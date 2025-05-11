// app/components/EditModelModal.tsx
'use client';

import React, { useState } from 'react';
import type { Model } from '@/lib/models/model';

interface Props {
    model: Model;
    onClose: () => void;
    onSaved: () => void;
}

export default function EditModelModal({ model, onClose, onSaved }: Props) {
    const [name, setName] = useState(model.name);
    const [modelType, setModelType] = useState(model.modelType);
    const [supportsImageInput, setSupportsImageInput] = useState(model.supportsImageInput);
    const [supportsVideoInput, setSupportsVideoInput] = useState(model.supportsVideoInput);
    const [supportsAudioOutput, setSupportsAudioOutput] = useState(model.supportsAudioOutput);
    const [supportsJsonMode, setSupportsJsonMode] = useState(model.supportsJsonMode);
    const [supportsTool, setSupportsTool] = useState(model.supportsTool);
    const [supportsWebSearch, setSupportsWebSearch] = useState(model.supportsWebSearch);
    const [supportsDeepThinking, setSupportsDeepThinking] = useState(model.supportsDeepThinking);
    const [isDefault, setIsDefault] = useState(model.isDefault);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/models', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: model.id,
                    name,
                    model_type: modelType,
                    supports_image_input: supportsImageInput,
                    supports_video_input: supportsVideoInput,
                    supports_audio_output: supportsAudioOutput,
                    supports_json_mode: supportsJsonMode,
                    supports_tool: supportsTool,
                    supports_web_search: supportsWebSearch,
                    supports_deep_thinking: supportsDeepThinking,
                    is_default: isDefault,
                }),
            });
            if (!res.ok) {
                throw new Error(await res.text());
            }
            onSaved();
            onClose();
        } catch (err: any) {
            console.error(err);
            alert('更新失败：' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white rounded shadow-lg p-6 w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-4">编辑模型</h3>
                <div className="space-y-3">
                    <input
                        className="w-full border rounded px-3 py-2"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="模型名称"
                    />
                    <select
                        className="w-full border rounded px-3 py-2"
                        value={modelType}
                        onChange={(e) => setModelType(e.target.value as any)}
                    >
                        <option value="chat">chat</option>
                        <option value="non-chat">non-chat</option>
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={supportsImageInput}
                                onChange={(e) => setSupportsImageInput(e.target.checked)}
                                className="mr-2"
                            />
                            图片输入
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={supportsVideoInput}
                                onChange={(e) => setSupportsVideoInput(e.target.checked)}
                                className="mr-2"
                            />
                            视频输入
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={supportsAudioOutput}
                                onChange={(e) => setSupportsAudioOutput(e.target.checked)}
                                className="mr-2"
                            />
                            音频输出
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={supportsJsonMode}
                                onChange={(e) => setSupportsJsonMode(e.target.checked)}
                                className="mr-2"
                            />
                            JSON 模式
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={supportsTool}
                                onChange={(e) => setSupportsTool(e.target.checked)}
                                className="mr-2"
                            />
                            Tool
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={supportsWebSearch}
                                onChange={(e) => setSupportsWebSearch(e.target.checked)}
                                className="mr-2"
                            />
                            WebSearch
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={supportsDeepThinking}
                                onChange={(e) => setSupportsDeepThinking(e.target.checked)}
                                className="mr-2"
                            />
                            深度思考
                        </label>
                    </div>
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            className="mr-2"
                        />
                        设为默认模型
                    </label>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                        {loading ? '保存中…' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}