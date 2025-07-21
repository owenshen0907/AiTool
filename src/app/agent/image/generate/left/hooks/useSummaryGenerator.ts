'use client';
import { useState } from 'react';

interface UseSummaryGeneratorOptions {
    scene?: string;
    endpoint?: string;
}

export function useSummaryGenerator(options: UseSummaryGeneratorOptions = {}) {
    const { scene = 'SUMMARY_GEN', endpoint = '/api/completions' } = options;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = async (body: string, extraReq: string) => {
        if (!body.trim()) {
            throw new Error('正文为空，无法生成摘要');
        }
        setLoading(true);
        setError(null);
        try {
            const combinedContent = [
                `【主体内容开始】\n${body}\n【主体内容结束】`,
                extraReq.trim() ? `\n【附加要求】\n${extraReq.trim()}` : ''
            ].join('\n');

            const payload = { scene, messages: [{ role: 'user', content: combinedContent }] };
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('摘要接口请求失败');

            // 不流式：直接一次性读取
            const text = await res.text();
            // 如果是 SSE，需要合并 data: ... 行
            if (text.includes('data:')) {
                const lines = text.split('\n').filter(l => l.startsWith('data:'));
                let final = '';
                for (const ln of lines) {
                    const raw = ln.replace(/^data:\s*/, '').trim();
                    if (raw === '[DONE]') continue;
                    try {
                        const json = JSON.parse(raw);
                        const delta = json.choices?.[0]?.delta?.content;
                        if (delta) final += delta;
                    } catch {
                        // ignore
                    }
                }
                return final.trim();
            }
            // 如果后端直接返回 JSON（非流）自定义解析
            return text.trim();
        } catch (e: any) {
            setError(e.message || '摘要生成失败');
            throw e;
        } finally {
            setLoading(false);
        }
    };

    return { generate, loading, error };
}