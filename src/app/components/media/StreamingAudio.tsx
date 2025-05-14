// src/components/media/StreamingAudio.tsx
'use client';

import React, { useEffect, useRef } from 'react';

export interface StreamingAudioProps {
    /** base64(mpeg) 片段数组，父组件可不断 push 新片段 */
    chunks: string[];
    /** 每片时长（秒），用来估算缓存大小，默认 0.25 */
    chunkDuration?: number;
}

const MIME = 'audio/mpeg';
const MIN_BUFFER_SEC = 0.5;   // 起播前最少缓冲
const HIGH_WATER_SEC = 2.0;   // 缓冲低于此阈值才再 append

export default function StreamingAudio({
                                           chunks,
                                           chunkDuration = 0.25,
                                       }: StreamingAudioProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const mediaSourceRef = useRef<MediaSource | null>(null);
    const sourceBufferRef = useRef<SourceBuffer | null>(null);
    const cursorRef = useRef(0);                      // 已写入下标

    /* ---------- 初始化 MediaSource ---------- */
    useEffect(() => {
        if (!chunks.length || audioRef.current?.src) return;

        const ms = new MediaSource();
        mediaSourceRef.current = ms;
        const url = URL.createObjectURL(ms);
        audioRef.current!.src = url;

        ms.addEventListener('sourceopen', () => {
            const sb = ms.addSourceBuffer(MIME);
            sourceBufferRef.current = sb;

            /** 喂数据 */
            const feed = () => {
                if (!sb || sb.updating) return;

                const audio = audioRef.current!;
                // 当前缓冲长度
                const bufferedSec =
                    sb.buffered.length > 0
                        ? sb.buffered.end(sb.buffered.length - 1) - audio.currentTime
                        : 0;

                // 只要缓冲不够 & 还有新数据，就 appendBuffer
                while (
                    bufferedSec < HIGH_WATER_SEC &&
                    cursorRef.current < chunks.length
                    ) {
                    const u8 = Uint8Array.from(
                        atob(chunks[cursorRef.current]),
                        (c) => c.charCodeAt(0)
                    );
                    sb.appendBuffer(u8);
                    cursorRef.current += 1;
                }
            };

            sb.addEventListener('updateend', feed);
            feed(); // 第一次推送
        });

        return () => {
            URL.revokeObjectURL(url);
            mediaSourceRef.current = null;
            sourceBufferRef.current = null;
        };
    }, [chunks]);

    /* ---------- 当 chunks 更新时继续推送 ---------- */
    useEffect(() => {
        const sb = sourceBufferRef.current;
        if (!sb) return;

        // 立刻尝试继续 append（条件不足时 feed 内部会提前 return）
        if (!sb.updating) {
            const evt = new Event('updateend');
            sb.dispatchEvent(evt);
        }
    }, [chunks]);

    /* ---------- 起播：缓冲够就自动 play ---------- */
    useEffect(() => {
        const int = setInterval(() => {
            const audio = audioRef.current;
            const sb = sourceBufferRef.current;
            if (!audio || !sb || audio.readyState >= 2 || audio.paused === false)
                return;

            const need = MIN_BUFFER_SEC / chunkDuration;
            if (cursorRef.current >= need) {
                audio.play().catch(() => {});
            }
        }, 200);
        return () => clearInterval(int);
    }, [chunkDuration]);

    return <audio ref={audioRef} controls className="w-full" />;
}