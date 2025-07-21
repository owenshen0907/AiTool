// File: src/lib/utils/imageGenClient.ts
// 前端直接 fetch OpenAI Responses API（带 image_generation 工具）
// 注意：前端使用会暴露 API Key，仅用于内测

interface CreateImageResult {
    images: string[];  // base64 (不含 data: 前缀)
    callId: string;
}

export async function createImage(prompt: string, apiKey: string): Promise<CreateImageResult> {
    const body = {
        model: 'gpt-4.1-mini',
        input: prompt,
        tools: [{ type: 'image_generation',quality:'low',size:'1024x1024' }]
    };

    const res = await fetch('https://api.chatanywhere.org/v1/responses', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
    }

    const json = await res.json();
    const calls = (json.output || []).filter((o: any) => o.type === 'image_generation_call');
    if (!calls.length) throw new Error('No image_generation_call in output');
    return {
        images: calls.map((c: any) => c.result),
        callId: calls[0].id
    };
}

export async function refineImageCall(
    callId: string,
    refineText: string,
    apiKey: string
): Promise<CreateImageResult> {
    const body = {
        model: 'gpt-4.1-mini',
        input: [
            { role: 'user', content: [{ type: 'input_text', text: refineText }] },
            { type: 'image_generation_call', id: callId }
        ],
        tools: [{ type: 'image_generation',quality:'low',size:'1024x1024' }]
    };

    const res = await fetch('https://api.chatanywhere.org/v1/responses', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
    }

    const json = await res.json();
    const calls = (json.output || []).filter((o: any) => o.type === 'image_generation_call');
    if (!calls.length) throw new Error('No image_generation_call in follow-up');
    return {
        images: calls.map((c: any) => c.result),
        callId: calls[0].id
    };
}