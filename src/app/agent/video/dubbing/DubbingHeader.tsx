// File: src/app/components/DubbingHeader.tsx
'use client';

import React, { useState } from 'react';
import {
    MoreVertical,
    Save,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';
import type {
    ContentItem,
} from '@/lib/models/content';
import type {
    Supplier,
    Model,
    VoiceTone,
} from '@/lib/models/model';

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

interface Props {
    /* 标题 / 摘要 */
    title: string;
    summary: string;
    onTitleChange: (t: string) => void;
    onSummaryChange: (s: string) => void;

    /* 全局参数 */
    selectedItem: ContentItem;
    suppliers: Supplier[];
    models: Model[];
    voiceTones: VoiceTone[];
    supplierId: string;
    model: string;
    voiceId: string;
    responseFormat: string;
    speed: number;
    volume: number;

    /* 回调 */
    dirty: boolean;
    onSupplierChange: (id: string) => void;
    onModelChange: (m: string) => void;
    onVoiceChange: (v: string) => void;
    onFormatChange: (f: string) => void;
    onSpeedChange: (n: number) => void;
    onVolumeChange: (n: number) => void;
    onSave: () => void;
    isEditing: boolean;
    onToggleEdit: () => void;
}

export default function DubbingHeader({
                                          title,
                                          summary,
                                          onTitleChange,
                                          onSummaryChange,
                                          suppliers,
                                          models,
                                          voiceTones,
                                          supplierId,
                                          model,
                                          voiceId,
                                          responseFormat,
                                          speed,
                                          volume,
                                          dirty,
                                          onSupplierChange,
                                          onModelChange,
                                          onVoiceChange,
                                          onFormatChange,
                                          onSpeedChange,
                                          onVolumeChange,
                                          onSave,
                                          isEditing,
                                          onToggleEdit,
                                      }: Props) {
    /* 折叠 */
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className={`w-full border border-gray-200 rounded-md bg-white ${
                collapsed ? 'p-1' : 'p-4'
            } mb-4 relative`}
        >
            {/* 折叠按钮 */}
            <button
                onClick={() => setCollapsed((v) => !v)}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 p-1"
                title={collapsed ? '展开' : '折叠'}
            >
                {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>

            {/* 折叠时只保留 1px 高度 */}
            {collapsed && <div style={{ height: 4 }} />}

            {!collapsed && (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* ---------------- 左列：标题/摘要 + 按钮 ---------------- */}
                    <div className="flex flex-1 min-w-[240px]">
                        {/* 左：标题 + 摘要（上下堆） */}
                        <div className="flex-1 flex flex-col">
                            {isEditing ? (
                                <input
                                    value={title}
                                    onChange={(e) => onTitleChange(e.target.value)}
                                    placeholder="标题"
                                    className="text-xl font-semibold border border-gray-300 rounded-md p-2 mb-2
                             focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <h2 className="text-xl font-semibold truncate mb-2">
                                    {title || '未命名'}
                                </h2>
                            )}

                            {isEditing ? (
                                <textarea
                                    rows={2}
                                    value={summary}
                                    onChange={(e) => onSummaryChange(e.target.value)}
                                    placeholder="摘要"
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm
                             focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <p className="text-gray-700 break-words text-sm">
                                    {summary}
                                </p>
                            )}
                        </div>

                        {/* 右：竖排按钮组 */}
                        <div className="ml-2 shrink-0 flex flex-col items-center">
                            <button
                                onClick={onToggleEdit}
                                className="p-2 hover:bg-gray-100 rounded-md"
                                title={isEditing ? '退出编辑' : '编辑标题 / 摘要'}
                            >
                                <MoreVertical size={20} />
                            </button>
                            <button
                                onClick={onSave}
                                disabled={!dirty}
                                className="p-2 hover:bg-gray-100 rounded-md disabled:opacity-40"
                                title="保存修改"
                            >
                                <Save size={20} />
                            </button>
                        </div>
                    </div>

                    {/* ---------------- 右列：全局参数 ---------------- */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <Param label="供应商">
                            <select
                                value={supplierId}
                                onChange={(e) => onSupplierChange(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2"
                            >
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </Param>

                        <Param label="模型">
                            <select
                                value={model}
                                onChange={(e) => onModelChange(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2"
                            >
                                {models.map((m) => (
                                    <option key={m.name} value={m.name}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </Param>

                        <Param label="音色">
                            <select
                                value={voiceId}
                                onChange={(e) => onVoiceChange(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2"
                            >
                                {voiceTones
                                    .filter((v) => v.supplierId === supplierId)
                                    .map((v) => (
                                        <option key={v.id} value={v.toneId}>
                                            {v.name}
                                        </option>
                                    ))}
                            </select>
                        </Param>

                        <Param label="格式">
                            <select
                                value={responseFormat}
                                onChange={(e) => onFormatChange(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2"
                            >
                                {['mp3', 'wav', 'flac', 'opus'].map((f) => (
                                    <option key={f} value={f}>
                                        {f}
                                    </option>
                                ))}
                            </select>
                        </Param>

                        <Param label="速率">
                            <input
                                type="number"
                                min={0.5}
                                max={2.0}
                                step={0.1}
                                value={speed}
                                onChange={(e) => onSpeedChange(+e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2"
                            />
                        </Param>

                        <Param label="音量">
                            <input
                                type="number"
                                min={0.1}
                                max={2.0}
                                step={0.1}
                                value={volume}
                                onChange={(e) => onVolumeChange(+e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2"
                            />
                        </Param>
                    </div>
                </div>
            )}
        </div>
    );
}

/* —— 标签 + 控件 —— */
function Param({
                   label,
                   children,
               }: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col">
            <label className="text-xs mb-1 text-gray-600">{label}</label>
            {children}
        </div>
    );
}