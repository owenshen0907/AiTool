/* File: src/app/audio/real-time/hooks/useRealtimeClient.ts */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
'use client';

import { useCallback, useRef } from 'react';
import { RealtimeClient } from '@/lib/openai-realtime-api-beta/lib/client.js';
import type { RealtimeEvent } from '@/lib';
import { WavRecorder, WavStreamPlayer } from '@/lib/utils/wavtools';
import WaveSurfer from 'wavesurfer.js';

/* --- 常量 & 工具 -------------------------------------------------------- */
const SR = 24_000;

/** 把 Int16Array → WAV Blob（单声道、16 bit、little-endian）*/
function encodeWav(pcm: Int16Array, sampleRate = SR): Blob {
    const numChannels = 1;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcm.length * bytesPerSample;

    const buf = new ArrayBuffer(44 + dataSize);
    const v = new DataView(buf);
    const w = (off: number, s: string) => [...s].forEach((c, i) => v.setUint8(off + i, c.charCodeAt(0)));

    w(0, 'RIFF');
    v.setUint32(4, 36 + dataSize, true);
    w(8, 'WAVE');
    w(12, 'fmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, numChannels, true);
    v.setUint32(24, sampleRate, true);
    v.setUint32(28, byteRate, true);
    v.setUint16(32, blockAlign, true);
    v.setUint16(34, 16, true);
    w(36, 'data');
    v.setUint32(40, dataSize, true);

    let off = 44;
    for (let i = 0; i < pcm.length; i++, off += 2) v.setInt16(off, pcm[i], true);

    return new Blob([v], { type: 'audio/wav' });
}

/* --- 全局共享的录音 / 播放 ------------------------------------------------ */
const recorder = new WavRecorder({ sampleRate: SR });
const player   = new WavStreamPlayer({ sampleRate: SR });

/* --- Props ---------------------------------------------------------------- */
interface Props {
    wsUrl: string | null;
    modelName: string;
    apiKey: string;
    selectedVoice: { name: string; value: string };

    setIsAISpeaking  : (v: boolean) => void;
    setConnectionError: (msg: string) => void;
    setRealtimeEvents : React.Dispatch<React.SetStateAction<RealtimeEvent[]>>;
    setItems          : React.Dispatch<React.SetStateAction<any[]>>;
    setIsConnected    : (v: boolean) => void;
    setIsRecording    : (v: boolean) => void;
    setAudioPlayers   : React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

/* --- Hook ----------------------------------------------------------------- */
export function useRealtimeClient({
                                      wsUrl, modelName, apiKey, selectedVoice,
                                      setIsAISpeaking, setConnectionError,
                                      setRealtimeEvents, setItems,
                                      setIsConnected, setIsRecording, setAudioPlayers,
                                  }: Props) {

    /* refs ------------------------------------------------------------------- */
    const clientRef          = useRef<RealtimeClient | null>(null);
    const assistantChunksRef = useRef<Record<string, Int16Array[]>>({});
    const userChunksRef      = useRef<Int16Array[]>([]);
    const audioPlayersRef    = useRef<Record<string, any>>({});

    /* ---------------- initClient (WS + 事件绑定) ---------------------------- */
    const initClient = useCallback(async () => {
        if (!wsUrl) { setConnectionError('wsUrl 不能为空'); return; }
// ① 固定写死本机的 wsOrigin，别再 replace
        const wsOrigin =
            process.env.NEXT_PUBLIC_NODE_ENV === 'production'
                ? 'wss://owenshen.top'     // ★ 生产
                : 'ws://localhost:3001';   // ★ 本地开发

// ② 千万别再自己多拼一个 /ws/ws
        const proxy = `${wsOrigin}/ws?` + new URLSearchParams({
            apiKey,
            model: modelName,
            wsUrl: encodeURIComponent(wsUrl),              // 仍指向 wss://api.stepfun.com/...
        }).toString();
        // const proxy = 'ws://127.0.0.1:8080?' + new URLSearchParams({
        //     apiKey, model: modelName, wsUrl: encodeURIComponent(wsUrl),
        // }).toString();

        const client = new RealtimeClient({ url: proxy });
        clientRef.current = client;

        /* 事件：全部实时日志 */
        client.on('realtime.event', (e: RealtimeEvent) => {
            setRealtimeEvents(prev => [...prev.slice(-299), e]);
        });

        /* 事件：连接错误 */
        client.on('error', (e: RealtimeEvent) => {
            setConnectionError(e.event.message || '连接错误');
            setIsConnected(false);
        });

        /* 事件：conversation.updated */
        client.on(
            'conversation.updated',
            async ({ item, delta }: { item: any; delta: any }) => {
                client.conversation.cleanupItems(30);
                setItems(client.conversation.getItems());

                /* chunk audio */
                if (delta?.audio) {
                    if (!assistantChunksRef.current[item.id]) assistantChunksRef.current[item.id] = [];
                    assistantChunksRef.current[item.id].push(delta.audio);
                    player.add16BitPCM(delta.audio, item.id);
                    setIsAISpeaking(true);
                }

                /* completed → 合并 WAV */
                if (item.status === 'completed') {
                    setIsAISpeaking(false);

                    if (typeof item.formatted.audio === 'string' && item.formatted.audio.length) {
                        item.formatted.file = { url: `data:audio/wav;base64,${item.formatted.audio}` };
                    } else {
                        const pcs = assistantChunksRef.current[item.id] ?? [];
                        if (pcs.length) {
                            const total = pcs.reduce((s, a) => s + a.length, 0);
                            const merged = new Int16Array(total);
                            let o = 0; pcs.forEach(a => { merged.set(a, o); o += a.length; });
                            const url = URL.createObjectURL(encodeWav(merged));
                            item.formatted.file = { url };
                        }
                    }
                    if (item.role === 'assistant') setItems(p => [...p.slice(0, -1), item]);
                }
            },
        );
    }, [apiKey, modelName, wsUrl,
        setRealtimeEvents, setItems, setIsAISpeaking, setIsConnected]);

    /* ------------------ 会话控制 ------------------------------------------- */
    const connectConversation = async (mode: 'manual' | 'realtime') => {
        assistantChunksRef.current = {}; userChunksRef.current = [];
        audioPlayersRef.current    = {}; setAudioPlayers({});

        await initClient();
        // await recorder.begin();
        try {
            await recorder.begin();
        } catch (err: any) {
            setConnectionError(
                err?.message?.includes('media stream')
                    ? '浏览器无法打开麦克风，请检查权限/设备'
                    : `录音设备错误：${err?.message || ''}`
            );
            return;               // 不再继续后面的 player.connect / client.connect
        }
        await player.connect(); await clientRef.current?.connect();
        await clientRef.current?.updateSession({ voice: selectedVoice.value });
        await clientRef.current?.sendUserMessageContent([{ type: 'input_text', text: '你好！' }]);
        setIsConnected(true);
        if (mode === 'realtime') recorder.record(d => clientRef.current?.appendInputAudio(d.mono));
    };

    const disconnectConversation = async () => {
        clientRef.current?.disconnect(); setIsConnected(false);
        try { await recorder.end(); } catch {}
        player.interrupt(); setItems([]); setAudioPlayers({});
    };

    /* ------------------ 手动录音 ------------------------------------------ */
    const startRecording = async () => {
        setIsRecording(true);
        const off = await player.interrupt();
        if (off?.trackId) clientRef.current?.cancelResponse(off.trackId, off.offset);
        recorder.record(d => { userChunksRef.current.push(d.mono); clientRef.current?.appendInputAudio(d.mono); });
    };

    const stopRecording = async () => {
        setIsRecording(false); await recorder.pause();

        if (userChunksRef.current.length) {
            const total = userChunksRef.current.reduce((s, a) => s + a.length, 0);
            const merged = new Int16Array(total);
            let o = 0; userChunksRef.current.forEach(a => { merged.set(a, o); o += a.length; });
            const url = URL.createObjectURL(encodeWav(merged));
            setItems(p => [...p, { id: crypto.randomUUID(), role: 'user', formatted: { transcript: null, file: { url } } }]);
            userChunksRef.current = [];
        }
        clientRef.current?.createResponse();
    };

    /* ------------------ 手动 ↔ VAD ---------------------------------------- */
    const toggleVAD = async (mode: 'manual' | 'realtime') => {
        if (mode === 'manual' && recorder.getStatus() === 'recording') await recorder.pause();
        clientRef.current?.updateSession({ turn_detection: mode === 'manual' ? null : { type: 'server_vad' } });
        if (mode === 'realtime' && clientRef.current?.isConnected())
            recorder.record(d => clientRef.current?.appendInputAudio(d.mono));
        setIsAISpeaking(false); setIsRecording(false);
    };

    /* ------------------ WaveSurfer --------------------------------------- */
    const initWaveSurfer = (node: HTMLDivElement | null, id: string, url: string) => {
        if (!node || audioPlayersRef.current[id]) return;
        const ws = WaveSurfer.create({
            container: node, height: 24,
            waveColor: 'rgba(74,131,255,.6)', progressColor: '#1a56db',
            cursorColor: 'transparent', barWidth: 2, barGap: 1, barRadius: 3,
            minPxPerSec: 50, interact: false, hideScrollbar: true,
        });
        audioPlayersRef.current[id] = { wavesurfer: ws, isPlaying: false, isLoading: true, hasError: false };
        ws.load(url);
        ws.on('ready', () => { audioPlayersRef.current[id].isLoading = false; setAudioPlayers({ ...audioPlayersRef.current }); });
        ws.on('error', (err: unknown) => { console.error('[WaveSurfer]', err); audioPlayersRef.current[id].hasError = true; setAudioPlayers({ ...audioPlayersRef.current }); });
        ws.on('finish', () => { audioPlayersRef.current[id].isPlaying = false; setAudioPlayers({ ...audioPlayersRef.current }); });
    };

    const togglePlay = (id: string) => {
        const p = audioPlayersRef.current[id];
        if (!p || p.isLoading || p.hasError) return;
        p.isPlaying ? p.wavesurfer.pause() : p.wavesurfer.play();
        p.isPlaying = !p.isPlaying; setAudioPlayers({ ...audioPlayersRef.current });
    };

    const downloadAudio = (url: string, name: string) => {
        const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    };

    /* ------------------ expose ------------------------------------------- */
    return {
        connectConversation,
        disconnectConversation,
        startRecording,
        stopRecording,
        toggleVAD,
        changeVoice       : (v: string) => clientRef.current?.updateSession({ voice: v }),
        changeInstructions: (ins: string) => clientRef.current?.updateSession({ instructions: ins }),
        initWaveSurfer,
        togglePlay,
        downloadAudio,
        audioPlayersRef,
    };
}