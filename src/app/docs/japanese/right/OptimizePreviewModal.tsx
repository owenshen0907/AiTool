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
    /** 只是触发一次流式合并，模型结果会反馈到 previewContent */
    onMerge: (editedSuggestion: string) => void;
    /** 合并完成后，用户点击“替换”时，把 localContent 传回父组件覆盖正文 */
    onReplace: (finalContent: string) => void;
    onClose: () => void;
    onTitleChange: (title: string) => void;
    onTitleComplete: (title: string) => void;
    onContentChange: (editedContent: string) => void;
}

export default function OptimizePreviewModal({
                                                 suggestionTitle = '',
                                                 userSuggestion,
                                                 previewContent,
                                                 visible,
                                                 onReplace,
                                                 onMerge,
                                                 onClose,
                                                 onTitleChange,
                                                 onTitleComplete,
                                                 onContentChange,
                                             }: Props) {
    if (!visible) return null;

    const [title, setTitle] = useState(suggestionTitle);
    const [localContent, setLocalContent] = useState(previewContent);
    const [generating, setGenerating] = useState(false);

    // 每次打开或 previewContent 改变时，重置 localContent
    useEffect(() => {
        setLocalContent(previewContent);
    }, [previewContent]);

    // 首次打开且无 title 时自动生成
    useEffect(() => {
        if (!title && previewContent) generateTitle();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewContent]);

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

            onTitleComplete(acc);
        } catch (e) {
            console.error('生成标题失败：', e);
        } finally {
            setGenerating(false);
        }
    };

    const handleTitleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTitle(val);
        onTitleChange(val);
        onTitleComplete(val);
    };

    // 编辑器变化只更新本地，不触发合并或替换
    const handleContentChange = (val: string) => {
        setLocalContent(val);
        onContentChange(val);
    };

    // 点击合并：把本地内容传给 onMerge
    const handleMergeClick = () => {
        // 调用父组件的流式合并
        onMerge(localContent);
    };

    // 点击替换：把编辑后的本地内容传给 onReplace
    const handleReplaceClick = () => {
        // 把合并／编辑后的本地内容传给父组件
        onReplace(localContent);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(localContent);
            alert('已复制到剪贴板');
        } catch {
            alert('复制失败，请手动复制');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded p-6 w-full max-w-3xl max-h-[95vh] overflow-auto">
                {/* 标题 & 建议 */}
                <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <input
                            className="flex-1 border rounded px-2 py-1"
                            value={title}
                            onChange={handleTitleInput}
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

                {/* 正文预览/编辑 */}
                <div className="mb-4 flex-1">
                    <h4 className="font-medium mb-2">预览内容</h4>
                    <div className="border rounded p-2 h-64 overflow-auto">
                        <MarkdownEditor value={localContent} onChange={handleContentChange} />
                    </div>
                </div>

                {/* 操作 按钮 */}
                <div className="mt-4 flex justify-end space-x-2">
                    <button onClick={handleCopy} className="px-4 py-2 border rounded hover:bg-gray-100">
                        复制
                    </button>
                    <button onClick={handleMergeClick} className="px-4 py-2 border rounded hover:bg-gray-100">
                        合并
                    </button>
                    <button
                        onClick={handleReplaceClick}
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