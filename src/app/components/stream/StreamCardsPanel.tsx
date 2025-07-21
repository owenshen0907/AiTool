// File: src/components/stream/StreamCardsPanel.tsx
'use client';

import React from 'react';
import { Play, Square, RotateCcw, Image as ImageIcon, Download } from 'lucide-react';
import type { StreamCard } from '@/hooks/useStreamCards';

interface Props {
    cards: StreamCard[];
    isStreaming: boolean;
    streamPreview: string;
    parsingMode: string;
    onStart: () => void;
    onStop: () => void;
    onReset: () => void;
}

export function StreamCardsPanel({
                                     cards,
                                     isStreaming,
                                     streamPreview,
                                     parsingMode,
                                     onStart,
                                     onStop,
                                     onReset,
                                 }: Props) {
    return (
        <div className="flex flex-col h-full">
            {/* 顶部预览（两行高度 + 可滚动，显示完整原始报文） */}
            <div className="mb-3 border rounded bg-white p-2 text-xs leading-5 font-mono h-[3.2rem] overflow-auto whitespace-pre-wrap">
                {streamPreview || '（等待流数据 ...）'}
            </div>

            {/* 控制区 */}
            <div className="mb-4 flex items-center space-x-2 text-xs">
                {!isStreaming ? (
                    <button
                        onClick={onStart}
                        className="px-3 py-1 bg-blue-600 text-white rounded flex items-center space-x-1"
                    >
                        <Play size={14} />
                        <span>开始流</span>
                    </button>
                ) : (
                    <button
                        onClick={onStop}
                        className="px-3 py-1 bg-red-500 text-white rounded flex items-center space-x-1"
                    >
                        <Square size={14} />
                        <span>停止</span>
                    </button>
                )}
                <button
                    onClick={onReset}
                    className="px-3 py-1 bg-gray-200 rounded flex items-center space-x-1"
                >
                    <RotateCcw size={14} />
                    <span>清空</span>
                </button>
                <span className="text-gray-500">
          模式: {parsingMode === 'auto' ? '自动' : parsingMode}
        </span>
                <span className="text-gray-400 ml-2">
          长度: {streamPreview.length} chars
        </span>
            </div>

            {/* 卡片列表 */}
            <div className="flex-1 overflow-auto space-y-4 pr-1">
                {cards.map(card => (
                    <CardView key={card.id} card={card} />
                ))}
                {isStreaming && (
                    <div className="text-center text-gray-400 text-xs py-4">正在接收...</div>
                )}
            </div>
        </div>
    );
}

function CardView({ card }: { card: StreamCard }) {
    const { title, description, prompt, text } = card;
    return (
        <div className="border rounded-lg bg-white shadow-sm flex p-4">
            {/* 左侧内容 */}
            <div className="flex-1 pr-4 space-y-2">
                <h3 className="font-semibold text-sm">{title || '（无标题）'}</h3>
                {description && (
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{description}</p>
                )}
                {prompt && (
                    <div>
                        <div className="text-[11px] font-medium text-gray-500 mb-1">Prompt</div>
                        <pre className="text-[11px] bg-gray-50 p-2 rounded whitespace-pre-wrap leading-5 max-h-40 overflow-auto">
              {prompt}
            </pre>
                    </div>
                )}
                {text && (
                    <div>
                        <div className="text-[11px] font-medium text-gray-500 mb-1">Text</div>
                        {Array.isArray(text) ? (
                            <ul className="list-disc ml-5 text-xs space-y-1">
                                {text.map((t, i) => (
                                    <li key={i} className="whitespace-pre-wrap">
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs whitespace-pre-wrap">{text}</p>
                        )}
                    </div>
                )}
            </div>
            {/* 右侧图片功能区 */}
            <div className="w-56 flex flex-col items-stretch">
                <div className="flex-1 border rounded bg-gray-50 flex items-center justify-center text-gray-400 text-xs mb-3">
                    图片预览
                </div>
                <div className="flex space-x-2">
                    <button className="flex-1 text-xs px-2 py-1 border rounded hover:bg-gray-100 flex items-center justify-center space-x-1">
                        <ImageIcon size={14} />
                        <span>生成图片</span>
                    </button>
                    <button className="flex-1 text-xs px-2 py-1 border rounded hover:bg-gray-100 flex items-center justify-center space-x-1">
                        <Download size={14} />
                        <span>下载</span>
                    </button>
                </div>
            </div>
        </div>
    );
}