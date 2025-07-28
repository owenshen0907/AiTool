// File: src/app/agent/image/ContentRight.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { ContentItem } from '@/lib/models/content';
import type { Template } from './right/TemplateSelectorModal';
import type { ImageEntry } from '@/lib/models/file';

import GenerateSection from './right/GenerateSection';
import ImageUploader from '@/lib/utils/ImageUploader';
import CacheBar from './right/CacheBar';
import ConfirmOverrideModal from './right/ConfirmOverrideModal';
import ConfirmExtractModal from './right/ConfirmExtractModal';

import { useAgentScenes } from 'src/hooks/useAgentScenes';
import { useIntentExtraction } from './right/hooks/useIntentExtraction';
// 新增
import { useImagePromptGenerate } from './right/hooks/useImagePromptGenerate';
import type { IntentPromptOutput } from './types';

// ✅ 新增：统一的正文保存工具（只更新相应区块、自动补齐围栏、合并 JSON）
import {
    saveImagePromptBlock,
    saveRequestAndIntentsBlocks,
    parseImagePromptBlock, // 仅用于解析 existingBody → state
} from './utils/saveBodyBlocks';

const CACHE_KEY = 'optimize_previews';
const MAX_CACHE = 10;
const SCENE_PROMPT_GEN = 'img_prompt_generate';

/* ---------- 本地缓存项 ---------- */
interface CacheItem {
    id: string;
    key: string;
    title: string;
    suggestion: string;
    content: string;
}

interface Props {
    feature: string;
    formId: string;
    selectedItem: ContentItem | null;
    existingBody: string;
    onChangeBody: (body: string) => void;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
    onPromptGeneratingChange?: (f: boolean) => void;
}

/** 从 markdown 中摘出原始请求文本（INTENT REQUEST） */
function parseRequestBlock(markdown: string): string | null {
    const m = markdown.match(
        /<!--\s*INTENT REQUEST START\s*-->\s*```text\s*([\s\S]*?)\s*```[\s\S]*?<!--\s*INTENT REQUEST END\s*-->/i
    );
    return m ? m[1].trim() : null;
}

/** 解析 INTENTS（数组） */
function parseIntentsBlock(markdown: string): IntentPromptOutput['intents'] | null {
    const m = markdown.match(
        /<!--\s*INTENTS START\s*-->\s*```json\s*([\s\S]*?)\s*```[\s\S]*?<!--\s*INTENTS END\s*-->/i
    );
    if (!m) return null;
    try {
        const arr: any[] = JSON.parse(m[1].trim());
        return arr.map((i: any) => ({
            id: i.id,
            title: i.title,
            level: i.level,
            description: i.description,
            category: i.category,
            subcategory: i.subcategory,
            confidence: i.confidence,
        }));
    } catch {
        console.warn('INTENTS JSON 解析失败');
        return null;
    }
}

