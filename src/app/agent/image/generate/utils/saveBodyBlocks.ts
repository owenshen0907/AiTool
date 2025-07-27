// File: src/app/agent/image/right/utils/saveBodyBlocks.ts
'use client';

/**
 * 该工具文件统一处理“把模型输出写回正文（Markdown）”的逻辑：
 * - 仅更新对应的区块（REQUEST / INTENTS / IMAGE_PROMPT），其它正文保持不动
 * - IMAGE_PROMPT：自动补齐 ```json/``` 围栏；旧内容不覆盖，按“数组追加”策略合并
 * - 所有保存 API：内部会调用 onChangeBody 和 onUpdateItem，确保状态与后端一致
 */

import type { ContentItem } from '@/lib/models/content';

/* ======================= 公共小工具 ======================= */

/** 转义正则保留字 */
const esc = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

/** 从 ```json ... ``` 中取“内部 JSON 文本”；若无围栏则原样返回（去首尾空白） */
export function stripJsonFence(text: string): string {
    if (!text) return '';
    const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    return m ? m[1].trim() : text.trim();
}

/** 统一的 upsert：若存在该块则替换，否则在文末追加（并自动补上 ```json 围栏） */
function upsertBlock(base: string, start: string, end: string, innerJsonText: string): string {
    const block = [
        `<!-- ${start} -->`,
        '```json',
        (innerJsonText || '').trim(),
        '```',
        `<!-- ${end} -->`,
    ].join('\n');

    const re = new RegExp(
        `<!--\\s*${esc(start)}\\s*-->[\\s\\S]*?<!--\\s*${esc(end)}\\s*-->`,
        'm'
    );

    return re.test(base)
        ? base.replace(re, block)                          // 已存在 → 替换该块
        : [base.trim(), block].filter(Boolean).join('\n\n'); // 不存在 → 末尾追加
}

/** 解析现有 IMAGE_PROMPT 区块内部 JSON 文本（无围栏） */
export function parseImagePromptBlock(markdown: string): string | null {
    const m = markdown.match(
        /<!--\s*IMAGE_PROMPT START\s*-->\s*```json\s*([\s\S]*?)\s*```[\s\S]*?<!--\s*IMAGE_PROMPT END\s*-->/i
    );
    return m ? m[1].trim() : null;
}

/** 构造 INTENT REQUEST 块（text 围栏） */
function buildRequestBlock(requestText: string): string {
    return [
        '<!-- INTENT REQUEST START -->',
        '```text',
        (requestText || '').trim(),
        '```',
        '<!-- INTENT REQUEST END -->'
    ].join('\n');
}

/** 构造 INTENTS 块（json 围栏） */
function buildIntentsBlock(intents: any[]): string {
    return [
        '<!-- INTENTS START -->',
        '```json',
        JSON.stringify(intents ?? [], null, 2),
        '```',
        '<!-- INTENTS END -->'
    ].join('\n');
}

/** 移除旧的 REQUEST 与 INTENTS 块，返回“干净的 base” */
function stripOldRequestAndIntents(base: string): string {
    return base
        .replace(
            /<!--\s*INTENT REQUEST START\s*-->[\s\S]*?<!--\s*INTENT REQUEST END\s*-->\s*/im,
            ''
        )
        .replace(
            /<!--\s*INTENTS START\s*-->[\s\S]*?<!--\s*INTENTS END\s*-->\s*/im,
            ''
        );
}

/* ======================= 对外能力 ======================= */

export interface SaveDeps {
    selectedItem: ContentItem | null;
    existingBody: string;
    onChangeBody: (body: string) => void;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
}

/**
 * 保存 “IMAGE_PROMPT” 区块：
 * - 接收模型原始输出（可含/不含 ```json 围栏）
 * - 强制校验为合法 JSON
 * - 与旧块合并：旧为对象→[old,new]；旧为数组→push new；旧损坏→[旧原文,new]
 * - 仅 upsert IMAGE_PROMPT，正文其他部分不变
 */
export async function saveImagePromptBlock(
    deps: SaveDeps,
    modelOutput: string, // 可能含 ```json/``` 围栏
): Promise<{ newBody: string; mergedJson: any }> {
    const { selectedItem, existingBody, onChangeBody, onUpdateItem } = deps;

    // 1) 取内部 JSON 文本
    const inner = stripJsonFence((modelOutput || '').trim());

    // 2) 严格校验 JSON
    let newJson: any;
    try {
        newJson = JSON.parse(inner);
    } catch (e) {
        throw new Error('模型返回的图片提示不是合法 JSON。请检查模板使其仅输出合法 JSON。');
    }

    // 3) 合并到旧 IMAGE_PROMPT
    let merged: any;
    const oldRaw = parseImagePromptBlock(existingBody);
    if (oldRaw) {
        try {
            const oldJson = JSON.parse(oldRaw);
            if (Array.isArray(oldJson)) {
                merged = [...oldJson, newJson];
            } else {
                merged = [oldJson, newJson];
            }
        } catch {
            // 旧数据损坏（或非 JSON）：保底——把旧原文与新对象一起塞进数组
            merged = [oldRaw, newJson];
        }
    } else {
        merged = newJson;
    }

    // 4) 仅 upsert IMAGE_PROMPT 区块（自动补齐 ```json 围栏）
    const newBody = upsertBlock(
        existingBody,
        'IMAGE_PROMPT START',
        'IMAGE_PROMPT END',
        JSON.stringify(merged, null, 2)
    );

    // 5) 本地与后端持久化
    onChangeBody(newBody);
    if (selectedItem) {
        await onUpdateItem(selectedItem, { body: newBody });
    }

    return { newBody, mergedJson: merged };
}

/**
 * 保存 “INTENT REQUEST + INTENTS” 两个区块：
 * - 移除旧块后，按顺序把新 REQUEST 与新 INTENTS 追加到文末
 * - 正文其他内容保持不动
 */
export async function saveRequestAndIntentsBlocks(
    deps: SaveDeps,
    requestText: string,
    intents: any[], // 你的 Intent 结构数组
): Promise<{ newBody: string }> {
    const { selectedItem, existingBody, onChangeBody, onUpdateItem } = deps;

    const base = stripOldRequestAndIntents(existingBody);
    const requestBlock = buildRequestBlock(requestText);
    const intentsBlock = buildIntentsBlock(intents);

    const newBody = [base.trim(), requestBlock, intentsBlock].filter(Boolean).join('\n\n');

    onChangeBody(newBody);
    if (selectedItem) {
        await onUpdateItem(selectedItem, { body: newBody });
    }

    return { newBody };
}