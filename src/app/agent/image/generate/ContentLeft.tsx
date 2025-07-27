// File: src/app/agent/image/ContentLeft.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ContentItem } from '@/lib/models/content';
import type { AgentSceneConfig } from 'src/hooks/useAgentScenes';

import HeaderSection  from './left/HeaderSection';
import CardView       from './left/cards/CardView';
import EmptyState     from './left/EmptyState';
import StatusPanel    from './left/StatusPanel';

import { useSummaryGenerator } from './left/hooks/useSummaryGenerator';
import { useImageCards       } from './left/hooks/useImageCards';
import { useSaveAll          } from './left/hooks/useSaveAll';  // ✅ 新增：抽离后的“保存主体内容”Hook

interface Props {
    feature: string;
    scenes: AgentSceneConfig[];
    loadingConfig: boolean;
    getScene: (sceneKey: string) => AgentSceneConfig | undefined;
    selectedItem: ContentItem | null;
    body: string;
    onChangeBody: (body: string) => void;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
    promptGenerating?: boolean;
}

/** 提取 IMAGE_PROMPT 块内部的纯 JSON 文本；若没找到则返回 null */
function extractImagePromptInnerJson(markdown: string): string | null {
    const m = markdown.match(
        /<!--\s*IMAGE_PROMPT START\s*-->\s*```json\s*([\s\S]*?)\s*```[\s\S]*?<!--\s*IMAGE_PROMPT END\s*-->/i
    );
    return m ? m[1].trim() : null;
}

/** 把 IMAGE_PROMPT 的 JSON（对象或数组）转换为“卡片数组”；失败返回 null */
function buildCardsFromImagePromptJson(jsonText: string): Array<{
    id: string;
    title?: string;
    description?: string;
    prompt?: string;
    text?: string | string[];
    index: number;
}> | null {
    try {
        const data = JSON.parse((jsonText || '').trim());
        const groups = Array.isArray(data) ? data : [data];
        // 把每个分组里的 images 收集起来
        const images: any[] = groups.flatMap(g => Array.isArray(g?.images) ? g.images : []);
        // 映射成 CardView 需要的结构（和 StatusPanel 也兼容）
        return images.map((img, idx) => ({
            id: `img-${idx}`,                        // 简单唯一 id；可换 uuid
            title: img?.title ?? `图 ${idx + 1}`,
            description: img?.description ?? '',
            prompt: img?.prompt ?? '',
            text: img?.text ?? '',
            index: idx,
        }));
    } catch (e) {
        // JSON 损坏/解析失败
        return null;
    }
}
/** 读取 localStorage IMG_DEBUG 决定是否打印调试日志 */
const dbg = (...args: any[]) => {
    try {
        if (typeof window !== 'undefined' && localStorage.getItem('IMG_DEBUG') === '1') {
            // eslint-disable-next-line no-console
            console.debug('[IMG_DEBUG]', ...args);
        }
    } catch {}
};

