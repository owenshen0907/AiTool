// File: src/app/docs/japanese/right/OptimizePreviewModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import MarkdownEditor from '@/components/common/MarkdownEditor';
import { RefreshCw } from 'lucide-react';
import { parseSSEStream } from '@/lib/utils/sse';

interface Props {
    suggestionTitle?: string;
    userSuggestion: string;
    previewContent: string;
    visible: boolean;
    onClose: () => void;
    onReplace: () => void;
    onMerge: () => void;
    onTitleChange: (title: string) => void;
    onTitleComplete: (title: string) => void;
}

export default function OptimizePreviewModal({
                                                 suggestionTitle = '',
                                                 userSuggestion,
                                                 previewContent,
                                                 visible,
                                                 onClose,
                                                 onReplace,
                                                 onMerge,
                                                 onTitleChange,
                                                 onTitleComplete,
                                             }: Props) {
    if (!visible) return null;

    const [title, setTitle] = useState(suggestionTitle);
    const [generating, setGenerating] = useState(false);

    /* ---------------- 自动生成（首次打开且无标题） ---------------- */
    useEffect(() => {
        if (!title && previewContent) generateTitle();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewContent]);

    /* ---------------- 生成标题（自动/手动） ---------------- */
    const generateTitle = async () => {
        if (generating) return;
        setGenerating(true);
        setTitle('');
        onTitleChange('');

        let acc = '';
        try {
            const payload = {
                scene: 'TITLE_GEN',
                messages: [{ role: 'user', content: userSuggestion }],
            };
            const res = await fetch('/api/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok || !res.body) throw new Error('接口返回异常');

            await parseSSEStream(res.body, ({ type, text }) => {
                if (type === 'content') {
                    acc += text;
                    setTitle(acc);
                    onTitleChange(acc);
                }
            });

            // 生成完毕 -> 回写缓存
            onTitleComplete(acc);
        } catch (e) {
            console.error('生成标题失败：', e);
        } finally {
            setGenerating(false);
        }
    };

    /* ---------------- 手动输入标题 ---------------- */
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTitle(val);
        onTitleChange(val);
        // 用户手动编辑后立即更新缓存
        onTitleComplete(val);
    };

    /* ---------------- 复制正文 ---------------- */
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(previewContent);
            alert('已复制到剪贴板');
        } catch {
            alert('复制失败，请手动复制');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded p-6 w-full max-w-3xl max-h-[95vh] overflow-auto">
                {/* -------- 标题 & 建议 -------- */}
                <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <input
                            className="flex-1 border rounded px-2 py-1"
                            value={title}
                            onChange={handleInput}
                            placeholder="输入标题"
                        />
                        <button
                            onClick={generateTitle}
                            disabled={generating}
                            className="p-1 hover:bg-gray-100 rounded"
                            title={generating ? '生成中…' : '刷新标题'}
                        >
                            <RefreshCw size={20} className={generating ? 'opacity-50' : ''} />
                        </button>
                    </div>
                    <h3 className="text-lg font-semibold">优化建议</h3>
                    <p className="mt-2 text-gray-700 whitespace-pre-wrap">{userSuggestion}</p>
                </div>

                {/* -------- 正文预览 -------- */}
                <div className="mb-4 flex-1">
                    <h4 className="font-medium mb-2">预览内容</h4>
                    <div className="border rounded p-2 h-64 overflow-auto">
                        <MarkdownEditor value={previewContent} onChange={onMerge} />
                    </div>
                </div>

                {/* -------- 操作 -------- */}
                <div className="mt-4 flex justify-end space-x-2">
                    <button onClick={handleCopy} className="px-4 py-2 border rounded hover:bg-gray-100">
                        复制
                    </button>
                    <button onClick={onMerge} className="px-4 py-2 border rounded hover:bg-gray-100">
                        合并
                    </button>
                    <button
                        onClick={onReplace}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        替换
                    </button>
                    <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
}