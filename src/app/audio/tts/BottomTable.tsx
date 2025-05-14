// File: src/app/audio/tts/BottomTable.tsx
'use client';

import React, {
    FC,
    useMemo,
    useEffect
} from 'react';

/** ============ 类型 ============ */
export interface CaseItem {
    id: string;
    text: string;
    chunks: string[];
    intervals?: number[];
    sessionId?: string;
}

export interface BottomTableProps {
    cases:               CaseItem[];

    /** 选中行由父组件集中管理 */
    selectedIds:         string[];
    onSelectionChange:   (ids: string[]) => void;

    onRemoveCase:        (id: string)  => void;
    onRunCase:           (item: CaseItem) => void;
}

/** 一页 15 行 */
const ITEMS_PER_PAGE = 15;

/** ============ 单行 ============ */
const CaseRow: FC<{
    item:          CaseItem;
    index:         number;
    startIndex:    number;
    selected:      boolean;
    onToggle:      () => void;
    onRemove:      () => void;
    onRun:         () => void;
}> = ({
          item,
          index,
          startIndex,
          selected,
          onToggle,
          onRemove,
          onRun,
      }) => {

    /* -------- 音频流式播放（MediaSource） -------- */
    const srcUrl = useMemo(() => {
        if (!item.chunks?.length) return '';

        const ms  = new MediaSource();
        const url = URL.createObjectURL(ms);

        ms.addEventListener('sourceopen', () => {
            const sb = ms.addSourceBuffer('audio/mpeg');

            const push = (idx = 0) => {
                if (idx >= item.chunks.length) {
                    ms.endOfStream();
                    return;
                }
                const u8 = Uint8Array.from(
                    atob(item.chunks[idx]),
                    ch => ch.charCodeAt(0)
                );
                sb.appendBuffer(u8);
                sb.onupdateend = () => push(idx + 1);
            };

            push();
        });

        return url;
    }, [item.chunks]);

    useEffect(() => {
        return () => { if (srcUrl) URL.revokeObjectURL(srcUrl); };
    }, [srcUrl]);

    /* ----------- 渲染 ----------- */
    return (
        <tr className="hover:bg-gray-50">
            <td className="border p-2 text-center w-8">
                <input type="checkbox" checked={selected} onChange={onToggle} />
            </td>

            <td className="border p-2 text-center w-12">
                {startIndex + index + 1}
            </td>

            <td className="border p-2 w-1/5">
        <textarea
            value={item.text}
            readOnly
            className="w-full h-16 border rounded p-1 resize-none"
        />
            </td>

            {/* 固定为 Case 文本一半，约 10% 宽度 */}
            <td className="border p-2 text-center" style={{ width: '10%' }}>
                {srcUrl
                    ? <audio controls className="w-full" src={srcUrl} />
                    : <span className="text-gray-400">—</span>}
            </td>

            <td className="border p-2 text-center flex-1">
                {(item.intervals ?? []).join(', ')}
            </td>

            {/* 16 rem ≈ 256 px，刚好放下一个 32 字节 id */}
            <td className="border p-2 text-center" style={{ width: '16rem' }}>
                <code className="text-xs break-all">{item.sessionId ?? ''}</code>
            </td>

            <td className="border p-2 text-center space-x-2">
                <button
                    onClick={onRemove}
                    className="px-2 py-1 bg-red-400 text-white rounded"
                >删除</button>
                <button
                    onClick={onRun}
                    className="px-2 py-1 bg-blue-400 text-white rounded"
                >执行</button>
            </td>
        </tr>
    );
};

/** ============ 主表格组件 ============ */
const BottomTable: FC<BottomTableProps> = ({
                                               cases,
                                               selectedIds,
                                               onSelectionChange,
                                               onRemoveCase,
                                               onRunCase,
                                           }) => {
    const [page, setPage] = React.useState(1);
    const totalPages = Math.max(1, Math.ceil(cases.length / ITEMS_PER_PAGE));

    const pageStart = (page - 1) * ITEMS_PER_PAGE;
    const pageItems = cases.slice(pageStart, pageStart + ITEMS_PER_PAGE);

    const pageAllSelected = pageItems.every(i => selectedIds.includes(i.id));

    /* ----- 勾选 / 反选 ----- */
    const togglePageAll = () => {
        const next = new Set(selectedIds);
        if (pageAllSelected) pageItems.forEach(i => next.delete(i.id));
        else                 pageItems.forEach(i => next.add(i.id));
        onSelectionChange([...next]);
    };

    return (
        <div>
            {/* ================= 表格 ================= */}
            <table className="min-w-full table-auto border-collapse">
                <thead>
                <tr className="bg-gray-100">
                    <th className="w-8  border p-2 text-center">
                        <input
                            type="checkbox"
                            checked={pageAllSelected}
                            onChange={togglePageAll}
                        />
                    </th>
                    <th className="w-12 border p-2 text-center">序号</th>
                    <th className="w-1/5 border p-2">Case 文本</th>
                    <th className="border p-2 text-center">音频合并播放</th>
                    <th className="border p-2 text-center flex-1">时延 (ms)</th>
                    <th className="border p-2 text-center">Session ID</th>
                    <th className="border p-2 text-center">操作</th>
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
                        onRun={()    => onRunCase(row)}
                    />
                ))}
                </tbody>
            </table>

            {/* ================= 分页 ================= */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-4 space-x-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >上一页</button>

                    <span>第 {page} / {totalPages} 页</span>

                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >下一页</button>
                </div>
            )}
        </div>
    );
};

export default BottomTable;