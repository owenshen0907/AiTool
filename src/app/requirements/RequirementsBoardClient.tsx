'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, FileText, FolderKanban, Radar, RefreshCcw, Sparkles } from 'lucide-react';
import { fetchDirectories } from '@/lib/api/directory';
import { fetchContentByDirectory, moveContent, updateContent } from '@/lib/api/content';
import type { ContentItem } from '@/lib/models/content';
import type { DirectoryItem } from '@/lib/models/directory';
import {
    appendRequirementMoveHandoff,
    buildRequirementsDocHref,
    computeRequirementFreshness,
    getRequirementDefaultMoveReason,
    getRequirementDefaultValidationFollowUp,
    requirementFreshnessMeta,
    requirementHandoffSignalFields,
    getRequirementMoveTargetStatuses,
    parseRequirementDocPreview,
    parseRequirementDocMetadata,
    requirementPriorityMeta,
    requirementPreviewFieldMeta,
    requirementStatusFocusFields,
    getRequirementStatusFromDirectoryName,
    requirementStatusMeta,
    requirementStatuses,
    type RequirementDocPreview,
    type RequirementPreviewField,
    requirementTypeMeta,
    type RequirementDocMetadata,
    type RequirementStatus,
} from '@/lib/requirements';

interface RequirementsBootstrapResponse {
    error?: string;
}

interface RequirementsBoardItem {
    id: string;
    title: string;
    summary: string;
    body: string;
    updatedAt: string;
    href: string;
    directoryId: string;
    directoryName: string;
    metadata: RequirementDocMetadata;
    preview: RequirementDocPreview;
}

interface RequirementsBoardState {
    itemsByStatus: Record<RequirementStatus, RequirementsBoardItem[]>;
    directoryIdByStatus: Record<RequirementStatus, string | null>;
    documentCount: number;
    directoryCount: number;
}

function createEmptyBoardState(): RequirementsBoardState {
    return {
        itemsByStatus: {
            inbox: [],
            shaping: [],
            ready: [],
            doing: [],
            validating: [],
            archived: [],
        },
        directoryIdByStatus: {
            inbox: null,
            shaping: null,
            ready: null,
            doing: null,
            validating: null,
            archived: null,
        },
        documentCount: 0,
        directoryCount: 0,
    };
}

function formatUpdatedAt(value: string) {
    try {
        return new Intl.DateTimeFormat('zh-CN', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Tokyo',
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function toBoardItems(directory: DirectoryItem, items: ContentItem[]) {
    return items.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary?.trim() || '打开文档补充背景、范围和验证记录。',
        body: item.body ?? '',
        updatedAt: item.updatedAt,
        href: buildRequirementsDocHref(directory.id, item.id),
        directoryId: directory.id,
        directoryName: directory.name,
        metadata: parseRequirementDocMetadata(item.body),
        preview: parseRequirementDocPreview(item.body),
    }));
}

function getBoardPreviewEntries(status: RequirementStatus, preview: RequirementDocPreview) {
    const focusedFields = requirementStatusFocusFields[status];
    const focusedEntries = focusedFields.flatMap((field) => {
        const value = preview[field];
        if (!value) return [];

        return [
            {
                field,
                label: requirementPreviewFieldMeta[field].label,
                value,
                isFallback: false,
            },
        ];
    });

    if (focusedEntries.length > 0) {
        return focusedEntries;
    }

    const fallbackFields = (Object.keys(requirementPreviewFieldMeta) as RequirementPreviewField[])
        .filter((field) => !focusedFields.includes(field))
        .filter((field) => Boolean(preview[field]))
        .slice(0, 2);

    return fallbackFields.map((field) => ({
        field,
        label: requirementPreviewFieldMeta[field].label,
        value: preview[field] ?? '',
        isFallback: true,
    }));
}

function splitBoardPreviewEntries(
    entries: ReturnType<typeof getBoardPreviewEntries>
) {
    const handoffFieldSet = new Set<RequirementPreviewField>(requirementHandoffSignalFields);

    return {
        handoffEntries: entries.filter((entry) => handoffFieldSet.has(entry.field)),
        regularEntries: entries.filter((entry) => !handoffFieldSet.has(entry.field)),
    };
}

