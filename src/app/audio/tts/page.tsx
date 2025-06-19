// File: src/app/audio/tts/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import TableToolbar from './TableToolbar';
import BottomTable, { CaseItem, BottomTableProps } from './BottomTable';
import DataImportManager, { ColumnDef } from '@/components/common/DataImport/DataImportManager';

import {
    generateCSV,
    parseExcel,
    generateExcel,
} from '@/lib/utils/fileUtils';
import type { Supplier } from '@/lib/models/model';

/* ---------------- 导入模板行类型 ---------------- */
interface CaseImportRow { id: string; text: string }

/* ---------------- 主组件 ---------------- */
export default function TTSTestPage() {
    /* 核心状态 */
    const [cases, setCases]           = useState<CaseItem[]>([]);
    const [selectedIds, setSelected]  = useState<string[]>([]);
    const [testing, setTesting]       = useState(false);

    /* 供应商 / 模型 / 并发 */
    const [suppliers, setSuppliers]   = useState<Supplier[]>([]);
    const [supplierId, setSupplierId] = useState('');
    const [model, setModel]           = useState('');
    const [concurrency, setConcurrency] = useState(1);

    /* -------- 供应商列表 -------- */
    useEffect(() => {
        fetch('/api/suppliers')
            .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
            .then((data: Supplier[]) => {
                setSuppliers(data);
                if (!supplierId && data.length) {
                    setSupplierId(data.find(s => s.isDefault)?.id || data[0].id);
                }
            })
            .catch(console.error);
    }, []);

    const currentSupplier = () =>
        suppliers.find(s => s.id === supplierId || s.wssUrl === supplierId);

    /* ---------------- 导出 / 导入 CSV 模板 ---------------- */
    const exportTemplate = () =>
        generateCSV(
            [['说明：请在此行编辑 Case 文本，然后保存上传'], ['Case 文本']],
            [],
            'template.csv'
        );

    const exportWithData = () =>
        generateCSV(
            [
                ['说明：请在此行编辑 Case 文本，然后保存上传'],
                ['Case 文本'],
                ...cases.map(c => [c.text]),
            ],
            [],
            'template_with_data.csv'
        );

    const parseFile = async (f: File): Promise<CaseImportRow[]> => {
        if (f.name.toLowerCase().endsWith('.csv')) {
            const lines = (await f.text()).split(/\r?\n/).slice(2, 1002);
            return lines
                .map(t => t.trim())
                .filter(Boolean)
                .map((t, i) => ({ id: `${Date.now()}-${i}`, text: t }));
        }
        const sheets = await parseExcel(f);
        const first  = sheets[Object.keys(sheets)[0]];
        return first
            .filter((r: any) => (r['Case 文本'] ?? '').trim())
            .slice(0, 1000)
            .map((r: any, i: number) => ({ id: `${Date.now()}-${i}`, text: r['Case 文本'].trim() }));
    };

    const columns: ColumnDef<CaseImportRow>[] = [
        { key: 'text', label: 'Case 文本', editable: true },
    ];

    const handleImport = (rows: CaseImportRow[]) =>
        setCases(prev => [
            ...prev,
            ...rows.map(r => ({
                id:         r.id,
                text:       r.text,
                chunks:     [],
                intervals:  [],
                sessionId:  '',
                connectAt:  undefined,
                doneAt:     undefined,
            })),
        ]);

    /* ---------------- 导出结果 ---------------- */
    function exportResults() {
        generateExcel(
            cases.map(c => ({
                Text:        c.text,
                Intervals:   (c.intervals ?? []).join(', '),
                ConnectTime: c.connectAt ? new Date(c.connectAt).toISOString() : '',
                DoneTime:    c.doneAt    ? new Date(c.doneAt).toISOString()    : '',
                SessionId:   c.sessionId,
            })),
            `tts_results_${Date.now()}.xlsx`
        );
    }

    /* ------------------------------------------------------------------ */
    /*                       单条 TTS（SSE + WS）                         */
    /* ------------------------------------------------------------------ */
    function runCase(row: CaseItem) {
        return new Promise<void>((resolve, reject) => {
            const sup = currentSupplier();
            if (!sup?.wssUrl || !sup.apiKey) return reject('缺少 wssUrl 或 apiKey');

            /* 清空行状态 */
            setCases(p => p.map(c =>
                c.id === row.id
                    ? { ...c, chunks: [], intervals: [], connectAt: undefined, doneAt: undefined, sessionId: '' }
                    : c
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

            /* 原始 JSON 透传（sessionId + 音频片段） */
            es.onmessage = (e) => {
                const msg = JSON.parse(e.data);
                if (msg.type === 'tts.connection.done') {
                    setCases(p => p.map(c =>
                        c.id === row.id ? { ...c, sessionId: msg.data.session_id } : c
                    ));
                }
                if (msg.type === 'tts.response.audio.delta') {
                    setCases(p => p.map(c =>
                        c.id === row.id ? { ...c, chunks: [...c.chunks, msg.data.audio] } : c
                    ));
                }
            };

            /* 自定义事件 */
            es.addEventListener('connect', ev => {
                setCases(p => p.map(c =>
                    c.id === row.id ? { ...c, connectAt: Number(ev.data) } : c
                ));
            });

            es.addEventListener('interval', ev => {
                const diff = Number(ev.data);
                setCases(p => p.map(c =>
                    c.id === row.id ? { ...c, intervals: [...(c.intervals ?? []), diff] } : c
                ));
            });

            es.addEventListener('done', ev => {
                setCases(p => p.map(c =>
                    c.id === row.id ? { ...c, doneAt: Number(ev.data) } : c
                ));
            });

            /* 结束 / 错误 */
            const finish = () => { es.close(); resolve(); };
            es.addEventListener('end', finish);
            es.addEventListener('error', err => { es.close(); reject(err); });
        });
    }

    /* ---------------- 批量并发执行 ---------------- */
    function runMany(rows: CaseItem[]) {
        if (!rows.length) return;
        const limit = Math.max(1, concurrency);
        let idx = 0, running = 0;
        setTesting(true);

        const launch = () => {
            if (idx >= rows.length && running === 0) { setTesting(false); return; }
            while (running < limit && idx < rows.length) {
                const row = rows[idx++];
                running += 1;
                runCase(row)
                    .catch(console.error)
                    .finally(() => { running -= 1; launch(); });
            }
        };
        launch();
    }

    /* ---------------- 行操作 ---------------- */
    const addCase = () =>
        setCases(p => [...p, {
            id: `row-${Date.now()}`,
            text: '',
            chunks: [],
            intervals: [],
            sessionId: '',
            connectAt: undefined,
            doneAt: undefined,
        }]);

    const removeCase = (id: string) =>
        setCases(p => p.filter(c => c.id !== id));

    const handleUpdateCaseText = (id: string, newText: string) =>
        setCases(p =>
            p.map(c =>
                c.id === id ? { ...c, text: newText } : c
            )
        );

    /* ---------------- 渲染 ---------------- */
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
                onStartTest={() => {
                    const list = selectedIds.length
                        ? cases.filter(c => selectedIds.includes(c.id))
                        : cases.slice(0, 1);
                    runMany(list);
                }}
                onExportResults={exportResults}
            />

            <DataImportManager<CaseImportRow>
                existingRows={cases.map(c => ({ id: c.id, text: c.text }))}
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
                onRunCase={row => runMany([row])}
                onUpdateCaseText={handleUpdateCaseText}
            />
        </div>
    );
}