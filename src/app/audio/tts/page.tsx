// File: src/app/audio/tts/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import TableToolbar         from './TableToolbar';
import BottomTable, { CaseItem } from './BottomTable';
import DataImportManager, { ColumnDef } from '@/components/common/DataImport/DataImportManager';

import { generateCSV, parseExcel } from '@/lib/utils/fileUtils';
import type { Supplier }  from '@/lib/models/model';

/* ---------------- 基础类型 ---------------- */
interface CaseImportRow {
    id:   string;
    text: string;
    selected?: boolean;
}

/* ============ 主组件 ============ */
export default function TTSTestPage() {
    /* -------- 核心状态 -------- */
    const [cases, setCases]           = useState<CaseItem[]>([]);
    const [selectedIds, setSelected]  = useState<string[]>([]);
    const [testing, setTesting]       = useState(false);

    /* -------- 供应商 / 模型 / 并发 -------- */
    const [suppliers,   setSuppliers]   = useState<Supplier[]>([]);
    const [supplierId,  setSupplierId]  = useState('');
    const [model,       setModel]       = useState('');
    const [concurrency, setConcurrency] = useState(1);

    /* ========= 拉供应商列表 ========= */
    useEffect(() => {
        fetch('/api/suppliers')
            .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
            .then((data: Supplier[]) => {
                setSuppliers(data);
                if (!supplierId && data.length) setSupplierId(data[0].id);
            })
            .catch(console.error);
    }, [supplierId]);

    const currentSupplier = () =>
        suppliers.find(s => s.id === supplierId || s.wssUrl === supplierId);

    /* ========= 导入 / 导出 ========= */
    const exportTemplate = () => {
        generateCSV(
            [['说明：请在此行编辑 Case 文本，然后保存上传'], ['Case 文本']],
            [],
            'template.csv'
        );
    };

    const exportWithData = () => {
        generateCSV(
            [['说明：请在此行编辑 Case 文本，然后保存上传'], ['Case 文本'],
                ...cases.map(c => [c.text])],
            [],
            'template_with_data.csv'
        );
    };

    /** 仅支持 csv / xlsx 两种 **/
    const parseFile = async (f: File): Promise<CaseImportRow[]> => {
        if (f.name.toLowerCase().endsWith('.csv')) {
            const lines = (await f.text()).split(/\r?\n/).slice(2, 1002);
            return lines
                .map(t => t.trim())
                .filter(Boolean)
                .map((t, i) => ({ id:`${Date.now()}-${i}`, text:t }));
        }
        // xlsx
        const sheet = (await parseExcel(f))[Object.keys(await parseExcel(f))[0]];
        return sheet
            .filter((r: any) => (r['Case 文本'] ?? '').trim())
            .slice(0, 1000)
            .map((r: any, i: number) => ({ id:`${Date.now()}-${i}`, text:r['Case 文本'] }));
    };

    const columns: ColumnDef<CaseImportRow>[] = [
        { key:'text', label:'Case 文本', editable:true }
    ];

    const handleImport = (rows: CaseImportRow[]) => {
        setCases(prev => [
            ...prev,
            ...rows.map(r => ({
                id:r.id, text:r.text, chunks:[], intervals:[], sessionId:''
            }))
        ]);
    };

    /* ========= 单行 TTS ========= */
    const runCase = (row: CaseItem) => new Promise<void>((resolve, reject) => {
        const sup = currentSupplier();
        if (!sup?.wssUrl || !sup.apiKey) return reject('缺少 wssUrl 或 apiKey');

        // 清空历史
        setCases(prev => prev.map(c =>
            c.id === row.id ? { ...c, chunks:[], intervals:[], sessionId:'' } : c
        ));

        const base = sup.wssUrl.endsWith('/realtime/audio')
            ? sup.wssUrl
            : sup.wssUrl.replace(/\/$/, '') + '/realtime/audio';

        const url =
            `/api/tts-sse?target=${encodeURIComponent(base)}` +
            `&token=${encodeURIComponent(sup.apiKey)}` +
            `&model=${encodeURIComponent(model)}` +
            `&text=${encodeURIComponent(row.text)}`;

        const es = new EventSource(url);
        let last = performance.now();

        es.onmessage = e => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'tts.connection.done') {
                setCases(prev => prev.map(c =>
                    c.id === row.id ? { ...c, sessionId: msg.data.session_id } : c
                ));
            }
            if (msg.type === 'tts.response.audio.delta') {
                const now = performance.now();
                setCases(prev => prev.map(c =>
                    c.id === row.id
                        ? {
                            ...c,
                            chunks:    [...c.chunks, msg.data.audio],
                            intervals: [...(c.intervals ?? []), Math.round(now - last)],
                        }
                        : c
                ));
                last = now;
            }
        };

        es.addEventListener('end', () => { es.close(); resolve(); });
        es.onerror = err => { es.close(); reject(err); };
    });

    /* ========= 并发批量执行 ========= */
    const runMany = (rows: CaseItem[]) => {
        if (!rows.length) return;
        const queue   = [...rows];
        let running   = 0;
        setTesting(true);

        const next = () => {
            if (!queue.length && running === 0) { setTesting(false); return; }
            if (running >= concurrency || !queue.length) return;

            const row = queue.shift()!;
            running += 1;
            runCase(row)
                .catch(console.error)
                .finally(() => { running -= 1; next(); });
            next();
        };
        next();
    };

    /* ========= 行增删 ========= */
    const addCase = () => setCases(prev => [
        ...prev,
        { id:`row-${Date.now()}`, text:'', chunks:[], intervals:[], sessionId:'' }
    ]);

    const removeCase = (id: string) =>
        setCases(prev => prev.filter(c => c.id !== id));

    /* ========= 渲染 ========= */
    return (
        <div className="p-4 space-y-6">
            <TableToolbar
                onAddCase={addCase}
                supplierId={supplierId}
                onSupplierChange={setSupplierId}
                model={model}
                onModelChange={setModel}
                concurrency={concurrency}
                onConcurrencyChange={setConcurrency}
                testing={testing}
                /* 选中 → 批量执行；没有选中默认第一行 */
                onStartTest={() => {
                    const list = selectedIds.length
                        ? cases.filter(c => selectedIds.includes(c.id))
                        : cases.slice(0, 1);
                    runMany(list);
                }}
            />

            <DataImportManager<CaseImportRow>
                existingRows={cases.map(c => ({ id:c.id, text:c.text }))}
                exportTemplate={exportTemplate}
                exportWithData={exportWithData}
                parseImportFile={parseFile}
                columns={columns}
                onImportConfirmed={handleImport}
            />

            <BottomTable
                cases={cases}
                selectedIds={selectedIds}
                onSelectionChange={setSelected}
                onRemoveCase={removeCase}
                onRunCase={row => runMany([row])}   // 单行 = 并发 1
            />
        </div>
    );
}