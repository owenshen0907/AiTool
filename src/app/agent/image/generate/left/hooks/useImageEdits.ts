// File: src/app/agent/image/left/hooks/useImageEdits.ts
'use client';

import { useState } from 'react';
import type { AgentSceneConfig } from 'src/hooks/useAgentScenes';
import { editImage } from '@/lib/openai/imageEdits'; // ← 前面我给过的 StepFun 编辑接口封装

/** 把补充说明并入原始 prompt（带标签，便于追踪） */
function mergePrompt(base?: string, extra?: string, tag = '编辑说明') {
    const b = (base ?? '').trim();
    const e = (extra ?? '').trim();
    if (!e) return b;
    if (!b) return `【${tag}】\n${e}`;
    return `${b}\n\n【${tag}】\n${e}`;
}

export interface UseImageEditsResult {
    previews: string[];                  // 本次编辑得到的预览（b64 或 url）
    loading: boolean;
    error: string | null;
    /**
     * 调用图片编辑：
     * @param image 一张图片（可以是 dataURL / 纯base64 / http(s)URL / 相对URL / File / Blob）
     * @param extraNote 编辑说明（可选，会并入最终 prompt）
     * @returns 返回生成的图片数组（与 previews 相同）
     */
    edit: (image: File | Blob | string, extraNote?: string) => Promise<string[] | void>;
}

/**
 * 图片编辑 Hook：调用 /images/edits（StepFun 与 OpenAI 兼容）
 * - 不做上传与正文落库，只负责得到编辑结果的预览
 */
export function useImageEdits(
    basePrompt?: string,               // 卡片自带的 prompt，可为空
    imgEditScene?: AgentSceneConfig    // 场景配置：来自 getScene('img_edit')
): UseImageEditsResult {
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState<string | null>(null);

    async function edit(image: File | Blob | string, extraNote?: string) {
        if (!imgEditScene) { setError('缺少图片编辑的模型场景配置'); return; }

        const finalPrompt = mergePrompt(basePrompt, extraNote);
        if (!finalPrompt) { setError('请提供编辑说明或基础提示词'); return; }

        setLoading(true);
        setError(null);
        try {
            const res = await editImage({
                prompt: finalPrompt,
                scene: imgEditScene,
                image,
                model: imgEditScene.model.name,     // ← 模型从 img_edit 场景里取
                response_format: 'b64_json',        // 你也可以改成 'url'
                size:'1024x1024'
                // 需要的话可追加 size/seed/steps/cfg_scale 等
            });
            setPreviews(res);
            return res;
        } catch (e: any) {
            setError(e?.message || '编辑失败');
        } finally {
            setLoading(false);
        }
    }

    return { previews, loading, error, edit };
}