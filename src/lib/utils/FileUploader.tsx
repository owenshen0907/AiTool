// File: src/lib/utils/FileUploader.tsx
'use client';

import React from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
    path: string;
    url: string;
}

interface FileUploaderProps {
    accept: string;
    multiple?: boolean;
    maxCount?: number;
    label?: React.ReactNode;
    onUploaded: (files: UploadedFile[], errors: Error[]) => void;
}

export default function FileUploader({
                                         accept,
                                         multiple = false,
                                         maxCount = 50,
                                         label = '点击或拖拽上传',
                                         onUploaded,
                                     }: FileUploaderProps) {

    // 真正的上传函数
    const doUpload = async (file: File): Promise<UploadedFile> => {
        const form = new FormData();
        form.append('file', file, file.name);

        const res = await fetch(`/api/upload?rand=${uuidv4()}`, {
            method: 'POST',
            body: form,
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`${file.name} 上传失败：${text}`);
        }
        return res.json();
    };

    // 带重试的上传
    const uploadWithRetry = async (file: File, retries = 3): Promise<UploadedFile> => {
        let lastErr: any;
        for (let i = 0; i < retries; i++) {
            try {
                return await doUpload(file);
            } catch (err) {
                lastErr = err;
            }
        }
        throw lastErr;
    };

    const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const list = Array.from(e.target.files).slice(0, maxCount);

        // 并行跑所有上传（每个带重试），收集结果
        const settles = await Promise.allSettled(list.map(f => uploadWithRetry(f)));

        const successes: UploadedFile[] = [];
        const errors: Error[] = [];

        settles.forEach(r => {
            if (r.status === 'fulfilled') {
                successes.push(r.value);
            } else {
                errors.push(r.reason instanceof Error ? r.reason : new Error(String(r.reason)));
            }
        });

        onUploaded(successes, errors);
        e.target.value = ''; // 允许再次选同文件
    };

    return (
        <label className="block border-dashed border-2 border-gray-300 p-6 text-center cursor-pointer hover:border-gray-500">
            <span className="text-gray-600">{label}</span>
            <input
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handle}
                className="hidden"
            />
        </label>
    );
}