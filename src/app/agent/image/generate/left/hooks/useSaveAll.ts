// File: src/app/agent/image/left/hooks/useSaveAll.ts
'use client';

import { useMemo, useState, useCallback } from 'react';
import type { ContentItem } from '@/lib/models/content';

/** 供外部传入的卡片预览结构：每个卡片有标题和一组预览（base64/data-URI 或 URL） */
export type PreviewMap = Record<string, { title: string; previews: string[] }>;

/** 供外部传入的在途状态：每个卡片 0|1 表示是否仍在生成中 */
export type PendingMap = Record<string, 0 | 1>;

/** 小工具：按 localStorage.IMG_DEBUG 决定是否打印调试日志 */
function dbg(...args: any[]) {
    try {
        if (typeof window !== 'undefined' && localStorage.getItem('IMG_DEBUG') === '1') {
            // eslint-disable-next-line no-console
            console.debug('[IMG_DEBUG]', ...args);
        }
    } catch {}
}

/** 转义正则特殊字符，确保标题安全用于构造正则 */
function escapeRegExp(str: string) {
    return (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 在“当前 md 文本”中查找某个标题已经使用到的最大序号（![标题-数字](...)），返回 next = max + 1。
 * 规则：匹配标准 Markdown 图片语法，允许行尾可选的 <!-- id: ... --> 注释。
 *
 * 例行匹配：
 *   ![图一：结构图-3](/upload/xxx.png)
 *   ![图一：结构图-4](/upload/yyy.png) <!-- id: 550e8400-e29b-41d4-a716-446655440000 -->
 */
function getNextIndexForTitle(md: string, title: string): number {
    if (!title) return 1;
    const esc = escapeRegExp(title.trim());
    const re = new RegExp(
        // ![  标题  -   数字  ](  非 ) 的任意内容  )   可选空白 + 可选注释
        String.raw`!$begin:math:display$\\s*${esc}\\s*-\\s*(\\d+)\\s*$end:math:display$$begin:math:text$[^)]+$end:math:text$(?:\s*<!--\s*id:\s*([a-f0-9-]+)\s*-->)?`,
        'gi'
    );

    let max = 0;
    let m: RegExpExecArray | null;
    const matchedNums: number[] = [];

    while ((m = re.exec(md)) !== null) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n)) {
            matchedNums.push(n);
            if (n > max) max = n;
        }
    }

    dbg('getNextIndexForTitle', { title, matched: matchedNums.sort((a,b)=>a-b), max, next: max + 1 });
    return max + 1;
}

/** 粗判：是否为 dataURI 或“裸的”base64（无 data: 前缀但看起来是 Base64 字符串） */
function isDataUriOrB64(s: string): boolean {
    if (!s) return false;
    if (s.startsWith('data:')) return true;
    // 注意：这是启发式判断——只要像 Base64 就视为需上传
    return /^[A-Za-z0-9+/=\s]+$/.test(s) && s.replace(/\s+/g, '').length >= 128 && !/^https?:\/\//i.test(s) && !s.startsWith('/');
}

/** 把 dataURI 或裸 base64 转为 File；统一当成 PNG 类型处理 */
async function dataUriToFile(dataUriOrB64: string, filename: string): Promise<File> {
    const dataUri = dataUriOrB64.startsWith('data:')
        ? dataUriOrB64
        : `data:image/png;base64,${dataUriOrB64}`;
    const blob = await fetch(dataUri).then(r => r.blob());
    return new File([blob], filename, { type: blob.type || 'image/png' });
}

/** Hook 入参 */
interface UseSaveAllParams {
    /** 业务模块名，会随上传文件一起带上（后端可据此分类） */
    feature: string;
    /** 当前选中的文档（用于持久化） */
    selectedItem: ContentItem | null;
    /** 当前编辑器正文（Markdown） */
    body: string;
    /** 各卡片的预览（base64/URL） */
    previewMap: PreviewMap;
    /** 各卡片是否还在生成（有在途则禁止保存） */
    pendingMap: PendingMap;
    /** 写回编辑器正文（仅更新前端状态） */
    onChangeBody: (body: string) => void;
    /** 持久化到后端 */
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
    /** 成功保存后的回调（例如清空 previewMap） */
    onAfterSaved?: () => void;
}

/** Hook 出参 */
interface UseSaveAllReturn {
    /** 可保存的预览总张数（仅统计 base64/URL 的总和） */
    totalPreviews: number;
    /** 正在保存（按钮 loading/disabled 的依据） */
    saving: boolean;
    /** 触发保存（批量上传 + 仅在末尾 append Markdown 图片行 + 一次性持久化） */
    handleSaveAll: () => Promise<void>;
}

/**
 * 统一的“保存主体内容”逻辑：
 * - 先校验：有无选中项、是否在途、是否有可保存图片
 * - 对每个卡片：
 *    1) 把“已是 URL”的直接拼 Markdown
 *    2) 把 base64/dataURI 批量上传到 /api/files，拿回 url 与 file_id 后拼 Markdown
 *    3) 把该卡片的 Markdown 块 append 到“当前 newBody”的末尾（不改原文其它部分）
 * - 最后：一次性 onChangeBody + onUpdateItem；成功后可执行 onAfterSaved（如清空预览）
 */
