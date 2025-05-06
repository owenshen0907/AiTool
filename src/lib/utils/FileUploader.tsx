// src/lib/utils/FileUploader.tsx
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

    /**
     * 上传完成后回调
     * @param successes 上传成功的文件列表
     * @param failures  上传失败的错误列表
     */
    onUploaded: (successes: UploadedFile[], failures: Error[]) => void;
}

export default function FileUploader({
                                         accept,
                                         multiple = false,
                                         maxCount = 50,
                                         label = '点击或拖拽上传',
                                         onUploaded,
                                     }: FileUploaderProps) {
    // 单文件上传 + 重试
    const uploadOne = async (file: File, retries = 3): Promise<UploadedFile> => {
        let lastErr: any;
        for (let i = 1; i <= retries; i++) {
            try {
                const form = new FormData();
                form.append('file', file, file.name);
                const res = await fetch(`/api/upload?rand=${uuidv4()}`, {
                    method: 'POST',
                    credentials: 'include',
                    body: form,
                });
                if (!res.ok) throw new Error(await res.text());
                return await res.json();
            } catch (err) {
                lastErr = err;
            }
        }
        throw lastErr;
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const list = Array.from(e.target.files).slice(0, maxCount);

        const successes: UploadedFile[] = [];
        const failures: Error[] = [];

        for (const file of list) {
            try {
                const up = await uploadOne(file, 3);
                successes.push(up);
            } catch (err: any) {
                failures.push(new Error(`${file.name}: ${err.message || err}`));
            }
        }

        onUploaded(successes, failures);
        e.target.value = '';
    };

    return (
        <label className="block border-dashed border-2 border-gray-300 p-6 text-center cursor-pointer hover:border-gray-500">
            <span className="text-gray-600">{label}</span>
            <input
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleChange}
                className="hidden"
            />
        </label>
    );
}