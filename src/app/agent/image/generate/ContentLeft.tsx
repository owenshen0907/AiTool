// File src/app/agent/image/ContentLeft.tsx
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

// 只保留 INTENTS 保底（与右侧一致）
import { extractIntentsBlock } from './utils/mdIntents';

interface Props {
    feature: string;
    scenes: AgentSceneConfig[];
    loadingConfig: boolean;
    getScene: (sceneKey: string) => AgentSceneConfig | undefined;
    selectedItem: ContentItem | null;
    body:         string;
    onChangeBody: (body: string) => void;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
    promptGenerating?: boolean;
}

/** 读取 localStorage IMG_DEBUG 决定是否打印 */
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

    /* ---------- 解析卡片 ---------- */
    const { cards, error: parseError, parsed } = useImageCards(body, {
        autoParse: true,
        reparseOnChange: true,
    });

    /* ---------- 选中文档变动 ---------- */
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

    /* ---------- 自动保存正文（普通编辑） ---------- */
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

    /* ---------- 收集各卡片预览（base64/data-URI） ---------- */
    // { [cardId]: { title, previews: string[] } }
    const [previewMap, setPreviewMap] = useState<Record<string, { title: string; previews: string[] }>>({});
    const [saving, setSaving] = useState(false);

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

    const totalPreviews = Object.values(previewMap).reduce<number>(
        (sum, it) => sum + (it?.previews?.length || 0),
        0
    );

// helper：对正则中的标题做转义
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    /** ✅ 标准 Markdown 规则：统计某个标题已存在的最大序号，返回 next = max + 1 */
    const getNextIndexForTitle = useCallback((md: string, title: string) => {
        if (!title) return 1;
        const esc = escapeRegExp(title.trim());

        // ✅ 标准 Markdown：![标题-数字](URL)  可有空格；行尾可带 <!-- id: ... -->
        // 例：![图一：结构图-3](/upload/xxx.png) <!-- id: 123 -->
        const re = new RegExp(
            `!\$begin:math:display$\\\\s*${esc}\\\\s*-\\\\s*(\\\\d+)\\\\s*\\$end:math:display$\$begin:math:text$[^\\$end:math:text$]+\\)(?:\\s*<!--\\s*id:\\s*([a-f0-9-]+)\\s*-->)?`,
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

        // 便于你在控制台确认统计是否正确
        try {
            if (typeof window !== 'undefined' && localStorage.getItem('IMG_DEBUG') === '1') {
                // eslint-disable-next-line no-console
                console.debug('[IMG_DEBUG] getNextIndexForTitle', {
                    title,
                    matched: matchedNums.sort((a,b)=>a-b),
                    max,
                    next: max + 1,
                });
            }
        } catch {}

        return max + 1;
    }, []);

    const isDataUriOrB64 = (s: string) =>
        s.startsWith('data:') || /^[A-Za-z0-9+/=]+$/.test(s);

    const dataUriToFile = async (dataUriOrB64: string, filename: string) => {
        const dataUri = dataUriOrB64.startsWith('data:')
            ? dataUriOrB64
            : `data:image/png;base64,${dataUriOrB64}`;
        const blob = await fetch(dataUri).then(r => r.blob());
        return new File([blob], filename, { type: blob.type || 'image/png' });
    };

    /* ---------- 保存主体内容：批量上传 + 写回（保留 INTENTS） ---------- */
    /** 批量上传预览并写回正文（在行尾追加 file_id 注释），只在末尾 append，不覆盖其它内容 */
    const handleSaveAll = useCallback(async () => {
        if (!selectedItem) return;
        if (totalPreviews === 0) { alert('没有可保存的图片。'); return; }
        if (Object.values(pendingMap).some(v => v === 1)) { alert('仍有图片生成中，请稍后再保存。'); return; }

        setSaving(true);
        try {
            let newBody = body; // 保留原内容，下面只在末尾 append

            dbg('saveAll.start', {
                cardIds: Object.keys(previewMap),
                totalPreviews,
            });

            for (const cardId of Object.keys(previewMap)) {
                const { title: cardTitle, previews } = previewMap[cardId] || {};
                if (!previews || previews.length === 0) continue;

                // 拆分：需要上传 vs 已是 URL
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

                // ① 先把“已是 URL”的直接写入
                for (const url of readyUrls) {
                    mdLines.push(`![${cardTitle}-${nextIndex}](${url})`);
                    dbg('saveAll.card.addReadyUrl', { url, index: nextIndex });
                    nextIndex += 1;
                }

                // ② 再上传 base64/dataURI（一次卡片一次表单）
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
                    if (!res.ok) throw new Error('上传失败');
                    const json = await res.json();
                    const arr: Array<{ url?: string; file_path?: string; file_id?: string }> =
                        Array.isArray(json) ? json : [json];

                    dbg('saveAll.card.uploadResult', arr);

                    for (const it of arr) {
                        const url = it?.url ?? (it?.file_path ? `/${it.file_path}` : '');
                        if (!url) continue;
                        const fileId = it?.file_id || '';
                        mdLines.push(`![${cardTitle}-${nextIndex}](${url})${fileId ? ` <!-- id: ${fileId} -->` : ''}`);
                        dbg('saveAll.card.addUploaded', { url, fileId, index: nextIndex });
                        nextIndex += 1;
                    }
                }

                // ③ 把该卡片的行统一 append 到正文末尾（不改原文其它部分）
                if (mdLines.length > 0) {
                    const block = mdLines.join('\n\n');
                    newBody = (newBody ? `${newBody}\n\n` : '') + block;
                    dbg('saveAll.card.appendBlock', { cardId, lines: mdLines.length, blockSample: block.slice(0, 120) + '...' });
                }
            }

            // 一次性写回 & 持久化
            onChangeBody(newBody);
            await onUpdateItem(selectedItem, { body: newBody });

            // 清理“预览缓存”
            setPreviewMap({});
            alert('已保存主体内容。');

            dbg('saveAll.done');
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
        pendingMap,
        getNextIndexForTitle
    ]);


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
                {parseError && <p className="text-xs text-red-500">{parseError}</p>}
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