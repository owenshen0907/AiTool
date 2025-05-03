// src/app/prompt/manage/PromptContent/Optimize/step1/CasesSetupPanel.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { GoodCaseItem, BadCaseItem } from '@/lib/models/prompt';
import {
    fetchGoodCases,
    createGoodCases,
    updateGoodCases,
    deleteGoodCases,
    fetchBadCases,
    createBadCases,
    updateBadCases,
    deleteBadCases,
} from '@/lib/api/prompt';
import { MoreVertical } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { parseExcel } from '@/lib/utils/fileUtils';
import ImportCasesModal from './ImportCasesModal';

export interface CasesSetupPanelProps {
    promptId: string;
    onLoadedGood: React.Dispatch<React.SetStateAction<GoodCaseItem[]>>;
    onLoadedBad: React.Dispatch<React.SetStateAction<BadCaseItem[]>>;
}

export default function CasesSetupPanel({
                                            promptId,
                                            onLoadedGood,
                                            onLoadedBad,
                                        }: CasesSetupPanelProps) {
    const [goodCases, setGoodCases] = useState<GoodCaseItem[]>([]);
    const [badCases, setBadCases] = useState<BadCaseItem[]>([]);
    const [deletedGoodIds, setDeletedGoodIds] = useState<string[]>([]);
    const [deletedBadIds, setDeletedBadIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const [menuOpen, setMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importGoodItems, setImportGoodItems] = useState<GoodCaseItem[]>([]);
    const [importBadItems, setImportBadItems] = useState<BadCaseItem[]>([]);

    useEffect(() => {
        loadCases();
    }, [promptId]);

    async function loadCases() {
        setLoading(true);
        try {
            const [goods, bads] = await Promise.all([
                fetchGoodCases(promptId),
                fetchBadCases(promptId),
            ]);
            setGoodCases(goods);
            setBadCases(bads);
            setDeletedGoodIds([]);
            setDeletedBadIds([]);
            onLoadedGood(goods);
            onLoadedBad(bads);
        } catch (err) {
            console.error('Failed to load cases', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setLoading(true);
        try {
            if (deletedGoodIds.length) await deleteGoodCases(deletedGoodIds);
            if (deletedBadIds.length) await deleteBadCases(deletedBadIds);

            const newGs = goodCases.filter(g => !g.id);
            const updGs = goodCases.filter(g => !!g.id);
            if (newGs.length) await createGoodCases(promptId, newGs);
            if (updGs.length) await updateGoodCases(updGs);

            const newBs = badCases.filter(b => !b.id);
            const updBs = badCases.filter(b => !!b.id);
            if (newBs.length) await createBadCases(promptId, newBs);
            if (updBs.length) await updateBadCases(updBs);

            await loadCases();
        } catch (err) {
            console.error('Failed to save cases', err);
        } finally {
            setLoading(false);
        }
    }

    function addGood() {
        setGoodCases(prev => [
            ...prev,
            {
                id: '',
                prompt_id: promptId,
                user_input: '',
                expected: '',
                images: [],
                audios: [],
                videos: [],
                position: prev.length,
                notes: '',
                created_at: '',
                updated_at: '',
            },
        ]);
    }

    function addBad() {
        setBadCases(prev => [
            ...prev,
            {
                id: '',
                prompt_id: promptId,
                user_input: '',
                bad_output: '',
                expected: '',
                images: [],
                audios: [],
                videos: [],
                position: prev.length,
                error_type: '',
                notes: '',
                created_at: '',
                updated_at: '',
            },
        ]);
    }

    function removeGood(idx: number) {
        const g = goodCases[idx];
        if (g.id) setDeletedGoodIds(ids => [...ids, g.id]);
        setGoodCases(prev => prev.filter((_, i) => i !== idx));
    }

    function removeBad(idx: number) {
        const b = badCases[idx];
        if (b.id) setDeletedBadIds(ids => [...ids, b.id]);
        setBadCases(prev => prev.filter((_, i) => i !== idx));
    }

    function exportTemplate() {
        const wb = XLSX.utils.book_new();
        const instr = [['说明：最多导入100条，按照表头字段填写']];
        const wsG = XLSX.utils.aoa_to_sheet([...instr, ['user_input', 'expected']]);
        XLSX.utils.book_append_sheet(wb, wsG, 'Good Cases');
        const wsB = XLSX.utils.aoa_to_sheet([
            ...instr,
            ['user_input', 'bad_output', 'expected'],
        ]);
        XLSX.utils.book_append_sheet(wb, wsB, 'Bad Cases');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout]), 'template.xlsx');
        setMenuOpen(false);
    }

    function exportWithData() {
        const wb = XLSX.utils.book_new();
        const instr = [['说明：包含当前用例数据']];
        function appendSheet(name: string, data: object[], headers: string[]) {
            const ws = XLSX.utils.aoa_to_sheet(instr);
            XLSX.utils.sheet_add_json(ws, data, { origin: instr.length, header: headers });
            XLSX.utils.book_append_sheet(wb, ws, name);
        }
        appendSheet('Good Cases', goodCases, ['user_input', 'expected']);
        appendSheet('Bad Cases', badCases, ['user_input', 'bad_output', 'expected']);
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout]), 'template_with_data.xlsx');
        setMenuOpen(false);
    }

    function startImport() {
        fileInputRef.current?.click();
        setMenuOpen(false);
    }

    async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const sheets = await parseExcel(file, ['Good Cases', 'Bad Cases']);
        const mapG = (rows: any[]): GoodCaseItem[] =>
            rows.slice(0, 100).map((r, i) => ({
                id: '',
                prompt_id: promptId,
                user_input: r.user_input || '',
                expected: r.expected || '',
                images: [],
                audios: [],
                videos: [],
                position: i,
                notes: '',
                created_at: '',
                updated_at: '',
            }));
        const mapB = (rows: any[]): BadCaseItem[] =>
            rows.slice(0, 100).map((r, i) => ({
                id: '',
                prompt_id: promptId,
                user_input: r.user_input || '',
                bad_output: r.bad_output || '',
                expected: r.expected || '',
                images: [],
                audios: [],
                videos: [],
                position: i,
                error_type: '',
                notes: '',
                created_at: '',
                updated_at: '',
            }));
        setImportGoodItems(mapG(sheets['Good Cases'] || []));
        setImportBadItems(mapB(sheets['Bad Cases'] || []));
        setImportModalOpen(true);
        e.target.value = '';
    }

    function handleImportConfirm(
        replace: boolean,
        selG: GoodCaseItem[],
        selB: BadCaseItem[]
    ) {
        if (replace) {
            setDeletedGoodIds(goodCases.filter(g => g.id).map(g => g.id));
            setDeletedBadIds(badCases.filter(b => b.id).map(b => b.id));
            setGoodCases(selG);
            setBadCases(selB);
        } else {
            setGoodCases(prev => [...prev, ...selG].slice(0, 100));
            setBadCases(prev => [...prev, ...selB].slice(0, 100));
        }
        setImportModalOpen(false);
    }

    return (
        <>
            <div className="space-y-4 relative">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">设置用例</h3>
                    <div className="relative">
                        <button onClick={() => setMenuOpen(o => !o)}>
                            <MoreVertical />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white shadow rounded border">
                                <button onClick={exportTemplate} className="block w-full text-left px-3 py-1 hover:bg-gray-100">
                                    导出模板
                                </button>
                                <button onClick={exportWithData} className="block w-full text-left px-3 py-1 hover:bg-gray-100">
                                    导出模板（含数据）
                                </button>
                                <button onClick={startImport} className="block w-full text-left px-3 py-1 hover:bg-gray-100">
                                    上传数据
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={onImport}
                />

                {loading && <div>加载中...</div>}

                <section>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">好例 (Good Cases)</h4>
                        <button onClick={addGood} className="text-blue-600">
                            + 添加
                        </button>
                    </div>
                    {goodCases.map((c, i) => (
                        <div key={i} className="flex space-x-2 mb-2">
                            <input
                                className="flex-1 border p-2 rounded"
                                placeholder="用户输入"
                                value={c.user_input}
                                onChange={e => {
                                    const v = e.target.value;
                                    setGoodCases(prev =>
                                        prev.map((g, idx) => (idx === i ? { ...g, user_input: v } : g))
                                    );
                                }}
                            />
                            <input
                                className="flex-1 border p-2 rounded"
                                placeholder="期望输出"
                                value={c.expected}
                                onChange={e => {
                                    const v = e.target.value;
                                    setGoodCases(prev =>
                                        prev.map((g, idx) => (idx === i ? { ...g, expected: v } : g))
                                    );
                                }}
                            />
                            <button onClick={() => removeGood(i)} className="text-red-600">
                                ×
                            </button>
                        </div>
                    ))}
                </section>

                <section>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">坏例 (Bad Cases)</h4>
                        <button onClick={addBad} className="text-blue-600">
                            + 添加
                        </button>
                    </div>
                    {badCases.map((c, i) => (
                        <div key={i} className="flex space-x-2 mb-2">
                            <input
                                className="flex-1 border p-2 rounded"
                                placeholder="用户输入"
                                value={c.user_input}
                                onChange={e => {
                                    const v = e.target.value;
                                    setBadCases(prev =>
                                        prev.map((b, idx) => (idx === i ? { ...b, user_input: v } : b))
                                    );
                                }}
                            />
                            <input
                                className="flex-1 border p-2 rounded"
                                placeholder="模型不佳输出"
                                value={c.bad_output}
                                onChange={e => {
                                    const v = e.target.value;
                                    setBadCases(prev =>
                                        prev.map((b, idx) => (idx === i ? { ...b, bad_output: v } : b))
                                    );
                                }}
                            />
                            <input
                                className="flex-1 border p-2 rounded"
                                placeholder="期望输出"
                                value={c.expected}
                                onChange={e => {
                                    const v = e.target.value;
                                    setBadCases(prev =>
                                        prev.map((b, idx) => (idx === i ? { ...b, expected: v } : b))
                                    );
                                }}
                            />
                            <button onClick={() => removeBad(i)} className="text-red-600">
                                ×
                            </button>
                        </div>
                    ))}
                </section>

                <div className="mt-4 flex justify-end">
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">
                        保存用例
                    </button>
                </div>
            </div>

            <ImportCasesModal
                open={importModalOpen}
                importGood={importGoodItems}
                importBad={importBadItems}
                onCancel={() => setImportModalOpen(false)}
                onConfirm={handleImportConfirm}
            />
        </>
    );
}