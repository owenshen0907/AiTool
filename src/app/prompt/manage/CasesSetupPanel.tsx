'use client';

import React, { useState, useEffect } from 'react';
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

interface CasesSetupPanelProps {
    promptId: string;
    goodCases: GoodCaseItem[];
    badCases: BadCaseItem[];
    onChangeGood: React.Dispatch<React.SetStateAction<GoodCaseItem[]>>;
    onChangeBad: React.Dispatch<React.SetStateAction<BadCaseItem[]>>;
}

export default function CasesSetupPanel({ promptId }: CasesSetupPanelProps) {
    const [goodCases, setGoodCases] = useState<GoodCaseItem[]>([]);
    const [badCases, setBadCases] = useState<BadCaseItem[]>([]);
    const [deletedGoodIds, setDeletedGoodIds] = useState<string[]>([]);
    const [deletedBadIds, setDeletedBadIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCases();
    }, [promptId]);

    const loadCases = async () => {
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
        } catch (err) {
            console.error('Failed to load cases', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Deletes
            if (deletedGoodIds.length) {
                await deleteGoodCases(deletedGoodIds);
            }
            if (deletedBadIds.length) {
                await deleteBadCases(deletedBadIds);
            }
            // Separating new vs existing
            const newGoods = goodCases.filter(g => !g.id);
            const updGoods = goodCases.filter(g => g.id);
            if (newGoods.length) await createGoodCases(promptId, newGoods);
            if (updGoods.length) await updateGoodCases(updGoods);

            const newBads = badCases.filter(b => !b.id);
            const updBads = badCases.filter(b => b.id);
            if (newBads.length) await createBadCases(promptId, newBads);
            if (updBads.length) await updateBadCases(updBads);

            // reload fresh
            await loadCases();
        } catch (err) {
            console.error('Failed to save cases', err);
        } finally {
            setLoading(false);
        }
    };

    const addGood = () => setGoodCases(prev => [...prev, { id: '', prompt_id: promptId, user_input: '', expected: '', images: [], audios: [], videos: [], position: 0, notes: '', created_at: '', updated_at: '' }]);
    const addBad = () => setBadCases(prev => [...prev, { id: '', prompt_id: promptId, user_input: '', bad_output: '', expected: '', images: [], audios: [], videos: [], position: 0, error_type: '', notes: '', created_at: '', updated_at: '' }]);

    const removeGood = (index: number) => {
        const g = goodCases[index];
        if (g.id) setDeletedGoodIds(ids => [...ids, g.id]);
        setGoodCases(cases => cases.filter((_, i) => i !== index));
    };
    const removeBad = (index: number) => {
        const b = badCases[index];
        if (b.id) setDeletedBadIds(ids => [...ids, b.id]);
        setBadCases(cases => cases.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">设置用例</h3>
            {loading && <div>加载中...</div>}
            <section>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">好例 (Good Cases)</h4>
                    <button onClick={addGood} className="text-blue-600">+ 添加</button>
                </div>
                {goodCases.map((c, i) => (
                    <div key={i} className="flex space-x-2 mb-2">
                        <input
                            className="flex-1 border p-2 rounded"
                            placeholder="用户输入"
                            value={c.user_input}
                            onChange={e => {
                                const v = e.target.value;
                                setGoodCases(gs => gs.map((g, idx) => idx === i ? { ...g, user_input: v } : g));
                            }}
                        />
                        <input
                            className="flex-1 border p-2 rounded"
                            placeholder="期望输出"
                            value={c.expected}
                            onChange={e => {
                                const v = e.target.value;
                                setGoodCases(gs => gs.map((g, idx) => idx === i ? { ...g, expected: v } : g));
                            }}
                        />
                        <button onClick={() => removeGood(i)} className="text-red-600">×</button>
                    </div>
                ))}
            </section>

            <section>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">坏例 (Bad Cases)</h4>
                    <button onClick={addBad} className="text-blue-600">+ 添加</button>
                </div>
                {badCases.map((c, i) => (
                    <div key={i} className="flex space-x-2 mb-2">
                        <input
                            className="flex-1 border p-2 rounded"
                            placeholder="用户输入"
                            value={c.user_input}
                            onChange={e => {
                                const v = e.target.value;
                                setBadCases(bs => bs.map((b, idx) => idx === i ? { ...b, user_input: v } : b));
                            }}
                        />
                        <input
                            className="flex-1 border p-2 rounded"
                            placeholder="模型不佳输出"
                            value={c.bad_output}
                            onChange={e => {
                                const v = e.target.value;
                                setBadCases(bs => bs.map((b, idx) => idx === i ? { ...b, bad_output: v } : b));
                            }}
                        />
                        <input
                            className="flex-1 border p-2 rounded"
                            placeholder="期望输出"
                            value={c.expected}
                            onChange={e => {
                                const v = e.target.value;
                                setBadCases(bs => bs.map((b, idx) => idx === i ? { ...b, expected: v } : b));
                            }}
                        />
                        <button onClick={() => removeBad(i)} className="text-red-600">×</button>
                    </div>
                ))}
            </section>

            <div className="mt-4 flex justify-end">
                <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">
                    保存用例
                </button>
            </div>
        </div>
    );
}
