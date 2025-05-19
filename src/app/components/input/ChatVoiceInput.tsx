
'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
// @ts-ignore
import Recorder from 'recorder-js';
import { Mic } from 'lucide-react';

export interface ChatVoiceInputProps {
    enableVoice?: boolean;
    language?: string;
    onTranscript: (text: string) => void;
}

export default function ChatVoiceInput({
                                           enableVoice = true,
                                           language = 'auto',
                                           onTranscript,
                                       }: ChatVoiceInputProps) {
    const MODEL = 'step-asr-mini';
    const THRESHOLD = 0.01;      // 静音检测阈值
    const CHUNK_INTERVAL = 1000; // ms

    const [listening, setListening] = useState(false);
    const [asrStatus, setAsrStatus] = useState<'idle'|'connecting'|'ready'|'waiting'>('idle');

    const recorderRef = useRef<Recorder|null>(null);
    const sessionIdRef = useRef<string|null>(null);
    const esRef = useRef<EventSource|null>(null);
    const analyserRef = useRef<AnalyserNode|null>(null);
    const chunkIntervalRef = useRef<number|null>(null);

    const startRecording = useCallback(async () => {
        if (!enableVoice) return;

        setAsrStatus('connecting');
        const es = new EventSource(`/api/asr-sse?model=${MODEL}&language=${language}`);
        esRef.current = es;

        es.addEventListener('connect', async (e: MessageEvent) => {
            sessionIdRef.current = e.data;
            setAsrStatus('ready');

            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (err: any) {
                alert('无法访问麦克风：' + err.message);
                es.close();
                setAsrStatus('idle');
                return;
            }

            const audioContext = new AudioContext();
            const sourceNode = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            sourceNode.connect(analyser);
            analyserRef.current = analyser;

            const recorder = new Recorder(audioContext, { numChannels: 1 });
            recorderRef.current = recorder;
            recorder.init(stream);
            recorder.start();
            setListening(true);

            // 分片上传
            setAsrStatus('ready');
            chunkIntervalRef.current = window.setInterval(async () => {
                const ana = analyserRef.current;
                if (ana) {
                    const data = new Float32Array(ana.fftSize);
                    ana.getFloatTimeDomainData(data);
                    let sum = 0;
                    for (let v of data) sum += v * v;
                    const rms = Math.sqrt(sum / data.length);
                    if (rms < THRESHOLD) {
                        recorder.start();
                        return;
                    }
                }
                const { blob } = await recorder.stop();
                const b64 = await new Promise<string>(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.readAsDataURL(blob);
                });
                // 发送音频片段
                fetch('/api/asr-sse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: sessionIdRef.current, audio: b64 }),
                }).catch(() => {});
                recorder.start();
            }, CHUNK_INTERVAL);
        });

        // 只监听 slice
        es.addEventListener('slice', (e: MessageEvent) => {
            onTranscript(e.data);
        });

        // 完成事件
        es.addEventListener('done', (e: MessageEvent) => {
            onTranscript(e.data);
            // 服务端处理完毕，进入 waiting
            setAsrStatus('waiting');
        });

        // 最终结束，关闭连接
        es.addEventListener('end', () => {
            es.close();
            setListening(false);
            setAsrStatus('idle');
            // 清理定时器和 recorder
            if (chunkIntervalRef.current) {
                clearInterval(chunkIntervalRef.current);
                chunkIntervalRef.current = null;
            }
            recorderRef.current?.stop();
        });

        // 错误
        es.addEventListener('error', () => {
            es.close();
            setListening(false);
            setAsrStatus('idle');
            if (chunkIntervalRef.current) {
                clearInterval(chunkIntervalRef.current);
                chunkIntervalRef.current = null;
            }
            recorderRef.current?.stop();
        });
    }, [enableVoice, language, onTranscript]);

    const stopRecording = useCallback(() => {
        if (chunkIntervalRef.current) {
            clearInterval(chunkIntervalRef.current);
            chunkIntervalRef.current = null;
        }
        // 发送 done，仅停止录音，不关闭 SSE
        fetch('/api/asr-sse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: sessionIdRef.current, done: true }),
        }).catch(() => {});
        recorderRef.current?.stop();
        setListening(false);
        setAsrStatus('waiting');
    }, []);

    useEffect(() => () => {
        stopRecording();
    }, [stopRecording]);

    if (!enableVoice) return null;
    return (
        <button
            onClick={listening ? stopRecording : startRecording}
            className={listening ? 'text-red-500 hover:text-red-700' : 'hover:text-gray-800'}
            title={
                listening
                    ? '停止录音'
                    : asrStatus === 'connecting'
                        ? '正在连接…'
                        : asrStatus === 'ready'
                            ? '请开始说话'
                            : asrStatus === 'waiting'
                                ? '等待生成结果…'
                                : '开始录音'
            }
        >
            <Mic size={20} />
        </button>
    );
}
