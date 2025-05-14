// File: src/lib/ws/ttsClient.ts
import EventEmitter from 'events';

export interface TTSMessage {
    eventId: string;
    type: string;
    data: any;
}

export interface TTSEvents {
    'connection.done': (sessionId: string) => void;
    'response.created': () => void;
    'response.audio.delta': (audioB64: string, status?: string) => void;
    'response.error': (error: any) => void;
}

export class TTSClient extends EventEmitter {
    private ws: WebSocket | null = null;
    private sessionId: string = '';
    private url: string;
    private token: string;

    constructor(url: string, token: string) {
        super();
        this.url = url;
        this.token = token;
    }

    connect() {
        this.ws = new WebSocket(this.url, []);
        this.ws.onopen = () => {
            // no-op, wait for tts.connection.done
        };
        this.ws.onmessage = (evt) => this.handleMessage(evt.data);
        this.ws.onerror = (err) => this.emit('response.error', err);
        this.ws.onclose = () => {/* cleanup if needed */};
    }

    private handleMessage(raw: string) {
        let msg: TTSMessage;
        try {
            msg = JSON.parse(raw);
        } catch {
            return;
        }
        const { type, data } = msg;
        switch (type) {
            case 'tts.connection.done':
                this.sessionId = data.session_id;
                this.emit('connection.done', this.sessionId);
                break;
            case 'tts.response.created':
                this.emit('response.created');
                break;
            case 'tts.response.audio.delta':
                this.emit('response.audio.delta', data.audio, data.status);
                break;
            case 'tts.response.error':
                this.emit('response.error', data);
                break;
            // add other cases: flushed, done etc.
        }
    }

    createSession(voiceId: string) {
        this.ws?.send(JSON.stringify({
            type: 'tts.create',
            data: { session_id: this.sessionId, voice_id: voiceId }
        }));
    }

    sendText(text: string) {
        this.ws?.send(JSON.stringify({
            type: 'tts.text.delta',
            data: { session_id: this.sessionId, text }
        }));
    }

    flush() {
        this.ws?.send(JSON.stringify({ type: 'tts.text.flush', data: { session_id: this.sessionId } }));
    }

    closeText() {
        this.ws?.send(JSON.stringify({ type: 'tts.text.done', data: { session_id: this.sessionId } }));
    }
}
