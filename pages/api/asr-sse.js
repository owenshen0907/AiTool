// File: pages/api/asr-sse.js
import WebSocket from 'ws';
import { parse } from 'url';
import getRawBody from 'raw-body';

// 禁用 Next.js 默认 bodyParser
export const config = { api: { bodyParser: false } };

// 内存存会话：sessionId -> { ws, sessionReady }
const sessions = new Map();

export default async function handler(req, res) {
    console.log(`
[ASR SSE] → ${req.method} ${req.url}`);
    const { query } = parse(req.url || '', true);

    const target   = typeof query.target   === 'string' ? query.target   : `${process.env.STEP_API_WSURL}/realtime/transcriptions`;
    const token    = typeof query.token    === 'string' ? query.token    : process.env.STEP_API_KEY;
    const model    = typeof query.model    === 'string' ? query.model    : 'step-asr-mini';
    const language = typeof query.language === 'string' ? query.language : 'auto';

    if (!token) {
        res.status(400).json({ error: 'token is required' });
        return;
    }

    // === GET: 建立 SSE + 上游 WSS ===
    if (req.method === 'GET') {
        // SSE 头，关闭压缩/缓存
        res.writeHead(200, {
            'Content-Type':     'text/event-stream; charset=utf-8',
            'Cache-Control':    'no-cache, no-transform',
            'Connection':       'keep-alive',
            'Content-Encoding': 'none',
        });
        res.write(''); // 初始空行，确保 EventSource 打开

        // 建立到 ASR 服务的 WebSocket
        const wsUrl = `${target}${target.includes('?') ? '&' : '?'}model=${encodeURIComponent(model)}`;
        console.log(`[ASR SSE] Connecting WSS to ${wsUrl}`);
        const ws = new WebSocket(wsUrl, { headers: { Authorization: `Bearer ${token}` } });

        let sessionId = '';
        let sessionReady = false;

        ws.on('open', () => console.log('[ASR SSE] WSS open'));
        ws.on('message', raw => {
            let msg;
            try { msg = JSON.parse(raw.toString()); } catch { return; }
            console.log('[ASR SSE] WSS message:', msg.type);

            // 透传原始事件
            res.write(`data: ${JSON.stringify(msg)}

`);

            switch (msg.type) {
                case 'transcript.connection.created':
                    sessionId = msg.connection_id;
                    console.log('[ASR SSE] Got sessionId=' + sessionId);
                    ws.send(JSON.stringify({
                        connection_id: sessionId,
                        type:          'transcript.session.create',
                        data:          { language },
                    }));
                    break;

                case 'transcript.session.created':
                    sessionReady = true;
                    sessions.set(sessionId, { ws, sessionReady });
                    console.log('[ASR SSE] Session ready');
                    // 通知前端可以开始录音，payload 为真实 sessionId
                    res.write(`event: connect
`);
                    res.write(`data: ${sessionId}

`);
                    break;

                case 'transcript.text.delta':
                    res.write(`event: delta
`);
                    res.write(`data: ${msg.data.result}

`);
                    break;

                case 'transcript.text.slice':
                    res.write(`event: slice
`);
                    res.write(`data: ${msg.data.result}

`);
                    break;

                case 'transcript.response.done':
                    res.write(`event: done
`);
                    res.write(`data: ${JSON.stringify(msg.data.result)}

`);
                    ws.close();
                    sessions.delete(sessionId);
                    res.write(`event: end
`);
                    res.write(`data: {}

`);
                    res.end();
                    console.log('[ASR SSE] Completed');
                    break;

                case 'transcript.response.error':
                    res.write(`event: error
`);
                    res.write(`data: ${JSON.stringify(msg.data)}

`);
                    ws.close();
                    sessions.delete(sessionId);
                    res.write(`event: end
`);
                    res.write(`data: {}

`);
                    res.end();
                    console.error('[ASR SSE] Engine error', msg.data);
                    break;
            }
        });

        ws.on('error', err => {
            console.error('[ASR SSE] WSS error', err.message);
            res.write(`event: error
`);
            res.write(`data: ${JSON.stringify({ message: err.message })}

`);
            res.end();
            if (sessionId) sessions.delete(sessionId);
        });

        req.on('close', () => {
            console.log('[ASR SSE] Client closed SSE');
            if (sessionId) {
                const s = sessions.get(sessionId);
                if (s) s.ws.close();
                sessions.delete(sessionId);
            } else {
                ws.close();
            }
        });

        return;
    }

    // === POST: 接收客户端上传的 audio/base64 或 done ===
    if (req.method === 'POST') {
        console.log('[ASR SSE] → POST ' + req.url);
        let buffer;
        try { buffer = await getRawBody(req); }
        catch { return res.status(400).json({ error: 'invalid body' }); }
        let data;
        try { data = JSON.parse(buffer.toString()); }
        catch { return res.status(400).json({ error: 'invalid JSON' }); }

        // 用 '*' 占位打印 audio
        const log = { sessionId: data.sessionId, audio: data.audio ? '*' : undefined, done: data.done };
        console.log('[ASR SSE] POST data:', log);

        const sess = sessions.get(data.sessionId);
        if (!sess || !sess.sessionReady) {
            console.error('[ASR SSE] Invalid session on POST');
            return res.status(400).end();
        }

        if (data.audio) {
            sess.ws.send(JSON.stringify({
                connection_id: data.sessionId,
                type:          'transcript.input_audio_buffer.append',
                data:          { audio: data.audio },
            }));
            console.log('[ASR SSE] Forwarded audio chunk');
        }
        if (data.done) {
            sess.ws.send(JSON.stringify({
                connection_id: data.sessionId,
                type:          'transcript.input_audio_buffer.done',
            }));
            console.log('[ASR SSE] Forwarded done');
        }

        res.status(200).end();
        return;
    }

    res.status(405).end();
}
