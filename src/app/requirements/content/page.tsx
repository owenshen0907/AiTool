'use client';

import React, { startTransition, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCcw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import DirectoryLayout from '@/components/directory/DirectoryLayout';
import { fetchDirectories } from '@/lib/api/directory';
import type { DirectoryItem } from '@/lib/models/directory';
import type { ContentItem } from '@/lib/models/content';
import {
    getRequirementStatusFromDirectoryName,
    requirementStatuses,
    requirementStatusMeta,
    type RequirementStatus,
} from '@/lib/requirements';
import RequirementsContentPanel from './RequirementsContentPanel';

interface BootstrapResult {
    dirId?: string | null;
    docId?: string | null;
    error?: string;
}

function buildRequirementsContentHref(dirId?: string | null, docId?: string | null) {
    const params = new URLSearchParams();
    if (dirId) params.set('dir', dirId);
    if (docId) params.set('doc', docId);
    const query = params.toString();
    return query ? `/requirements/content?${query}` : '/requirements/content';
}

export default function RequirementsContentPage() {
    const router = useRouter();
    const params = useSearchParams();
    const dirId = params?.get('dir') ?? undefined;
    const docId = params?.get('doc') ?? undefined;
    const [bootstrapError, setBootstrapError] = useState('');
    const [directories, setDirectories] = useState<DirectoryItem[]>([]);

    useEffect(() => {
        let cancelled = false;

        const loadDirectories = async () => {
            try {
                const nextDirectories = await fetchDirectories('requirements');
                if (!cancelled) {
                    setDirectories(nextDirectories);
                }
            } catch (error) {
                console.error('[requirements/content] failed to load directories', error);
            }
        };

        void loadDirectories();

        return () => {
            cancelled = true;
        };
    }, [dirId]);

    useEffect(() => {
        if (dirId) {
            setBootstrapError('');
            return;
        }

        let cancelled = false;

        const bootstrap = async () => {
            try {
                const response = await fetch('/api/requirements/bootstrap', {
                    method: 'POST',
                });
                const result = (await response.json().catch(() => null)) as BootstrapResult | null;

                if (!response.ok) {
                    throw new Error(result?.error || '初始化需求空间失败');
                }

                if (cancelled) return;

                startTransition(() => {
                    router.replace(
                        buildRequirementsContentHref(result?.dirId, result?.docId),
                        { scroll: false }
                    );
                });
            } catch (error) {
                if (cancelled) return;
                setBootstrapError(
                    error instanceof Error ? error.message : '初始化需求空间失败'
                );
            }
        };

        void bootstrap();

        return () => {
            cancelled = true;
        };
    }, [dirId, router]);

    if (!dirId) {
        return (
            <main className="min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_40%,#ffffff_100%)] px-4 py-10 md:px-8">
                <div className="mx-auto flex max-w-4xl items-center justify-center">
                    <section className="w-full rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-10">
                        <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                            需求空间初始化
                        </div>
                        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                            正在准备需求空间的默认目录和模板
                        </h1>
                        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
                            首次进入会自动初始化待处理、需求梳理、待开始、开发中、验证中、已归档
                            目录，并放入对应模板。这样需求空间不是空壳，打开后就能直接开始写。
                        </p>

                        {bootstrapError ? (
                            <div className="mt-8 rounded-[24px] border border-rose-200 bg-rose-50 p-5">
                                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">
                                    初始化失败
                                </div>
                                <p className="mt-3 text-sm leading-7 text-rose-700">
                                    {bootstrapError}
                                </p>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => window.location.reload()}
                                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                                    >
                                        <RefreshCcw size={16} />
                                        重试初始化
                                    </button>
                                    <Link
                                        href="/requirements"
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                    >
                                        返回需求看板
                                        <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                                正在执行事务式初始化，完成后会自动打开第一个默认需求文档。
                            </div>
                        )}
                    </section>
                </div>
            </main>
        );
    }

    return (
        <DirectoryLayout
            feature="requirements"
            modelName="内部需求/需求文档"
            initialDirId={dirId}
            initialItemId={docId}
        >
            {({
                currentDir,
                visibleItems,
                selectedItem,
                onSelectItem,
                onCreate,
                onUpdate,
                onDelete,
                onMove,
            }) => (
                <RequirementsContentPageBody
                    currentDir={currentDir}
                    directories={directories}
                    visibleItems={visibleItems}
                    selectedItem={selectedItem}
                    onSelectItem={onSelectItem}
                    onCreateItem={() => (currentDir ? onCreate(currentDir) : undefined)}
                    onUpdateItem={onUpdate}
                    onDeleteItem={onDelete}
                    onMoveItem={async (item, newDirId) => {
                        await onMove(item.id, newDirId);
                        startTransition(() => {
                            router.replace(buildRequirementsContentHref(newDirId, item.id), {
                                scroll: false,
                            });
                        });
                    }}
                />
            )}
        </DirectoryLayout>
    );
}

function RequirementsContentPageBody({
    currentDir,
    directories,
    visibleItems,
    selectedItem,
    onSelectItem,
    onCreateItem,
    onUpdateItem,
    onDeleteItem,
    onMoveItem,
}: {
    currentDir: string | null;
    directories: DirectoryItem[];
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
}) {
    const currentDirectory = currentDir
        ? directories.find((directory) => directory.id === currentDir) ?? null
        : null;
    const statusTargets = requirementStatuses.flatMap((status) => {
        const matchedDirectory = directories.find(
            (directory) => getRequirementStatusFromDirectoryName(directory.name) === status
        );

        if (!matchedDirectory) {
            return [];
        }

        return [
            {
                status,
                directoryId: matchedDirectory.id,
                directoryName: matchedDirectory.name,
                label: requirementStatusMeta[status].label,
                description: requirementStatusMeta[status].description,
            },
        ];
    });

    return (
        <div className="h-full overflow-auto bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_40%,#ffffff_100%)]">
            <RequirementsContentPanel
                currentDir={currentDir}
                currentDirectory={currentDirectory}
                statusTargets={statusTargets}
                visibleItems={visibleItems}
                selectedItem={selectedItem}
                onSelectItem={onSelectItem}
                onCreateItem={onCreateItem}
                onUpdateItem={onUpdateItem}
                onDeleteItem={onDeleteItem}
                onMoveItem={onMoveItem}
            />
        </div>
    );
}
