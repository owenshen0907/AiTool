// File: lib/models/file.ts
export interface FileUpload {
    file_id: string;
    user_id: string;
    module_name: string;
    file_category: string;
    mime_type: string;
    original_name: string;
    file_path: string;
    file_size: number;
    form_id: string;
    origin: 'manual' | 'ai';
    created_at: string;
    updated_at: string;
}

export type ImageEntry = {
    id: string;
    file?: File;
    url: string;
    status: 'uploading' | 'success' | 'error';
    file_id?: string;
    origin?:   'manual' | 'ai';
};
