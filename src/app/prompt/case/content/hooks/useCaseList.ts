// File: app/prompt/case/content/hooks/useCaseList.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { promptCaseApi } from '@/lib/api/promptCaseList';
import type { CaseRow } from '../CaseTable';

export function useCaseList(contentId: string) {
    const [rows, setRows] = useState<CaseRow[]>([]);

    // 初始拉数据
    useEffect(() => {
        if (!contentId) {
            setRows([]);
            return;
        }
        promptCaseApi.list(contentId).then(list =>
            setRows(list.map(r => ({ ...r, selected: false, dirty: false })))
        );
    }, [contentId]);

    const addRow = useCallback(() => {
        setRows(prev => [
            {
                id: `new-${Date.now()}`,
                caseContentId: contentId,
                seq: prev.length + 1,
                caseText: '',
                groundTruth: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                selected: false,
                dirty: true,
            },
            ...prev,
        ]);
    }, [contentId]);

    const updateRow = useCallback((newRow: CaseRow) => {
        setRows(prev => prev.map(r => (r.id === newRow.id ? newRow : r)));
    }, []);

    // 抽取创建/更新单行的逻辑
    const persist = useCallback(async (r: CaseRow) => {
        const text = r.caseText?.trim();
        const truth = r.groundTruth?.trim();
        if (!text || !truth) return;

        if (r.id.startsWith('new-')) {
            await promptCaseApi.create({
                caseContentId: r.caseContentId,
                seq: r.seq,
                caseText: text,
                groundTruth: truth,
            } as any);
        } else {
            await promptCaseApi.update(r.id, {
                caseText: text,
                groundTruth: truth,
            });
        }
    }, []);

    const saveRow = useCallback(
        async (row: CaseRow) => {
            await persist(row);
            // 重新拉最新数据，并重置 selected/dirty
            const list = await promptCaseApi.list(contentId);
            setRows(list.map(r => ({ ...r, selected: false, dirty: false })));
        },
        [contentId, persist]
    );

    const bulkSave = useCallback(
        async () => {
            const dirtyRows = rows.filter(r => r.dirty);
            for (const d of dirtyRows) {
                await persist(d);
            }
            const list = await promptCaseApi.list(contentId);
            setRows(list.map(r => ({ ...r, selected: false, dirty: false })));
        },
        [contentId, rows, persist]
    );

    const deleteRow = useCallback(async (id: string) => {
        if (id.startsWith('new-')) {
            setRows(prev => prev.filter(r => r.id !== id));
        } else {
            await promptCaseApi.remove(id);
            setRows(prev => prev.filter(r => r.id !== id));
        }
    }, []);

    return {
        rows,
        addRow,
        updateRow,
        saveRow,
        bulkSave,
        deleteRow,
        setRows,
    };
}