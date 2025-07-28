// File: src/app/agent/image/left/cards/CardImagePanel.tsx
'use client';
import React, { useMemo, useState } from 'react';
import LoaderLottie from '../components/LoaderLottie';
import imageAnim from '../animations/loading.json';

interface CardImagePanelProps {
    images: string[];
    fileIds?: (string | undefined)[];     // 与 images 一一对应（已落库的才可删除）
    loading: boolean;
    pending?: number;
    callId: string | null;
    /** 生成图片回调：可选 extraNote（来自弹框输入） */
    onGenerate: (extraNote?: string) => void;
    /** ✅ 新：编辑回调（必须传入选中图片的 src） */
    onEdit: (imageSrc: string, extraNote?: string) => void;
    onDownload: (idx: number) => void;
    /** @deprecated 已移除“插入正文”功能，保留此类型仅为兼容上层传参；组件内部不会使用 */
    onInsert?: (idx: number) => void;
    onDelete?: (idx: number) => void;
    canGenerate: boolean;
    /** ✅ 新：是否允许编辑（通常有任何图片即可设为 true） */
    canEdit: boolean;
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
                                   onEdit,
                                   onDownload,
                                   // onInsert // 👈 已不再使用
                                   onDelete,
                                   canGenerate,
                                   canEdit,
                                   title,
                                   error
                               }: CardImagePanelProps) {
    const displayImages = useMemo(() => {
        const arr = images.map(normalizeForDisplay);
        dbg('CardImagePanel.displayImages', { title, count: arr.length, sample: arr.slice(0,3) });
        return arr;
    }, [images, title]);

    // ====== 生成确认弹框状态（保持原逻辑） ======
    const [showConfirm, setShowConfirm] = useState(false);
    const [extraNote, setExtraNote]     = useState('');

    // ====== 选择要编辑的图片（新增） ======
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    const handleClickGenerate = () => {
        if (!canGenerate || loading) return;
        if (displayImages.length > 0) {
            // 已有图片 → 弹出确认对话框
            setShowConfirm(true);
        } else {
            // 没有图片 → 直接生成
            onGenerate();
        }
    };

    const handleConfirmGenerate = () => {
        const note = extraNote.trim();
        setShowConfirm(false);
        setExtraNote('');
        onGenerate(note || undefined);
    };
    const handleCancelGenerate = () => {
        setShowConfirm(false);
        setExtraNote('');
    };

    // ====== 新：编辑按钮逻辑 ======
    const handleEdit = () => {
        if (!canEdit || loading) return;
        if (selectedIdx == null || !displayImages[selectedIdx]) {
            alert('请先选择一张要编辑的图片。');
            return;
        }
        const input = window.prompt('输入编辑说明（例如：增强清晰度 / 在右上角加“ので”标签 / 柔和光线）', '');
        if (input === null) return; // 用户取消
        onEdit(displayImages[selectedIdx], input?.trim() || undefined);
    };

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
                                const selected  = selectedIdx === i;
                                return (
                                    <div
                                        key={i}
                                        className="relative group cursor-pointer"
                                        title="点击下载"
                                        onClick={() => onDownload(i)}
                                    >
                                        <img
                                            src={src}
                                            className={`object-cover w-40 h-40 border rounded ${selected ? 'ring-2 ring-indigo-500' : ''}`}
                                            alt={`${title || 'image'}-${i + 1}`}
                                        />

                                        {/* ✅ 新：选择按钮（左上角），避免和下载冲突，需要 stopPropagation */}
                                        <button
                                            type="button"
                                            className={`absolute top-1 left-1 w-5 h-5 rounded-full border shadow
                                  ${selected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}
                                  flex items-center justify-center text-[10px] ${selected ? 'text-white' : 'text-transparent'}`}
                                            title={selected ? '已选中' : '选择这张图片'}
                                            onClick={(e) => { e.stopPropagation(); setSelectedIdx(i); }}
                                        >
                                            ✓
                                        </button>

                                        <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            {/* ✅ 已移除“插入正文”按钮 */}
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
                    onClick={handleClickGenerate}
                    disabled={!canGenerate || loading}
                    className="flex-1 text-xs px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                    title={
                        callId
                            ? '重新生成（将重置 refine 链）'
                            : displayImages.length > 0
                                ? '将新生成一张图片'
                                : '生成图片'
                    }
                >
                    {loading ? '生成中' : callId ? '重新生成' : '生成图片'}
                </button>

                {/* ✅ 新：编辑按钮（替换“细化”） */}
                <button
                    onClick={handleEdit}
                    disabled={!canEdit || loading || displayImages.length === 0}
                    className="flex-1 text-xs px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                    title="选中一张图片后进行编辑"
                >
                    编辑
                </button>
            </div>

            {callId && (
                <div className="mt-2 text-[10px] text-gray-400 break-all">
                    callId: {callId}
                </div>
            )}

            {/* 生成确认弹框 */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* 背景遮罩 */}
                    <div className="absolute inset-0 bg-black/40" onClick={handleCancelGenerate} />
                    {/* 弹窗体 */}
                    <div className="relative z-10 w-[420px] max-w-[92vw] bg-white rounded-lg shadow-lg border p-4">
                        <h3 className="font-semibold text-sm mb-2">已有图片，确认要新生成一张吗？</h3>
                        <p className="text-xs text-gray-500 mb-2">
                            可以输入<span className="font-medium">补充说明</span>来指导本次生成（可留空）。
                        </p>
                        <textarea
                            value={extraNote}
                            onChange={(e) => setExtraNote(e.target.value)}
                            placeholder="例如：更写实 / 柔和光线 / 加入箭头标注..."
                            className="w-full h-24 text-xs p-2 border rounded outline-none focus:ring"
                        />
                        <div className="mt-3 flex justify-end gap-2">
                            <button
                                onClick={handleCancelGenerate}
                                className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleConfirmGenerate}
                                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                                确认生成
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}