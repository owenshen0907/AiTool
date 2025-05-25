// File: lib/repositories/fileRepository.ts
import { pool } from '@/lib/db/client';
import type { FileUpload } from '@/lib/models/file';

export const createFileUpload = async (
    user_id: string,
    module_name: string,
    file_category: string,
    mime_type: string,
    original_name: string,
    file_path: string,
    file_size: number
): Promise<FileUpload> => {
    const text = `
    INSERT INTO file_uploads(
      user_id, module_name, file_category, mime_type,
      original_name, file_path, file_size
    ) VALUES($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `;
    const values = [
        user_id,
        module_name,
        file_category,
        mime_type,
        original_name,
        file_path,
        file_size,
    ];
    const { rows } = await pool.query<FileUpload>(text, values);
    return rows[0];
};

export const getFileById = async (file_id: string): Promise<FileUpload | null> => {
    const { rows } = await pool.query<FileUpload>(
        'SELECT * FROM file_uploads WHERE file_id = $1',
        [file_id]
    );
    return rows[0] || null;
};

export const getFilesByUser = async (user_id: string): Promise<FileUpload[]> => {
    const { rows } = await pool.query<FileUpload>(
        'SELECT * FROM file_uploads WHERE user_id = $1 ORDER BY created_at DESC',
        [user_id]
    );
    return rows;
};

export const deleteFileUpload = async (file_id: string): Promise<void> => {
    await pool.query('DELETE FROM file_uploads WHERE file_id = $1', [file_id]);
};