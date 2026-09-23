'use client';

import React, { useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    ExternalLink,
    FileText,
    Loader2,
    Search,
    Trash2,
} from 'lucide-react';

interface FileItem {
    id: string;
    object: string;
    bytes: number;
    created_at: number;
    filename: string;
    purpose: string;
    status: string;
}

const ERROR_HINTS: Record<number, string> = {
    400: [
        '原因：请求参数格式不正确，可能原因如下：',
        '1. 图片无法下载',
        '2. 图片数量超过限制',
        '3. 该模型不支持视频输入',
        '4. 模型不存在或无权限',
        '5. 参数值不合法',
        '解决方案：请参照文档正确传递参数信息',
    ].join('\n'),
    401: '原因：认证无效\n解决方案：确保使用正确的 API 密钥',
    402: '原因：余额不足\n解决方案：确保账户里面有足够余额',
    404: '原因：请求路径不正确\n解决方案：请参照文档修复请求路径信息',
    429: '原因：请求的资源超限，可能原因是你发送请求太快，超过了速率限制\n解决方案：请稍候重试您的请求',
    451: '原因：请求内容或者响应内容未审核通过\n解决方案：修改请求信息后再重试',
    500: '原因：我们服务器上的问题\n解决方案：稍等片刻后重试请求，如果问题仍然存在，请联系我们',
    503: '原因：目前服务器负载过高\n解决方案：请稍候重试您的请求',
};

const purposeOptions = [
    { value: '', label: '全部文件' },
    { value: 'file-extract', label: 'chat 推理' },
    { value: 'retrieval-text', label: '文本知识库' },
    { value: 'retrieval-image', label: '图片知识库' },
    { value: 'storage', label: '存储/理解功能' },
];

function formatBytes(bytes: number) {
    if (!Number.isFinite(bytes)) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatCreatedAt(value: number) {
    return new Date(value * 1000).toLocaleString('zh-CN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        hourCycle: 'h23',
    });
}

