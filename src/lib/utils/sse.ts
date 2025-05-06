// File: src/lib/utils/sse.ts
/**
 * 解析流式 SSE 响应，自动区分
 *  - type:'reasoning'  → delta.reasoning（大模型思考片段）
 *  - type:'content'    → delta.content  （最终可见输出）
 *
 * onData 回调会持续收到形如：
 *   { type:'reasoning', text:string }
 *   { type:'content'  , text:string }
 */
export async function parseSSEStream(
    stream: ReadableStream<Uint8Array>,
    onData: (payload: { type: 'reasoning' | 'content'; text: string }) => void
): Promise<void> {
    const reader   = stream.getReader();
    const decoder  = new TextDecoder();
    let   buffer   = '';
    let   done     = false;

    while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        buffer += decoder.decode(value || new Uint8Array(), { stream: true });

        let boundary: number;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            const event = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 2);

            event.split('\n').forEach(line => {
                if (!line.startsWith('data:')) return;
                const jsonStr = line.replace(/^data:\s*/, '');
                if (jsonStr === '[DONE]') return;
                try {
                    const data = JSON.parse(jsonStr);
                    const delta = data.choices?.[0]?.delta ?? {};
                    if (typeof delta.reasoning === 'string' && delta.reasoning) {
                        onData({ type: 'reasoning', text: delta.reasoning });
                    }
                    if (typeof delta.content === 'string' && delta.content) {
                        onData({ type: 'content', text: delta.content });
                    }
                } catch (e) {
                    console.error('SSE parse error:', e);
                }
            });
        }
    }
    reader.releaseLock();
}