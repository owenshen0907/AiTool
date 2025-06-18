// File: src/app/api/completions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import { getSupplierById } from '@/lib/repositories/suppliers/supplierRepository';
import configurations from '@/config';

interface ChatRequest {
    supplierId?: string;
    model?: string;
    scene?: string;
    messages: { role: string; content: string }[];
    meta?: any;
}

export const POST = withUser(async (req: NextRequest, userId: string) => {
    console.log('👉 [completions] resolved userId =', userId);
    let body: ChatRequest;
    try {
        body = await req.json();
    } catch {
        return new NextResponse('Invalid JSON', { status: 400 });
    }

    const { supplierId, model: bodyModel, scene, messages: orig, meta } = body;
    if (!orig?.length) {
        return new NextResponse('Missing messages', { status: 400 });
    }

    let apiUrl: string, apiKey: string, model: string;
    const messages = [...orig];

    if (scene) {
        const cfg = configurations[scene];
        if (!cfg) {
            return new NextResponse(`Unknown scene: ${scene}`, { status: 400 });
        }
        apiUrl = cfg.apiUrl;
        apiKey = cfg.apiKey;
        model  = cfg.model;

        // 针对 PROMPT_MATE_GEN 做占位符替换
        if (scene === 'PROMPT_MATE_GEN') {
            let sys = cfg.systemMessage || '';
            sys = sys
                .replace('{{INPUT_TYPE}}',  meta.INPUT_TYPE  || '')
                .replace('{{INTENT_CODE}}', meta.INTENT_CODE || '')
                .replace('{{OUTPUT_FMT}}',  meta.OUTPUT_FMT  || '')
                .replace('{{SCHEMA_JSON}}', meta.SCHEMA_JSON || '');
            messages.unshift({ role: 'system', content: sys });
        } else if (cfg.systemMessage) {
            messages.unshift({ role: 'system', content: cfg.systemMessage });
        }
    } else {
        // 供应商代理模式
        if (!supplierId || !bodyModel) {
            return new NextResponse('Missing supplierId or model', { status: 400 });
        }
        const sup = await getSupplierById(supplierId).catch(() => null);
        if (!sup || sup.userId !== userId) {
            return new NextResponse('Forbidden', { status: 403 });
        }
        apiUrl = sup.apiUrl;
        apiKey = sup.apiKey;
        model  = bodyModel;
    }

    try {
        const upstream = await fetch(`${apiUrl}/chat/completions`, {
            method:  'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization:  `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, stream: true, messages }),
        });
        const headers: Record<string,string> = {};
        upstream.headers.forEach((v,k)=>{ headers[k]=v; });
        headers['Cache-Control'] = 'no-cache';

        return new NextResponse(upstream.body, {
            status:  upstream.status,
            headers,
        });
    } catch (err) {
        console.error('Error proxying completions', err);
        return new NextResponse('Proxy error', { status: 500 });
    }
});