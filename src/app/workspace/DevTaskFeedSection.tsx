'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ActivitySquare, ArrowRight, RefreshCw } from 'lucide-react';
import { createDevTask, fetchDevTaskFeed } from '@/lib/api/devTasks';
import { devTaskPriorityMeta, devTaskStatusMeta } from '@/lib/devTasks/meta';
import type { DevTaskFeedCard } from '@/lib/models/devTask';

export default function DevTaskFeedSection() {
    const [cards, setCards] = useState<DevTaskFeedCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        projectSlug: '',
        projectName: '',
        workspaceKey: '',
        goal: '',
        templateId: 'plan-execute',
        priority: 'normal' as 'low' | 'normal' | 'high',
        allowedDeviceType: 'any' as 'work' | 'personal' | 'any',
    });

    async function load() {
        try {
            setLoading(true);
            setError(null);
            setCards(await fetchDevTaskFeed());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load task feed');
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
    }, []);

    async function handleCreateTask() {
        if (!form.projectSlug.trim() || !form.projectName.trim() || !form.workspaceKey.trim() || !form.goal.trim()) {
            setError('请先补齐 project slug、project name、workspace key 和 goal。');
            return;
        }

        try {
            setCreating(true);
            setError(null);
            await createDevTask({
                projectSlug: form.projectSlug.trim(),
                projectName: form.projectName.trim(),
                workspaceKey: form.workspaceKey.trim(),
                goal: form.goal.trim(),
                templateId: form.templateId,
                priority: form.priority,
                allowedDeviceTypes: [form.allowedDeviceType],
            });
            setForm((current) => ({ ...current, goal: '' }));
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create task');
        } finally {
            setCreating(false);
        }
    }

    return (
        <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-2xl bg-rose-100 p-3 text-rose-700">
                        <ActivitySquare size={22} />
                    </div>
                    <div>
                        <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                            Shared Task Progress
                        </div>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                            MainTask Agent 正在推进的项目任务
                        </h2>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => void load()}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                    <RefreshCw size={16} />
                    刷新
                </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
                这里展示的是 AiTool 共享任务池里的按项目最新卡片：当前阶段、最近 Agent、执行摘要、下一步，以及是否已经进入需要微调的状态。
            </p>

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                    Create From AiTool
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <input
                        value={form.projectSlug}
                        onChange={(event) => setForm((current) => ({ ...current, projectSlug: event.target.value }))}
                        placeholder="project slug"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                    />
                    <input
                        value={form.projectName}
                        onChange={(event) => setForm((current) => ({ ...current, projectName: event.target.value }))}
                        placeholder="project name"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                    />
                    <input
                        value={form.workspaceKey}
                        onChange={(event) => setForm((current) => ({ ...current, workspaceKey: event.target.value }))}
                        placeholder="workspace key"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                    />
                    <select
                        value={form.allowedDeviceType}
                        onChange={(event) => setForm((current) => ({ ...current, allowedDeviceType: event.target.value as typeof current.allowedDeviceType }))}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                    >
                        <option value="any">any device</option>
                        <option value="personal">personal</option>
                        <option value="work">work</option>
                    </select>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_180px_180px]">
                    <textarea
                        value={form.goal}
                        onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
                        rows={4}
                        placeholder="Describe the task goal you want a MainTask Agent to claim."
                        className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700 outline-none"
                    />
                    <select
                        value={form.templateId}
                        onChange={(event) => setForm((current) => ({ ...current, templateId: event.target.value }))}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                    >
                        <option value="plan-execute">plan-execute</option>
                        <option value="code-review">code-review</option>
                    </select>
                    <div className="flex flex-col gap-3">
                        <select
                            value={form.priority}
                            onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as typeof current.priority }))}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                        >
                            <option value="normal">normal priority</option>
                            <option value="high">high priority</option>
                            <option value="low">low priority</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => void handleCreateTask()}
                            disabled={creating}
                            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {creating ? 'Creating...' : 'Create shared task'}
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    正在拉取共享任务进度...
                </div>
            ) : error ? (
                <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                    {error}
                </div>
            ) : cards.length === 0 ? (
                <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    还没有共享任务。可以先在 MainTask 创建并 Queue，或者从 AiTool 接口写入一条任务。
                </div>
            ) : (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    {cards.map((card) => {
                        const statusMeta = devTaskStatusMeta[card.status];
                        const priorityMeta = devTaskPriorityMeta[card.priority];
                        const summary = card.executionSummary || card.planSummary || card.lastStatusNote || '还没有摘要。';
                        const score = typeof card.checkReport?.score === 'number' ? card.checkReport.score : null;
                        return (
                            <Link
                                key={card.taskId}
                                href={`/dev-tasks/${card.taskId}`}
                                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                                            {card.projectName}
                                        </div>
                                        <div className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                                            Revision {card.revisionNo}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}>
                                            {statusMeta.label}
                                        </span>
                                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityMeta.badgeClass}`}>
                                            {priorityMeta.label}
                                        </span>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm leading-7 text-slate-600">
                                    {summary}
                                </p>
                                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Agent</div>
                                        <div className="mt-2 font-medium text-slate-900">
                                            {card.assignedAgentId || 'Waiting'}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Next Step</div>
                                        <div className="mt-2 font-medium text-slate-900">
                                            {card.nextStep || 'Open detail for the latest update.'}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-500">
                                    <span>{card.deviceType ? `Device: ${card.deviceType}` : 'Device pending'}</span>
                                    <span>{score !== null ? `Checker ${score}` : 'Checker pending'}</span>
                                    <span className="inline-flex items-center gap-1 text-slate-700">
                                        查看详情
                                        <ArrowRight size={16} />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </article>
    );
}
