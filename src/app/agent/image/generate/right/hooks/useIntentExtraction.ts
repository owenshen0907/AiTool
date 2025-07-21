// File: /src/app/agent/image/right/hooks/useIntentExtraction.ts
'use client';

import { useState } from 'react';
import { urlToBase64 } from '@/lib/utils/imageToBase64';
import type { AgentSceneConfig } from '../../../../../../hooks/useAgentScenes';
import type { Template } from '../TemplateSelectorModal';
import type { ImageEntry } from '../../types';

export interface IntentItem {
    id: string;
    title: string;
    jlpt_level?: string;
    category_level1?: string;
    category_subtype?: string;
    core_explanation?: string;
}

const SCENE_INTENT = 'img_intent_extract';

export function useIntentExtraction() {
    const [loading, setLoading] = useState(false);
    const [intents, setIntents] = useState<IntentItem[]>([]);
    const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);

    /** 抽取意图，返回数组供外层使用 */
    const extract = async (params: {
        template: Template | null;
        noteRequest: string;
        images: ImageEntry[];
        scenes: AgentSceneConfig[];
        forceBase64: boolean;
    }): Promise<IntentItem[]> => {
        const { template, noteRequest, images, scenes, forceBase64 } = params;
        if (!template?.prompts?.intent_prompt) throw new Error('模板缺少意图抽取 prompt');

        const scene = scenes.find(s => s.sceneKey === SCENE_INTENT);
        if (!scene) throw new Error('缺少意图抽取场景配置');
        if (!noteRequest.trim() && images.length === 0) throw new Error('请输入文本或上传图片');

        setLoading(true);
        try {
            const { apiUrl, apiKey } = scene.supplier;
            const modelName = scene.model.name;

            /* 拼 user 消息 */
            const userMsgs: any[] = [];
            if (noteRequest.trim()) userMsgs.push({ type: 'text', text: noteRequest.trim() });

            if (scene.model.modelType === 'chat') {
                for (const img of images) {
                    if (img.status !== 'success') continue;
                    let url = img.url;
                    if (forceBase64 || ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
                        url = await urlToBase64(img.url);
                    }
                    userMsgs.push({ type: 'image_url', image_url: { url, detail: 'auto' } });
                }
            }

            const messages = [
                { role: 'system', content: template.prompts.intent_prompt },
                { role: 'user', content: userMsgs }
            ];

            const resp = await fetch(`${apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify({ model: modelName, stream: false, messages })
            });
            if (!resp.ok) throw new Error('意图抽取接口调用失败');

            const data = await resp.json();
            const content: string = data.choices?.[0]?.message?.content?.trim() || '';
            const jsonStr = extractFirstJson(content);
            if (!jsonStr) throw new Error('未能解析 JSON');

            const parsed = JSON.parse(jsonStr);
            const intentsRaw: any[] = Array.isArray(parsed.intents) ? parsed.intents : [];

            const mapped: IntentItem[] = intentsRaw.map(i => ({
                id: i.id || i.category_subtype || 'UNKNOWN',
                title: i.title || i.id || '未命名意图',
                jlpt_level: i.jlpt_level,
                category_level1: i.category_level1,
                category_subtype: i.category_subtype,
                core_explanation: i.core_explanation
            }));

            setIntents(mapped);
            if (mapped.length) setSelectedIntentId(mapped[0].id);

            return mapped;        // ← 关键：返回给外层
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        intents,
        setIntents,
        selectedIntentId,
        setSelectedIntentId,
        extract
    };
}

/* ---------- 工具 ---------- */
function extractFirstJson(text: string): string | null {
    const first = text.indexOf('{');
    const last  = text.lastIndexOf('}');
    if (first === -1 || last === -1 || last <= first) return null;
    const candidate = text.slice(first, last + 1);
    try { JSON.parse(candidate); return candidate; } catch { return null; }
}