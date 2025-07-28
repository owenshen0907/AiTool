// File: src/app/agent/image/left/hooks/useImageGenerate.ts
'use client';

import { useState } from 'react';
import type { AgentSceneConfig } from 'src/hooks/useAgentScenes';
import type { GenerateImagesOptions } from '@/lib/openai/imageGenerator';
import { generateImages } from '@/lib/openai/imageGenerator';


/** 把补充说明并入原始 prompt（带标签，便于后续定位/追踪） */
function mergePrompt(base?: string, extra?: string, tag = '补充说明') {
    const b = (base ?? '').trim();
    const e = (extra ?? '').trim();
    if (!e) return b;                          // 没有补充说明，直接用原 prompt
    if (!b) return `【${tag}】\n${e}`;          // 没有原 prompt，仅输出补充
    return `${b}\n\n【${tag}】\n${e}`;          // 二者都有时，在末尾追加（空一行）
}
/**
 * Hook for generating and previewing AI images as Base64.
 * Does NOT perform any uploads or update content automatically.
 */
export function useImageGenerate(
    prompt?: string,
    imgGenerateScene?: AgentSceneConfig
) {
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * 生成图片：
     * - 接收可选的 extraNote（来自 UI 弹框的“补充说明”）
     * - 在调用接口前把 extraNote 合并进最终 prompt
     */
    async function generate(extraNote?: string) {
        if (!imgGenerateScene) return;
        const finalPrompt = mergePrompt(prompt, extraNote, '补充说明');
        if (!finalPrompt) return;

        setLoading(true);
        setError(null);
        try {
            const opts: GenerateImagesOptions = {
                prompt: finalPrompt,
                scene: imgGenerateScene,
                n: 1,
                response_format: 'b64_json',
                model: imgGenerateScene.model.name,
                background: 'auto',
            };
            const b64List = await generateImages(opts);
            setPreviews(b64List);
        } catch (e: any) {
            setError(e?.message || '生成失败');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Refine the current prompt by appending extra text, then regenerate.
     * @param refineText Additional instructions to refine the image
     */
    async function refine(refineText: string) {
        if (!prompt || !imgGenerateScene) return;
        setLoading(true);
        setError(null);
        try {
            const opts: GenerateImagesOptions = {
                prompt: `${prompt}\n${refineText.trim()}`,
                scene: imgGenerateScene,
                n: 1,
                response_format: 'b64_json',
                model: imgGenerateScene.model.name,
                background: 'auto',
            };
            const b64List = await generateImages(opts);
            setPreviews(b64List);
        } catch (e: any) {
            setError(e.message || '细化失败');
        } finally {
            setLoading(false);
        }
    }

    return { previews, loading, error, generate, refine };
}