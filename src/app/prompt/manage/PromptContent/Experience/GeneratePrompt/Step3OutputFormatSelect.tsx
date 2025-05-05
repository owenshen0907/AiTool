// src/app/prompt/manage/PromptContent/Experience/GeneratePrompt/Step3OutputFormatSelect.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import promptConfig from './promptConfig.json';
import SchemaBuilder from '@/lib/utils/SchemaBuilder';

type OutputFormat = typeof promptConfig.outputFormats[number];

interface Props {
    options: OutputFormat[];
    selected: string;
    onSelect: (code: string) => void;
    schema: string;
    onSchemaChange: (schema: string) => void;
}

export default function Step3OutputFormatSelect({
                                                    options,
                                                    selected,
                                                    onSelect,
                                                    schema,
                                                    onSchemaChange,
                                                }: Props) {
    const [editMode, setEditMode] = useState<'form' | 'builder'>('form');

    /* ---------- 修复：仅在“第一次切换为 JSON”时把模式设为 form ---------- */
    const prevSelRef = useRef(selected);

    useEffect(() => {
        if (selected === 'JSON' && prevSelRef.current !== 'JSON') {
            // 只有从非 JSON → JSON 的那一瞬间才重置
            setEditMode('form');
        }
        prevSelRef.current = selected;
    }, [selected]);
    /* ---------------------------------------------------------------------- */

    const handleBuilderSave = (gen: string) => {
        onSchemaChange(gen);
        setEditMode('form');
    };

    return (
        <div className="space-y-4">
            <p className="text-gray-500">
                说明：选择输出格式<span className="text-red-500 ml-1">*</span>
            </p>

            {/* 格式卡片 */}
            <div className="flex flex-wrap gap-4">
                {options.map(o => (
                    <div
                        key={o.code}
                        onClick={() => onSelect(o.code)}
                        className={`w-[120px] p-4 border rounded-lg cursor-pointer transition
              ${selected === o.code
                            ? 'border-blue-600 bg-blue-50 shadow-sm'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100'}`}
                    >
                        <h4 className="font-semibold mb-1">{o.label}</h4>
                        <p className="text-sm text-gray-500 whitespace-pre-wrap">{o.example}</p>
                    </div>
                ))}
            </div>

            {/* JSON 专属 */}
            {selected === 'JSON' && (
                <div className="mt-4 space-y-2">
                    {/* 方式切换 */}
                    <div className="space-x-3">
                        <label>
                            <input
                                type="radio"
                                name="json-edit-mode"
                                checked={editMode === 'form'}
                                onChange={() => setEditMode('form')}
                            />
                            <span className="ml-1">直接编辑 / 粘贴</span>
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="json-edit-mode"
                                checked={editMode === 'builder'}
                                onChange={() => setEditMode('builder')}
                            />
                            <span className="ml-1">字段式生成</span>
                        </label>
                    </div>

                    {/* 直接编辑 */}
                    {editMode === 'form' && (
                        <textarea
                            className="w-full h-40 max-h-[300px] p-2 border rounded font-mono text-sm overflow-auto"
                            placeholder="可直接粘贴完整 JSON Schema，留空亦可"
                            value={schema}
                            onChange={e => onSchemaChange(e.target.value)}
                        />
                    )}

                    {/* 字段式生成 */}
                    {editMode === 'builder' && (
                        <div className="p-4 border rounded max-h-[450px] overflow-auto">
                            <SchemaBuilder initialSchema={schema} onSchemaSave={handleBuilderSave} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}