export default function FilePage() {
    const [apiKey, setApiKey] = useState('');
    const [usage, setUsage] = useState('');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteMode, setDeleteMode] = useState<'selected' | 'all' | null>(null);
    const [deleteProgress, setDeleteProgress] = useState({ total: 0, remaining: 0 });
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState('');

    const totalBytes = useMemo(() => files.reduce((sum, file) => sum + (file.bytes || 0), 0), [files]);
    const totalPages = Math.ceil(files.length / itemsPerPage) || 1;
    const pageFiles = files.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const allPageSelected = pageFiles.length > 0 && pageFiles.every((file) => selectedIds.has(file.id));

    async function handleSearch() {
        if (!apiKey.trim()) {
            alert('请输入 API Key');
            return;
        }

        setLoading(true);
        setNotice('');
        try {
            const params = new URLSearchParams();
            if (usage) params.set('purpose', usage);

            const res = await fetch(`/api/stepfun/files?${params.toString()}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${apiKey.trim()}` },
                cache: 'no-store',
            });
            if (!res.ok) {
                const hint = ERROR_HINTS[res.status];
                const msg = hint ? `请求失败（${res.status}）\n${hint}` : `请求失败：${res.status}`;
                alert(msg);
                return;
            }
            const json = await res.json();
            const nextFiles = Array.isArray(json.data) ? json.data : [];
            setFiles(nextFiles);
            setSelectedIds(new Set());
            setCurrentPage(1);
            setNotice(`已读取 ${nextFiles.length} 个文件。`);
        } catch (err) {
            console.error('[Error] 搜索文件失败', err);
            alert('搜索文件失败，请查看控制台日志');
        } finally {
            setLoading(false);
        }
    }

    function toggleSelect(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function toggleCurrentPage(checked: boolean) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            pageFiles.forEach((file) => {
                if (checked) next.add(file.id);
                else next.delete(file.id);
            });
            return next;
        });
    }

    function openDelete(mode: 'selected' | 'all') {
        const count = mode === 'all' ? files.length : selectedIds.size;
        if (count === 0) return;
        setDeleteMode(mode);
        setDeleteProgress({ total: count, remaining: count });
        setShowDeleteModal(true);
    }

    async function confirmDelete() {
        const ids = deleteMode === 'all' ? files.map((file) => file.id) : Array.from(selectedIds);

        for (const id of ids) {
            try {
                const response = await fetch('/api/stepfun/files', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey.trim()}`,
                    },
                    body: JSON.stringify({ id }),
                });
                if (!response.ok) console.error('[Error] 删除失败', id, response.status);
            } catch (error) {
                console.error('[Error] 删除失败', id, error);
            }
            setDeleteProgress((prev) => ({ total: prev.total, remaining: prev.remaining - 1 }));
        }

        setFiles((prev) => (deleteMode === 'all' ? [] : prev.filter((file) => !selectedIds.has(file.id))));
        setSelectedIds(new Set());
        setNotice(`删除任务完成：${ids.length} 个文件已处理。`);
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(226,232,240,0.9),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-10 text-slate-900 md:px-8 md:py-14">
            <section className="mx-auto max-w-7xl rounded-[42px] border border-slate-900/10 bg-[linear-gradient(135deg,#0f172a_0%,#334155_100%)] p-6 text-white shadow-[0_28px_100px_rgba(15,23,42,0.18)] md:p-10">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-bold text-slate-200">
                            <FileText size={16} />
                            保留老服务 · /stepfun/file
                        </div>
                        <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
                            StepFun 文件管理
                        </h1>
                        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200/85 md:text-lg">
                            用你的 StepFun API Key 查询文件列表，按用途筛选、分页查看，并支持删除已选或全部文件。核心接口和老页面保持兼容，只把体验改成 AiTool 2.0 的工具台风格。
                        </p>
                    </div>
                    <a
                        href="https://owenshen.top/upload/stepfun%E6%96%87%E4%BB%B6%E5%88%A0%E9%99%A4%E7%AE%A1%E7%90%86.mp4"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.14]"
                    >
                        操作指引
                        <ExternalLink size={16} />
                    </a>
                </div>
            </section>

            <section className="mx-auto mt-8 grid max-w-7xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <aside className="rounded-[34px] border border-slate-900/10 bg-white/[0.84] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Query Controls
                    </div>
                    <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                        输入 API Key 后读取文件
                    </h2>
                    <div className="mt-6 space-y-4">
                        <label className="block">
                            <span className="text-sm font-bold text-slate-600">StepFun API Key</span>
                            <input
                                type="password"
                                placeholder="sk-..."
                                value={apiKey}
                                onChange={(event) => setApiKey(event.target.value)}
                                className="mt-2 w-full rounded-[20px] border border-slate-900/10 bg-white/[0.84] px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-slate-600">用途筛选</span>
                            <select
                                value={usage}
                                onChange={(event) => setUsage(event.target.value)}
                                className="mt-2 w-full rounded-[20px] border border-slate-900/10 bg-white/[0.84] px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                            >
                                {purposeOptions.map((option) => (
                                    <option key={option.value || 'all'} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={() => void handleSearch()}
                            disabled={loading || !apiKey.trim()}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            {loading ? '搜索中...' : '搜索文件'}
                        </button>
                    </div>

                    <div className="mt-7 grid grid-cols-3 gap-3">
                        <div className="rounded-[22px] border border-slate-900/10 bg-white/[0.76] p-4">
                            <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Files</div>
                            <div className="mt-2 text-2xl font-black text-slate-900">{files.length}</div>
                        </div>
                        <div className="rounded-[22px] border border-slate-900/10 bg-white/[0.76] p-4">
                            <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Selected</div>
                            <div className="mt-2 text-2xl font-black text-slate-900">{selectedIds.size}</div>
                        </div>
                        <div className="rounded-[22px] border border-slate-900/10 bg-white/[0.76] p-4">
                            <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Size</div>
                            <div className="mt-2 text-lg font-black text-slate-900">{formatBytes(totalBytes)}</div>
                        </div>
                    </div>

                    {notice ? (
                        <div className="mt-5 flex items-start gap-2 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-800">
                            <CheckCircle2 size={16} className="mt-1 shrink-0" />
                            {notice}
                        </div>
                    ) : null}
                </aside>

                <section className="rounded-[34px] border border-slate-900/10 bg-white/[0.82] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                File Table
                            </div>
                            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                                文件列表
                            </h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => openDelete('selected')}
                                disabled={selectedIds.size === 0}
                                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2 size={15} />
                                删除已选
                            </button>
                            <button
                                type="button"
                                onClick={() => openDelete('all')}
                                disabled={files.length === 0}
                                className="inline-flex items-center gap-2 rounded-full bg-rose-700 px-4 py-2 text-sm font-black text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2 size={15} />
                                删除全部
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                        <label className="flex items-center gap-2">
                            <span className="font-bold">每页显示</span>
                            <select
                                value={itemsPerPage}
                                onChange={(event) => {
                                    setItemsPerPage(Number(event.target.value));
                                    setCurrentPage(1);
                                }}
                                className="rounded-full border border-slate-900/10 bg-white px-3 py-2 text-sm outline-none"
                            >
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </label>
                        <span className="font-bold">第 {currentPage} / {totalPages} 页</span>
                    </div>

                    <div className="mt-5 overflow-x-auto rounded-[26px] border border-slate-900/10 bg-white/[0.82]">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-[linear-gradient(135deg,#0f172a_0%,#334155_100%)] text-white">
                                <tr>
                                    <th className="w-12 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={allPageSelected}
                                            onChange={(event) => toggleCurrentPage(event.target.checked)}
                                        />
                                    </th>
                                    <th className="px-4 py-3 font-black">文件</th>
                                    <th className="px-4 py-3 font-black">大小</th>
                                    <th className="px-4 py-3 font-black">创建时间</th>
                                    <th className="px-4 py-3 font-black">用途</th>
                                    <th className="px-4 py-3 font-black">状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageFiles.length > 0 ? pageFiles.map((file) => (
                                    <tr key={file.id} className="border-t border-slate-900/10 bg-white/[0.68] align-top transition hover:bg-white">
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(file.id)}
                                                onChange={() => toggleSelect(file.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-black text-slate-900">{file.filename}</div>
                                            <div className="mt-1 max-w-[320px] break-all font-mono text-xs leading-5 text-slate-500">{file.id}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-600">{formatBytes(file.bytes)}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatCreatedAt(file.created_at)}</td>
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <span className="rounded-full border border-slate-900/10 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                                {file.purpose || '-'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">{file.status || '-'}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-16 text-center text-slate-600">
                                            还没有文件数据。输入 API Key 后点击搜索。
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                            disabled={currentPage === 1}
                            className="rounded-full border border-slate-900/10 bg-white/75 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            上一页
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="rounded-full border border-slate-900/10 bg-white/75 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            下一页
                        </button>
                    </div>
                </section>
            </section>

            {showDeleteModal && deleteMode ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/62 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[34px] border border-white/70 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
                        <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-rose-100 text-rose-700">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-slate-900">
                                    确认删除 {deleteMode === 'all' ? files.length : deleteProgress.total} 个文件？
                                </h2>
                                <p className="mt-2 text-sm leading-7 text-slate-600">
                                    删除会逐个请求 StepFun 文件接口。请确认 API Key 和文件范围正确。
                                </p>
                            </div>
                        </div>
                        {deleteProgress.remaining < deleteProgress.total ? (
                            <div className="mt-5 rounded-[22px] border border-slate-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-slate-600">
                                剩余 {deleteProgress.remaining} / {deleteProgress.total}
                            </div>
                        ) : null}
                        <div className="mt-6 flex justify-end gap-2">
                            {deleteProgress.remaining === deleteProgress.total ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => void confirmDelete()}
                                        className="rounded-full bg-rose-700 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-800"
                                    >
                                        确定删除
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(false)}
                                        className="rounded-full border border-slate-900/10 bg-white/75 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-white"
                                    >
                                        取消
                                    </button>
                                </>
                            ) : deleteProgress.remaining > 0 ? (
                                <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white">
                                    <Loader2 size={16} className="animate-spin" />
                                    删除中...
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                                >
                                    完成
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    );
}
