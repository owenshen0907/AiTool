// File: src/app/docs/japanese/ImageUploader.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import type { ImageEntry } from '../types';

interface Props {
    feature: string;
    formId: string;
    images: ImageEntry[];
    setImages: React.Dispatch<React.SetStateAction<ImageEntry[]>>;
}

export default function ImageUploader({
                                          feature,
                                          formId,
                                          images,
                                          setImages,
                                      }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_TOTAL = 50 * 1024 * 1024; // 50 MB

    // 添加本地文件 (去重 + 累加大小限制)
    const addLocalFiles = (files: File[]) => {
        if (!formId) {
            alert('请先选择或创建对应的业务内容，再上传图片');
            return;
        }
        let currentTotal = images.reduce((sum, e) => sum + (e.file ? e.file.size : 0), 0);

        const unique = files.filter(
            file => !images.some(e => e.file && e.file.name === file.name && e.file.size === file.size)
        );
        let skippedSize = 0;
        const accepted: File[] = [];

        for (const file of unique) {
            if (currentTotal + file.size <= MAX_TOTAL) {
                accepted.push(file);
                currentTotal += file.size;
            } else {
                skippedSize += file.size;
            }
        }
        if (skippedSize > 0) {
            alert(`有 ${(skippedSize / (1024 * 1024)).toFixed(1)} MB 的图片超出 50 MB 限制，已被忽略`);
        }
        if (accepted.length === 0) return;

        const newEntries = accepted.map(file => {
            const preview = URL.createObjectURL(file);
            const id = 'temp-' + Math.random().toString(36).slice(2, 9);
            return { id, file, url: preview, status: 'uploading' } as const;
        });
        setImages(prev => [...prev, ...newEntries]);
        newEntries.forEach(uploadImage);
    };

    // 上传单张图片
    const uploadImage = async (entry: ImageEntry) => {
        try {
            const form = new FormData();
            form.append('module', feature);
            form.append('form_id', formId);
            form.append('file0', entry.file!);
            const res = await fetch('/api/files', { method: 'POST', body: form });
            if (!res.ok) throw new Error('上传失败');
            const data = await res.json();
            const fileData = Array.isArray(data) ? data[0] : data;
            const remoteUrl = '/' + fileData.file_path;
            setImages(prev =>
                prev.map(e =>
                    e.id === entry.id
                        ? { ...e, url: remoteUrl, status: 'success', file_id: fileData.file_id }
                        : e
                )
            );
        } catch {
            setImages(prev =>
                prev.map(e =>
                    e.id === entry.id ? { ...e, status: 'error' } : e
                )
            );
        } finally {
            if (entry.file) URL.revokeObjectURL(entry.url);
        }
    };

    // 重试上传
    const retryUpload = (id: string) => {
        const entry = images.find(e => e.id === id);
        if (entry?.file) {
            setImages(prev =>
                prev.map(e =>
                    e.id === id ? { ...e, status: 'uploading' } : e
                )
            );
            uploadImage(entry);
        }
    };

    // 删除图片
    const handleDelete = async (entry: ImageEntry) => {
        // 本地临时文件直接移除
        if (!entry.file_id) {
            setImages(prev => prev.filter(e => e.id !== entry.id));
            return;
        }
        if (!window.confirm('确认删除这张图片？')) return;
        try {
            const res = await fetch('/api/files', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_id: entry.file_id }),
            });
            if (!res.ok) throw new Error(await res.text());
            setImages(prev => prev.filter(e => e.id !== entry.id));
        } catch (err) {
            console.error(err);
            alert('删除失败，请稍后重试');
        }
    };

    // 拖拽上传
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        addLocalFiles(files);
    };

    // 选择文件上传
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
        addLocalFiles(files);
        e.target.value = '';
    };

    // 支持粘贴上传
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (!e.clipboardData?.items) return;
            const files: File[] = [];
            for (const item of Array.from(e.clipboardData.items)) {
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) files.push(file);
                }
            }
            if (files.length > 0) {
                e.preventDefault();
                addLocalFiles(files);
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [addLocalFiles]);

    return (
        <div
            className="flex-1 border-2 border-dashed border-gray-300 rounded p-4 mb-4 overflow-auto relative cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
            />

            {images.length === 0 ? (
                <div className="h-full w-full text-center text-gray-500 flex flex-col items-center justify-center">
                    <p>点击或拖拽上传图片，或粘贴图片</p>
                    <p>最多 10 张，总大小 ≤ 50 MB</p>
                </div>
            ) : (
                <div className="relative">
                    <div className="grid grid-cols-3 gap-2">
                        {images.map(entry => (
                            <div key={entry.id} className="relative">
                                <img
                                    src={entry.url}
                                    alt=""
                                    className="w-full h-24 object-cover rounded"
                                />

                                {entry.status === 'uploading' && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-sm">
                                        上传中
                                    </div>
                                )}
                                {entry.status === 'error' && (
                                    <div
                                        onClick={e => { e.stopPropagation(); retryUpload(entry.id); }}
                                        className="absolute inset-0 bg-red-100 flex items-center justify-center text-red-600 text-sm cursor-pointer"
                                    >
                                        上传失败，点击重试
                                    </div>
                                )}

                                <button
                                    onClick={e => { e.stopPropagation(); handleDelete(entry); }}
                                    className="absolute top-1 right-1 bg-white rounded-full p-1 text-gray-700 hover:bg-gray-200"
                                    title="删除此图"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="bg-white bg-opacity-75 px-2 py-1 rounded text-gray-600">
                            点击或拖拽上传更多图片，或粘贴图片
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}