// File: app/prompt/case/content/LeftBottomTable.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import TableToolbar from './TableToolbar';
import CaseTable from './CaseTable';
import type { CaseRow } from './CaseTable';
import { useCaseList } from './hooks/useCaseList';
import { useImportExport } from './hooks/useImportExport';
import { usePaginatedSelection } from './hooks/usePaginatedSelection';
import { useCaseTester } from './hooks/useCaseTester';
import FileImportInput from './FileImportInput';
import ImportPreviewModal from './ImportPreviewModal';
import DetailModal from './DetailModal';
import { generateExcel } from '@/lib/utils/fileUtils';
import type { Supplier, Model } from '@/lib/models/model';

interface Props {
    contentId: string;
    prompt: string;
}

export default function LeftBottomTable({ contentId, prompt }: Props) {
    const [concurrency, setConcurrency] = useState(1);
    const [testing, setTesting]     = useState(false);


    // 从 hook 里拿到操作 rows 的方法
    const { rows, addRow, updateRow, saveRow, bulkSave, deleteRow, setRows } =
        useCaseList(contentId);

    const { previewRows, handleFile, confirmImport, cancelImport, exportTemplate, exportWithData } =
        useImportExport(contentId, rows.length);

    const { page, setPage, pageCount, pagedRows, toggleSelectAll, toggleSelect } =
        usePaginatedSelection(rows);

    // 控制详情弹框
    const [detailRow, setDetailRow] = useState<typeof rows[0] | null>(null);

    // 供应商 & 模型
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [supplierId, setSupplierId] = useState('');
    const [testModel, setTestModel] = useState('');
    const { executeSingle, executeBatch } = useCaseTester(
        suppliers,
        supplierId,
        testModel,
        prompt,
        concurrency
    );

    // 拉取供应商
    useEffect(() => {
        fetch('/api/suppliers')
            .then(r => r.json())
            .then((data: Supplier[]) => {
                setSuppliers(data);
                const def = data.find(d => d.isDefault) || data[0];
                if (def) setSupplierId(def.id);
            });
    }, []);

    // 拉取模型
    useEffect(() => {
        if (!supplierId) return setModels([]);
        fetch(`/api/models?supplier_id=${supplierId}`)
            .then(r => r.json())
            .then((data: Model[]) => {
                setModels(data);
                const def = data.find(d => d.isDefault) || data[0];
                if (def) setTestModel(def.name);
            });
    }, [supplierId]);

    // 自动评估
// 复用 executeSingle 里的流式解析
    const evaluateSingle = useCallback(async (row: CaseRow) => {
        const sup = suppliers.find(s=>s.id===supplierId);
        if(!sup||!testModel) return;
        let buffer = '';
        try {
            const res = await fetch('/api/completions', {
                method:'POST',
                headers:{ 'Content-Type':'application/json' },
                body: JSON.stringify({
                    scene:'PROMPT_EVAL',
                    messages:[{
                        role:'user',
                        content:`Ground Truth：【${row.groundTruth}】\n测试结果：【${row.testResult}】`
                    }]
                })
            });
            const reader = res.body!.getReader();
            const dec    = new TextDecoder();
            let done=false;
            while(!done){
                const {value, done:dr} = await reader.read();
                done = dr;
                const chunk = dec.decode(value, {stream:true});
                chunk.split('\n').forEach(line=>{
                    if(!line.startsWith('data: ')) return;
                    const jsonStr = line.slice(6).trim();
                    if(jsonStr === '[DONE]') return;
                    try {
                        const pkg = JSON.parse(jsonStr);
                        const delta = pkg.choices?.[0]?.delta?.content;
                        if(delta) {
                            buffer += delta;
                        }
                    } catch{}
                });
            }
            // buffer 现在应该是一串完整的 JSON，如 {"result":"合格","reason":"..."}
            console.log('[AutoEval] raw buffer:', buffer);
            const obj = JSON.parse(buffer);
            const passed = obj.result === '合格';
            const reason = obj.reason;
            // 立刻回填这行
            updateRow({ ...row, passed, reason });
        } catch(e) {
            console.error('[AutoEval] 单行评估失败', row.seq, e);
        }
    }, [suppliers, supplierId, testModel, updateRow]);

    // 并发池执行所有选中行
    const handleAutoEvaluate = useCallback(() => {
        const toEval = rows.filter(r=>r.selected);
        if(!toEval.length) { alert('请先选中 Case'); return; }
        const pool: Promise<void>[] = [];
        const CONC = concurrency;
        let idx = 0;
        const runNext = async() => {
            if(idx >= toEval.length) return;
            const row = toEval[idx++];
            await evaluateSingle(row);
            await runNext();
        };
        for(let i=0;i<Math.min(CONC,toEval.length);i++){
            pool.push(runNext());
        }
    }, [rows, evaluateSingle, concurrency]);
    // ❶ 使用 generateExcel 来导出
    const handleExportTestResults = useCallback(() => {
        const data = rows.map(r => ({
            序号:        r.seq,
            Case:       r.caseText,
            'Ground Truth': r.groundTruth,
            '测试结果':    r.testResult,
            '是否通过':    r.passed ? '✅ 合格' : '❌ 不合格',
            原因:        r.reason ?? '',
        }));

        // 调用 generateExcel，传入一个带 name 的 sheet 数组
        generateExcel(
            [{ name: '测试结果', data }],
            `测试结果_${new Date().toISOString()}.xlsx`
        );
    }, [rows]);
    const handleStartTest = async () => {
        setTesting(true);
        try {
            await executeBatch(rows, updateRow);
        } finally {
            setTesting(false);
        }
    };

    return (

        <div className="p-4">
            <FileImportInput onFileParsed={handleFile} />
            {previewRows && (
                <ImportPreviewModal
                    visible
                    rows={previewRows}
                    onCancel={cancelImport}
                    onConfirm={sel => {
                        setRows(prev => [...confirmImport(sel), ...prev]);
                        setPage(1);
                    }}
                />
            )}
            {detailRow && (
                <DetailModal
                    visible
                    row={detailRow}
                    onClose={() => setDetailRow(null)}
                    onSave={(updated: Partial<CaseRow>) => {
                        // 把部分更新字段合并回原来的那一行
                        updateRow({ ...detailRow, ...updated });
                        setDetailRow(null);
                    }}
                />
            )}
            <table className="min-w-full border-collapse border border-gray-300 text-sm">
                <TableToolbar
                    onAddCase={addRow}
                    onBulkSave={bulkSave}
                    onExportTemplate={exportTemplate}
                    onExportTemplateWithData={() => exportWithData(rows)}
                    onUploadData={() => document.querySelector<HTMLInputElement>('input[type=file]')?.click()}
                    supplierId={supplierId}
                    onSupplierChange={setSupplierId}
                    model={testModel}
                    onModelChange={setTestModel}
                    concurrency={concurrency}
                    onConcurrencyChange={setConcurrency}
                    // onStartTest={() => executeBatch(rows, updateRow)}
                    onStartTest={handleStartTest}
                    onAutoEvaluate={handleAutoEvaluate}
                    onSaveTests={() => {}}
                    onExportTestResults={handleExportTestResults}
                    // testing={false}
                    testing={testing}
                />

                <thead>
                <tr>
                    <th className="border px-2 py-1 w-8">
                        <input
                            type="checkbox"
                            checked={pagedRows.every(r => r.selected)}
                            onChange={() => setRows(toggleSelectAll())}
                        />
                    </th>
                    <th className="border px-2 py-1 w-12">序号</th>
                    <th className="border px-2 py-1">Case</th>
                    <th className="border px-2 py-1">Ground Truth</th>
                    <th className="border px-2 py-1">测试结果</th>
                    <th className="border px-2 py-1">是否通过</th>
                    <th className="border px-2 py-1">原因</th>
                    <th className="border px-2 py-1 w-28">操作</th>
                </tr>
                </thead>

                <CaseTable
                    rows={pagedRows}
                    onChangeRow={updateRow}
                    onSaveRow={saveRow}
                    onDeleteRow={deleteRow}
                    onToggleSelect={id => setRows(toggleSelect(id))}
                    onExecuteRow={id => {
                        const row = rows.find(r => r.id === id);
                        if (row) executeSingle(row, updateRow);
                    }}
                    onViewDetail={row => setDetailRow(row)}
                />
            </table>

            <div className="mt-2 flex justify-center items-center space-x-2">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                >
                    上一页
                </button>
                <span>
          第 {page} / {pageCount} 页
        </span>
                <button
                    onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                    disabled={page === pageCount}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                >
                    下一页
                </button>
            </div>
        </div>
    );
}