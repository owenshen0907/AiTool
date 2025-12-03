// src/app/agent/web/generate/page.tsx
'use client';

import React, { useMemo, useState } from 'react';

interface GenerateResponse {
    url: string;
    filePath: string;
}

export default function WebPageGenerator() {
    const [title, setTitle] = useState('夏日科技产品发布页');
    const [theme, setTheme] = useState('极简科技，玻璃拟态，青绿渐变');
    const [description, setDescription] = useState('突出产品卖点、功能亮点、场景体验与行动按钮，适合移动端和桌面端浏览。');
    const [sectionsInput, setSectionsInput] = useState('Hero 首屏\n核心卖点卡片\n场景展示\n客户背书/数据\nCTA 按钮');
    const [extra, setExtra] = useState('色彩灵动但不刺眼；按钮有悬浮反馈；排版层次分明。');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const sections = useMemo(
        () => sectionsInput.split(/\n|;/).map(s => s.trim()).filter(Boolean),
        [sectionsInput]
    );

    const handleGenerate = async () => {
        if (!title.trim()) {
            setError('请填写标题');
            return;
        }
        setLoading(true);
        setError(null);
        setResultUrl(null);
        try {
            const res = await fetch('/api/agent/web/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    theme: theme.trim(),
                    description: description.trim(),
                    sections,
                    extra: extra.trim()
                })
            });
            if (!res.ok) {
                const text = await res.text().catch(() => '生成失败');
                throw new Error(text);
            }
            const json = (await res.json()) as GenerateResponse;
            setResultUrl(json.url);
        } catch (e: any) {
            setError(e?.message || '生成失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!resultUrl) return;
        try {
            await navigator.clipboard.writeText(window.location.origin + resultUrl);
        } catch {
            /* ignore */
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Web Agent</p>
                    <h1 className="text-3xl md:text-4xl font-semibold mt-2">静态网页生成器</h1>
                    <p className="text-slate-300 mt-2">填写页面需求，调用 Agent 生成可分享的 H5，并自动存到 public/share。</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 items-stretch">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">页面需求</h2>
                            <span className="text-xs text-slate-300">使用配置好的模型直接生成</span>
                        </div>
                        <div className="space-y-4">
                            <Field
                                label="标题 *"
                                placeholder="请输入页面标题"
                                value={title}
                                onChange={setTitle}
                            />
                            <Field
                                label="主题 / 风格"
                                placeholder="配色、氛围、风格关键词"
                                value={theme}
                                onChange={setTheme}
                            />
                            <Field
                                label="简介"
                                placeholder="一句话描述页面目的或产品卖点"
                                value={description}
                                onChange={setDescription}
                            />
                            <Field
                                label="模块（每行一个或用分号隔开）"
                                placeholder="Hero 首屏；优势卡片；客户故事；CTA"
                                value={sectionsInput}
                                onChange={setSectionsInput}
                                multiline
                            />
                            <Field
                                label="附加要求"
                                placeholder="是否有品牌调性、排版限制、动效偏好等"
                                value={extra}
                                onChange={setExtra}
                                multiline
                            />
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-400 disabled:opacity-60 transition"
                            >
                                {loading ? '生成中...' : '生成网页'}
                            </button>
                            {error && <span className="text-sm text-red-300">{error}</span>}
                        </div>
                    </div>

                    <div className="relative bg-white/5 border border-white/10 rounded-2xl p-0 overflow-hidden shadow-xl backdrop-blur min-h-[520px]">
                        <div className="p-5 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">生成预览</h3>
                                <p className="text-xs text-slate-300">生成后可直接预览或复制链接</p>
                            </div>
                            {resultUrl && (
                                <div className="flex items-center gap-2">
                                    <a
                                        href={resultUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-emerald-300 hover:text-emerald-200 underline"
                                    >
                                        在新窗口打开
                                    </a>
                                    <button
                                        onClick={handleCopy}
                                        className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition"
                                    >
                                        复制链接
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="relative h-[460px]">
                            {loading && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-sm">
                                    <div className="loader mb-3" />
                                    <p className="text-sm text-slate-200">模型生成中，请稍候...</p>
                                </div>
                            )}
                            {!loading && !resultUrl && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 px-8 text-center">
                                    <div className="text-4xl mb-3">🧭</div>
                                    <p className="text-sm">填写左侧需求后点击生成，生成的静态页面会展示在这里。</p>
                                </div>
                            )}
                            {resultUrl && (
                                <iframe
                                    title="preview"
                                    src={resultUrl}
                                    className="w-full h-full border-0 bg-white"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
              .loader {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: 4px solid rgba(255,255,255,0.2);
                border-top-color: #34d399;
                animation: spin 0.9s linear infinite;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
        </div>
    );
}

interface FieldProps {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    multiline?: boolean;
}

function Field({ label, placeholder, value, onChange, multiline }: FieldProps) {
    const base =
        'w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 transition';
    return (
        <label className="block space-y-1.5">
            <span className="text-sm text-slate-200">{label}</span>
            {multiline ? (
                <textarea
                    rows={3}
                    className={base}
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            ) : (
                <input
                    className={base}
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            )}
        </label>
    );
}
