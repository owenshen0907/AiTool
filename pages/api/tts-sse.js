// File: pages/api/tts-sse.js
import WebSocket from 'ws';
import { parse } from 'url';

export const config = { api: { bodyParser: false } };

export default function handler(req, res) {
    const { query } = parse(req.url, true);
    const { target, token, model, text } = query;
    if (!target || !token || !model || !text) {
        res.status(400).json({ error: 'target, token, model and text are required' });
        return;
    }

    // SSE 响应头
    res.writeHead(200, {
        'Content-Type':            'text/event-stream; charset=utf-8',
        'Cache-Control':           'no-cache',
        Connection:                'keep-alive',
    });
    res.write('\n');

    // 拼真实 WS URL
    const sep   = target.includes('?') ? '&' : '?';
    const wsUrl = `${target}${sep}model=${encodeURIComponent(model)}`;

    const ws = new WebSocket(wsUrl, {
        headers: { Authorization: `Bearer ${token}` },
    });

    let sessionId = '';

    ws.on('message', raw => {
        let msg;
        try { msg = JSON.parse(raw.toString()); }
        catch { return; }

        // 1) 透传所有消息
        res.write('data: ' + JSON.stringify(msg) + '\n\n');

        // 2) 建联成功后创建会话
        if (msg.type === 'tts.connection.done') {
            sessionId = msg.data.session_id;
            ws.send(JSON.stringify({
                type: 'tts.create',
                data: { session_id: sessionId, voice_id: 'voice-tone-Eog0tIPGwy' }
            }));
        }

        // 3) 会话创建成功后直接发文本+done
        if (msg.type === 'tts.response.created') {
            ws.send(JSON.stringify({
                type: 'tts.text.delta',
                data: { session_id: sessionId, text }
            }));
            ws.send(JSON.stringify({
                type: 'tts.text.done',
                data: { session_id: sessionId }
            }));
        }

        // 4) 结束或出错时关闭
        if (msg.type === 'tts.response.audio.done' || msg.type === 'tts.response.error') {
            ws.close();
            res.write('event: end\ndata: {}\n\n');
            res.end();
        }
    });

    ws.on('error', err => {
        res.write('event: error\ndata: ' + JSON.stringify({ message: err.message }) + '\n\n');
        res.end();
    });

    req.on('close', () => ws.close());
}