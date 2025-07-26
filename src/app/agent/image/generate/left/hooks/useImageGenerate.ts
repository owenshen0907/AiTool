// File: src/app/agent/image/left/hooks/useImageGenerate.ts
'use client';

import { useState } from 'react';
import type { AgentSceneConfig } from 'src/hooks/useAgentScenes';
import type { GenerateImagesOptions } from '@/lib/openai/imageGenerator';
import { generateImages } from '@/lib/openai/imageGenerator';

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
     * Generate a fresh batch of images (Base64 strings) from the AI.
     */
    async function generate() {
        if (!prompt?.trim() || !imgGenerateScene) return;
        setLoading(true);
        setError(null);
        try {
            const opts: GenerateImagesOptions = {
                prompt,
                scene: imgGenerateScene,
                n: 1,
                response_format: 'b64_json',
                model: imgGenerateScene.model.name,
                background: 'auto',
            };
            const b64List = await generateImages(opts);
            setPreviews(b64List);
        } catch (e: any) {
            setError(e.message || '生成失败');
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