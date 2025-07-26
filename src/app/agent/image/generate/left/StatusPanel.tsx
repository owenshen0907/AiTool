'use client';

import React from 'react';
import LoadingIndicator from '@/components/LoadingIndicator/LoadingIndicator';

type PendingMap = Record<string, 0 | 1>;

export interface StatusPanelProps {
    /** 右侧是否在生成“插画提示”（prompt），true 时显示加载动效 */
    promptGenerating: boolean;
    /** 卡片列表（只需要 id、title、index 三个字段即可） */
    cards: Array<{ id: string; title?: string; index?: number }>;
    /** 每张卡片是否有一张图片在生成（0=否，1=是） */
    pendingMap: PendingMap;
    /** 右侧区域的自定义插槽（比如“保存主体内容”按钮） */
    rightSlot?: React.ReactNode;
}

/** —— 小图标 —— */
function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
            <path d="M12 2l1.8 4.4L18 8.2l-4.2 1.8L12 14l-1.8-4-4.2-1.8 4.2-1.8L12 2zm6 8l.9 2.2L22 13l-3.1.8L18 17l-.9-3.2L14 13l3.1-1.8L18 10zM6 14l.8 1.8L9 16l-1.8.8L6 18l-.8-1.2L4 16l1.2-.2L6 14z" />
        </svg>
    );
}
function BrushIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
            <path d="M20.7 3.3a1 1 0 0 0-1.4 0l-7.8 7.8c-.3.3-.5.6-.6 1l-.5 2.1a.5.5 0 0 0 .6.6l2.1-.5c.4-.1.7-.3 1-.6l7.8-7.8a1 1 0 0 0 0-1.4l-1.2-1.2zM9 13c-2.2 0-4 1.8-4 4 0 1.3-.7 2-2 2 .7 1.3 2 2 3.5 2C9.4 21 11 19.4 11 17.5c0-1.7-.8-3.3-2-4.5z" />
        </svg>
    );
}
function ImageIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
            <path d="M19 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM8.5 8A1.5 1.5 0 1 1 7 9.5 1.5 1.5 0 0 1 8.5 8zM19 17l-4.5-6L10 15l-2-2-3 4h14z" />
        </svg>
    );
}

/** —— 压缩的空闲视图：最多显示 3 行文字 —— */
function MarketingHeroCompact() {
    return (
        <div className="absolute inset-0 overflow-hidden">
            {/* 背景柔光（轻量、低高度） */}
            <div className="pointer-events-none absolute -top-6 -left-6 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-300/40 to-fuchsia-300/40 blur-2xl animate-floatSlow" />
            <div className="pointer-events-none absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-gradient-to-br from-cyan-300/40 to-emerald-300/40 blur-2xl animate-floatSlow2" />

            {/* 内容层：更紧凑的“玻璃卡片” */}
            <div className="relative h-full w-full px-3 py-2 md:px-4 md:py-3 flex items-center">
                <div className="w-full rounded-xl border border-white/40 bg-white/50 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] px-3 py-3 md:px-4 md:py-3">
                    <div className="flex items-start gap-2">
                        <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md">
                <SparkleIcon className="h-3.5 w-3.5" />
              </span>
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-fuchsia-600 text-white shadow-md">
                <BrushIcon className="h-3.5 w-3.5" />
              </span>
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                <ImageIcon className="h-3.5 w-3.5" />
              </span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold tracking-tight">
                                图文知识 · 一键合成
                                <span className="ml-2 inline-block align-middle rounded-full bg-black/80 text-white text-[10px] px-2 py-[2px] animate-pulse">
                  AI 驱动
                </span>
                            </h3>

                            {/* —— 3 行内截断 —— */}
                            <p className="mt-1 text-xs text-gray-700 leading-5 clamp3">
                                只需输入创作意图或上传参考图片，系统即可自动生成
                                <span className="font-semibold"> 高质量、图文结合的知识分享内容</span>。
                                内置结构化插画提示与示例文案，支持分卡片微调与一键保存，创作更快、更稳、更好看。
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 局部样式与动画（行数限制） */}
            <style jsx>{`
                .clamp3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                @keyframes floatSlow {
                    0% { transform: translateY(0) translateX(0) }
                    50% { transform: translateY(-6px) translateX(4px) }
                    100% { transform: translateY(0) translateX(0) }
                }
                @keyframes floatSlow2 {
                    0% { transform: translateY(0) translateX(0) }
                    50% { transform: translateY(8px) translateX(-4px) }
                    100% { transform: translateY(0) translateX(0) }
                }
                .animate-floatSlow { animation: floatSlow 9s ease-in-out infinite; }
                .animate-floatSlow2 { animation: floatSlow2 11s ease-in-out infinite; }
            `}</style>
        </div>
    );
}