export function useSaveAll(params: UseSaveAllParams): UseSaveAllReturn {
    const {
        feature,
        selectedItem,
        body,
        previewMap,
        pendingMap,
        onChangeBody,
        onUpdateItem,
        onAfterSaved
    } = params;

    const [saving, setSaving] = useState(false);

    /** 统计总张数，便于 UI 显示“保存主体内容（X 张）” */
    const totalPreviews = useMemo(
        () => Object.values(previewMap).reduce((sum, it) => sum + (it?.previews?.length || 0), 0),
        [previewMap]
    );

    const handleSaveAll = useCallback(async () => {
        if (!selectedItem) return;

        // 1) 前置校验
        if (totalPreviews === 0) {
            alert('没有可保存的图片。');
            return;
        }
        if (Object.values(pendingMap).some(v => v === 1)) {
            alert('仍有图片生成中，请稍后再保存。');
            return;
        }

        setSaving(true);
        try {
            // 2) 保留原文，仅在末尾 append
            let newBody = body;

            dbg('saveAll.start', {
                cardIds: Object.keys(previewMap),
                totalPreviews,
            });

            // 3) 逐卡片处理
            for (const cardId of Object.keys(previewMap)) {
                const { title: cardTitle, previews } = previewMap[cardId] || {};
                if (!previews || previews.length === 0) continue;

                // 拆分：已是 URL vs 需上传
                const needsUpload = previews.filter(p => isDataUriOrB64(p));
                const readyUrls   = previews.filter(p => !isDataUriOrB64(p));

                // 计算该标题的起始序号（基于“当前 newBody”）
                let nextIndex = getNextIndexForTitle(newBody, cardTitle);
                const mdLines: string[] = [];

                dbg('saveAll.card.begin', {
                    cardId,
                    cardTitle,
                    previewsLen: previews.length,
                    needsUploadLen: needsUpload.length,
                    readyUrlsLen: readyUrls.length,
                    startNextIndex: nextIndex,
                });

                // 3.1) 已是 URL：直接拼 Markdown
                for (const url of readyUrls) {
                    mdLines.push(`![${cardTitle}-${nextIndex}](${url})`);
                    dbg('saveAll.card.addReadyUrl', { url, index: nextIndex });
                    nextIndex += 1;
                }

                // 3.2) 需上传：一次卡片一次表单，批量提交到 /api/files
                if (needsUpload.length > 0) {
                    const form = new FormData();
                    form.append('module', feature);
                    form.append('form_id', selectedItem.id);
                    form.append('origin', 'ai');

                    let i = 0;
                    for (const p of needsUpload) {
                        const file = await dataUriToFile(p, `save-${cardId}-${++i}.png`);
                        form.append(`file${i}`, file);
                    }

                    const res = await fetch('/api/files', { method: 'POST', body: form });

                    // 只读一次 body：先 text，再按 content-type 尝试 JSON 解析
                    const contentType = res.headers.get('content-type') || '';
                    const raw = await res.text(); // 只读一次
                    let data: any = raw;
                    if (contentType.includes('application/json')) {
                        try { data = raw ? JSON.parse(raw) : null; } catch { /* 保留 raw */ }
                    }

                    if (!res.ok) {
                        const msg = (data && typeof data === 'object' && data.error)
                            ? data.error
                            : `上传失败（${res.status}）`;
                        throw new Error(msg);
                    }

                    // 后续都用 data，千万别再 res.json() 了（Response.body 已消费）
                    const arr: Array<{ url?: string; file_path?: string; file_id?: string }> =
                        Array.isArray(data) ? data : [data];

                    dbg('saveAll.card.uploadResult', arr);

                    for (const it of arr) {
                        const url = it?.url ?? (it?.file_path ? `/${it.file_path}` : '');
                        if (!url) continue;
                        const fileId = it?.file_id || '';
                        mdLines.push(
                            `![${cardTitle}-${nextIndex}](${url})` +
                            (fileId ? ` <!-- id: ${fileId} -->` : '')
                        );
                        dbg('saveAll.card.addUploaded', { url, fileId, index: nextIndex });
                        nextIndex += 1;
                    }
                }

                // 3.3) 把该卡片的行统一 append 到正文末尾（不改原文其它部分）
                if (mdLines.length > 0) {
                    const block = mdLines.join('\n\n');
                    newBody = (newBody ? `${newBody}\n\n` : '') + block;
                    dbg('saveAll.card.appendBlock', {
                        cardId,
                        lines: mdLines.length,
                        blockSample: block.slice(0, 120) + '...'
                    });
                }
            }

            // 4) 一次性写回并持久化
            onChangeBody(newBody);
            await onUpdateItem(selectedItem, { body: newBody });

            dbg('saveAll.done');

            // 5) 成功回调（例如清空预览）
            onAfterSaved?.();

            alert('已保存主体内容。');
        } catch (e: any) {
            console.error(e);
            alert(e?.message || '保存失败');
        } finally {
            setSaving(false);
        }
    }, [
        body,
        feature,
        onChangeBody,
        onUpdateItem,
        previewMap,
        selectedItem,
        totalPreviews,
        pendingMap
    ]);

    return { totalPreviews, saving, handleSaveAll };
}