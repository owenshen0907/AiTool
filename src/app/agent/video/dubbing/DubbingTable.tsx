// File: src/app/components/DubbingTable.tsx
/* -------------------------------------------------------------------------- */
/*  DubbingTable.tsx  –– 支持拖拽排序版                                         */
/* -------------------------------------------------------------------------- */
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import type { DubCase } from './DubbingHeader';
import DataImportManager, { ColumnDef } from '@/components/common/DataImport/DataImportManager';
import type { VoiceTone } from '@/lib/models/model';
import { exportAudioZip } from './utils/exportAudioZip';
import {
    createMergedAudio,
    revokeMergedAudio,
    MergedAudio,
} from '@/lib/utils/concatAudioPlayer';

/* —— dnd-kit —— */
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ---------- 行类型 ---------- */
interface CaseImportRow {
    id: string;
    text: string;
}

/* ---------- Props ---------- */
interface Props {
    cases: DubCase[];
    selectedIds: string[];
    remaining: number;
    batchConcurrency: number;
    voiceTones: VoiceTone[];

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

    exportTemplate: () => void;
    exportWithData: () => void;
    parseImportFile: (f: File) => Promise<CaseImportRow[]>;

    /* ★ 拖拽排序结束后，把排好序的完整数组返回父组件 */
    onReorder: (next: DubCase[]) => void;
}

/* ---------- 可拖拽行封装 ---------- */
function SortableRow({
                         caseItem,
                         children,
                     }: {
    caseItem: DubCase;
    children: React.ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: caseItem.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        ...(isDragging ? { opacity: 0.6 } : {}),
    };

    return (
        <tr
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={style}
            className={`hover:bg-gray-50 ${
                isDragging ? 'ring-2 ring-indigo-400' : ''
            }`}
        >
            {children}
        </tr>
    );
}

