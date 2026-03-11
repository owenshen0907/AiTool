'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FileText, FolderPlus, Save, Sparkles, Trash2 } from 'lucide-react';
import type { ContentItem } from '@/lib/models/content';
import type { DirectoryItem } from '@/lib/models/directory';
import {
    appendRequirementMoveHandoff,
    buildRequirementMetadataBlock,
    getRequirementDefaultMoveReason,
    getRequirementDefaultValidationFollowUp,
    getRequirementMoveTargetStatuses,
    getRequirementStatusFromDirectoryName,
    hasRequirementDocMetadata,
    parseRequirementDocPreview,
    parseRequirementDocMetadata,
    requirementPriorityMeta,
    requirementPreviewFieldMeta,
    requirementStatusFocusFields,
    requirementStatusMeta,
    requirementTypeMeta,
    type RequirementStatus,
} from '@/lib/requirements';

interface RequirementStatusTarget {
    status: RequirementStatus;
    directoryId: string;
    directoryName: string;
    label: string;
    description: string;
}

interface RequirementsContentPanelProps {
    currentDir: string | null;
    currentDirectory: DirectoryItem | null;
    statusTargets: RequirementStatusTarget[];
    visibleItems: ContentItem[];
    selectedItem: ContentItem | null;
    onSelectItem: (id: string) => void;
    onCreateItem: () => Promise<void> | void;
    onUpdateItem: (
        item: ContentItem,
        patch: { title?: string; summary?: string; body?: string }
    ) => Promise<void>;
    onDeleteItem: (id: string) => Promise<void>;
    onMoveItem: (item: ContentItem, newDirId: string) => Promise<void>;
}

const suggestedSections = [
    'Meta: 用 Type / Priority / Related Route 让看板直接读取轻量结构化信息。',
    'Scene: 说明这条需求落在哪个页面、用户流或工作场景。',
    'Background: 这个需求为什么出现，当前卡点是什么。',
    'Expected Value: 做完后能减少什么摩擦，增加什么日常价值。',
    'Validation Result: 记录已经做过的检查、通过项和剩余风险。',
    'User Impact: 说明这次变化最终影响了谁、影响了什么行为。',
    'Handoff Log: 记录状态迁移时的原因与下一轮验证点，避免切状态后上下文丢失。',
    'Open Risks: 记录还没验证完的边界条件和遗留风险。',
    'Next Step: 明确这条需求下一轮应该接什么，不让状态停在半空。',
    'Scope: 这轮明确要做和不做的边界。',
    'Related Routes: 关联页面、入口、回链位置。',
];

