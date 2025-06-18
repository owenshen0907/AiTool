// File: src/app/components/info/EditModelModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { Model } from '@/lib/models/model';

interface Props {
    model: Model;
    onClose: () => void;
    onSaved: () => void;
}

type ModelType = Model['modelType'];

const OPTION_MAP: Record<ModelType, Array<{ key: keyof Omit<Required<Model>, 'id' | 'supplierId' | 'name' | 'modelType' | 'isDefault'>; label: string }>> = {
    chat: [
        { key: 'supportsAudioInput', label: '音频输入' },
        { key: 'supportsImageInput', label: '图片输入' },
        { key: 'supportsVideoInput', label: '视频输入' },
        { key: 'supportsJsonMode', label: 'JSON 模式' },
        { key: 'supportsTool', label: 'Tool' },
        { key: 'supportsWebSearch', label: 'Web Search' },
        { key: 'supportsDeepThinking', label: '深度思考' },
    ],
    audio: [
        { key: 'supportsAudioInput', label: '音频输入' },
        { key: 'supportsAudioOutput', label: '音频输出' },
        { key: 'supportsWebsocket', label: 'WebSocket 支持' },
    ],
    image: [ { key: 'supportsImageOutput', label: '图片输出' } ],
    video: [ { key: 'supportsVideoOutput', label: '视频输出' } ],
    other: [
        { key: 'supportsAudioInput', label: '音频输入' },
        { key: 'supportsImageInput', label: '图片输入' },
        { key: 'supportsVideoInput', label: '视频输入' },
        { key: 'supportsAudioOutput', label: '音频输出' },
        { key: 'supportsImageOutput', label: '图片输出' },
        { key: 'supportsVideoOutput', label: '视频输出' },
        { key: 'supportsJsonMode', label: 'JSON 模式' },
        { key: 'supportsTool', label: 'Tool' },
        { key: 'supportsWebSearch', label: 'Web Search' },
        { key: 'supportsDeepThinking', label: '深度思考' },
        { key: 'supportsWebsocket', label: 'WebSocket 支持' },
    ],
};

export default function EditModelModal({ model, onClose, onSaved }: Props) {
    const [name, setName] = useState(model.name);
    const [modelType, setModelType] = useState<ModelType>(model.modelType);
    const [supportsAudioInput, setSupportsAudioInput] = useState(model.supportsAudioInput);
    const [supportsImageInput, setSupportsImageInput] = useState(model.supportsImageInput);
    const [supportsVideoInput, setSupportsVideoInput] = useState(model.supportsVideoInput);
    const [supportsAudioOutput, setSupportsAudioOutput] = useState(model.supportsAudioOutput);
    const [supportsImageOutput, setSupportsImageOutput] = useState(model.supportsImageOutput);
    const [supportsVideoOutput, setSupportsVideoOutput] = useState(model.supportsVideoOutput);
    const [supportsJsonMode, setSupportsJsonMode] = useState(model.supportsJsonMode);
    const [supportsTool, setSupportsTool] = useState(model.supportsTool);
    const [supportsWebSearch, setSupportsWebSearch] = useState(model.supportsWebSearch);
    const [supportsDeepThinking, setSupportsDeepThinking] = useState(model.supportsDeepThinking);
    const [supportsWebsocket, setSupportsWebsocket] = useState(model.supportsWebsocket);
    const [isDefault, setIsDefault] = useState(model.isDefault);
    const [loading, setLoading] = useState(false);

    // 更新本地状态当 modelType 变更时重置相关选项
    useEffect(() => {
        const keysToReset: Array<keyof typeof OPTION_MAP> = ['chat','audio','image','video','other'];
        OPTION_MAP[modelType].forEach(opt => {
            // keep current
        });
    }, [modelType]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                id: model.id,
                name,
                model_type: modelType,
                supports_audio_input: supportsAudioInput,
                supports_image_input: supportsImageInput,
                supports_video_input: supportsVideoInput,
                supports_audio_output: supportsAudioOutput,
                supports_image_output: supportsImageOutput,
                supports_video_output: supportsVideoOutput,
                supports_json_mode: supportsJsonMode,
                supports_tool: supportsTool,
                supports_web_search: supportsWebSearch,
                supports_deep_thinking: supportsDeepThinking,
                supports_websocket: supportsWebsocket,
                is_default: isDefault,
            };
            const res = await fetch('/api/suppliers/models', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await res.text());
            onSaved(); onClose();
        } catch (err: any) {
            console.error('更新模型失败', err);
            alert('更新失败：' + err.message);
        } finally { setLoading(false); }
    };

    const options = OPTION_MAP[modelType];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-xl font-semibold mb-4">编辑模型</h3>
                <div className="space-y-4">
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="模型名称"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <select
                        value={modelType}
                        onChange={e => setModelType(e.target.value as ModelType)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    >
                        <option value="chat">chat</option>
                        <option value="audio">audio</option>
                        <option value="image">image</option>
                        <option value="video">video</option>
                        <option value="other">other</option>
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                        {options.map(opt => {
                            const setter = {
                                supportsAudioInput: setSupportsAudioInput,
                                supportsImageInput: setSupportsImageInput,
                                supportsVideoInput: setSupportsVideoInput,
                                supportsAudioOutput: setSupportsAudioOutput,
                                supportsImageOutput: setSupportsImageOutput,
                                supportsVideoOutput: setSupportsVideoOutput,
                                supportsJsonMode: setSupportsJsonMode,
                                supportsTool: setSupportsTool,
                                supportsWebSearch: setSupportsWebSearch,
                                supportsDeepThinking: setSupportsDeepThinking,
                                supportsWebsocket: setSupportsWebsocket,
                            }[opt.key] as (v: boolean) => void;
                            const value = {
                                supportsAudioInput,
                                supportsImageInput,
                                supportsVideoInput,
                                supportsAudioOutput,
                                supportsImageOutput,
                                supportsVideoOutput,
                                supportsJsonMode,
                                supportsTool,
                                supportsWebSearch,
                                supportsDeepThinking,
                                supportsWebsocket,
                            }[opt.key] as boolean;
                            return (
                                <label key={opt.key} className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={e => setter(e.target.checked)}
                                        className="mr-2"
                                    />
                                    {opt.label}
                                </label>
                            );
                        })}
                    </div>
                    <label className="inline-flex items-center">
                        <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="mr-2" /> 设为默认模型
                    </label>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100" disabled={loading}>取消</button>
                    <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded.hover:bg-blue-700 disabled:opacity-50">{loading?'保存中…':'保存'}</button>
                </div>
            </div>
        </div>
    );
}
