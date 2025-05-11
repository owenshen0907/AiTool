// File: app/prompt/case/content/hooks/useImportExport.ts
'use client';

import { parseImportFile as _parseImportFile, exportTemplateCsv, exportWithDataCsv } from '../useImportExport';
import type { CaseRow } from '../CaseTable';
import { useState, useCallback } from 'react';

/**
 * Hook for handling file import preview and CSV exports
 */
export function useImportExport(contentId: string, existingCount: number) {
    const [previewRows, setPreviewRows] = useState<CaseRow[] | null>(null);

    const handleFile = useCallback(async (file: File) => {
        const imported = await _parseImportFile(file, contentId, existingCount);
        setPreviewRows(imported.map(r => ({ ...r, selected: true })));
    }, [contentId, existingCount]);

    const confirmImport = useCallback((selected: CaseRow[]) => {
        setPreviewRows(null);
        return selected;
    }, []);

    const cancelImport = useCallback(() => {
        setPreviewRows(null);
    }, []);

    return {
        previewRows,
        handleFile,
        confirmImport,
        cancelImport,
        exportTemplate: exportTemplateCsv,
        exportWithData: exportWithDataCsv,
    };
}