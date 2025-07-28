// File: src/app/agent/image/right/hooks/useIntentExtraction.ts
'use client';
import { useState } from 'react';
import { urlToBase64 } from '@/lib/utils/imageToBase64';
import type { AgentSceneConfig } from 'src/hooks/useAgentScenes';
import type { Template } from '../TemplateSelectorModal';
import type { ImageEntry } from '@/lib/models/file';
import { buildPrompt } from '../../promptBuilder';
import type { IntentPromptOutput } from '../../types';

const SCENE_INTENT = 'img_intent_extract';

export function useIntentExtraction() {
    const [loading, setLoading] = useState(false);
    const [intents, setIntents] = useState<IntentPromptOutput['intents']>([]);
    const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);

    const extract = async (params: {
        template: Template | null;
        noteRequest: string;
        images: ImageEntry[];
        scenes: AgentSceneConfig[];
        forceBase64: boolean;
    }): Promise<IntentPromptOutput['intents']> => {
        const { template, noteRequest, images, scenes, forceBase64 } = params;
        if (!template?.id) {
            throw new Error('未选择模板');
        }

        let systemPrompt: string;
        try {
            systemPrompt = buildPrompt(template.id, 'intent_prompt');
        } catch {
            // 这里表示 promptConfigs 里没有对应 template.id 的 intent_prompt 定义
            throw new Error('PromptDefinition 未配置 intent_prompt');
        }

        const scene = scenes.find(s => s.sceneKey === SCENE_INTENT);
        if (!scene) throw new Error('缺少意图抽取场景配置');

        // 只用 origin==='manual' 的图片
        const manualImages = images.filter(img => img.origin === 'manual');
        if (!noteRequest.trim() && manualImages.length === 0) {
            throw new Error('请输入文本或上传手动上传的图片');
        }

        setLoading(true);
        try {
            const { apiUrl, apiKey } = scene.supplier;
            const modelName = scene.model.name;

            const userMsgs: any[] = [];
            if (noteRequest.trim()) userMsgs.push({ type: 'text', text: noteRequest.trim() });
            if (scene.model.modelType === 'chat') {
                for (const img of manualImages) {
                    if (img.status !== 'success') continue;
                    let url = img.url;
                    if (forceBase64 || ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
                        url = await urlToBase64(img.url);
                    }
                    userMsgs.push({ type: 'image_url', image_url: { url, detail: 'auto' } });
                }
            }

            // const systemPrompt = buildPrompt(template.id, 'intent_prompt');
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMsgs }
            ];

            const resp = await fetch(`${apiUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({ model: modelName, stream: false, messages })
            });
            if (!resp.ok) throw new Error('意图抽取接口调用失败');

            const data = await resp.json();
            const content = data.choices?.[0]?.message?.content?.trim() || '';
            const jsonStr = extractFirstJson(content);
            if (!jsonStr) throw new Error('未能解析 JSON');

            const parsed = JSON.parse(jsonStr) as { intents?: any[] };
            const intentsRaw = Array.isArray(parsed.intents) ? parsed.intents : [];

            // 映射到 IntentPromptOutput 结构
            const mapped: IntentPromptOutput['intents'] = intentsRaw.map(i => ({
                id: i.id,
                title: i.title,
                level: i.level,
                description: i.description,
                category: i.category,
                subcategory: i.subcategory,
                confidence: i.confidence
            }));

            setIntents(mapped);
            if (mapped.length) setSelectedIntentId(mapped[0].id);
            return mapped;
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

// 工具：截取第一对大括号包裹的 JSON
function extractFirstJson(text: string): string | null {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first === -1 || last === -1 || last <= first) return null;
    const candidate = text.slice(first, last + 1);
    try { JSON.parse(candidate); return candidate; } catch { return null; }
}