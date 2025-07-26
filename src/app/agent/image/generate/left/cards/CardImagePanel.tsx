// File: src/app/agent/image/left/cards/CardImagePanel.tsx
'use client';
import React, { useMemo } from 'react';
import LoaderLottie from '../components/LoaderLottie';
import imageAnim from '../animations/loading.json';

interface CardImagePanelProps {
    images: string[];
    fileIds?: (string | undefined)[];     // 👈 新增：与 images 一一对应
    loading: boolean;
    pending?: number;
    callId: string | null;
    onGenerate: () => void;
    onRefine: () => void;
    onDownload: (idx: number) => void;
    onInsert: (idx: number) => void;
    onDelete?: (idx: number) => void;     // 👈 新增
    canGenerate: boolean;
    canRefine: boolean;
    title?: string;
    error?: string | null;
}

function dbg(...args: any[]) {
    try {
        if (typeof window !== 'undefined' && window.localStorage.getItem('IMG_DEBUG') === '1') {
            // eslint-disable-next-line no-console
            console.debug('[IMG_DEBUG]', ...args);
        }
    } catch {}
}

function isBareBase64(s: string) {
    if (!s) return false;
    if (s.startsWith('data:')) return false;
    if (/^https?:\/\//i.test(s)) return false;
    if (s.startsWith('/')) return false;
    const t = s.replace(/\s+/g, '');
    if (t.length < 128) return false;
    return /^[A-Za-z0-9+/_-]+={0,2}$/.test(t);
}
function normalizeForDisplay(src: string) {
    if (!src) return src;
    if (src.startsWith('data:')) return src;
    if (isBareBase64(src)) return `data:image/png;base64,${src.replace(/\s+/g, '')}`;
    return src;
}

export function CardImagePanel({
                                   images,
                                   fileIds,
                                   loading,
                                   pending,
                                   callId,
                                   onGenerate,
                                   onRefine,
                                   onDownload,
                                   onInsert,
                                   onDelete,
                                   canGenerate,
                                   canRefine,
                                   title,
                                   error
                               }: CardImagePanelProps) {

    const displayImages = useMemo(() => {
        const arr = images.map(normalizeForDisplay);
        dbg('CardImagePanel.displayImages', { title, count: arr.length, sample: arr.slice(0,3) });
        return arr;
    }, [images, title]);

    return (
        <div className="w-72 flex flex-col items-stretch">
            <div className="relative flex-1 border rounded bg-gray-50 flex items-center justify-center text-gray-400 text-xs mb-3 overflow-hidden p-2">
                {loading && <LoaderLottie json={imageAnim} text="生成中..." size={100} speed={1.1} />}

                {typeof pending === 'number' && pending > 0 && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                        生成中：{pending}
                    </div>
                )}

                {!loading && displayImages.length === 0 && <span>图片预览</span>}

                {!loading && displayImages.length > 0 && (
                    <div className="w-full h-full overflow-auto">
                        <div className="flex space-x-2">
                            {displayImages.map((src, i) => {
                                const canDelete = !!fileIds?.[i]; // 只有已落库的图可删除
                                return (
                                    <div key={i} className="relative group cursor-pointer" title="点击下载" onClick={() => onDownload(i)}>
                                        <img src={src} className="object-cover w-40 h-40 border rounded" alt={`${title || 'image'}-${i + 1}`} />
                                        <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onInsert(i); }}
                                                className="flex-1 bg-black/60 text-white text-[10px] py-1 rounded"
                                            >
                                                插入正文
                                            </button>
                                            {canDelete && onDelete && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete(i); }}
                                                    className="px-2 bg-red-600/80 text-white text-[10px] rounded"
                                                    title="删除（同时从正文中移除该行）"
                                                >
                                                    删除
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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