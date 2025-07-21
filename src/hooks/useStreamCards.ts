// File: src/hooks/useStreamCards.ts
import { useCallback, useRef, useState } from 'react';

export interface StreamCard {
    id: string;
    title?: string;
    description?: string;
    prompt?: string;
    text?: string | string[];
    raw?: any;
    done: boolean;
    error?: string;
}

type ParsingMode = 'auto' | 'object-per-item' | 'wrapped-array';

interface UseStreamCardsOptions {
    endpoint?: string;
    /** 已不再使用截断，但保留参数以兼容旧调用 */
    tailPreviewLength?: number;
}

export function useStreamCards(opts: UseStreamCardsOptions = {}) {
    const {
        endpoint = '/api/stream-json',
    } = opts;

    const [cards, setCards] = useState<StreamCard[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamPreview, setStreamPreview] = useState(''); // 现在保存完整原始报文
    const [parsingMode, setParsingMode] = useState<ParsingMode>('auto');

    const bufferRef = useRef('');
    const arrayModeStartedRef = useRef(false);
    const finishedArrayRef = useRef(false);
    const cardIdRef = useRef(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    /* ---------- public: reset ---------- */
    const reset = useCallback(() => {
        setCards([]);
        setStreamPreview('');
        bufferRef.current = '';
        setParsingMode('auto');
        arrayModeStartedRef.current = false;
        finishedArrayRef.current = false;
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setIsStreaming(false);
    }, []);

    /* ---------- internal helpers ---------- */
    const addCard = useCallback((raw: any) => {
        const card: StreamCard = {
            id: String(++cardIdRef.current),
            title: raw.title,
            description: raw.description,
            prompt: raw.prompt,
            text: raw.text,
            raw,
            done: true,
        };
        setCards(prev => [...prev, card]);
    }, []);

    const pushParsed = useCallback((obj: any) => {
        if (obj && Array.isArray(obj.images)) {
            obj.images.forEach(addCard);
        } else {
            addCard(obj);
        }
    }, [addCard]);

    function detectParsingModeIfNeeded(buf: string) {
        if (parsingMode !== 'auto') return;
        const ts = buf.trimStart();
        if (!ts.startsWith('{')) return;
        if (/"images"\s*:\s*\[/.test(ts)) {
            setParsingMode('wrapped-array');
        } else {
            setParsingMode('object-per-item');
        }
    }

    const appendChunk = useCallback((chunk: string) => {
        // 可选：兼容 SSE data: 前缀（如果后端是 SSE，就取消注释下面处理）
        // chunk = chunk
        //   .split(/\r?\n/)
        //   .filter(line => line.trim() !== '' && !/^event:/.test(line))
        //   .map(line => line.replace(/^data:\s*/, ''))
        //   .join('');

        bufferRef.current += chunk;
        // 显示完整原始报文
        setStreamPreview(bufferRef.current);

        detectParsingModeIfNeeded(bufferRef.current);

        let safety = 0;
        while (safety++ < 100) {
            const { obj, rest, finished } = extractOneObject(
                bufferRef.current,
                parsingMode === 'auto' ? 'object-per-item' : parsingMode,
                arrayModeStartedRef,
                finishedArrayRef
            );
            if (!obj) break;
            bufferRef.current = rest;
            pushParsed(obj);
            if (finished) {
                finishedArrayRef.current = true;
                break;
            }
        }
    }, [parsingMode, pushParsed]);

    /* ---------- public: startStream ---------- */
    const startStream = useCallback(async (docId?: string | number) => {
        if (isStreaming) return;
        setIsStreaming(true);
        const ac = new AbortController();
        abortControllerRef.current = ac;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ docId }),
                signal: ac.signal,
            });
            if (!res.ok || !res.body) throw new Error('stream response invalid');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                appendChunk(decoder.decode(value, { stream: true }));
                if (finishedArrayRef.current) break;
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') console.error('Streaming error:', e);
        } finally {
            setIsStreaming(false);
        }
    }, [endpoint, isStreaming, appendChunk]);

    /* ---------- public: stop ---------- */
    const stopStream = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setIsStreaming(false);
    }, []);

    return {
        cards,
        isStreaming,
        streamPreview,
        parsingMode,
        startStream,
        stopStream,
        reset,
    };
}

/* ---------------- Parsing Helpers ---------------- */

function extractOneObject(
    buffer: string,
    mode: ParsingMode,
    arrayModeStartedRef: React.MutableRefObject<boolean>,
    finishedArrayRef: React.MutableRefObject<boolean>
): { obj?: any; rest: string; finished?: boolean } {
    if (finishedArrayRef.current) return { rest: buffer };
    if (mode === 'object-per-item') return extractStandaloneObject(buffer);
    if (mode === 'wrapped-array')
        return extractFromWrappedArray(buffer, arrayModeStartedRef, finishedArrayRef);
    return { rest: buffer };
}

function extractStandaloneObject(buffer: string) {
    const start = buffer.indexOf('{');
    if (start === -1) return { rest: buffer };
    let depth = 0;
    for (let i = start; i < buffer.length; i++) {
        const ch = buffer[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        if (depth === 0) {
            const candidate = buffer.slice(start, i + 1);
            try {
                const obj = JSON.parse(candidate);
                const rest = buffer.slice(i + 1);
                return { obj, rest };
            } catch {
                return { rest: buffer };
            }
        }
    }
    return { rest: buffer };
}

function extractFromWrappedArray(
    buffer: string,
    arrayModeStartedRef: React.MutableRefObject<boolean>,
    finishedArrayRef: React.MutableRefObject<boolean>
) {
    if (!arrayModeStartedRef.current) {
        const idx = buffer.indexOf('"images"');
        if (idx === -1) return { rest: buffer };
        const arrStart = buffer.indexOf('[', idx);
        if (arrStart === -1) return { rest: buffer };
        arrayModeStartedRef.current = true;
        buffer = buffer.slice(arrStart + 1);
    }

    const closeIdx = buffer.indexOf(']');
    let region = buffer;
    if (closeIdx !== -1) region = buffer.slice(0, closeIdx);

    const start = region.indexOf('{');
    if (start === -1) {
        if (closeIdx !== -1) {
            finishedArrayRef.current = true;
            try {
                const wrapped = '{"images":[' + region + ']}';
                const parsed = JSON.parse(wrapped);
                return {
                    obj: parsed,
                    rest: buffer.slice(closeIdx + 1),
                    finished: true,
                };
            } catch {
                return { rest: buffer };
            }
        }
        return { rest: buffer };
    }

    let depth = 0;
    for (let i = start; i < region.length; i++) {
        const ch = region[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        if (depth === 0) {
            const candidate = region.slice(start, i + 1);
            try {
                const obj = JSON.parse(candidate);
                const after = region.slice(i + 1).replace(/^\s*,?/, '');
                const leftover =
                    after + (closeIdx !== -1 ? buffer.slice(closeIdx) : buffer.slice(region.length));
                if (leftover.trimStart().startsWith(']')) {
                    finishedArrayRef.current = true;
                    return {
                        obj,
                        rest: leftover.replace(/^\s*\]/, ''),
                        finished: true,
                    };
                }
                return { obj, rest: leftover };
            } catch {
                return { rest: buffer };
            }
        }
    }
    return { rest: buffer };
}