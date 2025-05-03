// src/lib/utils/fileUtils.ts
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Parse a CSV file or string into array of records.
 */
export function parseCSV(
    input: File | string,
    config: Papa.ParseConfig = { header: true, skipEmptyLines: true }
): Promise<any[]> {
    return new Promise((resolve, reject) => {
        if (typeof input === 'string') {
            const result = Papa.parse(input, config);
            if (result.errors.length) {
                reject(result.errors);
            } else {
                resolve(result.data as any[]);
            }
        } else {
            Papa.parse(input, {
                ...config,
                complete: (res) => {
                    if (res.errors.length) {
                        reject(res.errors);
                    } else {
                        resolve(res.data as any[]);
                    }
                },
                error: (err) => reject(err),
            });
        }
    });
}

/**
 * Generate and download a CSV file.
 */
export function generateCSV(
    data: object[] | any[][],
    headers: string[] = [],
    fileName: string = 'export.csv'
): void {
    const csv = Papa.unparse({ fields: headers, data });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, fileName);
}

/**
 * Parse an Excel (XLSX) file into JSON for specified sheets.
 */
export function parseExcel(
    input: File | ArrayBuffer | ArrayBufferView,
    sheetNames?: string[]
): Promise<Record<string, any[]>> {
    return new Promise((resolve, reject) => {
        // Called once we have raw ArrayBuffer
        function processBuffer(buffer: ArrayBuffer) {
            const workbook = XLSX.read(buffer, { type: 'array' });
            const names = sheetNames || workbook.SheetNames;
            const result: Record<string, any[]> = {};
            for (const name of names) {
                const sheet = workbook.Sheets[name];
                if (!sheet) continue;
                result[name] = XLSX.utils.sheet_to_json(sheet, {
                    defval: '', // empty cells as ''
                    range: 1,   // skip first row of instructions
                });
            }
            resolve(result);
        }

        if (input instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const buf = e.target?.result;
                if (buf instanceof ArrayBuffer) {
                    processBuffer(buf);
                } else {
                    reject(new Error('Failed to read file as ArrayBuffer'));
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(input);
        } else if (input instanceof ArrayBuffer) {
            processBuffer(input);
        } else if (ArrayBuffer.isView(input)) {
            processBuffer((input as ArrayBufferView).buffer as ArrayBuffer);
        } else {
            reject(new Error('Unsupported input type for parseExcel'));
        }
    });
}

/**
 * Generate and download an Excel (XLSX) file with one or multiple sheets.
 */
export function generateExcel(
    sheets: object[] | { name: string; data: object[] }[],
    fileName: string = 'export.xlsx'
): void {
    const workbook = XLSX.utils.book_new();

    // multiple sheets if objects have 'name'
    if (
        Array.isArray(sheets) &&
        sheets.length > 0 &&
        (sheets[0] as any).name !== undefined
    ) {
        (sheets as { name: string; data: object[] }[]).forEach((sheetInfo) => {
            const ws = XLSX.utils.json_to_sheet(sheetInfo.data);
            XLSX.utils.book_append_sheet(workbook, ws, sheetInfo.name);
        });
    } else {
        const ws = XLSX.utils.json_to_sheet(sheets as object[]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Sheet1');
    }

    // write and download
    const buf = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
}