// File: src/app/agent/image/left/HeaderSection.tsx
'use client';
import React from 'react';
import { Save, RefreshCw, Printer, MoreVertical, Sparkles } from 'lucide-react';
import LoaderLottie from './components/LoaderLottie';
import summaryAnim from './animations/loading.json';

interface HeaderSectionProps {
    title: string;
    summary: string;
    edit: boolean;
    dirty: boolean;
    isGenerating: boolean;
    onChangeTitle: (v: string) => void;
    onChangeSummary: (v: string) => void;
    onToggleEdit: () => void;
    onRestore: () => void;
    onSave: () => void;
    onPrint: () => void;
    onGenerateSummary: () => Promise<void>;
}

export default function HeaderSection({
                                          title,
                                          summary,
                                          edit,
                                          dirty,
                                          isGenerating,
                                          onChangeTitle,
                                          onChangeSummary,
                                          onToggleEdit,
                                          onRestore,
                                          onSave,
                                          onPrint,
                                          onGenerateSummary
                                      }: HeaderSectionProps) {
    return (
        <div className="mb-4 flex items-start justify-between">
            <div className="flex-1 space-y-1">
                {edit ? (
                    <>
                        <input
                            className="w-full border rounded p-2"
                            value={title}
                            onChange={e => onChangeTitle(e.target.value)}
                            placeholder="输入标题"
                        />
                        <textarea
                            className="w-full border rounded p-2"
                            rows={2}
                            value={summary}
                            onChange={e => onChangeSummary(e.target.value)}
                            placeholder="输入摘要"
                        />
                        <div className="mt-2 flex items-center gap-3">
                            <button
                                className={`px-3 py-1 text-xs rounded bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100 flex items-center gap-1 ${
                                    isGenerating ? 'opacity-60 cursor-not-allowed' : ''
                                }`}
                                disabled={isGenerating}
                                onClick={onGenerateSummary}
                            >
                                <Sparkles size={14} />
                                {isGenerating ? '生成中...' : '重新生成摘要'}
                            </button>
                            {isGenerating && (
                                <LoaderLottie
                                    json={summaryAnim}
                                    text=""
                                    size={48}
                                    speed={1.1}
                                    className="ml-1"
                                />
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h1
                            className="text-2xl font-semibold cursor-pointer"
                            onClick={onToggleEdit}
                        >
                            {title || '（无标题）'}
                        </h1>
                        {summary ? (
                            <p
                                className="text-gray-600 cursor-pointer whitespace-pre-wrap"
                                onClick={onToggleEdit}
                            >
                                {summary}
                            </p>
                        ) : (
                            <button
                                className={`px-2 py-1 text-blue-600 hover:underline text-sm ${
                                    isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                onClick={onGenerateSummary}
                                disabled={isGenerating}
                            >
                                {isGenerating ? '生成中...' : 'AI生成摘要'}
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="flex flex-col items-center ml-4 space-y-2">
                <button
                    onClick={onRestore}
                    disabled={!dirty}
                    className={`p-2 rounded ${
                        dirty ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'
                    }`}
                    title="还原"
                >
                    <RefreshCw size={20} />
                </button>
                <button
                    onClick={onPrint}
                    className="p-2 rounded hover:bg-gray-200"
                    title="打印"
                >
                    <Printer size={20} />
                </button>
                <button
                    onClick={onSave}
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
                onClick={onToggleEdit}
                className="p-2 ml-2 hover:bg-gray-200 rounded"
                title="编辑标题/摘要"
            >
                <MoreVertical size={20} />
            </button>
        </div>
    );
}