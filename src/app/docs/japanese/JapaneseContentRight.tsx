// File: src/app/docs/japanese/JapaneseContentRight.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { ContentItem } from '@/lib/models/content';
import GenerateSection from './GenerateSection';
import ImageUploader from './ImageUploader';
import type { ImageEntry } from './types';
import type { Template } from './TemplateSelectorModal';

interface Props {
    feature: string;
    formId: string;
    selectedItem: ContentItem | null;
    onPreviewItem: (body: string) => void;
}

export default function JapaneseContentRight({
                                                 feature,
                                                 formId,
                                                 selectedItem,
                                                 onPreviewItem,
                                             }: Props) {
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [supplierId, setSupplierId]              = useState('');
    const [model, setModel]                        = useState('');
    const [noteRequest, setNoteRequest]            = useState('');
    const [includeExisting, setIncludeExisting]    = useState(false);
    const [forceBase64, setForceBase64]            = useState(false);
    const [images, setImages]                      = useState<ImageEntry[]>([]);
    const [loading, setLoading]                    = useState(false);
    const [streamed, setStreamed]                  = useState(''); // 流式拼接内容

    // —— 加载历史图片 ——
    useEffect(() => {
        if (!formId) {
            setImages([]);
            return;
        }
        (async () => {
            try {
                const res = await fetch(`/api/files?form_id=${formId}`);
                if (!res.ok) throw new Error();
                const files: Array<{ file_id: string; file_path: string }> = await res.json();
                setImages(files.map(f => ({
                    id: f.file_id,
                    url: `${window.location.origin}/${f.file_path}`,
                    status: 'success',
                    file_id: f.file_id,
                })));
            } catch (err) {
                console.error('加载历史图片失败', err);
            }
        })();
    }, [formId]);

    // —— 核心：流式调用 & Base64 逻辑修复 ——
    const handleGenerate = async () => {
        if (!selectedItem) {
            alert('请先选择一个文档');
            return;
        }
        const existing = (selectedItem.body ?? '').trim();
        if (existing && !window.confirm('覆盖已有内容？')) return;
        if (!selectedTemplate) {
            alert('请先选择模板');
            return;
        }

        setLoading(true);
        onPreviewItem(''); // 清空编辑区
        setStreamed('');

        const isDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

        try {
            // 1. 取供应商配置
            const supRes = await fetch('/api/suppliers');
            const sups: any[] = await supRes.json();
            const sup = sups.find(s => s.id === supplierId);
            const apiUrl = sup.apiUrl, apiKey = sup.apiKey;

            // 2. 构造 user 消息数组
            const userMsgs: any[] = [{ type: 'text', text: noteRequest }];

            for (const entry of images) {
                if (entry.status !== 'success') continue;

                const useB64 = forceBase64 || isDev;
                if (useB64) {
                    let b64: string;
                    if (entry.file) {
                        // 新上传的 File
                        b64 = await new Promise<string>((res, rej) => {
                            const reader = new FileReader();
                            reader.onload  = () => res(reader.result as string);
                            reader.onerror = rej;
                            reader.readAsDataURL(entry.file!);
                        });
                    } else {
                        // 历史 URL -> fetch blob -> to Base64
                        const resp = await fetch(entry.url);
                        const blob = await resp.blob();
                        b64 = await new Promise<string>((res, rej) => {
                            const reader = new FileReader();
                            reader.onload  = () => res(reader.result as string);
                            reader.onerror = rej;
                            reader.readAsDataURL(blob);
                        });
                    }
                    userMsgs.push({
                        type: 'image_url',
                        image_url: { url: b64, detail: 'high' },
                    });
                } else {
                    // 直接 URL
                    const absoluteUrl = entry.url.startsWith('http')
                        ? entry.url
                        : `${window.location.origin}${entry.url}`;
                    userMsgs.push({
                        type: 'image_url',
                        image_url: { url: absoluteUrl, detail: 'high' },
                    });
                }
            }

            // 3. 构建完整 messages
            const messages: any[] = [
                { role: 'system', content: selectedTemplate.content },
            ];
            if (includeExisting && existing) {
                messages.push({ role: 'assistant', content: existing });
            }
            messages.push({ role: 'user', content: userMsgs });

            // 4. 流式调用大模型
            const upstream = await fetch(`${apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization:  `Bearer ${apiKey}`,
                },
                body: JSON.stringify({ model, stream: true, messages }),
            });
            if (!upstream.ok) throw new Error('接口调用失败');

            const reader  = upstream.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop()!; // 留下最后可能不完整的一行

                for (const line of lines) {
                    if (!line.startsWith('data:')) continue;
                    const jsonStr = line.replace(/^data:\s*/, '').trim();
                    if (jsonStr === '[DONE]') {
                        reader.cancel();
                        break;
                    }
                    let payload: any;
                    try {
                        payload = JSON.parse(jsonStr);
                    } catch {
                        continue;
                    }
                    const delta = payload.choices?.[0]?.delta?.content;
                    if (delta) {
                        setStreamed(prev => {
                            const next = prev + delta;
                            onPreviewItem(next);
                            return next;
                        });
                    }
                }
            }
        } catch (err) {
            console.error(err);
            alert('生成失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-1/3 h-full border-l p-4 flex flex-col">
            <GenerateSection
                feature={feature}
                selectedTemplate={selectedTemplate!}
                setSelectedTemplate={setSelectedTemplate!}
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
            />

            <div className="flex-1 overflow-auto mt-4">
                <ImageUploader
                    feature={feature}
                    formId={formId}
                    images={images}
                    setImages={setImages}
                />
            </div>
        </div>
    );
}