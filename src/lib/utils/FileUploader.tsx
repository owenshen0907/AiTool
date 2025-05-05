// File: src/lib/utils/FileUploader.tsx
'use client';

import React from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
    /** 服务器返回的相对路径，如 upload/uid/img/20250506/a.jpg */
    path: string;
    /** 服务器返回的可访问 URL（含域名或根斜杠） */
    url: string;
}

interface FileUploaderProps {
    /** input accept，例："image/*" "video/*" "audio/mp3" */
    accept: string;
    /** 是否允许多选 */
    multiple?: boolean;
    /** 最多多少个文件（多选时生效） */
    maxCount?: number;
    /** 上传按钮内部文案 */
    label?: React.ReactNode;
    /** 成功后把 *相对路径数组* 与 *URL 数组* 回调出去 */
    onUploaded: (files: UploadedFile[]) => void;
}

export default function FileUploader({
                                         accept,
                                         multiple = false,
                                         maxCount = 50,
                                         label = '点击或拖拽上传',
                                         onUploaded,
                                     }: FileUploaderProps) {
    /** 发送到 /api/upload */
    const doUpload = async (file: File): Promise<UploadedFile> => {
        const form = new FormData();
        form.append('file', file, file.name);

        const res = await fetch(`/api/upload?rand=${uuidv4()}`, {
            method: 'POST',
            body: form,
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    };

    const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const list = Array.from(e.target.files).slice(0, maxCount);

        try {
            const uploaded = await Promise.all(list.map(doUpload));
            onUploaded(uploaded);
        } catch (err) {
            /* eslint-disable no-alert */
            console.error('upload failed:', err);
            alert('文件上传失败，请重试');
        } finally {
            e.target.value = ''; // 允许再次选同文件
        }
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