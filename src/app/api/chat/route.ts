// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupplierById } from '@/lib/repositories/supplierRepository';
import { withUser } from '@/lib/api/auth';
import configurations from '@/config';

interface ChatRequest {
    supplierId?: string;
    model?: string;
    scene?: string;
    messages: { role: string; content: string }[];
}

export const POST = withUser(async (req: NextRequest, userId: string) => {
    let body: ChatRequest;
    try {
        body = await req.json();
    } catch {
        return new NextResponse('Invalid JSON', { status: 400 });
    }

    const { supplierId, model: bodyModel, scene, messages: originalMessages } = body;
    if (!originalMessages || originalMessages.length === 0) {
        return new NextResponse('Missing messages', { status: 400 });
    }

    // If a scene code is provided and exists in config, use that instead of supplier
    let apiUrl: string;
    let apiKey: string;
    let model: string;
    let messages = [...originalMessages];

    if (scene) {
        const cfg = configurations[scene];
        if (!cfg) {
            return new NextResponse(`Unknown scene code: ${scene}`, { status: 400 });
        }
        apiUrl = cfg.apiUrl;
        apiKey = cfg.apiKey;
        model = cfg.model;
        if (cfg.systemMessage) {
            messages.unshift({ role: 'system', content: cfg.systemMessage });
        }
    } else {
        // fallback to supplier-based proxy
        if (!supplierId || !bodyModel) {
            return new NextResponse('Missing supplierId or model', { status: 400 });
        }
        // verify supplier ownership
        let supplier;
        try {
            supplier = await getSupplierById(supplierId);
        } catch {
            return new NextResponse('Supplier not found', { status: 404 });
        }
        if (supplier.userId !== userId) {
            return new NextResponse('Forbidden', { status: 403 });
        }
        apiUrl = supplier.apiUrl;
        apiKey = supplier.apiKey;
        model = bodyModel;
        // pass messages through unchanged
    }

    // Proxy as a streaming request to the upstream chat API
    try {
        const upstream = await fetch(
            `${apiUrl}/chat/completions`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({ model, stream: true, messages }),
            }
        );
        const headers: Record<string,string> = {};
        upstream.headers.forEach((v,k) => { headers[k] = v; });
        headers['Cache-Control'] = 'no-cache';
        return new NextResponse(upstream.body, {
            status: upstream.status,
            headers,
        });
    } catch (err) {
        console.error('Error proxying chat request', err);
        return new NextResponse('Proxy error', { status: 500 });
    }
});