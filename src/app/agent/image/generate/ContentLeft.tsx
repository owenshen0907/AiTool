// File: src/app/agent/image/ContentLeft.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { ContentItem } from '@/lib/models/content';
import type { AgentSceneConfig } from 'src/hooks/useAgentScenes';  // ← 新增

import HeaderSection  from './left/HeaderSection';
import CardView       from './left/cards/CardView';
import EmptyState     from './left/EmptyState';

import { useSummaryGenerator } from './left/hooks/useSummaryGenerator';
import { useImageCards       } from './left/hooks/useImageCards';

import LoadingIndicator from '@/components/LoadingIndicator/LoadingIndicator';

/* ---------- 组件 Props ---------- */
interface Props {
    feature: string;
    scenes: AgentSceneConfig[];
    loadingConfig: boolean;
    getScene: (sceneKey: string) => AgentSceneConfig | undefined;

    selectedItem: ContentItem | null;
    body:         string;
    onChangeBody: (body: string) => void;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
    promptGenerating?: boolean;     // 右侧正在生成插画提示
}

export default function ContentLeft({
                                        feature,
                                        scenes,
                                        loadingConfig,
                                        getScene,
                                        selectedItem,
                                        body,
                                        onChangeBody,
                                        onUpdateItem,
                                        promptGenerating = false
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
        reparseOnChange: true
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

    /* ---------- 自动保存正文 ---------- */
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

    /* ---------- 工具函数 ---------- */
    const escapeHtml = (str: string) =>
        str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    /* ---------- Header 操作 ---------- */
    const dirtyHeader = title !== orig.title || summary !== orig.summary;
    const handleRestore = () => {
        if (!dirtyHeader) return;
        if (confirm('确认还原未保存的标题/摘要修改？')) {
            setTitle(orig.title);
            setSummary(orig.summary);
            setEditHeader(false);
        }
    };
    const handleSave = () => {
        if (!dirtyHeader || !selectedItem) return;
        if (!confirm('确认保存修改？')) return;
        onUpdateItem(selectedItem, { title, summary, body })
            .then(() => setOrig({ title, summary, body }))
            .catch(err => console.error('手动保存失败:', err));
        setEditHeader(false);
    };
    const handlePrint = () => {
        const win = window.open('', '_blank');
        if (!win) return;
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
    };

    const handleGenerateSummary = async () => {
        if (summaryLoading) return;
        const userReq = prompt('AI 自动生成摘要，附加要求？（可留空）', '');
        if (userReq === null) return;
        try {
            const res = await generate(body, userReq || '');
            setSummary(res);
            setEditHeader(true);
        } catch {
            /* error 已在 hook 中处理 */
        }
    };

    /* ---------- 未选文档 ---------- */
    if (!selectedItem) {
        return (
            <div className="w-2/3 flex items-center justify-center">
                <span className="text-gray-500">请选择一个文档</span>
            </div>
        );
    }

    /* ========================= 渲染 ========================= */
    return (
        <div className="w-2/3 flex flex-col h-screen p-4">
            {/* Header */}
            <HeaderSection
                title={title}
                summary={summary}
                edit={editHeader}
                dirty={dirtyHeader}
                isGenerating={summaryLoading}
                onChangeTitle={setTitle}
                onChangeSummary={setSummary}
                onToggleEdit={() => setEditHeader(e => !e)}
                onRestore={handleRestore}
                onSave={handleSave}
                onPrint={handlePrint}
                onGenerateSummary={handleGenerateSummary}
            />

            {/* 状态块 */}
            <div className="mb-4">
                <div
                    className={`
                        group relative w-full rounded-xl border-2 transition
                        ${promptGenerating
                        ? 'border-transparent bg-gradient-to-br from-fuchsia-100 to-pink-100'
                        : 'border-dashed border-gray-300 bg-gray-50'}
                        hover:shadow-lg hover:-translate-y-[1px] hover:scale-[1.02]
                    `}
                    style={{ minHeight: '120px' }}
                >
                    {!promptGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-gray-500 text-sm transition group-hover:opacity-70 group-hover:scale-[0.98]">
                                状态：等待生成插画提示
                            </span>
                        </div>
                    )}
                    {promptGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <LoadingIndicator scene="img_prompt_generate" />
                        </div>
                    )}
                </div>
            </div>

            {/* 卡片 / 空态 */}
            <div className="flex-1 overflow-auto space-y-4 pr-1">
                {parseError && <p className="text-xs text-red-500">{parseError}</p>}
                {!parseError && cards.length === 0 && parsed && body.trim().replace(/\s+/g, '').replace(/<!--[\s\S]*?-->/g, '') !== ''
                    ? <EmptyState />
                    : cards.map(card => (
                        <CardView
                            key={card.id}
                            data={card}
                            selectedItem={selectedItem}
                            onUpdateItem={onUpdateItem}
                            imgGenerateScene={imgGenerateScene}
                        />
                    ))
                }
            </div>
        </div>
    );
}