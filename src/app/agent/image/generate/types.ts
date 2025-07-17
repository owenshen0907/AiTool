// File: src/app/docs/japanese/types.ts
export type ImageEntry = {
    id: string;
    file?: File;
    url: string;
    status: 'uploading' | 'success' | 'error';
    file_id?: string;
};