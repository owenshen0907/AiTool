'use client';

import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

export interface PromptMetaEditorProps {
    /** 是否显示弹框 */
    isOpen: boolean;
    /** 初始标题 */
    title: string;
    /** 初始描述 */
    description: string;
    /** 初始标签列表 */
    tags: string[];
    /** 关闭弹框 */
    onClose: () => void;
    /** 保存元数据 */
    onSave: (data: { title: string; description: string; tags: string[] }) => Promise<void>;
}

export default function PromptMetaEditor({
                                             isOpen,
                                             title: initialTitle,
                                             description: initialDesc,
                                             tags: initialTags,
                                             onClose,
                                             onSave,
                                         }: PromptMetaEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [desc, setDesc] = useState(initialDesc);
    const [tagInput, setTagInput] = useState(initialTags.join(','));
    const [saving, setSaving] = useState(false);

    // 每次打开时重置为初始值
    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
            setDesc(initialDesc);
            setTagInput(initialTags.join(','));
        }
    }, [isOpen, initialTitle, initialDesc, initialTags]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        const newTags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
        try {
            await onSave({ title, description: desc, tags: newTags });
            onClose();
        } catch (e: any) {
            console.error('保存失败', e);
            alert('保存失败：' + e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* 半透明遮罩 */}
            <div
                className="fixed inset-0 bg-black bg-opacity-30"
                onClick={onClose}
            />
            {/* 弹框容器 */}
            <div className="fixed top-1/3 left-1/2 w-96 p-4 bg-white rounded shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-50">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-md font-semibold">编辑 Prompt 元数据</h3>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-3">
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="标题"
                    />
                    <textarea
                        className="w-full p-2 border rounded resize-none"
                        rows={3}
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        placeholder="描述"
                    />
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        placeholder="标签（逗号分隔）"
                    />
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                    <button
                        className="flex items-center px-4 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        onClick={onClose}
                        disabled={saving}
                    >
                        取消
                    </button>
                    <button
                        className="flex items-center px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <Save size={16} />
                        <span className="ml-1">{saving ? '保存中…' : '保存'}</span>
                    </button>
                </div>
            </div>
        </>
    );
}
