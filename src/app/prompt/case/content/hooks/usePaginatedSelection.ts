// File: app/prompt/case/content/hooks/usePaginatedSelection.ts
'use client';

import { useState, useMemo, useCallback } from 'react';
import type { CaseRow } from '../CaseTable';

/**
 * Hook that provides pagination and selection toggles
 */
export function usePaginatedSelection(rows: CaseRow[], pageSize = 20) {
    const [page, setPage] = useState(1);
    const pageCount = useMemo(() => Math.ceil(rows.length / pageSize), [rows, pageSize]);

    const pagedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    const toggleSelectAll = useCallback(() => {
        const all = pagedRows.every(r => r.selected);
        return rows.map((r, idx) => {
            const gi = (page - 1) * pageSize + idx;
            if (gi < rows.length) return { ...rows[gi], selected: !all };
            return r;
        });
    }, [rows, pagedRows, page, pageSize]);

    const toggleSelect = useCallback((id: string) => {
        return rows.map(r => r.id === id ? { ...r, selected: !r.selected } : r);
    }, [rows]);

    return {
        page,
        setPage,
        pageCount,
        pagedRows,
        toggleSelectAll,
        toggleSelect,
    };
}