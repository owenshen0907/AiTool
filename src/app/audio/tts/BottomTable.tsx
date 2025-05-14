// File: src/app/audio/tts/BottomTable.tsx
'use client';

import React, { FC, useMemo, useEffect } from 'react';

/* -------------------------------------------------------------------------- */
/*                                    类型                                    */
/* -------------------------------------------------------------------------- */
export interface CaseItem {
    id: string;
    text: string;
    chunks: string[];           // base64 片段
    intervals?: number[];       // 分片间隔
    sessionId?: string;
    connectAt?: number;         // 建连时间节点 (ms since epoch)
    doneAt?: number;            // 完成时间节点 (ms since epoch)
}

export interface BottomTableProps {
    cases: CaseItem[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onRemoveCase: (id: string) => void;
    onRunCase: (item: CaseItem) => void;
}

/** 每页行数 */
const ITEMS_PER_PAGE = 15;

/** HH:mm:ss.SSS 格式化 */
const fmt = (t?: number) =>
    t
        ? new Date(t).toLocaleTimeString(undefined, { hour12: false }) +
        '.' +
        String(t % 1000).padStart(3, '0')
        : '—';

/* -------------------------------------------------------------------------- */
/*                                  单行组件                                  */
/* -------------------------------------------------------------------------- */
const CaseRow: FC<{
    item: CaseItem;
    index: number;
    startIndex: number;
    selected: boolean;
    onToggle: () => void;
    onRemove: () => void;
    onRun: () => void;
}> = ({ item, index, startIndex, selected, onToggle, onRemove, onRun }) => {
    /* -------- 把所有 base64 片段拼成 Blob URL -------- */
    const audioUrl = useMemo(() => {
        if (!item.chunks?.length) return '';
        const parts = item.chunks.map((b64) => {
            const bin = atob(b64);
            const u8  = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
            return u8;
        });
        return URL.createObjectURL(new Blob(parts, { type: 'audio/mpeg' }));
    }, [item.chunks]);

    useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

    return (
        <tr className="hover:bg-gray-50">
            {/* 选择框 */}
            <td className="border p-2 text-center w-8">
                <input type="checkbox" checked={selected} onChange={onToggle} />
            </td>

            {/* 序号 */}
            <td className="border p-2 text-center w-12">
                {startIndex + index + 1}
            </td>

            {/* Case 文本 */}
            <td className="border p-2 w-1/5">
        <textarea
            value={item.text}
            readOnly
            className="w-full h-16 border rounded p-1 resize-none"
        />
            </td>

            {/* 播放器列 */}
            <td className="border p-2 text-center" style={{ width: '18rem' }}>
                {audioUrl ? (
                    <audio controls className="w-full" src={audioUrl} />
                ) : (
                    <audio controls className="w-full opacity-50" />
                )}
            </td>

            {/* 时延序列 */}
            <td className="border p-2 text-center flex-1 break-all whitespace-pre-wrap">
                {(item.intervals ?? []).join(', ')}
            </td>

            {/* 建连 & 完成（时间节点） */}
            <td className="border p-2 text-center w-28">{fmt(item.connectAt)}</td>
            <td className="border p-2 text-center w-28">{fmt(item.doneAt)}</td>

            {/* Session ID */}
            <td className="border p-2 text-center" style={{ width: '16rem' }}>
                <code className="text-xs break-all">{item.sessionId ?? ''}</code>
            </td>

            {/* 操作列 */}
            <td className="border p-2 text-center space-x-2" style={{ width: '160px' }}>
                <button
                    onClick={onRemove}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                >
                    删除
                </button>
                <button
                    onClick={onRun}
                    className="px-2 py-1 bg-blue-500 text-white rounded"
                >
                    执行
                </button>
            </td>
        </tr>
    );
};

/* -------------------------------------------------------------------------- */
/*                                主表格组件                                  */
/* -------------------------------------------------------------------------- */
const BottomTable: FC<BottomTableProps> = ({
                                               cases,
                                               selectedIds,
                                               onSelectionChange,
                                               onRemoveCase,
                                               onRunCase,
                                           }) => {
    /* 分页 */
    const [page, setPage] = React.useState(1);
    const totalPages = Math.max(1, Math.ceil(cases.length / ITEMS_PER_PAGE));

    const pageStart = (page - 1) * ITEMS_PER_PAGE;
    const pageItems = cases.slice(pageStart, pageStart + ITEMS_PER_PAGE);

    const pageAllSelected = pageItems.every((i) => selectedIds.includes(i.id));

    const togglePageAll = () => {
        const next = new Set(selectedIds);
        pageAllSelected
            ? pageItems.forEach((i) => next.delete(i.id))
            : pageItems.forEach((i) => next.add(i.id));
        onSelectionChange([...next]);
    };

    return (
        <div>
            {/* ---------------- 表格 ---------------- */}
            <table className="min-w-full table-auto border-collapse">
                <thead>
                <tr className="bg-gray-100">
                    <th className="w-8 border p-2 text-center">
                        <input type="checkbox" checked={pageAllSelected} onChange={togglePageAll} />
                    </th>
                    <th className="w-12 border p-2 text-center">序号</th>
                    <th className="w-1/5 border p-2">Case 文本</th>
                    <th className="border p-2 text-center">音频合并播放</th>
                    <th className="border p-2 text-center flex-1">时延&nbsp;(ms)</th>
                    <th className="border p-2 text-center w-28">建连&nbsp;Time</th>
                    <th className="border p-2 text-center w-28">完成&nbsp;Time</th>
                    <th className="border p-2 text-center">Session&nbsp;ID</th>
                    <th className="border p-2 text-center" style={{ width: '160px' }}>操作</th>
                </tr>
                </thead>

                <tbody>
                {pageItems.map((row, i) => (
                    <CaseRow
                        key={row.id}
                        item={row}
                        index={i}
                        startIndex={pageStart}
                        selected={selectedIds.includes(row.id)}
                        onToggle={() => {
                            const next = new Set(selectedIds);
                            next.has(row.id) ? next.delete(row.id) : next.add(row.id);
                            onSelectionChange([...next]);
                        }}
                        onRemove={() => onRemoveCase(row.id)}
                        onRun={() => onRunCase(row)}
                    />
                ))}
                </tbody>
            </table>

            {/* ---------------- 分页 ---------------- */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-4 space-x-4">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                        上一页
                    </button>

                    <span>
            第 {page} / {totalPages} 页
          </span>

                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                        下一页
                    </button>
                </div>
            )}
        </div>
    );
};

export default BottomTable;