// File: src/lib/ws/browserTtsClient.ts
export interface BrowserTTSEvents {
    /** WS 建联成功并拿到 session_id */
    onConnectionDone: (sessionId: string) => void;
    /** tts.create 成功响应后触发 */
    onSessionCreated: () => void;
    /** 收到一段音频 base64 流 (data.audio)，status 可选 */
    onAudioDelta: (audioB64: string, status?: string) => void;
    /** 出错回调 */
    onError: (err: any) => void;
}

/**
 * 浏览器端 TTS Client，带详细日志
 *  - baseUrl: 不含 query 的 WSS 基地址
 *  - token: apiKey
 *  - model: 模型名称
 *  - voiceId: voice_id
 */
export class BrowserTtsClient {
    private ws!: WebSocket;
    private sessionId = '';
    private readonly voiceId: string;

    constructor(
        private readonly baseUrl: string,
        private readonly token: string,
        private readonly model: string,
        voiceId: string,
        private readonly events: BrowserTTSEvents
    ) {
        this.voiceId = voiceId;
    }

    connect() {
        // 在 URL 上挂载 token、model
        const sep = this.baseUrl.includes('?') ? '&' : '?';
        const url = `${this.baseUrl}${sep}model=${encodeURIComponent(this.model)}&authorization=${encodeURIComponent(this.token)}`;
        console.log('[TTS] connecting to', url);
        this.ws = new WebSocket(url);

        this.ws.onopen = (ev) => {
            console.log('[TTS] websocket onopen', ev);
            // 等待服务器发 tts.connection.done
        };

        this.ws.onmessage = ({ data }) => {
            console.log('[TTS] raw message:', data);
            let msg: any;
            try {
                msg = JSON.parse(data);
            } catch (err) {
                console.error('[TTS] JSON parse error:', err);
                return;
            }
            const { type, data: d } = msg;
            console.log('[TTS] message type:', type, 'data:', d);
            switch (type) {
                case 'tts.connection.done':
                    this.sessionId = d.session_id;
                    console.log('[TTS] connection.done, sessionId=', this.sessionId);
                    this.events.onConnectionDone(this.sessionId);
                    break;
                case 'tts.response.created':
                    console.log('[TTS] response.created');
                    this.events.onSessionCreated();
                    break;
                case 'tts.response.audio.delta':
                    console.log('[TTS] response.audio.delta, status=', d.status);
                    this.events.onAudioDelta(d.audio, d.status);
                    break;
                case 'tts.response.error':
                    console.error('[TTS] response.error:', d);
                    this.events.onError(d);
                    break;
                default:
                    console.warn('[TTS] unhandled message type:', type);
            }
        };

        this.ws.onerror = (err) => {
            console.error('[TTS] websocket error event:', err);
            this.events.onError(err);
        };

        this.ws.onclose = (ev) => {
            console.log('[TTS] websocket closed, code=', ev.code, 'reason=', ev.reason);
        };
    }

    /** 发送创建会话 */
    createSession() {
        console.log('[TTS] send tts.create, voiceId=', this.voiceId);
        this.ws.send(JSON.stringify({
            type: 'tts.create',
            data: {
                session_id: this.sessionId,
                voice_id: this.voiceId,
                response_format: 'mp3',
                volumn_ratio: 1.0,
                speed_ratio: 1.0,
                sample_rate: 16000,
                mode: 'sentence',
            }
        }));
    }

    /** 发送文本 */
    sendText(text: string) {
        console.log('[TTS] send tts.text.delta, text length=', text.length);
        this.ws.send(JSON.stringify({
            type: 'tts.text.delta',
            data: { session_id: this.sessionId, text }
        }));
    }

    /** 文本结束 */
    closeText() {
        console.log('[TTS] send tts.text.done');
        this.ws.send(JSON.stringify({ type: 'tts.text.done', data: { session_id: this.sessionId } }));
    }

    /** 主动关闭 WS */
    disconnect() {
        console.log('[TTS] disconnecting websocket');
        this.ws.close();
    }
}
