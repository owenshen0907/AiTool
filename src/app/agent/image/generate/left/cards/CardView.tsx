// File: src/app/agent/image/left/cards/CardView.tsx
'use client';

import React, { useMemo, useEffect } from 'react';
import { CardPromptBlock } from './CardPromptBlock';
import { CardImagePanel  } from './CardImagePanel';
import { useImageGenerate } from '../hooks/useImageGenerate';
import { useImageEdits } from '../hooks/useImageEdits';
import type { ContentItem }      from '@/lib/models/content';
import type { AgentSceneConfig } from 'src/hooks/useAgentScenes';

/* ------------ 工具 & 调试 ------------ */
function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function dbg(...args: any[]) {
    try {
        if (typeof window !== 'undefined' && window.localStorage.getItem('IMG_DEBUG') === '1') {
            // eslint-disable-next-line no-console
            console.debug('[IMG_DEBUG]', ...args);
        }
    } catch {}
}
function normalizeForCompare(s: string) {
    return (s || '').replace(/\s+/g, '').replace(/：/g, ':').trim();
}
// base64 预览补头
function isBareB64(s: string) {
    if (!s) return false;
    if (s.startsWith('data:')) return false;
    if (/^https?:\/\//i.test(s)) return false;
    if (s.startsWith('/')) return false;
    const t = s.replace(/\s+/g, '');
    if (t.length < 128) return false;
    return /^[A-Za-z0-9+/_-]+={0,2}$/.test(t);
}
function normalizePreviewSrc(src: string) {
    if (!src) return src;
    if (src.startsWith('data:')) return src;
    if (isBareB64(src)) return `data:image/png;base64,${src.replace(/\s+/g, '')}`;
    return src;
}
// 展示时给 /upload/... 补域名
function withOriginIfRelative(src: string) {
    if (!src) return src;
    if (typeof window !== 'undefined' && src.startsWith('/')) {
        return `${window.location.origin}${src}`;
    }
    return src;
}
// 删除时把域名剥掉，和 body 里的相对路径对齐
function stripOrigin(u: string) {
    if (!u) return u;
    try {
        const { origin } = window.location;
        return u.startsWith(origin) ? u.slice(origin.length) : u;
    } catch {
        return u;
    }
}

/** 按 file_id 精确删行（否则回退 URL），返回 next body 和命中方式 */
/** 行级删除：优先按 file_id 命中，其次回退按 URL 命中 */
function removeLineByIdOrUrl(
    md: string,
    fileId?: string,
    url?: string
): { next: string; matchedBy: 'id'|'url'|'none'; debug?: any } {
    const src = md || '';

    // 工具：给 url 去掉域名，和正文中的相对路径一致
    const stripOriginLocal = (u: string) => {
        if (!u) return u;
        try {
            const { origin } = window.location;
            return u.startsWith(origin) ? u.slice(origin.length) : u;
        } catch { return u; }
    };

    // 工具：裁掉一整行（从 startOfLine 到 endOfLine）
    const clipLineByHitIndex = (text: string, hitIdx: number) => {
        const start = Math.max(0, text.lastIndexOf('\n', Math.max(0, hitIdx - 1)) + 1);
        // 找“下一个换行”的索引；如果没有，则取文末
        const nl = text.indexOf('\n', hitIdx);
        const end = nl === -1 ? text.length : nl + 1;
        const before = text.slice(0, start);
        const after  = text.slice(end);
        // 压缩 3+ 连续换行为 2 行
        const merged = (before + after).replace(/\n{3,}/g, '\n\n');
        return { next: merged, start, end };
    };

    // ① 先按 file_id 删
    if (fileId) {
        const needle = `id: ${fileId}`;
        const hitIdx = src.indexOf(needle);
        if (hitIdx !== -1) {
            const { next, start, end } = clipLineByHitIndex(src, hitIdx);
            return {
                next,
                matchedBy: 'id',
                debug: { via: 'id', needle, hitIdx, start, end, removedSample: src.slice(start, end) }
            };
        }
    }

    // ② 回退按 URL 删（把 http://host 去掉，只保留 /upload/...）
    if (url) {
        const bodyUrl = stripOriginLocal(url);
        const needle = `](${bodyUrl})`;
        const hitIdx = src.indexOf(needle);
        if (hitIdx !== -1) {
            const { next, start, end } = clipLineByHitIndex(src, hitIdx);
            return {
                next,
                matchedBy: 'url',
                debug: { via: 'url', needle, hitIdx, start, end, removedSample: src.slice(start, end) }
            };
        }
    }

    return { next: src, matchedBy: 'none', debug: { reason: 'no-hit', len: src.length } };
}

/* ------------ 组件 ------------ */
interface CardViewProps {
    feature: string;
    data: {
        id: string;
        title?: string;
        description?: string;
        prompt?: string;
        text?: string | string[];
    };
    selectedItem: ContentItem;

    /** 左侧最新正文（用于解析历史图片） */
    bodyText: string;

    onChangeBody: (body: string) => void;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
    imgGenerateScene?: AgentSceneConfig;
    /** ✅ 新增：图片编辑场景 */
    imgEditScene?: AgentSceneConfig;

    onStart?: () => void;
    onFinish?: () => void;
    onPreviewsChange?: (cardId: string, title: string, previews: string[]) => void;
}

export default function CardView({
                                     feature,
                                     data,
                                     selectedItem,
                                     bodyText,
                                     onChangeBody,
                                     onUpdateItem,
                                     imgGenerateScene,
                                     imgEditScene,
                                     onStart,
                                     onFinish,
                                     onPreviewsChange,
                                 }: CardViewProps) {
    const { id: cardId, title = '（无标题）', description, prompt, text } = data;

    // 生成
    const {
        previews: genPreviews,
        loading: genLoading,
        error: genError,
        generate
    } = useImageGenerate(prompt, imgGenerateScene);

    // 编辑
    const {
        previews: editPreviews,
        loading: editLoading,
        error: editError,
        edit
    } = useImageEdits(prompt, imgEditScene);

    const loading = genLoading || editLoading;
    const error   = genError || editError;

    /** 解析与本卡相关的“已保存图片”：拿到 (url, fileId) 对 */
    const persistedPairs = useMemo(() => {
        const md = bodyText || '';
        // 抓所有 markdown 图片（带不带 id 注释都行）
        const anyImgRe = /!\[([^\]]*)\]\(([^)]+)\)(?:\s*<!--\s*id:\s*([a-f0-9-]+)\s*-->)?/gi;
        const hits: Array<{ alt: string; url: string; id?: string }> = [];
        let m: RegExpExecArray | null;
        while ((m = anyImgRe.exec(md)) !== null) {
            hits.push({ alt: m[1] || '', url: m[2], id: m[3] });
        }
        const normTitle = normalizeForCompare(title);
        const pairs = hits.filter(h => normalizeForCompare(h.alt).startsWith(`${normTitle}-`));
        dbg('CardView.parse.pairs', { cardId, title, all: hits.length, matched: pairs.length, sample: pairs.slice(0,3) });
        return pairs; // [{url, id}]
    }, [bodyText, title, cardId]);

    /** 展示：预览优先（生成 + 编辑），随后拼接持久化的；同时构造 fileId 数组（与展示顺序对齐） */
    const previewsFromHooks = useMemo(
        () => [...genPreviews, ...editPreviews],   // 原始（保存用，不做 normalize）
        [genPreviews, editPreviews]
    );

    const previewsForDisplay = useMemo(
        () => previewsFromHooks.map(normalizePreviewSrc),
        [previewsFromHooks]
    );

    const persistedForDisplay = useMemo(
        () => persistedPairs.map(p => withOriginIfRelative(p.url)),
        [persistedPairs]
    );
    const persistedFileIds = useMemo(
        () => persistedPairs.map(p => p.id),
        [persistedPairs]
    );

    const displayImages = useMemo(() => {
        if (previewsForDisplay.length === 0) return persistedForDisplay;
        return [...previewsForDisplay, ...persistedForDisplay];
    }, [previewsForDisplay, persistedForDisplay]);

    const displayFileIds = useMemo(() => {
        if (previewsForDisplay.length === 0) return persistedFileIds;
        return [...new Array(previewsForDisplay.length).fill(undefined), ...persistedFileIds];
    }, [previewsForDisplay, persistedFileIds]);

    useEffect(() => {
        dbg('CardView.gallery', {
            cardId, title,
            genPreviews: genPreviews.length,
            editPreviews: editPreviews.length,
            persistedLen: persistedForDisplay.length,
            showLen: displayImages.length,
            sample: displayImages.slice(0,3)
        });
    }, [cardId, title, genPreviews, editPreviews, persistedForDisplay, displayImages]);

    // 上报“可保存的预览”（生成+编辑），供左侧“保存主体内容”使用
    useEffect(() => {
        onPreviewsChange?.(cardId, title, previewsFromHooks);
    }, [cardId, title, previewsFromHooks, onPreviewsChange]);

    /* ---- 交互 ---- */
    const handleDownload = (idx: number) => {
        const url = displayImages[idx];
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'image'}-${idx + 1}.png`;
        a.click();
    };

    const handleDelete = async (idx: number) => {
        const fileId = displayFileIds[idx];
        const url    = displayImages[idx];
        const group  = `[IMG_DEBUG] delete ${title} @${idx}`;

        // 折叠日志组，便于一眼看全流程
        // eslint-disable-next-line no-console
        console.groupCollapsed(group);
        try {
            // 0) 参数 & 上下文
            // eslint-disable-next-line no-console
            console.debug('[IMG_DEBUG] delete.params', { cardId, title, idx, fileId, url });

            if (!fileId && !url) {
                // eslint-disable-next-line no-console
                console.warn('[IMG_DEBUG] delete.cancel: empty fileId & url');
                return;
            }
            if (!confirm('确定删除这张图片吗？')) {
                // eslint-disable-next-line no-console
                console.debug('[IMG_DEBUG] delete.userCancel');
                return;
            }

            const beforeBody = bodyText || '';
            const { next, matchedBy, debug } = removeLineByIdOrUrl(beforeBody, fileId, url);
            console.debug('[IMG_DEBUG] delete.removeLine', {
                matchedBy,
                via: debug?.via,
                needle: debug?.needle,
                hitIdx: debug?.hitIdx,
                start: debug?.start,
                end: debug?.end,
                removedSample: debug?.removedSample,
                beforeLen: beforeBody.length,
                afterLen: next.length
            });

            // 判定一下是否真的删到了东西
            if (next.length === beforeBody.length) {
                // eslint-disable-next-line no-console
                console.warn('[IMG_DEBUG] delete.noChange: body length unchanged (regex not matched)');
            }

            // 2) 乐观更新（先把 UI 里的这行干掉，避免裂图）
            onChangeBody(next);
            // eslint-disable-next-line no-console
            console.debug('[IMG_DEBUG] delete.optimisticApplied');

            // 3) 有 fileId 就删服务器文件；没有 id（旧数据）就跳过
            if (fileId) {
                const res = await fetch('/api/files', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file_id: fileId }),
                });
                const text = await res.text().catch(() => '');
                // eslint-disable-next-line no-console
                console.debug('[IMG_DEBUG] delete.api.files', { ok: res.ok, status: res.status, body: text });
                if (!res.ok) throw new Error(`删除文件失败（status ${res.status}）`);
            } else {
                // eslint-disable-next-line no-console
                console.debug('[IMG_DEBUG] delete.api.files.skip (no fileId)');
            }

            // 4) 持久化新的 body
            // eslint-disable-next-line no-console
            console.debug('[IMG_DEBUG] delete.onUpdateItem.call');
            await onUpdateItem(selectedItem, { body: next });
            // eslint-disable-next-line no-console
            console.debug('[IMG_DEBUG] delete.onUpdateItem.done');
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[IMG_DEBUG] delete.error', e);
            alert((e as any)?.message || '删除失败');
            // 理论上这里应该回滚，但 onChangeBody 的回滚需要上层持有 beforeBody；
            // 如果你要回滚，请把 beforeBody 通过参数传回调用方，这里仅记录日志。
        } finally {
            // eslint-disable-next-line no-console
            console.groupEnd();
        }
    };

    // 生成：支持额外说明（从弹框传入）
    const handleGenerate = async (extraNote?: string) => {
        onStart?.();
        try { await generate(extraNote); } finally { onFinish?.(); }
    };

    // 编辑：需要选中图片 + 编辑说明
    const handleEdit = async (imageSrc: string, extraNote?: string) => {
        onStart?.();
        try { await edit(imageSrc, extraNote); } finally { onFinish?.(); }
    };

    return (
        <div className="border rounded-lg bg-white shadow-sm flex p-4">
            <div className="flex-1 pr-4 space-y-2">
                <h3 className="font-semibold text-sm">{title}</h3>
                <CardPromptBlock prompt={prompt} description={description} text={text} />
            </div>

            <CardImagePanel
                images={displayImages}
                fileIds={displayFileIds}        // ✅ 与 images 对齐的 fileId（预览 undefined）
                loading={loading}
                callId={null}
                onGenerate={handleGenerate}
                onEdit={handleEdit}             // ✅ 新：编辑
                onDownload={handleDownload}
                onDelete={handleDelete}
                canGenerate={!!prompt}
                canEdit={displayImages.length > 0}  // ✅ 只要有图即可编辑
                title={title}
                error={error}
            />
        </div>
    );
}