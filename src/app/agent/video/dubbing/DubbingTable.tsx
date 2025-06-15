'use client';

import React from 'react';
import type { DubCase } from './DubbingHeader';
import DataImportManager, { ColumnDef } from '@/components/common/DataImport/DataImportManager';
import voices from './voices.json';

/* ---------- 导入行类型 ---------- */
interface CaseImportRow { id: string; text: string }

/* ---------- 组件 Props ---------- */
interface Props {
    cases: DubCase[];
    selectedIds: string[];
    remaining: number;
    batchConcurrency: number;

    onImport: (rows: CaseImportRow[]) => void;
    onAddCase: () => void;
    onBatchGenerate: () => void;
    onConcurrencyChange: (n: number) => void;
    onSelectIds: (ids: string[]) => void;
    onUpdateCase: (id: string, patch: Partial<DubCase>) => void;
    onRemoveCase: (id: string) => void;
    onGenerateCase: (c: DubCase) => void;

    globalVoiceId: string;
    globalResponseFormat: string;
    globalSpeed: number;
    globalVolume: number;
    globalSupplierId: string;

    /* 新增：文件导入 / 导出三个函数 */
    exportTemplate: () => void;
    exportWithData: () => void;
    parseImportFile: (f: File) => Promise<CaseImportRow[]>;
}

/* ---------- 组件实现 ---------- */
export default function DubbingTable({
                                         cases, selectedIds, remaining, batchConcurrency,
                                         onImport, onAddCase, onBatchGenerate, onConcurrencyChange,
                                         onSelectIds, onUpdateCase, onRemoveCase, onGenerateCase,
                                         globalVoiceId, globalResponseFormat, globalSpeed, globalVolume,
                                         globalSupplierId,
                                         exportTemplate, exportWithData, parseImportFile,
                                     }: Props) {

    const columns: ColumnDef<CaseImportRow>[] = [
        { key: 'text', label: 'Case 文本', editable: true },
    ];

    const toggleRow = (id: string, checked: boolean) =>
        onSelectIds(checked ? [...selectedIds, id] : selectedIds.filter(x => x !== id));

    return (
        <div className="flex-1 overflow-auto px-4 pb-4 w-full">
            {/* ───────── 工具栏 ───────── */}
            <div className="flex items-center mb-4">
                <DataImportManager<CaseImportRow>
                    existingRows    ={cases.map(c => ({ id: c.id, text: c.text }))}
                    exportTemplate  ={exportTemplate}
                    exportWithData  ={exportWithData}
                    parseImportFile ={parseImportFile}
                    columns         ={columns}
                    onImportConfirmed={onImport}
                />

                <button onClick={onAddCase} className="ml-4 px-3 py-1 bg-gray-700 text-white rounded">
                    新增行
                </button>

                <button onClick={onBatchGenerate} className="ml-4 px-3 py-1 bg-green-500 text-white rounded">
                    一键执行
                </button>

                <span className="ml-2 text-sm text-gray-600">
          已选 {selectedIds.length}，剩余 {remaining}
        </span>

                <div className="ml-4 flex items-center">
                    <span className="mr-2">并发数</span>
                    <input
                        type="number"
                        min={1}
                        max={6}
                        value={batchConcurrency}
                        onChange={e => onConcurrencyChange(+e.target.value)}
                        className="w-16 border rounded p-1"
                    />
                </div>
            </div>

            {/* ───────── 数据表 ───────── */}
            <table className="min-w-full table-auto border-collapse">
                <colgroup>
                    <col style={{ width: '5%'  }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '5%'  }} />
                    <col style={{ width: '5%'  }} />
                    <col style={{ width: '5%'  }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '5%'  }} />
                    <col style={{ width: '5%'  }} />
                    <col style={{ width: '10%' }} />
                </colgroup>

                <thead>
                <tr className="bg-gray-100">
                    <th className="border p-2 text-center">
                        <input
                            type="checkbox"
                            checked={cases.length > 0 && selectedIds.length === cases.length}
                            onChange={e => onSelectIds(e.target.checked ? cases.map(c => c.id) : [])}
                        />
                    </th>
                    {['Case 文本','音色','格式','速率','音量','音频','建连','完成','操作'].map(t => (
                        <th key={t} className="border p-2 text-center">{t}</th>
                    ))}
                </tr>
                </thead>

                <tbody>
                {cases.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                        {/* 勾选 */}
                        <td className="border p-2 text-center">
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(c.id)}
                                onChange={e => toggleRow(c.id, e.target.checked)}
                            />
                        </td>

                        {/* Case 文本 */}
                        <td className="border p-2">
                            <input
                                className="w-full"
                                value={c.text}
                                onChange={e => onUpdateCase(c.id, { text: e.target.value })}
                            />
                        </td>

                        {/* 音色 */}
                        <td className="border p-2 text-center">
                            <select
                                className="w-full border p-1 rounded"
                                value={c.voiceId ?? globalVoiceId}
                                onChange={e => onUpdateCase(c.id, { voiceId: e.target.value })}
                            >
                                <option value="">--</option>
                                {voices.filter(v => v.supplierId === globalSupplierId).map(v => (
                                    <option key={v.voiceId} value={v.voiceId}>{v.voiceName}</option>
                                ))}
                            </select>
                        </td>

                        {/* 格式 */}
                        <td className="border p-2 text-center">
                            <select
                                className="w-full border p-1 rounded"
                                value={c.responseFormat ?? globalResponseFormat}
                                onChange={e => onUpdateCase(c.id, { responseFormat: e.target.value })}
                            >
                                {['mp3','wav','flac','opus'].map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </td>

                        {/* 速率 */}
                        <td className="border p-2 text-center">
                            <input
                                type="number" step="0.1" min="0.5" max="2.0"
                                value={c.speed ?? globalSpeed}
                                onChange={e => onUpdateCase(c.id, { speed: +e.target.value })}
                                className="w-full border p-1 rounded"
                            />
                        </td>

                        {/* 音量 */}
                        <td className="border p-2 text-center">
                            <input
                                type="number" step="0.1" min="0.1" max="2.0"
                                value={c.volume ?? globalVolume}
                                onChange={e => onUpdateCase(c.id, { volume: +e.target.value })}
                                className="w-full border p-1 rounded"
                            />
                        </td>

                        {/* 播放器 */}
                        <td className="border p-2 text-center">
                            {c.audioUrl ? <audio controls src={c.audioUrl} className="w-full" /> : '—'}
                        </td>

                        {/* 建连 / 完成 */}
                        <td className="border p-2 text-center">
                            {c.connectAt ? new Date(c.connectAt).toLocaleTimeString('en-GB',{hour12:false}) : '—'}
                        </td>
                        <td className="border p-2 text-center">
                            {c.doneAt ? new Date(c.doneAt).toLocaleTimeString('en-GB',{hour12:false}) : '—'}
                        </td>

                        {/* 操作 */}
                        <td className="border p-2 flex justify-center space-x-1">
                            <button onClick={() => onGenerateCase(c)} className="px-2 py-1 bg-green-500 text-white rounded">
                                生成
                            </button>
                            <button onClick={() => onRemoveCase(c.id)} className="px-2 py-1 bg-red-500 text-white rounded">
                                删除
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}