/* =================================================================== */
export default function ContentRight({
                                         feature,
                                         formId,
                                         selectedItem,
                                         existingBody,
                                         onChangeBody,
                                         onUpdateItem,
                                         onPromptGeneratingChange,
                                     }: Props) {
    /* ---------- 基础 state ---------- */
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [noteRequest, setNoteRequest] = useState('');
    const [forceBase64, setForceBase64] = useState(false);
    const [images, setImages] = useState<ImageEntry[]>([]);
    const [imagePromptJson, setImagePromptJson] = useState<any>(null);

    /* 二次确认—意图抽取 */
    const [showExtractConfirmModal, setShowExtractConfirmModal] = useState(false);
    const [extractExtraNote, setExtractExtraNote] = useState('');

    /* ---------- 意图抽取 ---------- */
    const {
        loading: intentsLoading,
        intents,
        setIntents,
        selectedIntentId,
        setSelectedIntentId,
        extract,
    } = useIntentExtraction();
    /* ---------- 基于意图生成插画提示词 ---------- */
    // 使用“读取 prompt 的统一 hook”
    const { generate: genImagePrompt } = useImagePromptGenerate();

    /* ---------- 本地生成记录 ---------- */
    const [generatedIntentMap, setGeneratedIntentMap] = useState<
        Record<string, { lastContent: string; updatedAt: string; count: number }>
    >({});
    const [generateLoading, setGenerateLoading] = useState(false);
    const [lastGeneratedIntentId, setLastGeneratedIntentId] = useState<string | null>(null);

    /* ---------- 覆盖确认 ---------- */
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [extraNote, setExtraNote] = useState('');

    /* ---------- 浏览器缓存 ---------- */
    const [cacheList, setCacheList] = useState<CacheItem[]>([]);

    /* ---------- 场景 ---------- */
    const { scenes, loading: loadingConfig, getScene } = useAgentScenes(feature);

    /* ================================================================ */
    /* 1. 加载历史图片（带 origin） */
    useEffect(() => {
        if (!formId) {
            setImages([]);
            return;
        }
        (async () => {
            try {
                const res = await fetch(`/api/files?form_id=${formId}`);
                if (!res.ok) throw new Error('接口错误');
                const files: Array<{
                    file_id: string;
                    file_path: string;
                    created_at: string;
                    origin?: 'manual' | 'ai';
                }> = await res.json();
                files.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
                setImages(
                    files.map((f) => ({
                        id: f.file_id,
                        url: `${location.origin}/${f.file_path}`,
                        status: 'success' as const,
                        file_id: f.file_id,
                        origin: f.origin ?? 'manual',
                    }))
                );
            } catch (e) {
                console.error('加载历史图片失败:', e);
            }
        })();
    }, [formId]);

    /* 2. 切换文档时重置意图选择 */
    useEffect(() => {
        setIntents([]);
        setSelectedIntentId(null);
    }, [selectedItem?.id]);

    /* 3. 从 existingBody 中初始化：INTENTS、REQUEST、IMAGE_PROMPT */
    useEffect(() => {
        const parsedIntents = parseIntentsBlock(existingBody);
        if (parsedIntents && parsedIntents.length) {
            setIntents(parsedIntents);
            setSelectedIntentId(parsedIntents[0].id);
        }
        const parsedReq = parseRequestBlock(existingBody);
        if (parsedReq) setNoteRequest(parsedReq);

        const parsedImg = parseImagePromptBlock(existingBody); // util 内部已匹配 json 围栏
        if (parsedImg) {
            try {
                setImagePromptJson(JSON.parse(parsedImg));
            } catch {
                console.warn('IMAGE_PROMPT JSON 解析失败');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingBody, setIntents, setSelectedIntentId]);

    /* ---------- 本地缓存工具 ---------- */
    const saveCache = (list: CacheItem[]) => {
        localStorage.setItem(CACHE_KEY, JSON.stringify(list));
        setCacheList(list);
    };

    const upsertCache = (title: string, content: string) => {
        if (!selectedItem) return;
        const key = selectedItem.id;
        const idx = cacheList.findIndex((i) => i.key === key && i.suggestion === noteRequest);
        if (idx >= 0) {
            const next = [...cacheList];
            next[idx] = { ...next[idx], title, content };
            saveCache(next);
        } else {
            const item: CacheItem = {
                id: Date.now().toString(),
                key,
                title,
                suggestion: noteRequest,
                content,
            };
            const same = cacheList.filter((i) => i.key === key);
            const other = cacheList.filter((i) => i.key !== key);
            saveCache([...other, item, ...same].slice(0, MAX_CACHE));
        }
    };

    const filteredCache = useMemo(
        () => (selectedItem ? cacheList.filter((i) => i.key === selectedItem.id) : []),
        [cacheList, selectedItem]
    );

    const hasContent = Boolean(existingBody.trim());

    /* ================================================================ */
    /** 抽取意图 —— 提取完后替换原有的请求 & 意图区块并保存 */
    const handleExtractIntents = async (extra?: string) => {
        const fullRequest = extra ? `${noteRequest}\n\n【补充说明】\n${extra.trim()}` : noteRequest;

        try {
            const intentItems = await extract({
                template: selectedTemplate!,
                noteRequest: fullRequest,
                images,
                scenes,
                forceBase64,
            });
            if (!selectedItem || intentItems.length === 0) return;

            await saveRequestAndIntentsBlocks(
                {
                    selectedItem,
                    existingBody,
                    onChangeBody,
                    onUpdateItem,
                },
                fullRequest,
                intentItems
            );

            console.debug('✅ 原始请求 + 意图区块已替换并保存到 DB');
        } catch (err: any) {
            console.error(err);
            alert(err.message || '意图抽取失败');
        }
    };

    /* -- 生成插画提示（左侧自动保存） -- */
    const requestGenerate = () => {
        if (!selectedIntentId) {
            alert('请选择意图');
            return;
        }
        if (hasContent && lastGeneratedIntentId === selectedIntentId) {
            setExtraNote('');
            setShowConfirmModal(true);
            return;
        }
        void handleGenerate();
    };

    /** 二次确认抽取意图 的入口 */
    const requestExtract = () => {
        if (intents.length > 0) {
            setShowExtractConfirmModal(true);
        } else {
            handleExtractIntents(); // 直接第一次抽取
        }
    };

    const handleGenerate = async (extra?: string) => {
        onPromptGeneratingChange?.(true);

        // === 前置校验：沿用你原来的判断（也可以只保留“是否选择了意图”） ===
        const scene = getScene(SCENE_PROMPT_GEN); // 可保留/也可去掉，让 hook 自行检查
        if (!scene || !selectedTemplate?.id || !selectedIntentId) {
            alert('生成前置条件缺失');
            onPromptGeneratingChange?.(false);
            return;
        }
        const chosen = intents.find(i => i.id === selectedIntentId);
        if (!chosen) {
            alert('意图不存在');
            onPromptGeneratingChange?.(false);
            return;
        }

        setGenerateLoading(true);
        try {
            // 1) 取该意图上一次生成的内容（作为“连续对话式”上下文）
            const prevContent = generatedIntentMap[chosen.id]?.lastContent;

            // 2) 调用统一 hook：用 promptBuilder 读模板，非流式完成，自动解析 JSON/围栏
            const jsonText = await genImagePrompt({
                template: selectedTemplate,
                scenes,
                intent: chosen,
                extraNote: extra,
                prevContent,         // ✅ 新参数名，替代你之前写错的 prev
            });

            // 3) 仅更新 IMAGE_PROMPT 区块（自动补齐 ```json/```，并与旧内容合并不覆盖）
            const { newBody, mergedJson } = await saveImagePromptBlock(
                {
                    selectedItem,
                    existingBody,
                    onChangeBody,
                    onUpdateItem,
                },
                jsonText               // ✅ 直接传 hook 返回的“合法 JSON 字符串”
            );

            // 4) 缓存与统计：以“格式化后的 JSON 文本”为准
            const jsonTextForCache = JSON.stringify(mergedJson, null, 2);
            upsertCache(chosen.title || '(意图生成)', jsonTextForCache);
            setLastGeneratedIntentId(chosen.id);
            setGeneratedIntentMap(prevMap => ({
                ...prevMap,
                [chosen.id]: {
                    lastContent: jsonTextForCache,     // ✅ 保存“本次最终 JSON”
                    updatedAt: new Date().toISOString(),
                    count: (prevMap[chosen.id]?.count || 0) + 1,
                },
            }));
        } catch (e: any) {
            console.error(e);
            alert(e.message || '生成失败');
        } finally {
            setGenerateLoading(false);
            onPromptGeneratingChange?.(false);
        }
    };

    const confirmOverride = () => {
        setShowConfirmModal(false);
        void handleGenerate(extraNote);
    };
    const cancelOverride = () => {
        setShowConfirmModal(false);
        setExtraNote('');
    };
    const confirmExtract = () => {
        setShowExtractConfirmModal(false);
        void handleExtractIntents(extractExtraNote);
        setExtractExtraNote('');
    };
    const cancelExtract = () => {
        setShowExtractConfirmModal(false);
        setExtractExtraNote('');
    };

    /* ==================== 渲染 ==================== */
    return (
        <div className="w-1/3 h-full border-l p-4 flex flex-col relative">
            <GenerateSection
                feature={feature}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                noteRequest={noteRequest}
                setNoteRequest={setNoteRequest}
                forceBase64={forceBase64}
                setForceBase64={setForceBase64}
                imagesCount={images.length}
                loadingConfig={loadingConfig}
                loadingIntent={intentsLoading}
                onExtractIntent={requestExtract}
                intents={intents}
                selectedIntentId={selectedIntentId}
                setSelectedIntentId={setSelectedIntentId}
                loadingGenerate={generateLoading}
                onGenerate={requestGenerate}
                generatedIntentMap={generatedIntentMap}
            />

            <CacheBar
                items={filteredCache}
                onClick={(item) => {
                    setNoteRequest(item.suggestion);
                    // ⚠️ 注意：这里沿用原设计，直接用缓存内容覆盖编辑器正文
                    // 如果缓存仅存 JSON，而非完整正文，你可能需要改造成 upsert 到 IMAGE_PROMPT
                    onChangeBody(item.content);
                }}
                onRemove={(id) => saveCache(cacheList.filter((i) => i.id !== id))}
            />

            <div className="flex-1 overflow-auto mt-2">
                <ImageUploader feature={feature} formId={formId} images={images} setImages={setImages} />
            </div>

            <ConfirmOverrideModal
                open={showConfirmModal}
                onCancel={cancelOverride}
                onConfirm={confirmOverride}
                extraNote={extraNote}
                onChangeExtraNote={setExtraNote}
                intentTitle={intents.find((i) => i.id === selectedIntentId)?.title}
            />
            <ConfirmExtractModal
                open={showExtractConfirmModal}
                extraNote={extractExtraNote}
                onChangeExtraNote={setExtractExtraNote}
                onConfirm={confirmExtract}
                onCancel={cancelExtract}
            />
        </div>
    );
}