export default function RequirementsContentPanel({
    currentDir,
    currentDirectory,
    statusTargets,
    visibleItems,
    selectedItem,
    onSelectItem,
    onCreateItem,
    onUpdateItem,
    onDeleteItem,
    onMoveItem,
}: RequirementsContentPanelProps) {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [body, setBody] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [moveTargetDirId, setMoveTargetDirId] = useState('');
    const [moveReason, setMoveReason] = useState('');
    const [moveValidationFollowUp, setMoveValidationFollowUp] = useState('');
    const [saveMessage, setSaveMessage] = useState('');
    const metadata = parseRequirementDocMetadata(body);
    const preview = parseRequirementDocPreview(body);
    const metadataConfigured = hasRequirementDocMetadata(body);
    const currentStatus = currentDirectory ? getRequirementStatusFromDirectoryName(currentDirectory.name) : null;
    const focusedPreviewFields = currentStatus ? requirementStatusFocusFields[currentStatus] : [];
    const focusedPreviewEntries = focusedPreviewFields.flatMap((field) => {
        const value = preview[field];
        if (!value) return [];

        return [
            {
                field,
                label: requirementPreviewFieldMeta[field].label,
                value,
            },
        ];
    });
    const hasUnsavedChanges = Boolean(
        selectedItem &&
        (
            title !== (selectedItem.title ?? '') ||
            summary !== (selectedItem.summary ?? '') ||
            body !== (selectedItem.body ?? '')
        )
    );
    const availableMoveTargets = useMemo(
        () => statusTargets.filter((target) => target.directoryId !== currentDirectory?.id),
        [statusTargets, currentDirectory?.id]
    );
    const availableMoveTargetKey = availableMoveTargets
        .map((target) => `${target.status}:${target.directoryId}`)
        .join('|');

    const applyMoveContextDefaults = (targetStatus: RequirementStatus) => {
        setMoveReason(getRequirementDefaultMoveReason(currentStatus, targetStatus));
        setMoveValidationFollowUp(getRequirementDefaultValidationFollowUp(targetStatus));
    };

    useEffect(() => {
        setTitle(selectedItem?.title ?? '');
        setSummary(selectedItem?.summary ?? '');
        setBody(selectedItem?.body ?? '');
        setSaveMessage('');
    }, [selectedItem?.id]);

    useEffect(() => {
        if (!selectedItem || availableMoveTargets.length === 0) {
            setMoveTargetDirId('');
            setMoveReason('');
            setMoveValidationFollowUp('');
            return;
        }

        if (currentStatus) {
            const suggestedTarget = getRequirementMoveTargetStatuses(currentStatus)
                .map((status) => availableMoveTargets.find((target) => target.status === status))
                .find(Boolean);

            const target = suggestedTarget ?? availableMoveTargets[0];
            setMoveTargetDirId(target.directoryId);
            applyMoveContextDefaults(target.status);
            return;
        }

        setMoveTargetDirId(availableMoveTargets[0].directoryId);
        applyMoveContextDefaults(availableMoveTargets[0].status);
    }, [selectedItem?.id, currentDirectory?.id, currentStatus, availableMoveTargetKey]);

    const handleMoveTargetChange = (newDirId: string) => {
        setMoveTargetDirId(newDirId);
        const target = statusTargets.find((item) => item.directoryId === newDirId);
        if (target) {
            applyMoveContextDefaults(target.status);
        }
    };

    const handleSave = async () => {
        if (!selectedItem) return;

        setIsSaving(true);
        setSaveMessage('');
        try {
            await onUpdateItem(selectedItem, {
                title: title.trim(),
                summary: summary.trim(),
                body: body.trim(),
            });
            setSaveMessage('已保存');
        } catch (error) {
            setSaveMessage(error instanceof Error ? error.message : '保存失败');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInsertMetadataTemplate = () => {
        setBody((currentBody) => {
            const metadataBlock = buildRequirementMetadataBlock();
            if (!currentBody.trim()) {
                return `${metadataBlock}\n\n`;
            }

            return `${metadataBlock}\n\n${currentBody.trim()}`;
        });
        setSaveMessage('已插入 Meta 模板，保存后看板即可读取。');
    };

    const handleMove = async () => {
        if (!selectedItem || !moveTargetDirId) return;

        if (hasUnsavedChanges) {
            setSaveMessage('请先保存当前修改，再移动需求状态。');
            return;
        }

        const target = statusTargets.find((item) => item.directoryId === moveTargetDirId);
        if (!target) {
            setSaveMessage('目标状态目录不存在。');
            return;
        }

        const nextBody = appendRequirementMoveHandoff(body, {
            fromStatus: currentStatus,
            toStatus: target.status,
            reason: moveReason,
            validationFollowUp: moveValidationFollowUp,
        });

        setIsMoving(true);
        setSaveMessage('');
        try {
            await onMoveItem(selectedItem, moveTargetDirId);
            try {
                await onUpdateItem(selectedItem, { body: nextBody });
                setBody(nextBody);
                setSaveMessage(`已移动到 ${target.label}，并写入交接说明。`);
            } catch (error) {
                setSaveMessage(
                    `已移动到 ${target.label}，但交接说明保存失败：${error instanceof Error ? error.message : '未知错误'}`
                );
            }
        } catch (error) {
            setSaveMessage(error instanceof Error ? error.message : '移动状态失败');
        } finally {
            setIsMoving(false);
        }
    };

    if (!currentDir && visibleItems.length === 0) {
        return (
            <div className="flex min-h-full items-center justify-center p-6">
                <div className="max-w-3xl rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-8 shadow-[0_22px_80px_rgba(15,23,42,0.08)] md:p-10">
                    <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                        需求文档空间
                    </div>
                    <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                        这里开始承接真实的需求说明和验证记录
                    </h2>
                    <p className="mt-5 text-base leading-8 text-slate-600">
                        左侧目录树已经复用现有目录布局。先创建一个目录，再在目录里新增需求文档，就可以把需求背景、范围、验证备注和相关路由沉淀进 AiTool 自己的工作流。
                    </p>
                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                <FolderPlus size={16} />
                                建议目录
                            </div>
                            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                                <div className="rounded-2xl bg-white px-4 py-3">待处理</div>
                                <div className="rounded-2xl bg-white px-4 py-3">待开始</div>
                                <div className="rounded-2xl bg-white px-4 py-3">开发中</div>
                                <div className="rounded-2xl bg-white px-4 py-3">验证中</div>
                            </div>
                        </div>
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                <FileText size={16} />
                                起始模板
                            </div>
                            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                                {suggestedSections.slice(0, 3).map((section) => (
                                    <div key={section} className="rounded-2xl bg-white px-4 py-3">
                                        {section}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            href="/requirements"
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                        >
                            返回需求看板
                            <ArrowRight size={16} />
                        </Link>
                        <div className="inline-flex items-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600">
                            在左侧点“＋目录”开始搭结构
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedItem) {
        return (
            <div className="min-h-full space-y-6 p-4 md:p-6">
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                需求文档
                            </div>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                                当前目录下的需求文档
                            </h2>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                                这里开始复用现有内容系统，单条需求可以记录背景、范围、验证方式和回链路由。正文里的元信息区块会被 `/requirements` 看板直接读取。
                            </p>
                        </div>
                        {currentDir ? (
                            <button
                                type="button"
                                onClick={() => void onCreateItem()}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                            >
                                新建需求文档
                                <ArrowRight size={16} />
                            </button>
                        ) : null}
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                        <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                            当前文档
                        </div>
                        <div className="mt-5 space-y-4">
                            {visibleItems.length === 0 ? (
                                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm leading-7 text-slate-600">
                                    当前目录还没有需求文档。可以在左侧目录菜单或这里点击“新建需求文档”创建第一条。
                                </div>
                            ) : (
                                visibleItems.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => onSelectItem(item.id)}
                                        className="block w-full rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-white"
                                    >
                                        <div className="text-lg font-semibold text-slate-900">
                                            {item.title}
                                        </div>
                                        <p className="mt-3 text-sm leading-7 text-slate-600">
                                            {item.summary || '还没有摘要，适合补上目标、范围和验证结果。'}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </article>

                    <article className="rounded-[30px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
                        <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-300">
                            Suggested Structure
                        </div>
                        <div className="mt-4 space-y-3">
                            {suggestedSections.map((section) => (
                                <div
                                    key={section}
                                    className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-slate-200"
                                >
                                    {section}
                                </div>
                            ))}
                        </div>
                    </article>
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-full space-y-6 p-4 md:p-6">
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                            Requirement Doc
                        </div>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                            {selectedItem.title}
                        </h2>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                            把需求解释、边界、验证和回链信息写在同一条文档里。当前看板会直接解析正文里的 `Type / Priority / Related Route`，并按当前生命周期状态优先展示最关键的预览字段。
                        </p>
                        {currentStatus ? (
                            <div className="mt-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                                当前状态：{requirementStatusMeta[currentStatus].label}
                            </div>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {selectedItem && availableMoveTargets.length > 0 ? (
                            <>
                                <select
                                    value={moveTargetDirId}
                                    onChange={(event) => handleMoveTargetChange(event.target.value)}
                                    disabled={isMoving}
                                    className="rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {availableMoveTargets.map((target) => (
                                        <option key={target.directoryId} value={target.directoryId}>
                                            移到 {target.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => void handleMove()}
                                    disabled={isMoving || !moveTargetDirId}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <ArrowRight size={16} />
                                    {isMoving ? '移动中...' : '移动状态'}
                                </button>
                            </>
                        ) : null}
                        {!metadataConfigured ? (
                            <button
                                type="button"
                                onClick={handleInsertMetadataTemplate}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                <Sparkles size={16} />
                                插入 Meta 模板
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => void handleSave()}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={16} />
                            {isSaving ? '保存中...' : '保存修改'}
                        </button>
                        <button
                            type="button"
                            onClick={() => void onDeleteItem(selectedItem.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                            <Trash2 size={16} />
                            删除文档
                        </button>
                        <Link
                            href="/requirements"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                        >
                            返回需求看板
                        </Link>
                    </div>
                </div>
                {saveMessage ? (
                    <div className="mt-4 text-sm text-slate-500">
                        {saveMessage}
                    </div>
                ) : null}
                {selectedItem && availableMoveTargets.length > 0 ? (
                    <div className="mt-5 grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-2">
                        <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                迁移原因
                            </span>
                            <input
                                value={moveReason}
                                onChange={(event) => setMoveReason(event.target.value)}
                                disabled={isMoving}
                                className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                下一步验证
                            </span>
                            <input
                                value={moveValidationFollowUp}
                                onChange={(event) => setMoveValidationFollowUp(event.target.value)}
                                disabled={isMoving}
                                className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                        </label>
                        <div className="lg:col-span-2 text-xs leading-6 text-slate-500">
                            移动状态时，会把这两条写进正文的 `# 交接记录`，避免切目录后丢掉“为什么移动”和“接下来验证什么”。
                        </div>
                    </div>
                ) : null}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                    <div className="space-y-5">
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-600">
                                标题
                            </span>
                            <input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-600">
                                摘要
                            </span>
                            <textarea
                                rows={3}
                                value={summary}
                                onChange={(event) => setSummary(event.target.value)}
                                className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-400"
                            />
                        </label>

                        <label className="block">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                                <span className="block text-sm font-medium text-slate-600">
                                    需求正文
                                </span>
                                <span className="text-xs text-slate-500">
                                    建议在正文顶部保留 `# 元信息` 区块，供看板读取
                                </span>
                            </div>
                            <textarea
                                rows={18}
                                value={body}
                                onChange={(event) => setBody(event.target.value)}
                                className="w-full rounded-[22px] border border-slate-200 px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-400"
                            />
                        </label>
                    </div>
                </article>

                <div className="grid gap-6">
                    <article className="rounded-[30px] border border-slate-200 bg-slate-50 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
                        <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                            Metadata
                        </div>
                        <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                            <div className="rounded-[20px] bg-white px-4 py-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Board Meta
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {metadata.type ? (
                                        <span
                                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${requirementTypeMeta[metadata.type].badgeClass}`}
                                        >
                                            {requirementTypeMeta[metadata.type].label}
                                        </span>
                                    ) : null}
                                    {metadata.priority ? (
                                        <span
                                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${requirementPriorityMeta[metadata.priority].badgeClass}`}
                                        >
                                            {requirementPriorityMeta[metadata.priority].label}
                                        </span>
                                    ) : null}
                                    {!metadata.type && !metadata.priority && !metadata.relatedRoute ? (
                                        <span className="inline-flex rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-500">
                                            Meta 待补充
                                        </span>
                                    ) : null}
                                </div>
                                <div className="mt-3 text-sm leading-7 text-slate-600">
                                    相关路由：{metadata.relatedRoute || '未设置'}
                                </div>
                            </div>
                            <div className="rounded-[20px] bg-white px-4 py-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Board Preview
                                </div>
                                <div className="mt-3 text-sm leading-7 text-slate-600">
                                    场景：{preview.scene || '未设置'}
                                </div>
                                <div className="mt-3 text-sm leading-7 text-slate-600">
                                    预期价值：{preview.expectedValue || '未设置'}
                                </div>
                                <div className="mt-3 text-sm leading-7 text-slate-600">
                                    验证结果：{preview.validationResult || '未设置'}
                                </div>
                                <div className="mt-3 text-sm leading-7 text-slate-600">
                                    用户影响：{preview.userImpact || '未设置'}
                                </div>
                                <div className="mt-3 text-sm leading-7 text-slate-600">
                                    最新交接：{preview.latestHandoff || '未设置'}
                                </div>
                                <div className="mt-3 text-sm leading-7 text-slate-600">
                                    交接时间：{preview.latestHandoffAt || '未设置'}
                                </div>
                                <div className="mt-3 text-sm leading-7 text-slate-600">
                                    迁移方向：{preview.latestHandoffDirection || '未设置'}
                                </div>
                                <div className="mt-3 text-sm leading-7 text-slate-600">
                                    交接验证：{preview.latestHandoffValidateNext || '未设置'}
                                </div>
                                <div className="mt-3 text-sm leading-7 text-slate-600">
                                    剩余风险：{preview.openRisks || '未设置'}
                                </div>
                                <div className="mt-3 text-sm leading-7 text-slate-600">
                                    下一步：{preview.nextStep || '未设置'}
                                </div>
                            </div>
                            <div className="rounded-[20px] bg-white px-4 py-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Board Focus
                                </div>
                                {currentStatus ? (
                                    <>
                                        <div className="mt-3 text-sm leading-7 text-slate-600">
                                            当前目录对应 `{requirementStatusMeta[currentStatus].label}` 列；看板会优先展示这些字段。
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {focusedPreviewFields.map((field) => (
                                                <span
                                                    key={field}
                                                    className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                                                >
                                                    {requirementPreviewFieldMeta[field].label}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            {focusedPreviewEntries.length > 0 ? (
                                                focusedPreviewEntries.map((entry) => (
                                                    <div key={entry.field}>
                                                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                            {entry.label}
                                                        </div>
                                                        <div className="mt-1 rounded-[16px] bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                                            {entry.value}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="rounded-[16px] border border-dashed border-slate-200 px-3 py-2 text-sm leading-7 text-slate-500">
                                                    当前目录重点字段还没补齐，优先补这些 section。
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-3 text-sm leading-7 text-slate-600">
                                        当前目录还没有映射到 requirements 生命周期状态。
                                    </div>
                                )}
                            </div>
                            <div className="rounded-[20px] bg-white px-4 py-3">
                                当前目录：{currentDirectory?.name || currentDir || '未选择'}
                            </div>
                            <div className="rounded-[20px] bg-white px-4 py-3">
                                创建时间：{selectedItem.createdAt}
                            </div>
                            <div className="rounded-[20px] bg-white px-4 py-3">
                                更新时间：{selectedItem.updatedAt}
                            </div>
                        </div>
                    </article>

                    <article className="rounded-[30px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
                        <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-300">
                            Writing Prompts
                        </div>
                        <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-slate-200">
                            把下面三行放在正文顶部，`/requirements` 看板就会自动读到：
                            <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-300">
{`# 元信息
- 类型: 功能
- 优先级: P1
- 相关路由: /workspace`}
                            </pre>
                        </div>
                        <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-slate-200">
                            看板预览会从这些章节抽取：
                            <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-300">
{`# 场景
- 工作台里的需求看板

# 预期价值
- 让看板能直接展示这条需求解决了什么问题

# 交接记录
- 2026-03-08 14:10 JST | 待开始 -> 开发中 | 原因: 范围已经收敛到单个小步 | 下一步验证: 完成实现后跑 build 和关键路径检查

# 验证结果
- npm run build 通过

# 用户影响
- 日常判断是否可以继续推进或归档时不需要再先打开正文

# 未决风险
- 独立 tsc 仍受 .next/types include 影响

# 下一步
- 继续整理需求生命周期字段和迁移规则`}
                            </pre>
                        </div>
                        <div className="mt-5 space-y-3">
                            {suggestedSections.map((section) => (
                                <div
                                    key={section}
                                    className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-slate-200"
                                >
                                    {section}
                                </div>
                            ))}
                        </div>
                    </article>
                </div>
            </section>
        </div>
    );
}
