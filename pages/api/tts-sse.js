// File: pages/api/tts-sse.js
import WebSocket from 'ws';
import { parse } from 'url';

export const config = { api: { bodyParser: false } };

export default function handler(req, res) {
    /* --- 参数校验 --- */
    const { query } = parse(req.url, true);
    const { target, token, model, text } = query;
    if (!target || !token || !model || !text) {
        res.status(400).json({ error: 'target, token, model and text are required' });
        return;
    }

    /* --- SSE 头 --- */
    res.writeHead(200, {
        'Content-Type':  'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection:      'keep-alive',
    });
    res.write('\n');

    /* --- 建 WebSocket --- */
    const wsUrl = `${target}${target.includes('?') ? '&' : '?'}model=${encodeURIComponent(model)}`;
    const ws = new WebSocket(wsUrl, {
        headers: { Authorization: `Bearer ${token}` },
    });

    let sessionId = '';
    let last      = 0;

    ws.on('message', raw => {
        let msg;
        try { msg = JSON.parse(raw.toString()); } catch { return; }

        /* 1) 原始消息透传 */
        res.write(`data: ${JSON.stringify(msg)}\n\n`);

        /* 2) 建联成功 → 推送 connect 时间节点 */
        if (msg.type === 'tts.connection.done') {
            res.write(`event: connect\ndata: ${Date.now()}\n\n`);
            sessionId = msg.data.session_id;
            ws.send(JSON.stringify({
                type: 'tts.create',
                data: { session_id: sessionId, voice_id: 'voice-tone-Eog0tIPGwy' },
            }));
        }

        /* 3) 会话 OK → 发送文本 */
        if (msg.type === 'tts.response.created') {
            last = Date.now();
            ws.send(JSON.stringify({
                type: 'tts.text.delta',
                data: { session_id: sessionId, text },
            }));
            ws.send(JSON.stringify({
                type: 'tts.text.done',
                data: { session_id: sessionId },
            }));
        }

        /* 4) 分片间隔事件 */
        if (msg.type === 'tts.response.audio.delta') {
            const now  = Date.now();
            res.write(`event: interval\ndata: ${now - last}\n\n`);
            last = now;
        }

        /* 5) 完成 → 推送 done 时间节点 */
        if (msg.type === 'tts.response.audio.done' || msg.type === 'tts.response.error') {
            res.write(`event: done\ndata: ${Date.now()}\n\n`);
            ws.close();
            res.write('event: end\ndata: {}\n\n');
            res.end();
        }
    });

    ws.on('error', err => {
        res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
        res.end();
    });

    req.on('close', () => ws.close());
}