// src/lib/utils/sse.ts

/**
 * 解析流式 SSE 响应，只保留 `data:` 行并调用回调
 * @param stream ReadableStream<Uint8Array> - fetch 响应的 body
 * @param onData (data) => void - 每次解析到的 SSE JSON 对象
 */
export async function parseSSEStream(
    stream: ReadableStream<Uint8Array>,
    onData: (data: any) => void
): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let done = false;

    while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        buffer += decoder.decode(value || new Uint8Array(), { stream: true });

        let boundary: number;
        // 持续查找 "\n\n" 分隔的完整事件
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            const event = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 2);

            // 按行处理
            event.split('\n').forEach(line => {
                if (!line.startsWith('data:')) return;
                const jsonStr = line.replace(/^data:\s*/, '');
                if (jsonStr === '[DONE]') return;
                try {
                    const data = JSON.parse(jsonStr);
                    onData(data);
                } catch (e) {
                    console.error('SSE parse error:', e);
                }
            });
        }
    }
    reader.releaseLock();
}
