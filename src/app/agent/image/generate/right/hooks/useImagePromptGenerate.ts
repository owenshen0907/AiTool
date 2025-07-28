'use client';

import { useState } from 'react';
import type { AgentSceneConfig } from 'src/hooks/useAgentScenes';
import type { Template } from '../TemplateSelectorModal';
import type { IntentPromptOutput } from '../../types';
import { buildPrompt } from '../../promptBuilder';

const SCENE_PROMPT_GEN = 'img_prompt_generate';

interface GenerateParams {
    template: Template | null;
    scenes: AgentSceneConfig[];
    /** 选中的意图（从 intents 里拿） */
    intent: IntentPromptOutput['intents'][number] | null;
    /** 补充说明（可选，来自二次确认弹框） */
    extraNote?: string;
    /** 这条意图上一次生成的内容（如果要做“连续对话式”改善，可以传入） */
    prevContent?: string;
}

/** 提取第一段 JSON：既支持 ```json 围栏，也支持裸的 {} 或 [] 根节点 */
function extractFirstJsonOrArray(text: string): string | null {
    if (!text) return null;
    // 1) 优先找 ```json 围栏
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fence) {
        const inner = fence[1].trim();
        try { JSON.parse(inner); return inner; } catch { /* fallthrough */ }
    }
    // 2) 退化：找最外层 {} 或 []
    const firstBrace = text.indexOf('{');
    const lastBrace  = text.lastIndexOf('}');
    const firstBracket = text.indexOf('[');
    const lastBracket  = text.lastIndexOf(']');

    const candObjects = (firstBrace !== -1 && lastBrace > firstBrace)
        ? [text.slice(firstBrace, lastBrace + 1)]
        : [];
    const candArrays = (firstBracket !== -1 && lastBracket > firstBracket)
        ? [text.slice(firstBracket, lastBracket + 1)]
        : [];

    for (const c of [...candObjects, ...candArrays]) {
        try { JSON.parse(c); return c; } catch { /* try next */ }
    }
    return null;
}

/**
 * 与 useIntentExtraction 同风格的“生成插画提示”Hook：
 * - 用 buildPrompt(template.id, 'image_prompt') 构造 system
 * - 从 scenes 找 img_prompt_generate
 * - 用 chat completions（非流式）调用
 * - 解析返回中的 JSON（支持 ```json 围栏或裸 JSON）
 */
export function useImagePromptGenerate() {
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    /**
     * 生成插画提示 JSON 文本（**返回值是合法 JSON 字符串**，已格式化）
     */
    const generate = async (params: GenerateParams): Promise<string> => {
        const { template, scenes, intent, extraNote, prevContent } = params;

// ✅ 先确保选了模板
        if (!template?.id) {
            throw new Error('未选择模板');
        }

// ✅ 再验证在 promptConfigs 里确实配置了 image_prompt
        try {
            buildPrompt(template.id, 'image_prompt');
        } catch {
            throw new Error('PromptDefinition 未配置 image_prompt');
        }
        const scene = scenes.find(s => s.sceneKey === SCENE_PROMPT_GEN);
        if (!scene) {
            throw new Error('缺少图片提示生成场景配置（img_prompt_generate）');
        }
        if (!intent) {
            throw new Error('请先选择一个意图');
        }

        setLoading(true);
        setError(null);
        try {
            const { apiUrl, apiKey } = scene.supplier;
            const modelName = scene.model.name;

            // 1) system：用统一的 promptBuilder
            const systemPrompt = buildPrompt(template.id, 'image_prompt');

            // 2) user：把“选中意图 + 补充说明”作为文字输入
            const userTxt =
                `【选中意图】\nID:${intent.id}\n标题:${intent.title}\n` +
                (intent.level ? `JLPT:${intent.level}\n` : '') +
                (intent.description ? `说明:${intent.description}\n` : '') +
                (extraNote?.trim() ? `\n【补充说明】\n${extraNote.trim()}` : '');

            const messages: any[] = [
                { role: 'system', content: systemPrompt },
                ...(prevContent ? [{ role: 'assistant', content: prevContent }] : []),
                { role: 'user', content: [{ type: 'text', text: userTxt }] },
            ];

            // 3) 非流式请求
            const resp = await fetch(`${apiUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({ model: modelName, stream: false, messages })
            });
            if (!resp.ok) {
                const text = await resp.text().catch(() => '');
                throw new Error(`生成插画提示失败：${resp.status} ${text || ''}`.trim());
            }

            const data = await resp.json();
            const content = data?.choices?.[0]?.message?.content?.trim() || '';
            const jsonStr = extractFirstJsonOrArray(content);
            if (!jsonStr) throw new Error('未能从模型返回中解析出 JSON');

            // 4) 二次校验并格式化
            const parsed = JSON.parse(jsonStr);
            return JSON.stringify(parsed, null, 2);
        } catch (e: any) {
            const msg = e?.message || '生成失败';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, generate };
}