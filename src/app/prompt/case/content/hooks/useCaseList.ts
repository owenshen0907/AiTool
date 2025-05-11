// File: app/prompt/case/content/hooks/useCaseList.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { promptCaseApi } from '@/lib/api/promptCaseList';
import type { CaseRow } from '../CaseTable';

/**
 * Hook that manages CRUD operations and dirty state for case rows
 */
export function useCaseList(contentId: string) {
    const [rows, setRows] = useState<CaseRow[]>([]);

    useEffect(() => {
        if (!contentId) return setRows([]);
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
        setRows(prev => prev.map(r => r.id === newRow.id ? newRow : r));
    }, []);

    const saveRow = useCallback(async (row: CaseRow) => {
        if (!row.caseText.trim() || !row.groundTruth.trim()) return;
        if (row.id.startsWith('new-')) {
            await promptCaseApi.create({
                caseContentId: row.caseContentId,
                seq: row.seq,
                caseText: row.caseText,
                groundTruth: row.groundTruth,
            } as any);
        } else {
            await promptCaseApi.update(row.id, {
                caseText: row.caseText,
                groundTruth: row.groundTruth,
            });
        }
        const list = await promptCaseApi.list(contentId);
        setRows(list.map(r => ({ ...r, selected: false, dirty: false })));
    }, [contentId]);

    const bulkSave = useCallback(async () => {
        const dirtyRows = rows.filter(r => r.dirty);
        for (const d of dirtyRows) {
            if (!d.caseText.trim() || !d.groundTruth.trim()) continue;
            if (d.id.startsWith('new-')) {
                await promptCaseApi.create({
                    caseContentId: d.caseContentId,
                    seq: d.seq,
                    caseText: d.caseText,
                    groundTruth: d.groundTruth,
                } as any);
            } else {
                await promptCaseApi.update(d.id, {
                    caseText: d.caseText,
                    groundTruth: d.groundTruth,
                });
            }
        }
        const list = await promptCaseApi.list(contentId);
        setRows(list.map(r => ({ ...r, selected: false, dirty: false })));
    }, [contentId, rows]);

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