/** —— 颜色与 Hash —— */
function hashToIndex(str: string, mod: number) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h % mod;
}
const PALETTE = [
    { bg: 'bg-indigo-100',   text: 'text-indigo-700',   ring: 'ring-indigo-300' },
    { bg: 'bg-sky-100',      text: 'text-sky-700',      ring: 'ring-sky-300' },
    { bg: 'bg-emerald-100',  text: 'text-emerald-700',  ring: 'ring-emerald-300' },
    { bg: 'bg-amber-100',    text: 'text-amber-800',    ring: 'ring-amber-300' },
    { bg: 'bg-rose-100',     text: 'text-rose-700',     ring: 'ring-rose-300' },
    { bg: 'bg-violet-100',   text: 'text-violet-700',   ring: 'ring-violet-300' },
    { bg: 'bg-cyan-100',     text: 'text-cyan-700',     ring: 'ring-cyan-300' },
    { bg: 'bg-lime-100',     text: 'text-lime-700',     ring: 'ring-lime-300' },
];

export default function StatusPanel({
                                        promptGenerating,
                                        cards,
                                        pendingMap,
                                        rightSlot,
                                    }: StatusPanelProps) {
    // 统计在途数量（避免 reduce 的 TS 重载问题）
    const totalPending = Object.values(pendingMap).filter((v): v is 1 => v === 1).length;
    const showSplit = !promptGenerating && cards.length > 0;

    return (
        <div className="mb-4">
            <div
                className={`
          relative w-full rounded-xl border-2 transition
          ${promptGenerating
                    ? 'border-transparent bg-gradient-to-br from-fuchsia-100 to-pink-100'
                    : 'border-dashed border-gray-300 bg-gray-50'}
          hover:shadow-lg hover:-translate-y-[1px] hover:scale-[1.01]
          overflow-hidden
          max-h-32
        `}
                style={{ minHeight: '84px' }}  // 更紧凑：高度压缩
            >
                {/* 1) 生成插画提示阶段：沿用你的动效 */}
                {promptGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <LoadingIndicator scene="img_prompt_generate" />
                    </div>
                )}

                {/* 2) 已有卡片：左右分栏（无内框），保持紧凑 */}
                {showSplit && (
                    <div className="absolute inset-0 h-full w-full px-3 py-2">
                        <div className="flex h-full w-full items-stretch overflow-hidden">
                            {/* 左：卡片标签（自动换行，尺寸更小更紧凑） */}
                            <div className="flex-1 pr-2 h-full overflow-auto">
                                <div className="flex flex-wrap gap-1">
                                    {cards.map((c) => {
                                        const busy = (pendingMap[c.id] ?? 0) === 1;
                                        const idx = hashToIndex(c.id, PALETTE.length);
                                        const color = PALETTE[idx];

                                        return (
                                            <span
                                                key={c.id}
                                                className={[
                                                    'inline-flex items-center rounded-full px-2 py-[2px] text-[10px] border',
                                                    color.bg,
                                                    color.text,
                                                    busy ? `border-transparent ring-2 ${color.ring}` : 'border-transparent',
                                                ].join(' ')}
                                                title={c.title || (typeof c.index === 'number' ? `图 ${c.index + 1}` : '卡片')}
                                            >
                        <span className="truncate max-w-[10rem]">
                          {c.title || (typeof c.index === 'number' ? `图 ${c.index + 1}` : '卡片')}
                        </span>
                                                {busy && (
                                                    <span className="ml-1 w-1.5 h-1.5 rounded-full animate-pulse bg-current opacity-80" />
                                                )}
                      </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 分隔线 */}
                            <div className="w-px bg-gray-200 mx-1" />

                            {/* 右：在途数量 + 操作位（按钮） */}
                            <div className="w-40 pl-2 h-full overflow-hidden flex flex-col">
                                <div className="text-[11px] text-gray-700">
                                    在途图片：<span className="font-semibold">{totalPending}</span> 张
                                </div>
                                <div className="mt-auto">{rightSlot}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3) 空闲（无卡片）：压缩文案视图（最多 3 行） */}
                {!promptGenerating && cards.length === 0 && <MarketingHeroCompact />}
            </div>
        </div>
    );
}