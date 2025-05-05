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
    let body: ChatRequest & { meta?: any };
    try {
        body = await req.json();
    } catch {
        return new NextResponse('Invalid JSON', { status: 400 });
    }

    /* ✅ 这里把 meta 一起解构出来 */
    const {
        supplierId,
        model: bodyModel,
        scene,
        messages: originalMessages,
        meta                          // <-- 新增
    } = body;

    if (!originalMessages?.length) {
        return new NextResponse('Missing messages', { status: 400 });
    }

    /* --------- 统一处理 scene ---------- */
    let apiUrl: string;
    let apiKey: string;
    let model : string;
    let messages = [...originalMessages];

    if (scene) {
        const cfg = configurations[scene];
        if (!cfg) return new NextResponse(`Unknown scene code: ${scene}`, { status: 400 });

        apiUrl = cfg.apiUrl;
        apiKey = cfg.apiKey;
        model  = cfg.model;

        /** PROMPT_MATE_GEN: 占位符替换 */
        if (scene === 'PROMPT_MATE_GEN') {
            const p = meta ?? {};
            let sys = cfg.systemMessage || '';
            sys = sys.replace('{{INPUT_TYPE}}' , p.INPUT_TYPE  ?? '')
                .replace('{{INTENT_CODE}}', p.INTENT_CODE ?? '')
                .replace('{{OUTPUT_FMT}}' , p.OUTPUT_FMT  ?? '')
                .replace('{{SCHEMA_JSON}}', p.SCHEMA_JSON ?? '');
            messages.unshift({ role: 'system', content: sys });
            // console.log('system prompt:', sys);
        } else if (cfg.systemMessage) {
            messages.unshift({ role: 'system', content: cfg.systemMessage });
        }
    } else {
        /* -------- supplier 代理模式保持不变 -------- */
        if (!supplierId || !bodyModel) {
            return new NextResponse('Missing supplierId or model', { status: 400 });
        }
        const supplier = await getSupplierById(supplierId).catch(() => null);
        if (!supplier) return new NextResponse('Supplier not found', { status: 404 });
        if (supplier.userId !== userId) return new NextResponse('Forbidden', { status: 403 });

        apiUrl = supplier.apiUrl;
        apiKey = supplier.apiKey;
        model  = bodyModel;
    }

    /* --------- 向上游转发 (保持原实现) --------- */
    try {
        // 准备请求的body数据
        // const requestBody = JSON.stringify({ model, stream: true, messages });
        // console.log('Request Body:', requestBody); // 打印请求的body
        const upstream = await fetch(`${apiUrl}/chat/completions`, {
            method : 'POST',
            headers: { 'Content-Type':'application/json', Authorization:`Bearer ${apiKey}` },
            body   : JSON.stringify({ model, stream: true, messages })
        });
        const headers: Record<string,string> = {};
        upstream.headers.forEach((v,k)=>{ headers[k]=v; });
        headers['Cache-Control'] = 'no-cache';
        // 创建NextResponse对象
        const response = new NextResponse(upstream.body, { status: upstream.status, headers });
        // console.log('Response:', response); // 打印返回的NextResponse对象
        return response;
    } catch (err) {
        console.error('Error proxying chat request', err);
        return new NextResponse('Proxy error', { status: 500 });
    }
});