export default function ContentLeft({
                                        feature,
                                        scenes,
                                        loadingConfig,
                                        getScene,
                                        selectedItem,
                                        body,
                                        onChangeBody,
                                        onUpdateItem,
                                        promptGenerating = false,
                                    }: Props) {
    const imgGenerateScene = getScene('img_generate');

    /* ---------- 标题 / 摘要 ---------- */
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [orig, setOrig] = useState({ title: '', summary: '', body: '' });
    const [editHeader, setEditHeader] = useState(false);
    const { generate, loading: summaryLoading } = useSummaryGenerator();

    /* ---------- 解析卡片（读取正文中的卡片定义） ---------- */

// 先从 IMAGE_PROMPT 围栏里取出 JSON
    const innerJson = extractImagePromptInnerJson(body);

// 如果能取到并成功解析，就直接用它生成 cards；否则回退到原来的 useImageCards
    const cardsFromImagePrompt = React.useMemo(
        () => (innerJson ? buildCardsFromImagePromptJson(innerJson) : null),
        [innerJson]
    );

// 只有当没有 IMAGE_PROMPT（或解析失败）时，才使用 useImageCards 的旧逻辑
    const shouldUseHook = !cardsFromImagePrompt;

    const { cards: hookCards, error: hookError, parsed: hookParsed } = useImageCards(
        shouldUseHook ? body : '',                       // 避免重复解析
        { autoParse: true, reparseOnChange: true }
    );

// 统一对外变量（后续渲染无需改）
    const cards      = cardsFromImagePrompt ?? hookCards;
    const parseError = cardsFromImagePrompt ? null : hookError;
    const parsed     = cardsFromImagePrompt ? true : hookParsed;

// 可选调试
    try {
        if (typeof window !== 'undefined' && localStorage.getItem('IMG_DEBUG') === '1') {
            console.debug('[IMG_DEBUG] cards.count', cards?.length, { fromImagePrompt: !!cardsFromImagePrompt });
        }
    } catch {}

    /* ---------- 选中文档变化时，同步标题/摘要/正文到本地 ---------- */
    const lastSavedBody = useRef(body);
    useEffect(() => {
        if (!selectedItem) return;
        const t = selectedItem.title ?? '';
        const s = selectedItem.summary ?? '';
        const b = selectedItem.body ?? '';
        setTitle(t);
        setSummary(s);
        setOrig({ title: t, summary: s, body: b });
        setEditHeader(false);
        onChangeBody(b);
        lastSavedBody.current = b;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedItem?.id]);

    /* ---------- 自动保存正文（普通编辑，去抖 1s） ---------- */
    useEffect(() => {
        if (!selectedItem) return;
        if (body === lastSavedBody.current) return;
        const timer = setTimeout(async () => {
            try {
                await onUpdateItem(selectedItem, { body });
                lastSavedBody.current = body;
            } catch (err) {
                console.error('[auto-save] failed:', err);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [body, selectedItem, onUpdateItem]);

    /* ---------- 在途生成（每卡片 0|1） ---------- */
    const [pendingMap, setPendingMap] = useState<Record<string, 0 | 1>>({});
    const markStart  = (cardId: string) => setPendingMap(m => ({ ...m, [cardId]: 1 as const }));
    const markFinish = (cardId: string) => setPendingMap(m => ({ ...m, [cardId]: 0 as const }));

    /* ---------- 收集各卡片预览（base64/data-URI/URL），供“保存主体内容”使用 ---------- */
    // 结构：{ [cardId]: { title, previews: string[] } }
    const [previewMap, setPreviewMap] = useState<Record<string, { title: string; previews: string[] }>>({});
    const handlePreviewsChange = useCallback((cardId: string, title: string, previews: string[]) => {
        setPreviewMap(prev => {
            const old = prev[cardId]?.previews || [];
            const sameLen = old.length === previews.length;
            const sameArr = sameLen && old.every((v, i) => v === previews[i]);
            const sameTitle = prev[cardId]?.title === title;
            if (sameArr && sameTitle) return prev;
            const next = { ...prev, [cardId]: { title, previews } };
            dbg('previewMap.update', { cardId, title, previewsLen: previews.length });
            return next;
        });
    }, []);

    /* ---------- 使用抽离的保存 Hook ---------- */
    const { totalPreviews, saving, handleSaveAll } = useSaveAll({
        feature,
        selectedItem,
        body,
        previewMap,
        pendingMap,
        onChangeBody,
        onUpdateItem,
        onAfterSaved: () => setPreviewMap({}) // 保存成功后清空预览缓存
    });

    /* ---------- 渲染 ---------- */
    if (!selectedItem) {
        return (
            <div className="w-2/3 flex items-center justify-center">
                <span className="text-gray-500">请选择一个文档</span>
            </div>
        );
    }

    /** 包一层 onUpdateItem，打印详细日志（包括 body 片段/长度差） */
    const onUpdateItemDebug = useCallback(async (item: ContentItem, patch: Partial<ContentItem>) => {
        const keys = Object.keys(patch);
        const beforeLen = (item.body || '').length;
        const afterLen  = patch.body != null ? patch.body.length : undefined;
        const delta     = afterLen != null ? afterLen - beforeLen : undefined;

        dbg('onUpdateItem.call', {
            id: item.id,
            keys,
            bodyDelta: delta,
            bodyTail: typeof patch.body === 'string' ? patch.body.slice(-160) : undefined,
        });

        const res = await onUpdateItem(item, patch);

        dbg('onUpdateItem.done', { id: item.id });
        return res;
    }, [onUpdateItem]);

    return (
        <div className="w-2/3 flex flex-col h-screen p-4">
            {/* Header */}
            <HeaderSection
                title={title}
                summary={summary}
                edit={editHeader}
                dirty={title !== orig.title || summary !== orig.summary}
                isGenerating={summaryLoading}
                onChangeTitle={setTitle}
                onChangeSummary={setSummary}
                onToggleEdit={() => setEditHeader(e => !e)}
                onRestore={() => {
                    if (confirm('确认还原未保存的标题/摘要修改？')) {
                        setTitle(orig.title);
                        setSummary(orig.summary);
                        setEditHeader(false);
                    }
                }}
                onSave={() => {
                    if (!confirm('确认保存修改？')) return;
                    onUpdateItem(selectedItem, { title, summary, body })
                        .then(() => setOrig({ title, summary, body }))
                        .catch(console.error);
                    setEditHeader(false);
                }}
                onPrint={() => {
                    const win = window.open('', '_blank');
                    if (!win) return;
                    const escapeHtml = (str: string) =>
                        str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
<style>
body{font-family:Arial,system-ui;padding:20px;}
h1{font-size:24px;margin-bottom:10px;}
p.summary{font-size:16px;color:#555;margin-bottom:20px;}
pre{background:#f6f8fa;padding:12px;border-radius:4px;line-height:1.5;white-space:pre-wrap;}
</style></head><body>
<h1>${title}</h1><p class="summary">${summary||''}</p>
<pre>${escapeHtml(body)}</pre></body></html>`;
                    win.document.write(html);
                    win.document.close();
                    win.print();
                    win.close();
                }}
                onGenerateSummary={async () => {
                    const userReq = prompt('AI 自动生成摘要，附加要求？（可留空）', '');
                    if (userReq === null) return;
                    try {
                        const res = await generate(body, userReq || '');
                        setSummary(res);
                        setEditHeader(true);
                    } catch {
                        /* hook 内部已处理 */
                    }
                }}
            />

            {/* 状态块 */}
            <StatusPanel
                promptGenerating={promptGenerating}
                cards={cards.map(c => ({ id: c.id, title: c.title, index: c.index }))}
                pendingMap={pendingMap}
                rightSlot={
                    <button
                        className="w-full text-xs px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
                        disabled={
                            promptGenerating ||
                            Object.values(pendingMap).some(v => v === 1) ||
                            totalPreviews === 0 ||
                            saving
                        }
                        title={totalPreviews === 0 ? '暂无可保存的图片' : '当所有图片生成完毕后在此保存主体内容（批量上传并写回正文）'}
                        onClick={handleSaveAll}
                    >
                        {saving ? '保存中…' : `保存主体内容（${totalPreviews} 张）`}
                    </button>
                }
            />

            <div className="flex-1 overflow-auto space-y-4 pr-1">
                {/* 仅在“确实解析出了卡片且报错”时显示错误提示 */}
                {parseError && cards.length > 0 && (
                    <p className="text-xs text-red-500">图片卡解析失败：{parseError}</p>
                )}

                {/* 无错误且无卡片时，显示空状态；否则渲染各卡片 */}
                {!parseError && cards.length === 0 && parsed && body.trim().replace(/\s+/g, '').replace(/<!--[\s\S]*?-->/g, '') !== ''
                    ? <EmptyState />
                    : cards.map(card => (
                        <CardView
                            key={card.id}
                            feature={feature}
                            data={card}
                            selectedItem={selectedItem}
                            imgGenerateScene={imgGenerateScene}
                            onChangeBody={onChangeBody}
                            onUpdateItem={onUpdateItemDebug}
                            onStart={() => markStart(card.id)}
                            onFinish={() => markFinish(card.id)}
                            onPreviewsChange={(cardId, cardTitle, previews) => {
                                const safeTitle = cardTitle || `图 ${card.index + 1}`;
                                handlePreviewsChange(cardId, safeTitle, previews);
                            }}
                            bodyText={body}
                        />
                    ))
                }
            </div>
        </div>
    );
}