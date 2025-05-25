// File: lib/services/fileService.ts
import path from 'path';
import fs from 'fs/promises';
import {
    createFileUpload,
    getFileById,
    getFilesByUser,
    deleteFileUpload,
} from '@/lib/repositories/fileRepository';
import type { FileUpload } from '@/lib/models/file';

export const uploadFilesWithDb = async (
    user_id: string,
    module_name: string,
    entries: Array<{
        original_name: string;
        mime_type: string;
        file_category: string;
        file_path: string;
        file_size: number;
    }>
): Promise<FileUpload[]> => {
    const results: FileUpload[] = [];
    for (const e of entries) {
        const record = await createFileUpload(
            user_id,
            module_name,
            e.file_category,
            e.mime_type,
            e.original_name,
            e.file_path,
            e.file_size
        );
        results.push(record);
    }
    return results;
};

export const listFilesByUser = getFilesByUser;

export const removeFile = async (file_id: string): Promise<void> => {
    const file = await getFileById(file_id);
    if (!file) throw new Error('File not found');
    // 删除物理文件
    const absPath = path.join(process.cwd(), 'public', file.file_path);
    await fs.unlink(absPath).catch(() => {
        // 忽略物理删除错误
    });
    // 删除数据库记录
    await deleteFileUpload(file_id);
};