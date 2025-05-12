// File: app/prompt/case/content/CaseTable.tsx
'use client';

import React, { FC } from 'react';
import { Save, Trash2, PlayCircle, Search } from 'lucide-react';
import type { PromptCaseList } from '@/lib/models/prompt/promptCase';

export interface CaseRow extends PromptCaseList {
    selected?:   boolean;
    dirty?:      boolean;
    testResult?: string;
    passed?:     boolean;
    reason?:     string;
}

export interface CaseTableProps {
    rows:           CaseRow[];
    onChangeRow:    (row: CaseRow) => void;
    onSaveRow:      (row: CaseRow) => void;
    onDeleteRow:    (id: string) => void;
    onToggleSelect: (id: string) => void;
    onExecuteRow:   (id: string) => void;
    onViewDetail:   (row: CaseRow)   => void;
}

const CaseTable: FC<CaseTableProps> = ({
                                           rows,
                                           onChangeRow,
                                           onSaveRow,
                                           onDeleteRow,
                                           onToggleSelect,
                                           onExecuteRow,
                                           onViewDetail,
                                       }) => (
    <tbody>
    {rows.map((row, idx) => (
        <tr key={row.id} className="hover:bg-gray-50">
            {/* 复选框 */}
            <td className="border px-2 py-1 w-10 text-center">
                <input
                    type="checkbox"
                    checked={!!row.selected}
                    onChange={() => onToggleSelect(row.id)}
                    className="mx-auto"
                />
            </td>

            {/* 序号 */}
            <td className="border px-2 py-1 w-12 text-center">
                {idx + 1}
            </td>

            {/* Case 列（textarea 限制两行） */}
            <td className="border px-2 py-1 w-[30%]">
          <textarea
              value={row.caseText || ''}
              onChange={e =>
                  onChangeRow({ ...row, caseText: e.target.value, dirty: true })
              }
              rows={2}
              className="w-full border rounded px-1 py-1 resize-none overflow-hidden"
          />
            </td>

            {/* Ground Truth 列（textarea 限制两行） */}
            <td className="border px-2 py-1 w-[30%]">
          <textarea
              value={row.groundTruth || ''}
              onChange={e =>
                  onChangeRow({ ...row, groundTruth: e.target.value, dirty: true })
              }
              rows={2}
              className="w-full border rounded px-1 py-1 resize-none overflow-hidden"
          />
            </td>

            {/* 测试结果 列（只读，line-clamp-2） */}
            <td className="border px-2 py-1 w-[30%]">
                <p className="line-clamp-2">{row.testResult ?? '—'}</p>
            </td>

            {/* 是否通过 */}
            <td className="border px-2 py-1 w-20 text-center">
                {row.passed == null ? '—' : row.passed ? '✅' : '❌'}
            </td>

            {/* 原因 列（只读，line-clamp-2） */}
            <td className="border px-2 py-1 w-32">
                <p className="line-clamp-2">{row.reason ?? '—'}</p>
            </td>

            {/* 操作 */}
            <td className="border px-2 py-1 w-32 text-center space-x-1">
                <button
                    onClick={() => {
                        if (confirm('保存后将会覆盖原 case，确认要保存吗？')) {
                            onSaveRow(row);
                        }
                    }}
                    className="p-1 text-green-600"
                    title="保存"
                >
                    <Save size={16} strokeWidth={2} />
                </button>
                <button
                    onClick={() => onExecuteRow(row.id)}
                    className="p-1 text-blue-600"
                    title="执行"
                >
                    <PlayCircle size={16} strokeWidth={2} />
                </button>
                <button
                    onClick={() => onViewDetail(row)}
                    className="p-1 text-gray-600"
                    title="查看详情"
                >
                    <Search size={16} strokeWidth={2} />
                </button>
                <button
                    onClick={() => {
                        if (
                            confirm(
                                '删除后将从数据库移除，无法恢复，确认要删除吗？'
                            )
                        ) {
                            onDeleteRow(row.id);
                        }
                    }}
                    className="p-1 text-red-600"
                    title="删除"
                >
                    <Trash2 size={16} strokeWidth={2} />
                </button>
            </td>
        </tr>
    ))}
    </tbody>
);

export default CaseTable;