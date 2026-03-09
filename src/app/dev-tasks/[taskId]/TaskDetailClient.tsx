'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertOctagon, ArrowLeft, CheckCircle2, RefreshCw, Send } from 'lucide-react';
import {
    approveDevTask,
    cancelDevTask,
    createDevTaskTuningRequest,
    fetchDevTaskDetail,
    type DevTaskDetailResponse,
} from '@/lib/api/devTasks';
import { devTaskPriorityMeta, devTaskStatusMeta } from '@/lib/devTasks/meta';
import { devTaskActiveStatuses } from '@/lib/models/devTask';

export default function TaskDetailClient({ taskId }: { taskId: string }) {
    const [detail, setDetail] = useState<DevTaskDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [acting, setActing] = useState<'approve' | 'cancel' | null>(null);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            setDetail(await fetchDevTaskDetail(taskId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load task detail');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        const id = window.setInterval(() => {
            void load();
        }, 10000);
        return () => window.clearInterval(id);
    }, [taskId]);

    const currentRevision = useMemo(() => detail?.revisions[0] || null, [detail]);

    async function submitTuning() {
        if (!currentRevision || !message.trim()) return;
        try {
            setSubmitting(true);
            await createDevTaskTuningRequest(taskId, {
                revisionId: currentRevision.revisionId,
                requestedBy: 'aitool-ui',
                requestedFrom: 'aitool',
                message: message.trim(),
            });
            setMessage('');
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create tuning request');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleApprove() {
        try {
            setActing('approve');
            setError(null);
            await approveDevTask(taskId);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to approve task');
        } finally {
            setActing(null);
        }
    }

    async function handleCancel() {
        try {
            setActing('cancel');
            setError(null);
            await cancelDevTask(taskId);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel task');
        } finally {
            setActing(null);
        }
    }

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,#f4efe8_0%,#faf7f2_42%,#ffffff_100%)] px-4 py-10 md:px-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link href="/workspace" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
                        <ArrowLeft size={16} />
                        回到 Workspace
                    </Link>
                    <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
                        <RefreshCw size={16} />
                        刷新详情
                    </button>
                </div>

                {loading ? (
                    <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                        正在加载任务详情...
                    </div>
                ) : error ? (
                    <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                        {error}
                    </div>
                ) : detail ? (
                    <>
                        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                            <article className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${devTaskStatusMeta[detail.task.status].badgeClass}`}>
                                        {devTaskStatusMeta[detail.task.status].label}
                                    </span>
                                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${devTaskPriorityMeta[detail.task.priority].badgeClass}`}>
                                        {devTaskPriorityMeta[detail.task.priority].label}
                                    </span>
                                </div>
                                <div className="mt-4 text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                                    {detail.task.projectName}
                                </div>
                                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                                    {currentRevision?.goal || 'Task detail'}
                                </h1>
                                <p className="mt-4 text-sm leading-8 text-slate-600">
                                    {detail.task.lastStatusNote || '还没有状态备注。'}
                                </p>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => void handleApprove()}
                                        disabled={acting !== null || detail.task.status !== 'awaiting_approval'}
                                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <CheckCircle2 size={16} />
                                        {acting === 'approve' ? '批准中...' : '批准执行'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleCancel()}
                                        disabled={acting !== null || !['queued', 'claimed', 'awaiting_approval', ...devTaskActiveStatuses].includes(detail.task.status)}
                                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <AlertOctagon size={16} />
                                        {acting === 'cancel' ? '取消中...' : '取消任务'}
                                    </button>
                                </div>
                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current Agent</div>
                                        <div className="mt-2 text-lg font-semibold text-slate-900">{detail.task.lastAgentId || 'Not claimed yet'}</div>
                                    </div>
                                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace Key</div>
                                        <div className="mt-2 text-lg font-semibold text-slate-900">{detail.task.workspaceKey}</div>
                                    </div>
                                </div>
                            </article>

                            <article className="rounded-[36px] border border-slate-200 bg-slate-900 p-8 text-white shadow-[0_24px_90px_rgba(15,23,42,0.16)]">
                                <div className="text-sm font-medium uppercase tracking-[0.16em] text-slate-300">AiTool tuning</div>
                                <h2 className="mt-3 text-3xl font-semibold tracking-tight">发起下一轮微调</h2>
                                <p className="mt-4 text-sm leading-8 text-slate-300">
                                    输入新的方向、验收条件或范围变化。若当前任务已结束，会立刻生成新的 revision；若还在运行，则会作为待处理微调请求挂起。
                                </p>
                                <textarea
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    rows={8}
                                    placeholder="例如：保留当前执行结果，但把 Workspace 卡片再压缩到更适合跨设备续接的摘要风格。"
                                    className="mt-6 w-full rounded-[24px] border border-white/15 bg-white/10 px-5 py-4 text-sm leading-7 text-white outline-none placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => void submitTuning()}
                                    disabled={submitting || !currentRevision}
                                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Send size={16} />
                                    {submitting ? '提交中...' : '提交微调'}
                                </button>
                            </article>
                        </section>

                        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                            <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                                <div className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Revisions</div>
                                <div className="mt-4 space-y-4">
                                    {detail.revisions.map((revision) => (
                                        <div key={revision.revisionId} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-lg font-semibold text-slate-900">Revision {revision.revisionNo}</div>
                                                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${devTaskStatusMeta[revision.status].badgeClass}`}>
                                                    {devTaskStatusMeta[revision.status].label}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm leading-7 text-slate-600">{revision.goal}</p>
                                            <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Plan</div>
                                                    <div className="mt-2 text-slate-900">{revision.planSummary || 'No plan summary yet.'}</div>
                                                </div>
                                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Execution</div>
                                                    <div className="mt-2 text-slate-900">{revision.executionSummary || 'No execution summary yet.'}</div>
                                                </div>
                                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Checker</div>
                                                    <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs leading-6 text-slate-700">{JSON.stringify(revision.checkReport || {}, null, 2)}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </article>

                            <div className="grid gap-6">
                                <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                                    <div className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Recent events</div>
                                    <div className="mt-4 space-y-3">
                                        {detail.events.map((event) => (
                                            <div key={event.eventId} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                                <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    <span>{event.eventType}</span>
                                                    <span>{new Date(event.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                                                </div>
                                                <div className="mt-2 text-sm leading-7 text-slate-700">{event.note || 'No note attached.'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </article>

                                <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                                    <div className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Tuning requests</div>
                                    <div className="mt-4 space-y-3">
                                        {detail.tuningRequests.length === 0 ? (
                                            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                                                还没有微调请求。
                                            </div>
                                        ) : detail.tuningRequests.map((request) => (
                                            <div key={request.requestId} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                                <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    <span>{request.requestedFrom}</span>
                                                    <span>{request.status}</span>
                                                </div>
                                                <div className="mt-2 text-sm leading-7 text-slate-700">{request.message}</div>
                                            </div>
                                        ))}
                                    </div>
                                </article>

                                <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                                    <div className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Commands</div>
                                    <div className="mt-4 space-y-3">
                                        {detail.commands.length === 0 ? (
                                            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                                                还没有待处理或历史命令。
                                            </div>
                                        ) : detail.commands.map((command) => (
                                            <div key={command.commandId} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                                <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    <span>{command.type}</span>
                                                    <span>{command.status}</span>
                                                </div>
                                                <div className="mt-2 text-sm leading-7 text-slate-700">
                                                    {command.message || 'No extra message.'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            </div>
                        </section>
                    </>
                ) : null}
            </div>
        </main>
    );
}
