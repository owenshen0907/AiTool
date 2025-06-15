'use client';

import React from 'react';
import { MoreVertical, Save } from 'lucide-react';
import type { ContentItem } from '@/lib/models/content';
import type { Supplier, Model } from '@/lib/models/model';
import voices from './voices.json';

/* 行类型（表格也会用到） */
export interface DubCase {
    id: string;
    text: string;
    voiceId?: string;
    responseFormat?: string;
    speed?: number;
    volume?: number;
    audioUrl?: string;
    connectAt?: number;
    doneAt?: number;
    sessionId?: string;
}

/* ---------------- Props ---------------- */
interface Props {
    /* 标题 / 摘要受控 */
    title: string;
    summary: string;
    onTitleChange:   (t: string) => void;
    onSummaryChange: (s: string) => void;

    /* 其余全局参数 */
    selectedItem: ContentItem;
    suppliers: Supplier[];
    models: Model[];

    supplierId: string;
    model: string;
    voiceId: string;
    responseFormat: string;
    speed: number;
    volume: number;

    dirty: boolean;
    onSupplierChange: (id: string) => void;
    onModelChange:    (m: string)  => void;
    onVoiceChange:    (v: string)  => void;
    onFormatChange:   (f: string)  => void;
    onSpeedChange:    (n: number)  => void;
    onVolumeChange:   (n: number)  => void;
    onSave:           () => void;

    isEditing: boolean;
    onToggleEdit: () => void;
}

/* -------------- 组件实现 -------------- */
export default function DubbingHeader({
                                          title, summary, onTitleChange, onSummaryChange,
                                          suppliers, models,
                                          supplierId, model, voiceId,
                                          responseFormat, speed, volume,
                                          dirty,
                                          onSupplierChange, onModelChange, onVoiceChange,
                                          onFormatChange, onSpeedChange, onVolumeChange,
                                          onSave, isEditing, onToggleEdit,
                                      }: Props) {

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 bg-white shadow">
            {/* —— 左栏：标题 / 摘要 —— */}
            <div className="flex-1 min-w-[300px]">
                <div className="flex items-start">
                    {isEditing ? (
                        <input
                            value={title}
                            onChange={e => onTitleChange(e.target.value)}
                            placeholder="标题"
                            className="flex-1 text-xl font-semibold border rounded p-2"
                        />
                    ) : (
                        <h2 className="flex-1 text-xl font-semibold truncate">{title || '未命名'}</h2>
                    )}

                    {/* 竖排图标 */}
                    <div className="ml-2 flex flex-col items-center">
                        <button
                            onClick={onToggleEdit}
                            className="p-2 hover:bg-gray-100 rounded"
                            title={isEditing ? '退出编辑' : '编辑标题/摘要'}
                        >
                            <MoreVertical size={20} />
                        </button>

                        <button
                            onClick={onSave}
                            disabled={!dirty}
                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-40"
                            title="保存修改"
                        >
                            <Save size={20} />
                        </button>
                    </div>
                </div>

                {isEditing ? (
                    <textarea
                        rows={2}
                        value={summary}
                        onChange={e => onSummaryChange(e.target.value)}
                        placeholder="摘要"
                        className="w-full border rounded p-2 mt-2"
                    />
                ) : (
                    <p className="mt-2 text-gray-700">{summary}</p>
                )}
            </div>

            {/* —— 右栏：全局参数 —— */}
            <div className="flex-1 flex flex-wrap gap-4 min-w-[300px]">
                <Param label="供应商">
                    <select
                        value={supplierId}
                        onChange={e => onSupplierChange(e.target.value)}
                        className="border rounded p-2 w-full"
                    >
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </Param>

                <Param label="模型">
                    <select
                        value={model}
                        onChange={e => onModelChange(e.target.value)}
                        className="border rounded p-2 w-full"
                    >
                        {models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                    </select>
                </Param>

                <Param label="音色">
                    <select
                        value={voiceId}
                        onChange={e => onVoiceChange(e.target.value)}
                        className="border rounded p-2 w-full"
                    >
                        {voices.filter(v => v.supplierId === supplierId).map(v => (
                            <option key={v.voiceId} value={v.voiceId}>{v.voiceName}</option>
                        ))}
                    </select>
                </Param>

                <Param label="格式">
                    <select
                        value={responseFormat}
                        onChange={e => onFormatChange(e.target.value)}
                        className="border rounded p-2 w-full"
                    >
                        {['mp3','wav','flac','opus'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </Param>

                <Param label="速率">
                    <input
                        type="number" min={0.5} max={2.0} step={0.1}
                        value={speed}
                        onChange={e => onSpeedChange(+e.target.value)}
                        className="border rounded p-2 w-full"
                    />
                </Param>

                <Param label="音量">
                    <input
                        type="number" min={0.1} max={2.0} step={0.1}
                        value={volume}
                        onChange={e => onVolumeChange(+e.target.value)}
                        className="border rounded p-2 w-full"
                    />
                </Param>
            </div>
        </div>
    );
}

/* label + 控件 封装 */
function Param({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex-1 min-w-[150px]">
            <label className="block text-sm mb-1">{label}</label>
            {children}
        </div>
    );
}