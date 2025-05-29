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
    existingBody: string;                    // 来自左侧或上次生成的内容
    onChangeBody: (body: string) => void;    // 更新正文
}

export default function JapaneseContentRight({
                                                 feature,
                                                 formId,
                                                 selectedItem,
                                                 existingBody,
                                                 onChangeBody,
                                             }: Props) {
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [supplierId, setSupplierId]              = useState<string>('');
    const [model, setModel]                        = useState<string>('');
    const [noteRequest, setNoteRequest]            = useState<string>('');
    const [includeExisting, setIncludeExisting]    = useState<boolean>(false);
    const [forceBase64, setForceBase64]            = useState<boolean>(false);
    const [images, setImages]                      = useState<ImageEntry[]>([]);
    const [loading, setLoading]                    = useState<boolean>(false);

    // 加载已有文件
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

    // 核心：流式+Base64逻辑
    const handleGenerate = async () => {
        if (!selectedItem) {
            alert('请先选择一个文档');
            return;
        }
        // existingBody 可能是空字符串
        const existing = existingBody.trim();
        if (existing && !window.confirm('覆盖已有内容？')) return;
        if (!selectedTemplate) {
            alert('请先选择模板');
            return;
        }

        setLoading(true);
        onChangeBody('');  // 清空正文
        let acc = '';      // 本地累积

        const isDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        try {
            // 1) 取供应商配置
            const supRes = await fetch('/api/suppliers');
            const sups: any[] = await supRes.json();
            const sup = sups.find(s => s.id === supplierId);
            const apiUrl = sup.apiUrl, apiKey = sup.apiKey;

            // 2) 构造 user 消息
            const userMsgs: any[] = [{ type: 'text', text: noteRequest }];
            for (const e of images) {
                if (e.status !== 'success') continue;
                const useB64 = forceBase64 || isDev;
                let urlOrB64: string;
                if (useB64) {
                    if (e.file) {
                        urlOrB64 = await new Promise<string>((res, rej) => {
                            const r = new FileReader();
                            r.onload = () => res(r.result as string);
                            r.onerror = rej;
                            r.readAsDataURL(e.file!);
                        });
                    } else {
                        const resp = await fetch(e.url);
                        const blob = await resp.blob();
                        urlOrB64 = await new Promise<string>((res, rej) => {
                            const r = new FileReader();
                            r.onload = () => res(r.result as string);
                            r.onerror = rej;
                            r.readAsDataURL(blob);
                        });
                    }
                } else {
                    urlOrB64 = e.url.startsWith('http')
                        ? e.url
                        : `${window.location.origin}${e.url}`;
                }
                userMsgs.push({ type: 'image_url', image_url: { url: urlOrB64, detail: 'high' } });
            }

            // 3) 构建 messages
            const messages: any[] = [
                { role: 'system', content: selectedTemplate.content },
            ];
            if (includeExisting && existing) {
                messages.push({ role: 'assistant', content: existing });
            }
            messages.push({ role: 'user', content: userMsgs });

            // 4) 发流式请求
            const upstream = await fetch(`${apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({ model, stream: true, messages }),
            });
            if (!upstream.ok) throw new Error('接口调用失败');

            const reader = upstream.body!.getReader();
            const decoder = new TextDecoder();
            let buf = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split('\n');
                buf = lines.pop()!; // 留最后不完整
                for (const line of lines) {
                    if (!line.startsWith('data:')) continue;
                    const jsonStr = line.replace(/^data:\s*/, '').trim();
                    if (jsonStr === '[DONE]') {
                        reader.cancel();
                        break;
                    }
                    let payload: any;
                    try { payload = JSON.parse(jsonStr); } catch { continue; }
                    const delta = payload.choices?.[0]?.delta?.content;
                    if (delta) {
                        acc += delta;
                        onChangeBody(acc);
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