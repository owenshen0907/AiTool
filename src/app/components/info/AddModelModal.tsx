// File: src/app/components/info/AddModelModal.tsx
'use client';

import React, { useState } from 'react';
import type { Model } from '@/lib/models/model';

interface Props {
  supplierId: string;
  defaultModelType: Model['modelType'];
  onClose: () => void;
  onSaved: () => void;
}

type ModelType = Model['modelType'];

// 每种类型对应的显示选项
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
  image: [
    { key: 'supportsImageOutput', label: '图片输出' },
  ],
  video: [
    { key: 'supportsVideoOutput', label: '视频输出' },
  ],
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

export default function AddModelModal({ supplierId,defaultModelType, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [modelType, setModelType] = useState<ModelType>(defaultModelType);
  // const [modelType, setModelType] = useState<ModelType>('chat');
  const [supportsAudioInput, setSupportsAudioInput] = useState(false);
  const [supportsImageInput, setSupportsImageInput] = useState(false);
  const [supportsVideoInput, setSupportsVideoInput] = useState(false);
  const [supportsAudioOutput, setSupportsAudioOutput] = useState(false);
  const [supportsImageOutput, setSupportsImageOutput] = useState(false);
  const [supportsVideoOutput, setSupportsVideoOutput] = useState(false);
  const [supportsJsonMode, setSupportsJsonMode] = useState(false);
  const [supportsTool, setSupportsTool] = useState(false);
  const [supportsWebSearch, setSupportsWebSearch] = useState(false);
  const [supportsDeepThinking, setSupportsDeepThinking] = useState(false);
  const [supportsWebsocket, setSupportsWebsocket] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { alert('请填写模型名称'); return; }
    setLoading(true);
    try {
      const payload = {
        supplier_id: supplierId,
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved(); onClose();
    } catch (err: any) {
      console.error('添加模型失败', err);
      alert('添加失败：' + err.message);
    } finally { setLoading(false); }
  };

  // 根据类型获取对应配置
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
          <h3 className="text-xl font-semibold mb-4">添加模型</h3>
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
                const checked = ({} as any)[opt.key];
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
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {loading ? '添加中…' : '保存'}
            </button>
          </div>
        </div>
      </div>
  );
}