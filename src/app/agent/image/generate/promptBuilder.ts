// File: src/app/agent/image/generate/promptBuilder.ts

import type { PromptDefinition } from './types';
import { promptConfigs, globalOutputFormats } from './promptConfigs';

/**
 * 构建完整 prompt 文本
 * @param agentId 对应 promptConfigs 中的 id
 * @param promptKey 'intent_prompt' | 'image_prompt'
 */
export function buildPrompt(
    agentId: string,
    promptKey: keyof PromptDefinition['prompts']
): string {
    const cfg = promptConfigs.find(p => p.id === agentId);
    if (!cfg) {
        throw new Error(`PromptDefinition 未找到: ${agentId}`);
    }
    const p = cfg.prompts[promptKey];
    if (!p) {
        throw new Error(`Prompt 键未定义: ${promptKey}`);
    }

    // 注入全局格式
    const fmt = globalOutputFormats[promptKey as 'intent_prompt' | 'image_prompt'];

    const parts: string[] = [];
    parts.push(`ROLE: ${p.role}`);
    parts.push(`TASK: ${p.task}`);
    if (p.steps) {
        parts.push(
            `STEPS:\n${p.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        );
    }
    if (p.description) {
        parts.push(`DESCRIPTION:\n${p.description}`);
    }
    parts.push(`OUTPUT_FORMAT:\n${fmt}`);
    if (p.notes) {
        parts.push(`NOTES:\n${p.notes.join('\n')}`);
    }

    return parts.join('\n\n');
}