export default function DubbingTable(props: Props) {
    /** ------------ props 解构 ------------ */
    const {
        cases,
        selectedIds,
        remaining,
        batchConcurrency,
        voiceTones,
        onImport,
        onAddCase,
        onBatchGenerate,
        onConcurrencyChange,
        onSelectIds,
        onUpdateCase,
        onRemoveCase,
        onGenerateCase,
        globalVoiceId,
        globalResponseFormat,
        globalSpeed,
        globalVolume,
        globalSupplierId,
        exportTemplate,
        exportWithData,
        parseImportFile,
        onReorder,
    } = props;

    /* ───── Import 弹层显隐 ───── */
    const [showImport, setShowImport] = useState(false);

    /* ───── 连续试听相关 ───── */
    const [range, setRange] = useState({ start: 0, end: 0 });
    useEffect(() => {
        setRange(
            cases.length ? { start: 1, end: cases.length } : { start: 0, end: 0 },
        );
    }, [cases.length]);

    const [merged, setMerged] = useState<MergedAudio>();
    const [playing, setPlaying] = useState(false);
    const [curIdx, setCurIdx] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const startMergedPlay = async () => {
        const urls = cases
            .slice(Math.max(range.start - 1, 0), range.end)
            .map((c) => c.audioUrl)
            .filter(Boolean) as string[];

        if (!urls.length) {
            alert('区间内暂无音频');
            return;
        }

        if (merged) revokeMergedAudio(merged.blobUrl);
        setMerged(undefined);
        setCurIdx(0);

        try {
            const res = await createMergedAudio(urls);
            setMerged(res);
            setCurIdx(1);
            setPlaying(true);
        } catch (e) {
            console.error(e);
            alert('合并音频失败');
        }
    };
    const handleTogglePlay = () => {
        if (playing) {
            audioRef.current?.pause();
            setPlaying(false);
        } else {
            startMergedPlay();
        }
    };
    const onTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        if (!merged) return;
        const t = (e.target as HTMLAudioElement).currentTime;
        const i = merged.cumDurations.filter((d) => d <= t).length;
        setCurIdx(i + 1);
    };
    useEffect(
        () => () => {
            if (merged) revokeMergedAudio(merged.blobUrl);
        },
        [merged],
    );

    /* ───── 分页状态 ───── */
    const PAGE_OPTS = [10, 20, 50, 100, '自定义'] as const;
    type PageOpt = (typeof PAGE_OPTS)[number];
    const [pageSizeOpt, setPageSizeOpt] = useState<PageOpt>(10);
    const [customSize, setCustomSize] = useState(10);
    const pageSize = pageSizeOpt === '自定义' ? customSize || 10 : pageSizeOpt;
    const [currentPage, setCurrentPage] = useState(1);

    /* 总页数 */
    const totalPages = Math.max(1, Math.ceil(cases.length / pageSize));

    const pagedCases = useMemo(() => {
        const begin = (currentPage - 1) * pageSize;
        return cases.slice(begin, begin + pageSize);
    }, [cases, currentPage, pageSize]);

    /* 若数据/页数变动导致当前页超出，回退 */
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    /* ───── DataImportManager 配置 ───── */
    const columns: ColumnDef<CaseImportRow>[] = [
        { key: 'text', label: 'Case 文本', editable: true },
    ];
    const toggleRow = (id: string, checked: boolean) =>
        onSelectIds(
            checked
                ? [...selectedIds, id]
                : selectedIds.filter((x) => x !== id),
        );

    /* ───── dnd-kit 传感器 / 事件 ───── */
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 4 },
        }),
    );
    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;

        const oldIdx = cases.findIndex((c) => c.id === active.id);
        const newIdx = cases.findIndex((c) => c.id === over.id);
        if (oldIdx < 0 || newIdx < 0) return;

        onReorder(arrayMove(cases, oldIdx, newIdx));
    };

    /* ============== 渲染 ============== */
    return (
        <div className="flex-1 overflow-auto w-full">
            {/* ───────── 工具栏 ───────── */}
            <div className="border border-gray-200 rounded-md p-4 mb-4 bg-gray-50">
                <div className="flex items-center flex-wrap gap-2">
                    {/* 新增行 + Import */}
                    <button
                        onClick={onAddCase}
                        className="px-3 py-1 bg-gray-700 text-white rounded"
                    >
                        新增行
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowImport((v) => !v)}
                            className="p-2 hover:bg-gray-100 rounded"
                        >
                            <MoreVertical size={18} />
                        </button>
                        {showImport && (
                            <div className="absolute z-10 mt-1 bg-white border rounded shadow-lg p-3">
                                <DataImportManager<CaseImportRow>
                                    existingRows={cases.map((c) => ({ id: c.id, text: c.text }))}
                                    exportTemplate={exportTemplate}
                                    exportWithData={exportWithData}
                                    parseImportFile={parseImportFile}
                                    columns={columns}
                                    onImportConfirmed={(rows) => {
                                        onImport(rows);
                                        setShowImport(false);
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* | */}
                    <span className="mx-4 h-6 border-l border-gray-300" />

                    {/* 批量执行区 */}

                    <span className="text-sm text-gray-600">
            已选 {selectedIds.length}，剩余 {remaining}
          </span>
                    <div className="flex items-center">
                        <span className="mx-2">并发数</span>
                        <input
                            type="number"
                            min={1}
                            max={6}
                            value={batchConcurrency}
                            onChange={(e) => onConcurrencyChange(+e.target.value)}
                            className="w-16 border rounded p-1"
                        />
                    </div>
                    <button
                        onClick={onBatchGenerate}
                        className="px-3 py-1 bg-green-500 text-white rounded"
                    >
                        一键执行
                    </button>

                    {/* | */}
                    <span className="mx-4 h-6 border-l border-gray-300" />

                    {/* 合成试听 */}
                    <span className="text-sm text-gray-600">连续试听</span>
                    <input
                        type="number"
                        min={0}
                        max={cases.length}
                        value={range.start}
                        onChange={(e) => setRange((r) => ({ ...r, start: +e.target.value }))}
                        className="w-14 border rounded p-1 text-sm"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                        type="number"
                        min={0}
                        max={cases.length}
                        value={range.end}
                        onChange={(e) => setRange((r) => ({ ...r, end: +e.target.value }))}
                        className="w-14 border rounded p-1 text-sm"
                    />
                    <button
                        onClick={handleTogglePlay}
                        className={`px-3 py-1 rounded ${
                            playing ? 'bg-red-500' : 'bg-indigo-500'
                        } text-white`}
                    >
                        {playing ? '暂停' : '合成播放'}
                    </button>

                    {merged && (
                        <>
                            <audio
                                ref={audioRef}
                                src={merged.blobUrl}
                                controls
                                autoPlay
                                className="w-64 ml-2"
                                onTimeUpdate={onTimeUpdate}
                                onEnded={() => setPlaying(false)}
                            />
                            <span className="ml-2 text-sm text-gray-700">
                {playing ? `正在播放第 ${curIdx} 条` : ''}
              </span>
                        </>
                    )}

                    {/* 导出 */}
                    <button
                        onClick={() =>
                            exportAudioZip(
                                cases,
                                selectedIds
                                    .map((id) => cases.findIndex((c) => c.id === id))
                                    .filter((i) => i >= 0)
                                    .sort((a, b) => a - b),
                                voiceTones,
                                globalSupplierId,
                            )
                        }
                        className="ml-4 px-3 py-1 bg-blue-600 text-white rounded"
                    >
                        导出音频片段及字幕
                    </button>

                    {/* | */}
                    <span className="mx-4 h-6 border-l border-gray-300" />

                    {/* 分页器 */}
                    <div className="flex items-center flex-wrap gap-1 text-sm">
                        <span>每页</span>
                        <select
                            value={pageSizeOpt}
                            onChange={(e) => setPageSizeOpt(e.target.value as any)}
                            className="border rounded p-1"
                        >
                            {PAGE_OPTS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        {pageSizeOpt === '自定义' && (
                            <input
                                type="number"
                                min={1}
                                value={customSize}
                                onChange={(e) => setCustomSize(+e.target.value)}
                                className="w-16 border rounded p-1"
                            />
                        )}

                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-2 py-1 border rounded disabled:opacity-40"
                        >
                            上一页
                        </button>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-2 py-1 border rounded disabled:opacity-40"
                        >
                            下一页
                        </button>
                        <span className="ml-1">
              第 {currentPage} / {totalPages} 页
            </span>
                    </div>
                </div>
            </div>

            {/* ───────── 数据表（拖拽排序） ───────── */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={cases.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <table className="min-w-full table-auto border-collapse">
                        <colgroup>
                            <col style={{ width: '4%' }} />
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '28%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '8%' }} />
                        </colgroup>
                        <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2 text-center">#</th>
                            <th className="border p-2 text-center">
                                <input
                                    type="checkbox"
                                    checked={
                                        pagedCases.length > 0 &&
                                        pagedCases.every((c) => selectedIds.includes(c.id))
                                    }
                                    onChange={(e) => {
                                        const ids = pagedCases.map((c) => c.id);
                                        onSelectIds(
                                            e.target.checked
                                                ? Array.from(new Set([...selectedIds, ...ids]))
                                                : selectedIds.filter((id) => !ids.includes(id)),
                                        );
                                    }}
                                />
                            </th>
                            {[
                                'Case 文本',
                                '音色',
                                '格式',
                                '速率',
                                '音量',
                                '音频',
                                '建连',
                                '完成',
                                '操作',
                            ].map((t) => (
                                <th key={t} className="border p-2 text-center">
                                    {t}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {pagedCases.map((c, idx) => {
                            const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                            return (
                                <SortableRow key={c.id} caseItem={c}>
                                    {/* # */}
                                    <td className="border p-2 text-center">{globalIdx}</td>

                                    {/* 选择框 */}
                                    <td className="border p-2 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(c.id)}
                                            onChange={(e) =>
                                                toggleRow(c.id, e.target.checked)
                                            }
                                        />
                                    </td>

                                    {/* --------- 文本 --------- */}
                                    <td className="border p-2">
                      <textarea
                          rows={2}
                          className="w-full resize-y border rounded p-1"
                          value={c.text}
                          onChange={(e) =>
                              onUpdateCase(c.id, { text: e.target.value })
                          }
                      />
                                    </td>

                                    {/* 音色 */}
                                    <td className="border p-2 text-center">
                                        <select
                                            className="w-full border p-1 rounded"
                                            value={c.voiceId ?? globalVoiceId}
                                            onChange={(e) =>
                                                onUpdateCase(c.id, { voiceId: e.target.value })
                                            }
                                        >
                                            <option value="">--</option>
                                            {voiceTones
                                                .filter((v) => v.supplierId === globalSupplierId)
                                                .map((v) => (
                                                    <option key={v.id} value={v.toneId}>
                                                        {v.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </td>

                                    {/* 格式 */}
                                    <td className="border p-2 text-center">
                                        <select
                                            className="w-full border p-1 rounded"
                                            value={c.responseFormat ?? globalResponseFormat}
                                            onChange={(e) =>
                                                onUpdateCase(c.id, {
                                                    responseFormat: e.target.value,
                                                })
                                            }
                                        >
                                            {['mp3', 'wav', 'flac', 'opus'].map((f) => (
                                                <option key={f} value={f}>
                                                    {f}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    {/* 速率 */}
                                    <td className="border p-2 text-center">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.5"
                                            max="2.0"
                                            value={c.speed ?? globalSpeed}
                                            onChange={(e) =>
                                                onUpdateCase(c.id, { speed: +e.target.value })
                                            }
                                            className="w-full border p-1 rounded"
                                        />
                                    </td>

                                    {/* 音量 */}
                                    <td className="border p-2 text-center">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            max="2.0"
                                            value={c.volume ?? globalVolume}
                                            onChange={(e) =>
                                                onUpdateCase(c.id, { volume: +e.target.value })
                                            }
                                            className="w-full border p-1 rounded"
                                        />
                                    </td>

                                    {/* 音频 */}
                                    <td className="border p-2 text-center">
                                        {c.audioUrl ? (
                                            <audio
                                                controls
                                                src={c.audioUrl}
                                                className="w-full"
                                            />
                                        ) : (
                                            '—'
                                        )}
                                    </td>

                                    {/* 时间 */}
                                    <td className="border p-2 text-center">
                                        {c.connectAt
                                            ? new Date(c.connectAt).toLocaleTimeString('en-GB', {
                                                hour12: false,
                                            })
                                            : '—'}
                                    </td>
                                    <td className="border p-2 text-center">
                                        {c.doneAt
                                            ? new Date(c.doneAt).toLocaleTimeString('en-GB', {
                                                hour12: false,
                                            })
                                            : '—'}
                                    </td>

                                    {/* 操作 */}
                                    <td className="border p-2 flex justify-center space-x-1">
                                        <button
                                            onClick={() => onGenerateCase(c)}
                                            className="px-2 py-1 bg-green-500 text-white rounded"
                                        >
                                            生成
                                        </button>
                                        <button
                                            onClick={() => onRemoveCase(c.id)}
                                            className="px-2 py-1 bg-red-500 text-white rounded"
                                        >
                                            删除
                                        </button>
                                    </td>
                                </SortableRow>
                            );
                        })}
                        </tbody>
                    </table>
                </SortableContext>
            </DndContext>
        </div>
    );
}