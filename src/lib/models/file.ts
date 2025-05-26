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
    created_at: string;
    updated_at: string;
}