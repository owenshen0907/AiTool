// File: src/app/docs/japanese/JapaneseContentRight.tsx
'use client';

import React, { useState } from 'react';
import type { ContentItem } from '@/lib/models/content';
import TemplateSelectorModal, { Template } from './TemplateSelectorModal';
import SupplierModelSelector from './SupplierModelSelector';
import ImageUploader from './ImageUploader';
import { Send } from 'lucide-react';
import type { ImageEntry } from './types';

interface Props {
    feature: string;
    selectedItem: ContentItem | null;
    /** 前端预览生成的内容 */
    onPreviewItem: (body: string) => void;
}

export default function JapaneseContentRight({
                                                 feature,
                                                 selectedItem,
                                                 onPreviewItem,
                                             }: Props) {
    const lastSupKey   = `lastSupplier_${feature}`;
    const lastModelKey = `lastModel_${feature}`;

    // 1️⃣ 模板选择
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

    // 2️⃣ 供应商 & 模型（从 localStorage 恢复）
    const [supplierId, setSupplierId] = useState(
        () => localStorage.getItem(lastSupKey) || ''
    );
    const [model, setModel] = useState(
        () => localStorage.getItem(lastModelKey) || ''
    );
    const handleSupplierChange = (id: string) => {
        setSupplierId(id);
        localStorage.setItem(lastSupKey, id);
    };
    const handleModelChange = (name: string) => {
        setModel(name);
        localStorage.setItem(lastModelKey, name);
    };

    // 3️⃣ 笔记要求、图片和 loading
    const [noteRequest, setNoteRequest] = useState('');
    const [images, setImages]           = useState<ImageEntry[]>([]);
    const [loading, setLoading]         = useState(false);
    const [streamed, setStreamed]       = useState(''); // 累积流式文本

    const handleGenerate = async () => {
        if (!selectedItem) {
            alert('请先选择一个文档');
            return;
        }
        // 确认覆盖已有内容
        const existing = (selectedItem.body ?? '').trim();
        if (existing && !window.confirm('当前笔记区已有内容，继续生成将覆盖它？')) {
            return;
        }
        if (!selectedTemplate) {
            alert('请先选择模板');
            return;
        }
        if (images.length === 0) {
            alert('请上传至少一张图片');
            return;
        }

        setLoading(true);
        setStreamed('');
        onPreviewItem(''); // 清空左侧预览

        try {
            // 【1】取供应商配置
            const supRes = await fetch('/api/suppliers');
            const sups: any[] = await supRes.json();
            const sup = sups.find(s => s.id === supplierId);
            const apiUrl = sup.apiUrl;
            const apiKey = sup.apiKey;

            // 【2】构造 messages
            const userMsgs: any[] = [{ type: 'text', text: noteRequest }];
            const isDev = ['localhost','127.0.0.1'].includes(window.location.hostname);
            for (const e of images) {
                if (e.status !== 'success') continue;
                if (isDev && e.file) {
                    const b64 = await new Promise<string>((res, rej) => {
                        const rdr = new FileReader();
                        rdr.onload  = () => res(rdr.result as string);
                        rdr.onerror = rej;
                        rdr.readAsDataURL(e.file!);
                    });
                    userMsgs.push({ type: 'image_url', image_url: { url: b64, detail: 'high' } });
                } else {
                    userMsgs.push({ type: 'image_url', image_url: { url: e.url, detail: 'high' } });
                }
            }
            const messages = [
                { role: 'system', content: selectedTemplate.content },
                { role: 'user',   content: userMsgs },
            ];

            // 【3】流式调用
            const res = await fetch(`${apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization:  `Bearer ${apiKey}`,
                },
                body: JSON.stringify({ model, stream: true, messages }),
            });
            if (!res.ok) throw new Error('流式接口调用失败');

            const reader  = res.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop()!; // 留下不完整行

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
                        // 使用函数式更新拿到最新 prev
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
            alert('流式生成失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-1/3 h-full border-l p-4 flex flex-col">
            {/* 模板选择 */}
            <div className="mb-4 flex items-center space-x-2">
                <TemplateSelectorModal
                    feature={feature}
                    onSelect={tpl => setSelectedTemplate(tpl)}
                />
                {selectedTemplate && (
                    <span className="text-gray-700 truncate" title={selectedTemplate.name}>
            已选模板：{selectedTemplate.name}
          </span>
                )}
            </div>

            {/* 供应商 & 模型 */}
            <div className="mb-4">
                <SupplierModelSelector
                    className="w-full"
                    supplierId={supplierId}
                    onSupplierChange={handleSupplierChange}
                    model={model}
                    onModelChange={handleModelChange}
                />
            </div>

            {/* 一键流式生成 */}
            <div className="mb-4">
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className={`w-full flex items-center justify-center px-4 py-2 rounded font-semibold transition-colors duration-200 overflow-hidden truncate ${
                        loading
                            ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                    <Send size={16} className="mr-2 flex-shrink-0" />
                    {loading ? '生成中...' : '一键生成笔记'}
                </button>
            </div>

            {/* 笔记要求 */}
            <div className="mb-4">
        <textarea
            value={noteRequest}
            onChange={e => setNoteRequest(e.target.value)}
            placeholder="输入笔记要求 (可选)"
            className="w-full border rounded p-2 h-24 resize-none"
        />
            </div>

            {/* 图片上传 */}
            <ImageUploader feature={feature} images={images} setImages={setImages} />
        </div>
    );
}