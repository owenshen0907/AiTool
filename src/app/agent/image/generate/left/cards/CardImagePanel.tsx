// File: src/app/agent/image/left/cards/CardImagePanel.tsx
'use client';
import React from 'react';
import LoaderLottie from '../components/LoaderLottie';
import imageAnim from '../animations/loading.json';

interface CardImagePanelProps {
    images: string[];
    loading: boolean;
    callId: string | null;
    onGenerate: () => void;
    onRefine: () => void;
    onDownload: (idx: number) => void;
    onInsert: (idx: number) => void;
    canGenerate: boolean;
    canRefine: boolean;
    title?: string;
    error?: string | null;
}

export function CardImagePanel({
                                   images,
                                   loading,
                                   callId,
                                   onGenerate,
                                   onRefine,
                                   onDownload,
                                   onInsert,
                                   canGenerate,
                                   canRefine,
                                   title,
                                   error
                               }: CardImagePanelProps) {
    return (
        <div className="w-72 flex flex-col items-stretch">
            <div className="flex-1 border rounded bg-gray-50 flex items-center justify-center text-gray-400 text-xs mb-3 overflow-hidden p-2 relative">
                {loading && (
                    <LoaderLottie
                        json={imageAnim}
                        text="生成图片中..."
                        size={100}
                        speed={1.1}
                    />
                )}
                {!loading && images.length === 0 && <span>图片预览</span>}
                {!loading && images.length > 0 && (
                    <div className="w-full h-full overflow-auto">
                        <div className="flex space-x-2">
                            {images.map((b64, i) => (
                                <div
                                    key={i}
                                    className="relative group cursor-pointer"
                                    title="点击下载"
                                    onClick={() => onDownload(i)}
                                >
                                    <img
                                        src={`data:image/png;base64,${b64}`}
                                        className="object-cover w-40 h-40 border rounded"
                                        alt={`img-${i}`}
                                    />
                                    <div className="absolute bottom-1 left-1 right-1 flex opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                onInsert(i);
                                            }}
                                            className="flex-1 bg-black/60 text-white text-[10px] py-1 rounded"
                                        >
                                            插入正文
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {error && <div className="text-[10px] text-red-500 mb-2">{error}</div>}

            <div className="flex space-x-2">
                <button
                    onClick={onGenerate}
                    disabled={!canGenerate || loading}
                    className="flex-1 text-xs px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                    title={callId ? '重新生成（将重置 refine 链）' : '生成图片'}
                >
                    {loading ? '生成中' : callId ? '重新生成' : '生成图片'}
                </button>
                <button
                    onClick={onRefine}
                    disabled={!canRefine || loading}
                    className="flex-1 text-xs px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                    细化
                </button>
            </div>
            {callId && (
                <div className="mt-2 text-[10px] text-gray-400 break-all">
                    callId: {callId}
                </div>
            )}
        </div>
    );
}