export default function RequirementsBoardClient() {
    const [boardState, setBoardState] = useState<RequirementsBoardState>(createEmptyBoardState);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [noticeMessage, setNoticeMessage] = useState('');
    const [movingItemId, setMovingItemId] = useState('');
    const [moveTargetByItemId, setMoveTargetByItemId] = useState<Record<string, RequirementStatus>>(
        {}
    );
    const [moveReasonByItemId, setMoveReasonByItemId] = useState<Record<string, string>>({});
    const [moveValidationByItemId, setMoveValidationByItemId] = useState<Record<string, string>>({});
    const [handoffEditorItemId, setHandoffEditorItemId] = useState('');
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const loadBoard = async () => {
            setIsLoading(true);
            setErrorMessage('');

            try {
                let directories = await fetchDirectories('requirements');
                let matchedDirectories = directories.filter((directory) =>
                    Boolean(getRequirementStatusFromDirectoryName(directory.name))
                );

                if (matchedDirectories.length === 0) {
                    const response = await fetch('/api/requirements/bootstrap', {
                        method: 'POST',
                    });
                    const payload = (await response.json().catch(() => null)) as RequirementsBootstrapResponse | null;
                    if (!response.ok) {
                        throw new Error(payload?.error || '初始化 Requirements 看板失败');
                    }

                    directories = await fetchDirectories('requirements');
                    matchedDirectories = directories.filter((directory) =>
                        Boolean(getRequirementStatusFromDirectoryName(directory.name))
                    );
                }

                const itemsByStatus = createEmptyBoardState().itemsByStatus;
                const directoryIdByStatus = createEmptyBoardState().directoryIdByStatus;
                const contentResults = await Promise.all(
                    matchedDirectories.map(async (directory) => ({
                        directory,
                        items: await fetchContentByDirectory('requirements', directory.id),
                    }))
                );

                let documentCount = 0;

                for (const result of contentResults) {
                    const status = getRequirementStatusFromDirectoryName(result.directory.name);
                    if (!status) continue;

                    directoryIdByStatus[status] = result.directory.id;
                    const boardItems = toBoardItems(result.directory, result.items);
                    documentCount += boardItems.length;
                    itemsByStatus[status].push(...boardItems);
                }

                for (const status of requirementStatuses) {
                    itemsByStatus[status].sort((left, right) =>
                        right.updatedAt.localeCompare(left.updatedAt)
                    );
                }

                if (cancelled) return;

                setBoardState({
                    itemsByStatus,
                    directoryIdByStatus,
                    documentCount,
                    directoryCount: matchedDirectories.length,
                });
            } catch (error) {
                if (cancelled) return;
                setErrorMessage(
                    error instanceof Error ? error.message : '加载 Requirements 看板失败'
                );
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadBoard();

        return () => {
            cancelled = true;
        };
    }, [reloadToken]);

    const getAvailableMoveStatuses = (status: RequirementStatus) =>
        getRequirementMoveTargetStatuses(status).filter(
            (targetStatus) => Boolean(boardState.directoryIdByStatus[targetStatus])
        );

    const getSelectedMoveStatus = (
        itemId: string,
        status: RequirementStatus
    ): RequirementStatus | null => {
        const availableStatuses = getAvailableMoveStatuses(status);
        if (availableStatuses.length === 0) {
            return null;
        }

        const selectedStatus = moveTargetByItemId[itemId];
        if (selectedStatus && availableStatuses.includes(selectedStatus)) {
            return selectedStatus;
        }

        return availableStatuses[0];
    };

    const handleMoveTargetChange = (
        itemId: string,
        targetStatus: RequirementStatus | ''
    ) => {
        setMoveTargetByItemId((current) => {
            const next = { ...current };
            if (!targetStatus) {
                delete next[itemId];
                return next;
            }

            next[itemId] = targetStatus;
            return next;
        });
        setMoveReasonByItemId((current) => {
            const next = { ...current };
            delete next[itemId];
            return next;
        });
        setMoveValidationByItemId((current) => {
            const next = { ...current };
            delete next[itemId];
            return next;
        });
    };

    const handleMoveReasonChange = (itemId: string, value: string) => {
        setMoveReasonByItemId((current) => ({
            ...current,
            [itemId]: value,
        }));
    };

    const handleMoveValidationChange = (itemId: string, value: string) => {
        setMoveValidationByItemId((current) => ({
            ...current,
            [itemId]: value,
        }));
    };

    const resetMoveDraft = (itemId: string) => {
        handleMoveTargetChange(itemId, '');
        setHandoffEditorItemId((current) => (current === itemId ? '' : current));
    };

    const toggleHandoffEditor = (itemId: string) => {
        setHandoffEditorItemId((current) => (current === itemId ? '' : itemId));
    };

    const handleMoveToStatus = async (
        item: RequirementsBoardItem,
        status: RequirementStatus,
        targetStatus: RequirementStatus
    ) => {
        const targetDirectoryId = boardState.directoryIdByStatus[targetStatus];
        if (!targetDirectoryId) {
            setErrorMessage(`缺少 ${requirementStatusMeta[targetStatus].label} 目录，无法迁移。`);
            return;
        }

        const reason = moveReasonByItemId[item.id]
            ?? getRequirementDefaultMoveReason(status, targetStatus);
        const validationFollowUp = moveValidationByItemId[item.id]
            ?? getRequirementDefaultValidationFollowUp(targetStatus);
        const nextBody = appendRequirementMoveHandoff(item.body, {
            fromStatus: status,
            toStatus: targetStatus,
            reason,
            validationFollowUp,
        });

        setMovingItemId(item.id);
        setErrorMessage('');
        setNoticeMessage('');
        try {
            await moveContent('requirements', item.id, targetDirectoryId);
            try {
                await updateContent('requirements', {
                    id: item.id,
                    body: nextBody,
                });
                setNoticeMessage(
                    `已将「${item.title}」移到 ${requirementStatusMeta[targetStatus].label}，并写入 handoff context。`
                );
            } catch (error) {
                setNoticeMessage(
                    `已将「${item.title}」移到 ${requirementStatusMeta[targetStatus].label}，但 handoff context 保存失败：${error instanceof Error ? error.message : '未知错误'}`
                );
            }
            resetMoveDraft(item.id);
            setReloadToken((value) => value + 1);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : '迁移需求状态失败');
        } finally {
            setMovingItemId('');
        }
    };

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_42%,#ffffff_100%)] px-4 py-10 md:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                    <article className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
                        <div className="bg-[radial-gradient(circle_at_top_left,#dce9fb_0%,#edf4fb_42%,#ffffff_100%)] px-6 py-8 md:px-10 md:py-10">
                            <div className="inline-flex items-center rounded-full border border-sky-200 bg-white/85 px-4 py-2 text-sm font-medium text-sky-700">
                                Requirements Space / Internal Product Ops
                            </div>
                            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                                把 AiTool 的下一步，直接放进 AiTool 里推进
                            </h1>
                            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                                这版看板不再依赖静态 seed 条目，而是直接从 requirements 文档空间读取真实目录和需求文档。总览和详情现在共用同一份数据，并开始从正文同时提取 Meta 与验证向预览信息。
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href="/workspace"
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                                >
                                    返回 Workspace
                                    <ArrowRight size={16} />
                                </Link>
                                <Link
                                    href="/roadmap"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    查看系统规划
                                </Link>
                                <Link
                                    href="/requirements/content"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    打开需求文档空间
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </article>

                    <article className="rounded-[36px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.18)] md:p-8">
                        <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-slate-300">
                            <FolderKanban size={16} />
                            This Iteration
                        </div>
                        <div className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
                            让看板直接反映真实需求文档
                        </div>
                        <div className="mt-6 space-y-4">
                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                                    Current Move
                                </div>
                                <p className="mt-3 text-sm leading-7 text-slate-200">
                                    看板现在直接读取 `/requirements/content` 背后的目录和需求文档，并允许在卡片内直接选择目标生命周期状态、补轻量交接说明，然后直接迁移。
                                </p>
                            </div>
                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                                    Why Small
                                </div>
                                <p className="mt-3 text-sm leading-7 text-slate-200">
                                    继续复用目录名和共享迁移逻辑，不急着提前引入更多字段、审批流或单独的 requirements 表结构。
                                </p>
                            </div>
                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                                    Next Hook
                                </div>
                                <p className="mt-3 text-sm leading-7 text-slate-200">
                                    Doing / Validating 卡片已经开始用紧凑的 handoff rail 表达交接时间、迁移方向和验证提示；下一步把 handoff 时间转成更直接的 freshness 提示。
                                </p>
                            </div>
                        </div>
                    </article>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <article className="animate-fade-in-up stagger-1 card-hover rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                        <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                            <Sparkles size={16} />
                            Requirement Docs
                        </div>
                        <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                            {isLoading ? '...' : boardState.documentCount}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                            当前状态看板直接聚合真实需求文档，并展示从正文解析出的轻量元数据、场景、风险和下一步线索。
                        </p>
                    </article>

                    <article className="animate-fade-in-up stagger-2 card-hover rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                        <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                            <Radar size={16} />
                            Status Folders
                        </div>
                        <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                            {isLoading ? '...' : boardState.directoryCount}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                            看板通过目录名映射生命周期状态，先保持实现最小且可持续演进。
                        </p>
                    </article>

                    <article className="animate-fade-in-up stagger-3 card-hover rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                        <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                            Lifecycle
                        </div>
                        <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                            6 States
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                            Inbox / Shaping / Ready / Doing / Validating / Archived 已开始由真实目录驱动。
                        </p>
                    </article>

                    <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:col-span-3">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                    <FileText size={16} />
                                    Requirement Docs
                                </div>
                                <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                                    看板卡片已经回链到真实需求文档
                                </div>
                                <p className="mt-3 text-sm leading-7 text-slate-600">
                                    现在从看板点击卡片，会直接打开 `/requirements/content` 里的对应文档，不再是孤立的说明卡片。
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => setReloadToken((value) => value + 1)}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    <RefreshCcw size={16} />
                                    刷新看板
                                </button>
                                <Link
                                    href="/requirements/content"
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                                >
                                    进入需求文档空间
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </article>
                </section>

                <section className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                Status Board
                            </div>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                                需求状态看板
                            </h2>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                                看板现在直接消费需求目录与需求文档。当前除了 `type / priority / related route`，还会按状态强调不同预览字段，并允许卡片直接迁移到任意目标状态，同时把轻量 handoff context 写回正文；Doing / Validating 也开始用紧凑 rail 显示 handoff 信号。
                            </p>
                        </div>
                    </div>

                    {errorMessage ? (
                        <div className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 p-6">
                            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">
                                Board Load Failed
                            </div>
                            <p className="mt-3 text-sm leading-7 text-rose-700">
                                {errorMessage}
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => setReloadToken((value) => value + 1)}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                                >
                                    <RefreshCcw size={16} />
                                    重试加载
                                </button>
                                <Link
                                    href="/requirements/content"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    打开需求文档空间
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ) : null}
                    {noticeMessage ? (
                        <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 text-sm leading-7 text-emerald-700">
                            {noticeMessage}
                        </div>
                    ) : null}

                    <div className="mt-6 overflow-x-auto pb-2">
                        <div className="grid min-w-[1720px] gap-4 xl:min-w-0 xl:grid-cols-6">
                            {requirementStatuses.map((status) => {
                                const meta = requirementStatusMeta[status];
                                const items = boardState.itemsByStatus[status];

                                return (
                                    <article
                                        key={status}
                                        className={`rounded-[28px] border p-4 ${meta.panelClass}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}
                                                >
                                                    {meta.label}
                                                </span>
                                                <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
                                                    {isLoading ? '...' : `${items.length} 项`}
                                                </h3>
                                            </div>
                                            <div className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                {status}
                                            </div>
                                        </div>
                                        <p className="mt-3 text-sm leading-7 text-slate-600">
                                            {meta.description}
                                        </p>

                                        <div className="mt-5 space-y-4">
                                            {isLoading ? (
                                                <div className="space-y-3">
                                                    {[1, 2].map((n) => (
                                                        <div key={n} className="animate-pulse rounded-[24px] border border-white/80 bg-white p-4">
                                                            <div className="h-3 w-16 rounded-full bg-slate-200" />
                                                            <div className="mt-3 h-4 w-3/4 rounded-full bg-slate-200" />
                                                            <div className="mt-2 h-3 w-full rounded-full bg-slate-100" />
                                                            <div className="mt-1 h-3 w-2/3 rounded-full bg-slate-100" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : items.length > 0 ? (
                                                items.map((item) => {
                                                    const freshness = (status === 'doing' || status === 'validating')
                                                        ? computeRequirementFreshness(item.preview.latestHandoffAt, item.updatedAt)
                                                        : null;
                                                    const previewEntries = getBoardPreviewEntries(status, item.preview);
                                                    const { handoffEntries, regularEntries } =
                                                        splitBoardPreviewEntries(previewEntries);
                                                    const availableMoveStatuses =
                                                        getAvailableMoveStatuses(status);
                                                    const selectedMoveStatus = getSelectedMoveStatus(
                                                        item.id,
                                                        status
                                                    );
                                                    const moveReason = selectedMoveStatus
                                                        ? moveReasonByItemId[item.id]
                                                            ?? getRequirementDefaultMoveReason(
                                                                status,
                                                                selectedMoveStatus
                                                            )
                                                        : '';
                                                    const moveValidationFollowUp = selectedMoveStatus
                                                        ? moveValidationByItemId[item.id]
                                                            ?? getRequirementDefaultValidationFollowUp(
                                                                selectedMoveStatus
                                                            )
                                                        : '';
                                                    const showHandoffEditor =
                                                        handoffEditorItemId === item.id;

                                                    return (
                                                        <article
                                                            key={item.id}
                                                            className="link-card-hover block rounded-[24px] border border-white/80 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:border-slate-300 hover:bg-slate-50"
                                                        >
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="inline-flex rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                                    {item.directoryName}
                                                                </span>
                                                                {item.metadata.type ? (
                                                                    <span
                                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${requirementTypeMeta[item.metadata.type].badgeClass}`}
                                                                    >
                                                                        {requirementTypeMeta[item.metadata.type].label}
                                                                    </span>
                                                                ) : null}
                                                                {item.metadata.priority ? (
                                                                    <span
                                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${requirementPriorityMeta[item.metadata.priority].badgeClass}`}
                                                                    >
                                                                        {requirementPriorityMeta[item.metadata.priority].label}
                                                                    </span>
                                                                ) : null}
                                                                {freshness ? (
                                                                    <span
                                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${requirementFreshnessMeta[freshness].badgeClass}`}
                                                                    >
                                                                        {freshness === 'fresh' ? '🟢' : freshness === 'aging' ? '🟡' : '🔴'}{' '}
                                                                        {requirementFreshnessMeta[freshness].label}
                                                                    </span>
                                                                ) : null}
                                                                {!item.metadata.type && !item.metadata.priority && !item.metadata.relatedRoute ? (
                                                                    <span className="inline-flex rounded-full border border-dashed border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500">
                                                                        Meta 待补充
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <h4 className="mt-4 text-lg font-semibold leading-7 text-slate-900">
                                                                {item.title}
                                                            </h4>
                                                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                                                {item.summary}
                                                            </p>
                                                            {handoffEntries.length > 0 ? (
                                                                <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 p-3">
                                                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                                        Handoff Signals
                                                                    </div>
                                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                                        {handoffEntries
                                                                            .filter(
                                                                                (entry) =>
                                                                                    entry.field !==
                                                                                    'latestHandoffValidateNext'
                                                                            )
                                                                            .map((entry) => (
                                                                                <span
                                                                                    key={entry.field}
                                                                                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600"
                                                                                >
                                                                                    {entry.value}
                                                                                </span>
                                                                            ))}
                                                                    </div>
                                                                    {handoffEntries
                                                                        .filter(
                                                                            (entry) =>
                                                                                entry.field ===
                                                                                'latestHandoffValidateNext'
                                                                        )
                                                                        .map((entry) => (
                                                                            <div
                                                                                key={entry.field}
                                                                                className="mt-3 rounded-[14px] border border-white bg-white px-3 py-2 text-xs leading-6 text-slate-600"
                                                                            >
                                                                                <div className="font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                                                    {entry.label}
                                                                                </div>
                                                                                <div className="mt-1">
                                                                                    {entry.value}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            ) : null}
                                                            {regularEntries.length > 0 ? (
                                                                regularEntries.map((entry) => (
                                                                    <div key={entry.field}>
                                                                        <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                                            <span>{entry.label}</span>
                                                                            {entry.isFallback ? (
                                                                                <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium tracking-[0.12em] text-slate-500">
                                                                                    Fallback
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                        <div className="mt-1 rounded-[16px] bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                                                            {entry.value}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                handoffEntries.length === 0 ? (
                                                                    <div className="mt-4 rounded-[16px] border border-dashed border-slate-200 px-3 py-2 text-xs leading-6 text-slate-500">
                                                                        当前状态重点字段还没补齐。
                                                                    </div>
                                                                ) : null
                                                            )}
                                                            {item.metadata.relatedRoute ? (
                                                                <>
                                                                    <div className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                                        Related Route
                                                                    </div>
                                                                    <div className="mt-1 rounded-[16px] bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                                                        {item.metadata.relatedRoute}
                                                                    </div>
                                                                </>
                                                            ) : null}
                                                            <div className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                                Updated
                                                            </div>
                                                            <div className="mt-1 text-sm text-slate-600">
                                                                {formatUpdatedAt(item.updatedAt)}
                                                            </div>
                                                            <div className="mt-4 flex flex-wrap gap-3">
                                                                {availableMoveStatuses.length > 0 ? (
                                                                    <>
                                                                        <select
                                                                            value={selectedMoveStatus ?? ''}
                                                                            onChange={(event) =>
                                                                                handleMoveTargetChange(
                                                                                    item.id,
                                                                                    event.target
                                                                                        .value as RequirementStatus
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                movingItemId === item.id
                                                                            }
                                                                            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        >
                                                                            {availableMoveStatuses.map(
                                                                                (targetStatus) => (
                                                                                    <option
                                                                                        key={targetStatus}
                                                                                        value={targetStatus}
                                                                                    >
                                                                                        移到{' '}
                                                                                        {
                                                                                            requirementStatusMeta[
                                                                                                targetStatus
                                                                                            ].label
                                                                                        }
                                                                                    </option>
                                                                                )
                                                                            )}
                                                                        </select>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                selectedMoveStatus
                                                                                    ? void handleMoveToStatus(
                                                                                        item,
                                                                                        status,
                                                                                        selectedMoveStatus
                                                                                    )
                                                                                    : undefined
                                                                            }
                                                                            disabled={
                                                                                movingItemId === item.id ||
                                                                                !selectedMoveStatus
                                                                            }
                                                                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        >
                                                                            <ArrowRight size={14} />
                                                                            {movingItemId === item.id
                                                                                ? '移动中...'
                                                                                : '移动状态'}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                toggleHandoffEditor(item.id)
                                                                            }
                                                                            disabled={
                                                                                movingItemId === item.id ||
                                                                                !selectedMoveStatus
                                                                            }
                                                                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        >
                                                                            {showHandoffEditor
                                                                                ? '收起交接'
                                                                                : '交接说明'}
                                                                        </button>
                                                                    </>
                                                                ) : null}
                                                                <Link
                                                                    href={item.href}
                                                                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                                                                >
                                                                    打开需求文档
                                                                    <ArrowRight size={14} />
                                                                </Link>
                                                            </div>
                                                            {showHandoffEditor && selectedMoveStatus ? (
                                                                <div className="mt-4 space-y-3 rounded-[20px] border border-slate-200 bg-slate-50 p-3">
                                                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                        Move Handoff
                                                                    </div>
                                                                    <label className="block">
                                                                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                                            Why This Move
                                                                        </span>
                                                                        <input
                                                                            value={moveReason}
                                                                            onChange={(event) =>
                                                                                handleMoveReasonChange(
                                                                                    item.id,
                                                                                    event.target.value
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                movingItemId === item.id
                                                                            }
                                                                            className="w-full rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        />
                                                                    </label>
                                                                    <label className="block">
                                                                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                                            Validate Next
                                                                        </span>
                                                                        <input
                                                                            value={moveValidationFollowUp}
                                                                            onChange={(event) =>
                                                                                handleMoveValidationChange(
                                                                                    item.id,
                                                                                    event.target.value
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                movingItemId === item.id
                                                                            }
                                                                            className="w-full rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        />
                                                                    </label>
                                                                    <div className="text-xs leading-6 text-slate-500">
                                                                        不填写也会写入默认 handoff；这里主要用来补“为什么移动”和“下一步验证什么”。
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </article>
                                                    );
                                                })
                                            ) : (
                                                <div className="rounded-[24px] border border-dashed border-white/80 bg-white/80 p-4 text-sm leading-7 text-slate-500">
                                                    当前列还没有真实需求文档。可以去需求文档空间继续补充。
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
