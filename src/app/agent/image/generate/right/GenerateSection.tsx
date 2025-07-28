// File: src/app/agent/image/right/GenerateSection.tsx
'use client';

import React from 'react';
import TemplateSelectorModal, { Template } from './TemplateSelectorModal';
import { Brain, Send } from 'lucide-react';
import IntentList from './IntentList';
import LoadingIndicator from '@/components/LoadingIndicator/LoadingIndicator';
import type { IntentPromptOutput } from '../types';

interface Props {
    feature: string;
    selectedTemplate: Template | null;
    setSelectedTemplate: (tpl: Template) => void;
    noteRequest: string;
    setNoteRequest: (val: string) => void;
    forceBase64: boolean;
    setForceBase64: (flag: boolean) => void;
    imagesCount: number;
    loadingConfig: boolean;
    loadingIntent: boolean;
    onExtractIntent: () => void;
    intents: IntentPromptOutput['intents'];
    selectedIntentId: string | null;
    setSelectedIntentId: (id: string) => void;
    loadingGenerate: boolean;
    onGenerate: () => void;
    generatedIntentMap: Record<string,{ lastContent:string; count:number }>
    // lastGeneratedIntentId: string | null;
}

/** 简单去除常见 Markdown 语法 */
function stripMarkdown(md: string): string {
    return md
        // 删除代码块
        .replace(/```[\s\S]*?```/g, '')
        // 行内代码
        .replace(/`([^`]*)`/g, '$1')
        // 标题
        .replace(/^#{1,6}\s*(.*)$/gm, '$1')
        // 图片 ![alt](url)
        .replace(/!$begin:math:display$.*?$end:math:display$$begin:math:text$.*?$end:math:text$/g, '')
        // 链接 [text](url)
        .replace(/$begin:math:display$(.*?)$end:math:display$$begin:math:text$.*?$end:math:text$/g, '$1')
        // 引用块
        .replace(/^>\s?(.*)$/gm, '$1')
        // 加粗、斜体
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // 列表符号
        .replace(/^[\-\*\+\d\.]+\s+/gm, '')
        // 多余分隔线
        .replace(/-{3,}/g, '')
        // 多余空行
        .replace(/\n{2,}/g, '\n\n')
        .trim();
}
export default function GenerateSection({
                                            feature,
                                            selectedTemplate,
                                            setSelectedTemplate,
                                            noteRequest,
                                            setNoteRequest,
                                            // requestText,
                                            forceBase64,
                                            setForceBase64,
                                            imagesCount,
                                            loadingConfig,
                                            loadingIntent,
                                            onExtractIntent,
                                            intents,
                                            selectedIntentId,
                                            setSelectedIntentId,
                                            loadingGenerate,
                                            onGenerate,
                                            generatedIntentMap
                                        }: Props) {
    return (
        <div className="flex flex-col space-y-4">
            {/* 模板选择 */}
            <div className="flex items-center space-x-2">
                <TemplateSelectorModal feature={feature} onSelect={setSelectedTemplate} />
                {selectedTemplate && (
                    <span className="text-gray-700 truncate text-sm" title={selectedTemplate.title}>
            已选模板：{selectedTemplate.title}
          </span>
                )}
            </div>

            {loadingConfig && <div className="text-xs text-gray-500">加载模型配置中...</div>}

            {/* 文本输入：实时去除 Markdown */}
            <textarea
                value={noteRequest}
                onChange={e => {
                    const cleaned = stripMarkdown(e.target.value);
                    setNoteRequest(cleaned);
                }}
                placeholder="输入原始内容（意图抽取用）"
                className="w-full border rounded p-2 h-24 resize-none text-sm"
            />

            {/* Base64 选项 */}
            {imagesCount > 0 && (
                <label className="inline-flex items-center space-x-2 text-sm">
                    <input
                        type="checkbox"
                        checked={forceBase64}
                        onChange={e => setForceBase64(e.target.checked)}
                        className="h-4 w-4"
                    />
                    <span>兼容不支持图片外链的模型（转Base64）</span>
                </label>
            )}

            {/* 抽取意图 */}
            <button
                onClick={onExtractIntent}
                disabled={loadingIntent || !selectedTemplate?.id}
                className={`w-full flex items-center justify-center px-4 py-2 rounded font-semibold text-white ${
                    loadingIntent || !selectedTemplate?.id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-500 hover:bg-indigo-600'
                }`}
            >
                <Brain size={16} className="mr-2" />
                {loadingIntent ? '抽取中...' : '抽取意图'}
            </button>

            {/* 意图列表 */}
            {loadingIntent ? (
                <LoadingIndicator scene="img_intent_extract" />
            ) : (
                <IntentList
                    intents={intents}
                    selectedId={selectedIntentId}
                    onSelect={setSelectedIntentId}
                    generatedIntentMap={generatedIntentMap}
                />
            )}

            {/* 生成插画提示 */}
            <button
                onClick={onGenerate}
                disabled={
                    loadingGenerate ||
                    !selectedTemplate?.id ||
                    intents.length === 0 ||
                    !selectedIntentId
                }
                className={`w-full flex items-center justify-center px-4 py-2 rounded font-semibold text-white ${
                    loadingGenerate ||
                    !selectedTemplate?.id ||
                    intents.length === 0 ||
                    !selectedIntentId
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                }`}
            >
                <Send size={16} className="mr-2" />
                {loadingGenerate ? '生成中...' : '生成插画提示'}
            </button>
        </div>
    );
}
