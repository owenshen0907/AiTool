// File: app/prompt/case/content/useCaseTester.ts
/**
 * 独立的测试模块：对单条 Case 发起流式 LLM 调用，并实时回填。
 */
export interface TesterConfig {
    apiUrl: string;
    apiKey: string;
    model:  string;
    prompt: string;
}

export async function testSingleCase(
    cfg: TesterConfig,
    row: { id: string; caseText: string },
    onUpdate: (id: string, partial: { testResult: string }) => void
): Promise<void> {
    const res = await fetch(`${cfg.apiUrl}/chat/completions`, {
        method:  'POST',
        headers: {
            'Content-Type':  'application/json',
            Authorization:   `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
            model:  cfg.model,
            stream: true,
            messages: [
                { role: 'system',  content: cfg.prompt },
                { role: 'user',    content: row.caseText },
            ]
        }),
    });
    if (!res.ok) throw new Error(`LLM 接口报错：${res.status}`);
    const reader  = res.body!.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
            if (!line.startsWith('data:')) continue;
            const payload = line.replace(/^data:\s*/, '');
            if (payload === '[DONE]') {
                onUpdate(row.id, { testResult: result });
                return;
            }
            try {
                const obj = JSON.parse(payload);
                const delta = obj.choices?.[0]?.delta?.content;
                if (delta) {
                    result += delta;
                    onUpdate(row.id, { testResult: result });
                }
            } catch {
                // ignore
            }
        }
    }
}