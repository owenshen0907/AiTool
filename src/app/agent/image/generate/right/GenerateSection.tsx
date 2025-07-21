// File: src/app/agent/image/right/GenerateSection.tsx
'use client';

import React from 'react';
import TemplateSelectorModal, { Template } from './TemplateSelectorModal';
import { Brain, Send } from 'lucide-react';
import IntentList from './IntentList';
import LoadingIndicator from '@/components/LoadingIndicator/LoadingIndicator';
import type { IntentItem } from './hooks/useIntentExtraction';

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

    intents: IntentItem[];
    selectedIntentId: string | null;
    setSelectedIntentId: (id: string) => void;
    generatedIntentMap: Record<string, { lastContent: string; updatedAt: string; count: number }>;

    loadingGenerate: boolean;
    onGenerate: () => void;
}

export default function GenerateSection({
                                            feature,
                                            selectedTemplate,
                                            setSelectedTemplate,
                                            noteRequest,
                                            setNoteRequest,
                                            forceBase64,
                                            setForceBase64,
                                            imagesCount,
                                            loadingConfig,
                                            loadingIntent,
                                            onExtractIntent,
                                            intents,
                                            selectedIntentId,
                                            setSelectedIntentId,
                                            generatedIntentMap,
                                            loadingGenerate,
                                            onGenerate
                                        }: Props) {
    return (
        <div className="flex flex-col space-y-4">
            {/* 模板选择 */}
            <div className="flex items-center space-x-2">
                <TemplateSelectorModal feature={feature} onSelect={setSelectedTemplate} />
                {selectedTemplate && (
                    <span
                        className="text-gray-700 truncate text-sm"
                        title={selectedTemplate.title}
                    >
            已选模板：{selectedTemplate.title}
          </span>
                )}
            </div>

            {loadingConfig && (
                <div className="text-xs text-gray-500">加载模型配置中...</div>
            )}

            {/* 原始输入 */}
            <textarea
                value={noteRequest}
                onChange={e => setNoteRequest(e.target.value)}
                placeholder="输入原始内容（意图抽取用）"
                className="w-full border rounded p-2 h-24 resize-none text-sm"
            />

            {/* Base64 选项（有图片时才显示） */}
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

            {/* 意图抽取 */}
            <button
                type="button"
                onClick={onExtractIntent}
                disabled={loadingIntent || !selectedTemplate?.prompts?.intent_prompt}
                className={`w-full flex items-center justify-center px-4 py-2 rounded font-semibold transition text-white ${
                    loadingIntent || !selectedTemplate?.prompts?.intent_prompt
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-500 hover:bg-indigo-600'
                }`}
            >
                <Brain size={16} className="mr-2" />
                {loadingIntent ? '抽取中...' : '抽取意图'}
            </button>

            {/* 意图列表或加载 */}
            {loadingIntent ? (
                <LoadingIndicator scene="img_intent_extract" />
            ) : (
                <IntentList
                    intents={intents}
                    selectedId={selectedIntentId}
                    onSelect={id => setSelectedIntentId(id)}
                    generatedIntentMap={generatedIntentMap}
                />
            )}

            {/* 生成插画提示 */}
            <button
                onClick={onGenerate}
                disabled={
                    loadingGenerate ||
                    !selectedTemplate?.prompts?.image_prompt ||
                    intents.length === 0 ||
                    !selectedIntentId
                }
                className={`w-full flex items-center justify-center px-4 py-2 rounded font-semibold transition ${
                    loadingGenerate ||
                    !selectedTemplate?.prompts?.image_prompt ||
                    intents.length === 0 ||
                    !selectedIntentId
                        ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
            >
                <Send size={16} className="mr-2 flex-shrink-0" />
                {loadingGenerate ? '生成中...' : '生成插画提示'}
            </button>
        </div>
    );
}