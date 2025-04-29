// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupplierById } from '@/lib/repositories/supplierRepository';
import { withUser } from '@/lib/api/auth';

interface ChatRequest {
    supplierId: string;
    model: string;
    messages: { role: string; content: string }[];
}

export const POST = withUser(async (req: NextRequest, userId: string) => {
    let body: ChatRequest;
    try {
        body = await req.json();
    } catch {
        return new NextResponse('Invalid JSON', { status: 400 });
    }
    const { supplierId, model, messages } = body;
    if (!supplierId || !model || !messages) {
        return new NextResponse('Missing parameters', { status: 400 });
    }

    let supplier;
    try {
        supplier = await getSupplierById(supplierId);
    } catch {
        return new NextResponse('Supplier not found', { status: 404 });
    }
    if (supplier.userId !== userId) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    // **流式代理**：直接把 upstream.body 透传给前端
    try {
        const upstream = await fetch(
            `${supplier.apiUrl}/chat/completions`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${supplier.apiKey}`,
                },
                body: JSON.stringify({ model, stream: true, messages }),
            }
        );
        // 取 upstream 的流和 headers 转发
        const headers: Record<string,string> = {};
        upstream.headers.forEach((v,k) => { headers[k] = v; });
        // 禁用缓存
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