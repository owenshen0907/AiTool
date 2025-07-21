// File: src/app/agent/image/left/hooks/useImageGenerate.ts
'use client';

import { useState } from 'react';
import type { AgentSceneConfig } from 'src/hooks/useAgentScenes';
import type { GenerateImagesOptions } from '@/lib/openai/imageGenerator';
import { generateImages } from '@/lib/openai/imageGenerator';

export function useImageGenerate(
    prompt: string | undefined,
    /** img_generate 场景配置，从父组件传入 */
    imgGenerateScene: AgentSceneConfig | undefined
) {
    const [images, setImages] = useState<string[]>([]);
    const [callId, setCallId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** 发起新一轮生成 */
    async function create() {
        if (!prompt?.trim()) return;
        if (!imgGenerateScene) {
            setError('缺少 img_generate 场景配置');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // 直接用 generateImages 接受的类型
            const opts: GenerateImagesOptions = {
                prompt,
                scene: imgGenerateScene,
                n: 1,
                // response_format: 'b64_json',          // 字面量，满足类型要求
                model: imgGenerateScene.model.name,   // 用配置里的 model.name
                background: 'auto'                    // 可选项
            };

            const imgs = await generateImages(opts);
            setImages(imgs);
            setCallId(Date.now().toString());     // 兼容旧版
        } catch (e: any) {
            setError(e.message || '生成失败');
        } finally {
            setLoading(false);
        }
    }

    /** 简单拼接 refine 逻辑占位 */
    async function refine() {
        if (!callId) return;
        if (!imgGenerateScene) {
            setError('缺少 img_generate 场景配置');
            return;
        }

        const refineText = window.prompt('输入细化指令（例如：更写实 / 柔和光线）', '');
        if (!refineText?.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const opts: GenerateImagesOptions = {
                prompt: `${prompt}\n${refineText.trim()}`,
                scene: imgGenerateScene,
                n: 1,
                // response_format: 'b64_json',
                model: imgGenerateScene.model.name,
                background: 'auto'
            };
            const imgs = await generateImages(opts);
            setImages(imgs);
            setCallId(Date.now().toString());
        } catch (e: any) {
            setError(e.message || '细化失败');
        } finally {
            setLoading(false);
        }
    }

    return { images, callId, loading, error, create, refine };
}