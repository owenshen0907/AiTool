// File: src/app/docs/japanese/JapaneseContentRight.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { ContentItem } from '@/lib/models/content';
import GenerateSection from './right/GenerateSection';
import ImageUploader from './right/ImageUploader';
import OptimizePreviewModal from './right/OptimizePreviewModal';
import type { ImageEntry } from './types';
import type { Template } from './right/TemplateSelectorModal';
import { parseSSEStream } from '@/lib/utils/sse';
import { urlToBase64 } from '@/lib/utils/imageToBase64';

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
}

const CACHE_KEY = 'optimize_previews';
const MAX_CACHE = 10;


export default function JapaneseContentRight({
                                                 feature,
                                                 formId,
                                                 selectedItem,
                                                 existingBody,
                                                 onChangeBody,
                                             }: Props) {
    /* 基本状态 */
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [supplierId, setSupplierId] = useState('');
    const [model, setModel] = useState('');
    const [noteRequest, setNoteRequest] = useState('');
    const [includeExisting, setIncludeExisting] = useState(false);
    const [forceBase64, setForceBase64] = useState(false);
    const [images, setImages] = useState<ImageEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [overwriteExisting, setOverwriteExisting] = useState(false);

    const [previewContent, setPreviewContent] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [suggestionTitle, setSuggestionTitle] = useState('');
    // 加载数据库已上传图片
    useEffect(() => {
        if (!formId) {
            setImages([]);
            return;
        }
        (async () => {
            try {
                const res = await fetch(`/api/files?form_id=${formId}`);
                if (!res.ok) throw new Error('接口错误');
                const files: Array<{ file_id: string; file_path: string }> = await res.json();
                // 把每条记录映射成 ImageEntry 并标记为 success
                setImages(
                    files.map(f => ({
                        id: f.file_id,
                        url: `${window.location.origin}/${f.file_path}`,
                        status: 'success',
                        file_id: f.file_id,
                    }))
                );
            } catch (e) {
                console.error('加载历史图片失败：', e);
            }
        })();
    }, [formId]);

    /* 缓存列表 */
    const [cacheList, setCacheList] = useState<CacheItem[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
            try {
                const list: CacheItem[] = JSON.parse(stored);
                setCacheList(list.map(i => ({ ...i, title: i.title || i.suggestion })));
            } catch {}
        }
    }, []);

    const saveCache = (list: CacheItem[]) => {
        localStorage.setItem(CACHE_KEY, JSON.stringify(list));
        setCacheList(list);
    };

    /* upsert 缓存：若 content 相同则更新标题，否则新增 */
    const upsertCache = (title: string) => {
        if (!selectedItem) return;
        const key = selectedItem.id;
        const idx = cacheList.findIndex(
            i => i.key === key && i.suggestion === noteRequest ,
        );
        if (idx >= 0) {
            const updated = [...cacheList];
            updated[idx] = { ...updated[idx], title ,content: previewContent };
            saveCache(updated);
        } else {
            const newItem: CacheItem = {
                id: Date.now().toString(),
                key,
                title,
                suggestion: noteRequest,
                content: previewContent,
            };
            const same = cacheList.filter(i => i.key === key);
            const other = cacheList.filter(i => i.key !== key);
            saveCache([...other, newItem, ...same].slice(0, MAX_CACHE));
        }
    };
        const updateCacheContent = (newContent: string) => {
                if (!selectedItem) return;
                const key = selectedItem.id;
                let modified = false;
                const updated = cacheList.map(item => {
                        if (item.key === key && item.suggestion === noteRequest) {
                                modified = true;
                                return { ...item, content: newContent };
                            }
                        return item;
                    });
                if (modified) {
                        saveCache(updated);
                    }
            };

    const removeFromCache = (id: string) => saveCache(cacheList.filter(i => i.id !== id));

    /* 根据当前条目过滤 */
    const filteredCache = useMemo(
        () => (selectedItem ? cacheList.filter(i => i.key === selectedItem.id) : []),
        [cacheList, selectedItem],
    );

    /* ---------------- 生成正文 / 优化 ---------------- */
    const handleGenerate = async () => {
        if (!selectedItem || !selectedTemplate) return;

        setLoading(true);
        setSuggestionTitle(''); // 清空标题以触发自动生成（若需要）
        let acc = '';

        const hasExisting = !!existingBody.trim();
        if (!hasExisting) {
            // 无原始正文：直接写入正文区
            onChangeBody('');
            setPreviewContent('');
            setShowPreview(false);
        } else if (!overwriteExisting) {
            // 有正文且不覆盖：打开预览
            setPreviewContent('');
            setShowPreview(true);
        }

        try {
            /* 1. 供应商 */
            const sups = await (await fetch('/api/suppliers')).json();
            const sup = sups.find((s: any) => s.id === supplierId);
            if (!sup) throw new Error('无效 supplierId');
            const { apiUrl, apiKey } = sup;

            /* 2. 组装 messages */
            const userMsgs: any[] = [{ type: 'text', text: noteRequest }];

            /** decide base64 or url */
            const shouldBase64 = forceBase64 || ['localhost', '127.0.0.1'].includes(window.location.hostname);
            for (const img of images) {
                if (img.status !== 'success') continue;
                let url = img.url;
                if (shouldBase64) {
                    url = await urlToBase64(img.url);
                }
                userMsgs.push({ type: 'image_url', image_url: { url, detail: 'auto' } });
            }

            const messages: any[] = [{ role: 'system', content: selectedTemplate.content }];
            if (includeExisting && hasExisting) messages.push({ role: 'assistant', content: existingBody.trim() });
            messages.push({ role: 'user', content: userMsgs });

            /* 3. SSE */
            const upstream = await fetch(`${apiUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({ model, stream: true, messages }),
            });
            if (!upstream.ok || !upstream.body) throw new Error('接口调用失败');

            const reader = upstream.body.getReader();
            const decoder = new TextDecoder();
            let buf = '';
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split('\n');
                buf = lines.pop()!;
                for (const line of lines) {
                    if (!line.startsWith('data:')) continue;
                    const jsonStr = line.replace(/^data:\s*/, '').trim();
                    if (jsonStr === '[DONE]') { reader.cancel(); break; }
                    let payload: any;
                    try { payload = JSON.parse(jsonStr); } catch { continue; }
                    const delta = payload.choices?.[0]?.delta?.content;
                    if (delta) {
                        acc += delta;
                        if (!hasExisting || overwriteExisting) {
                            onChangeBody(acc);               // 直接写正文
                        } else {
                            setPreviewContent(acc);          // 更新预览
                        }
                    }
                }
            }

            // 结束：若是预览模式，写入缓存
            if (hasExisting && !overwriteExisting) upsertCache(suggestionTitle || '(未命名)');
        } catch (e) {
            console.error('生成失败', e);
            alert('生成失败，请重试');
        } finally {
            setLoading(false);
        }
    };
    const removeCurrentCache = () => {
        if (!selectedItem) return;

        const key = selectedItem.id;
        const newList = cacheList.filter(
            i => !(i.key === key && i.suggestion === noteRequest)
        );
        saveCache(newList);
    };
    /* 放在组件内部，跟 handleGenerate 平级 */
    const handleMerge = async (editedSuggestion: string) => {
        if (!selectedItem) return;
        const original = existingBody.trim();
        const trimmedSuggestion = editedSuggestion.trim();
        if (!original || !editedSuggestion) {
            alert('缺少原始笔记或建议内容，无法合并');
            return;
        }

        setLoading(true);
        let acc = '';

        try {
            const payload = {
                scene: 'MERGE_GEN',
                messages: [
                    {
                        role: 'user',
                        content:
                            `【原始笔记】\n${original}\n\n` +
                            `【AI 建议】\n${trimmedSuggestion}`,
                    },
                ],
            };

            const res = await fetch('/api/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok || !res.body) throw new Error('合并接口失败');

            await parseSSEStream(res.body, ({ type, text }) => {
                if (type === 'content') {
                    acc += text;
                    setPreviewContent(acc);        // ← 用新内容覆盖预览
                }
            });

            // upsertCache(suggestionTitle || '(未命名)'); // 更新缓存
            updateCacheContent(acc);
        } catch (e) {

            console.error('合并失败', e);
            alert('合并失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    /* 彩色背景 */
    const colors = [
        'bg-gradient-to-r from-red-300 to-pink-300',
        'bg-gradient-to-r from-green-300 to-lime-300',
        'bg-gradient-to-r from-blue-300 to-cyan-300',
        'bg-gradient-to-r from-yellow-300 to-orange-300',
        'bg-gradient-to-r from-indigo-300 to-purple-300',
        'bg-gradient-to-r from-pink-300 to-red-300',
        'bg-gradient-to-r from-purple-300 to-indigo-300',
        'bg-gradient-to-r from-teal-300 to-blue-300',
    ];

    return (
        <div className="w-1/3 h-full border-l p-4 flex flex-col">
            {/* 生成区 */}
            <GenerateSection
                feature={feature}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                noteRequest={noteRequest}
                setNoteRequest={setNoteRequest}
                includeExisting={includeExisting}
                setIncludeExisting={setIncludeExisting}
                forceBase64={forceBase64}
                setForceBase64={setForceBase64}
                supplierId={supplierId}
                handleSupplierChange={setSupplierId}
                model={model}
                handleModelChange={setModel}
                loading={loading}
                onGenerate={handleGenerate}
                hasContent={Boolean(existingBody.trim())}
                overwriteExisting={overwriteExisting}
                setOverwriteExisting={setOverwriteExisting}
            />

            {/* 缓存按钮 */}
            <div className="mt-4 mb-4 flex flex-wrap gap-2">
                {filteredCache.map((item, idx) => (
                    <div key={item.id} className="relative">
                        <button
                            onClick={() => {
                                setNoteRequest(item.suggestion);
                                setPreviewContent(item.content);
                                setSuggestionTitle(item.title);
                                setShowPreview(true);
                            }}
                            className={`${colors[idx % colors.length]} px-2 py-1 rounded`}
                        >
                            {item.title}
                        </button>
                        <span
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full cursor-pointer"
                            onClick={() => removeFromCache(item.id)}
                        >
              ×
            </span>
                    </div>
                ))}
            </div>

            {/* 图片上传 */}
            <div className="flex-1 overflow-auto mt-4">
                <ImageUploader feature={feature} formId={formId} images={images} setImages={setImages} />
            </div>

            {/* Modal */}
            <OptimizePreviewModal
                suggestionTitle={suggestionTitle}
                userSuggestion={noteRequest}
                previewContent={previewContent}
                visible={showPreview}
                onClose={() => setShowPreview(false)}
                onMerge={(editedSuggestion)=> {handleMerge(editedSuggestion);}}                         // <— 流式调用模型，更新 previewContent
                onReplace={(finalContent: string) => {        // <— 用最新内容替换正文
                    removeCurrentCache();
                    onChangeBody(finalContent);
                    setShowPreview(false);
                }}
                onTitleChange={setSuggestionTitle}
                onTitleComplete={upsertCache}
                onContentChange={(editedContent) => {setPreviewContent(editedContent);updateCacheContent(editedContent);}}
            />
        </div>
    );
}
