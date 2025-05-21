// File: app/components/ChatVoiceInput.tsx
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
// @ts-ignore
import Recorder from 'recorder-js';
import { Mic, Loader2 } from 'lucide-react';

export interface ChatVoiceInputProps {
  enableVoice?: boolean;
  language?: string;
  onTranscript: (text: string, isFinal: boolean) => void;
}

export default function ChatVoiceInput({
  enableVoice = true,
  language = 'auto',
  onTranscript,
}: ChatVoiceInputProps) {
  const MODEL = 'step-asr-mini';
  const THRESHOLD = 0.01;      // 静音识别阈值
  const CHUNK_INTERVAL = 1000; // 分片上传间隔（毫秒）
  const SMOOTH_WINDOW = 5;     // 滑动窗口长度

  const [asrStatus, setAsrStatus] = useState<'idle'|'connecting'|'recording'>('idle');

  const recorderRef = useRef<Recorder | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunkIntervalRef = useRef<number | null>(null);
  // 新增：存储最近几次 RMS 的滑动窗口数组
  const rmsBufferRef = useRef<number[]>([]);

  const startRecording = useCallback(async () => {
    if (!enableVoice || asrStatus !== 'idle') return;
    setAsrStatus('connecting');

    const es = new EventSource(`/api/asr-sse?model=${MODEL}&language=${language}`);
    esRef.current = es;

    es.onopen = () => console.log('[ChatVoiceInput] SSE open');
    es.onerror = e => {
      console.error('[ChatVoiceInput] SSE error', e);
      es.close();
      setAsrStatus('idle');
    };

    es.addEventListener('connect', async (e: MessageEvent) => {
      sessionIdRef.current = e.data;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      } catch (err: any) {
        alert('无法访问麦克风：' + err.message);
        es.close();
        setAsrStatus('idle');
        return;
      }

      const audioContext = new AudioContext();
      audioCtxRef.current = audioContext;
      const sourceNode = audioContext.createMediaStreamSource(streamRef.current!);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      sourceNode.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new Recorder(audioContext, { numChannels: 1 });
      recorderRef.current = recorder;
      recorder.init(streamRef.current!);
      recorder.start();

      setAsrStatus('recording');
      // 重置平滑缓冲
      rmsBufferRef.current = [];

      chunkIntervalRef.current = window.setInterval(async () => {
        const ana = analyserRef.current!;
        const data = new Float32Array(ana.fftSize);
        ana.getFloatTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((sum, v) => sum + v * v, 0) / data.length);

        // 平滑：记录到滑动窗口
        const buf = rmsBufferRef.current;
        buf.push(rms);
        if (buf.length > SMOOTH_WINDOW) buf.shift();
        const avgRms = buf.reduce((sum, v) => sum + v, 0) / buf.length;

        // 当平均 RMS 小于阈值时，仍继续录制但不上传
        if (avgRms < THRESHOLD) {
          recorder.start();
          return;
        }

        const { blob } = await recorder.stop();
        const b64 = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
        fetch('/api/asr-sse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionIdRef.current, audio: b64 }),
        }).catch(() => {});
        recorder.start();
      }, CHUNK_INTERVAL);
    });

    es.addEventListener('delta', (e: MessageEvent) => {
      onTranscript(e.data, false);
    });

    es.addEventListener('done', (e: MessageEvent) => {
      onTranscript(e.data, true);
      es.close();
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
        chunkIntervalRef.current = null;
      }
      recorderRef.current?.stop(); recorderRef.current = null;
      streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null;
      audioCtxRef.current?.close(); audioCtxRef.current = null;
      setAsrStatus('idle');
    });
  }, [enableVoice, language, onTranscript, asrStatus]);

  const stopRecording = useCallback(async () => {
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    if (recorderRef.current) {
      try {
        const { blob } = await recorderRef.current.stop();
        const b64 = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
        await fetch('/api/asr-sse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionIdRef.current, audio: b64 }),
        });
      } catch {}
    }
    try {
      await fetch('/api/asr-sse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionIdRef.current, done:true }),
      });
    } catch {}
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setAsrStatus('idle');
  }, []);

  useEffect(() => () => { stopRecording(); esRef.current?.close(); }, [stopRecording]);

  if (!enableVoice) return null;

  return (
    <button
      onClick={asrStatus === 'recording' ? stopRecording : startRecording}
      className={
        `p-2 rounded-full transition duration-200 ` +
        (asrStatus === 'connecting'
          ? 'text-gray-400 cursor-wait'
          : asrStatus === 'recording'
          ? 'text-red-500 animate-pulse'
          : 'text-black hover:text-gray-600')
      }
      title={
        asrStatus === 'connecting'
          ? '正在连接…'
          : asrStatus === 'idle'
          ? '开始录音'
          : '停止录音'
      }
    >
      {asrStatus === 'connecting' ? (
        <Loader2 className="animate-spin" size={20} />
      ) : (
        <Mic size={20} />
      )}
    </button>
  );
}