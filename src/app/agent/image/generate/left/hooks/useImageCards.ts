// File: src/app/agent/image/left/hooks/useImageCards.ts
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * 生成内容里期望的 JSON 结构：
 * {
 *   "images": [
 *     {
 *       "title": "...",
 *       "description": "...",
 *       "prompt": "...",
 *       "text": "..." | ["...","..."]
 *       // 可能还有其它自定义字段
 *     },
 *     ...
 *   ]
 * }
 */
interface RawImagesJson {
    images?: any[];
    [k: string]: any;
}

export interface ImageCard {
    id: string;
    title?: string;
    description?: string;
    prompt?: string;
    text?: string | string[];
    raw?: any;                // 原始对象
    index: number;            // 在 images 数组中的序号
}

interface UseImageCardsOptions {
    /**
     * 是否组件挂载后立即尝试解析
     * @default false
     */
    autoParse?: boolean;
    /**
     * body 文本变化时是否重新解析
     * @default false
     */
    reparseOnChange?: boolean;
    /**
     * 解析失败时是否保留上一次成功解析的 cards
     * @default true
     */
    keepLastOnError?: boolean;
    /**
     * 当解析出一条 image item 时，允许对其做二次加工
     */
    transformImageItem?: (raw: any, index: number) => any;
    /**
     * 自定义生成 card id（例如带时间戳或 hash）
     */
    makeId?: (raw: any, index: number) => string;
    /**
     * 最大解析的 images 数量（防止超长生成塞爆 UI）
     * @default 50
     */
    maxImages?: number;
}

/**
 * 返回对象
 */
interface UseImageCardsResult {
    cards: ImageCard[];
    error: string | null;
    parsed: boolean;          // 是否已尝试解析（成功或失败）
    rawJson: RawImagesJson | null;
    lastUpdated: number | null;
    parse: () => void;        // 手动触发解析
    reset: () => void;        // 清空解析结果
}

/**
 * Hook 实现
 */
export function useImageCards(
    body: string,
    {
        autoParse = false,
        reparseOnChange = false,
        keepLastOnError = true,
        transformImageItem,
        makeId,
        maxImages = 50
    }: UseImageCardsOptions = {}
): UseImageCardsResult {
    const [cards, setCards] = useState<ImageCard[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [parsed, setParsed] = useState(false);
    const [rawJson, setRawJson] = useState<RawImagesJson | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);
    const lastBodyRef = useRef<string>('');

    const doParse = useCallback(() => {
        setParsed(true);
        setError(null);

        if (!body || !body.trim()) {
            setCards([]);
            setRawJson(null);
            setLastUpdated(Date.now());
            return;
        }

        try {
            const jsonText = extractJsonBlock(body);
            if (!jsonText) {
                throw new Error('未找到有效 JSON 片段');
            }

            let parsedObj: RawImagesJson;
            try {
                parsedObj = JSON.parse(jsonText);
            } catch (e: any) {
                throw new Error(`JSON 解析失败: ${e?.message || '语法错误'}`);
            }

            if (!parsedObj || typeof parsedObj !== 'object') {
                throw new Error('解析后的结构不是对象');
            }

            if (!Array.isArray(parsedObj.images)) {
                // 尝试兼容其它命名
                const alt = guessImagesArray(parsedObj);
                if (alt) {
                    parsedObj.images = alt;
                } else {
                    throw new Error('未找到 images 数组');
                }
            }

            const list = (parsedObj.images || []).slice(0, maxImages).map((raw, idx) => {
                const transformed = transformImageItem ? transformImageItem(raw, idx) : raw;
                return normalizeImageItem(transformed, idx, makeId);
            });

            setCards(list);
            setRawJson(parsedObj);
            setLastUpdated(Date.now());
        } catch (e: any) {
            if (!keepLastOnError) {
                setCards([]);
                setRawJson(null);
            }
            setError(e.message || '解析失败');
        }
    }, [body, keepLastOnError, makeId, maxImages, transformImageItem]);

    // 自动解析
    useEffect(() => {
        if (autoParse) {
            doParse();
            lastBodyRef.current = body;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 监听 body 变化
    useEffect(() => {
        if (!reparseOnChange) return;
        if (body !== lastBodyRef.current) {
            doParse();
            lastBodyRef.current = body;
        }
    }, [body, reparseOnChange, doParse]);

    const reset = useCallback(() => {
        setCards([]);
        setError(null);
        setParsed(false);
        setRawJson(null);
        setLastUpdated(null);
    }, []);

    return useMemo(
        () => ({
            cards,
            error,
            parsed,
            rawJson,
            lastUpdated,
            parse: doParse,
            reset
        }),
        [cards, error, parsed, rawJson, lastUpdated, doParse, reset]
    );
}

/* ----------------- 工具函数 ------------------ */

/**
 * 1. 优先匹配 ```json ... ``` 代码块
 * 2. 否则找第一个 { 与最后一个 } 直接截取
 */
function extractJsonBlock(text: string): string | null {
    if (!text) return null;

    // ```json fenced code
    const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/i;
    const m = fenceRegex.exec(text);
    if (m && m[1]) {
        const trimmed = m[1].trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            return trimmed;
        }
    }

    // 直接找花括号范围（可能包含多余文字，取最大包围）
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first === -1 || last === -1 || last <= first) return null;
    const candidate = text.slice(first, last + 1).trim();
    if (!candidate.startsWith('{') || !candidate.endsWith('}')) return null;
    return candidate;
}

/**
 * 尝试猜测 images 数组字段（如果不是标准的 images）
 */
function guessImagesArray(obj: any): any[] | null {
    if (!obj || typeof obj !== 'object') return null;
    const candidates = ['pictures', 'items', 'data', 'slides'];
    for (const k of candidates) {
        if (Array.isArray(obj[k])) return obj[k];
    }
    return null;
}

/**
 * 归一化 image item
 * 可根据你生成的实际字段名再扩展映射
 */
function normalizeImageItem(
    raw: any,
    index: number,
    makeId?: (raw: any, index: number) => string
): ImageCard {
    const id =
        (makeId && makeId(raw, index)) ||
        raw.id ||
        raw.key ||
        `img_${index}_${Math.random().toString(36).slice(2, 8)}`;

    // 常见字段兼容
    const title =
        raw.title ||
        raw.name ||
        (raw.heading ? String(raw.heading) : undefined) ||
        `图 ${index + 1}`;

    const description =
        raw.description ||
        raw.desc ||
        raw.caption ||
        undefined;

    // 生成 prompt 兼容字段
    const prompt =
        raw.prompt ||
        raw.image_prompt ||
        raw.visual_prompt ||
        raw.prompt_text ||
        undefined;

    // 文本（可能是单例或数组）
    let text: string | string[] | undefined = raw.text || raw.texts || raw.examples;
    if (Array.isArray(text) && text.length === 1) {
        text = text[0];
    }

    return {
        id,
        index,
        title,
        description,
        prompt,
        text,
        raw
    };
}