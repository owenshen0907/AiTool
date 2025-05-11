// File: app/prompt/case/content/useImportExport.ts
import { parseCSV, parseExcel, generateCSV } from '@/lib/utils/fileUtils';
import type { CaseRow }                    from './CaseTable';

const MAX_IMPORT = 1000;

export function exportTemplateCsv() {
    const instruction = [['说明：请在此行编辑 Case 和 Ground Truth，然后保存上传']];
    const headers     = ['Case', 'Ground Truth'];
    generateCSV([...instruction, headers], [], 'template.csv');
}

export function exportWithDataCsv(rows: CaseRow[]) {
    const instruction = [['说明：请在此行编辑 Case 和 Ground Truth，然后保存上传']];
    const headers     = ['Case', 'Ground Truth'];
    const data        = rows.map(r => [r.caseText, r.groundTruth]);
    generateCSV([...instruction, headers, ...data], [], 'template_with_data.csv');
}

/**
 * 解析上传文件，只保留有 Case 值的行，
 * 并且一次最多导入 MAX_IMPORT 条。
 * 返回真正符合 CaseRow 接口的数组。
 */
export async function parseImportFile(
    file: File,
    contentId: string,
    existingCount: number
): Promise<CaseRow[]> {            // 改成 Promise<CaseRow[]>
    if (file.name.endsWith('.csv')) {
        const raw = await parseCSV(file, { header: false, skipEmptyLines: true }) as string[][];
        if (raw.length < 3) return [];

        const headerRow = raw[1].map(h => h.toString().trim().toLowerCase());
        const hasId     = headerRow.includes('id');

        const dataRows = raw
            .slice(2, 2 + MAX_IMPORT)
            .filter(r => {
                const idx = hasId ? 1 : 0;
                return r[idx]?.toString().trim() !== '';
            });

        return dataRows.map((cols, i) => ({
            id:            hasId ? cols[0]! : `new-${Date.now()}-${i}`,
            caseContentId: contentId,
            seq:           existingCount + i + 1,
            caseText:      cols[hasId ? 1 : 0] || '',
            groundTruth:   cols[hasId ? 2 : 1] || '',
            createdAt:     new Date().toISOString(),
            updatedAt:     new Date().toISOString(),
            selected:      false,
            dirty:         true,
        }));
    } else {
        const sheets   = await parseExcel(file);
        const name     = Object.keys(sheets)[0];
        const rawRows  = sheets[name] as Record<string, any>[];
        const dataRows = rawRows
            .filter(r => (r['Case'] ?? r['case_text'] ?? '').toString().trim() !== '')
            .slice(0, MAX_IMPORT);

        return dataRows.map((r, i) => ({
            id:            r.id || `new-${Date.now()}-${i}`,
            caseContentId: contentId,
            seq:           existingCount + i + 1,
            caseText:      r['Case'] ?? r['case_text'] ?? '',
            groundTruth:   r['Ground Truth'] ?? r['ground_truth'] ?? '',
            createdAt:     new Date().toISOString(),
            updatedAt:     new Date().toISOString(),
            selected:      false,
            dirty:         true,
        }));
    }
}