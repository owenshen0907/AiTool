// File: src/app/docs/japanese/JapaneseContentLeft.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { ContentItem } from '@/lib/models/content';
import MarkdownEditor from '@/components/common/MarkdownEditor';
import { Save, Printer, RefreshCw, MoreVertical } from 'lucide-react';
import { marked } from 'marked';

interface Props {
    selectedItem: ContentItem | null;
    body: string;                         // 父组件传进来的当前正文
    onChangeBody: (body: string) => void; // 编辑器里内容变化时回调
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => void;
}

export default function JapaneseContentLeft({
                                                selectedItem,
                                                body,
                                                onChangeBody,
                                                onUpdateItem,
                                            }: Props) {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [orig, setOrig] = useState({ title: '', summary: '', body: '' });
    const [editHeader, setEditHeader] = useState(false);

    // 选中项切换：重置 header 和 orig
    useEffect(() => {
        if (selectedItem) {
            const t = selectedItem.title ?? '';
            const s = selectedItem.summary ?? '';
            const b = selectedItem.body ?? '';
            setTitle(t);
            setSummary(s);
            setOrig({ title: t, summary: s, body: b });
            setEditHeader(false);
            // 同步父组件的 bodyState
            onChangeBody(b);
        }
    }, [selectedItem?.id]);

    if (!selectedItem) {
        return (
            <div className="w-2/3 flex items-center justify-center">
                <span className="text-gray-500">请选择一个文档</span>
            </div>
        );
    }

    const dirtyHeader =
        title !== orig.title || summary !== orig.summary;
    const dirtyBody = body !== orig.body;
    const dirty = dirtyHeader || dirtyBody;

    const handleRestore = () => {
        if (!dirty) return;
        if (confirm('确认要还原所有未保存的修改吗？')) {
            setTitle(orig.title);
            setSummary(orig.summary);
            onChangeBody(orig.body);
            setEditHeader(false);
        }
    };

    const handleSave = () => {
        if (!dirty) return;
        if (!confirm('确认要保存所有修改吗？')) return;
        onUpdateItem(selectedItem, {
            title,
            summary,
            body, // body 已经同步到父组件
        });
        setOrig({ title, summary, body });
        setEditHeader(false);
    };

    const handlePrint = () => {
        const win = window.open('', '_blank');
        if (!win) return;
        const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
      <style>
        body{font-family:Arial;padding:20px;}
        h1{font-size:24px;margin-bottom:10px;}
        p.summary{font-size:16px;color:#555;margin-bottom:20px;}
        table{width:100%;border-collapse:collapse;margin-bottom:20px;}
        table,th,td{border:1px solid #333;}th,td{padding:8px;text-align:left;}
        .content img{max-width:100%;}pre,code{background:#f6f8fa;padding:6px;}
      </style>
      </head><body>
      <h1>${title}</h1>
      <p class="summary">${summary}</p>
      <div class="content">${marked(body)}</div>
      </body></html>`;
        win.document.write(html);
        win.document.close();
        win.print();
        win.close();
    };

    return (
        <div className="w-2/3 flex flex-col h-screen p-4">
            {/* Header 编辑区 */}
            <div className="mb-4 flex items-start justify-between">
                <div className="flex-1 space-y-1">
                    {editHeader ? (
                        <>
                            <input
                                className="w-full border rounded p-2"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="输入标题"
                            />
                            <textarea
                                className="w-full border rounded p-2"
                                rows={2}
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="输入摘要"
                            />
                        </>
                    ) : (
                        <>
                            <h1
                                className="text-2xl font-semibold cursor-pointer"
                                onClick={() => setEditHeader(true)}
                            >
                                {title || '（无标题）'}
                            </h1>
                            <p
                                className="text-gray-600 cursor-pointer"
                                onClick={() => setEditHeader(true)}
                            >
                                {summary || '（无摘要）'}
                            </p>
                        </>
                    )}
                </div>

                <div className="flex flex-col items-center ml-4 space-y-2">
                    <button
                        onClick={handleRestore}
                        disabled={!dirty}
                        className={`p-2 rounded ${
                            dirty ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'
                        }`}
                        title="还原"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button
                        onClick={handlePrint}
                        className="p-2 rounded hover:bg-gray-200"
                        title="打印"
                    >
                        <Printer size={20} />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!dirty}
                        className={`p-2 rounded ${
                            dirty ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'
                        }`}
                        title="保存"
                    >
                        <Save size={20} />
                    </button>
                </div>

                <button
                    onClick={() => setEditHeader(!editHeader)}
                    className="p-2 ml-2 hover:bg-gray-200 rounded"
                    title="编辑标题/摘要"
                >
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Markdown 编辑器，value=body，onChange=onChangeBody */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <MarkdownEditor value={body} onChange={onChangeBody} />
            </div>
        </div>
    );
}