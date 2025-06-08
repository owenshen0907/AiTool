// File: src/components/directory/DirectoryNode.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
    ChevronRight,
    FolderOpen,
    Folder,
    FileText,
    MoreVertical,
    ArrowUpDown,
} from 'lucide-react';
import type { TreeNode } from './types';
import type { ContentItem } from '@/lib/models/content';
import { reorderDirectoriesApi, updateDirectoryApi } from '@/lib/api/directory';
import { moveAndReorderContent } from '@/lib/api/content';
import { getDirId } from './dragHelpers';

interface Props {
    feature: string;
    node: TreeNode;
    level: number;
    items: ContentItem[];
    expand: Set<string>;
    toggleExpand: (id: string) => void;
    collapsed: boolean;

    selectedDirId: string | null;
    selectedItemId: string | null;

    onSelectDir: (id: string) => void;
    onSelectItem: (id: string) => void;

    onCreateContent?: (dirId: string) => void;
    onDeleteItem?: (itemId: string) => void;

    addSubDir: (parentId?: string) => void;
    renameDir: (id: string, name: string) => void;
    removeDir: (id: string, name: string) => void;

    onMoveItem: (id: string, newDir: string) => void;
    onReorderFile: (dirId: string, ids: string[]) => void;

    reloadDirs: () => void;
    rootList: TreeNode[];
}

export default function DirectoryNode(props: Props) {
    const {
        feature,
        node,
        level,
        items,
        expand,
        toggleExpand,
        collapsed,
        onSelectDir,
        onSelectItem,
        onCreateContent,
        onDeleteItem,
        addSubDir,
        renameDir,
        removeDir,
        onMoveItem,
        onReorderFile,
        reloadDirs,
        rootList,
    } = props;
    const router = useRouter();

    // files under this directory
    const files = items
        .filter(i => getDirId(i) === node.id)
        .sort((a, b) => {
            if (a.position !== b.position) return b.position - a.position;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

    const isOpen = expand.has(node.id);
    const indent = collapsed ? 8 : 12 + level * 16;
    const isRoot = node.parentId === null;

    const [dirMenu, setDirMenu] = useState<{ x: number; y: number } | null>(null);
    const [fileMenu, setFileMenu] = useState<{ x: number; y: number; id: string } | null>(null);
    const [sortAsc, setSortAsc] = useState(false);

    // close menus on outside click
    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('#dir-menu,#file-menu')) {
                setDirMenu(null);
                setFileMenu(null);
            }
        };
        document.addEventListener('click', close, true);
        return () => document.removeEventListener('click', close, true);
    }, []);

    // handle drag start
    const onDragStart = (
        e: React.DragEvent,
        id: string,
        type: 'dir' | 'file'
    ) => {
        e.dataTransfer.setData(
            'text/plain',
            JSON.stringify({ id, type, parentId: node.parentId })
        );
        e.dataTransfer.effectAllowed = 'move';
    };

    // handle drop
    const onDrop = async (
        e: React.DragEvent,
        target: { id: string; type: 'dir' | 'file' }
    ) => {
        e.preventDefault();
        e.stopPropagation();
        const raw = e.dataTransfer.getData('text/plain');
        if (!raw) return;
        const { id: srcId, type: srcType, parentId: srcParent } = JSON.parse(raw) as {
            id: string;
            type: 'dir' | 'file';
            parentId: string | null;
        };

        // folder dragging
        if (srcType === 'dir') {
            // 同一个节点，不处理
            if (srcId === target.id) return;

            const dragRoot = srcParent === null;
            const dropRoot = node.parentId === null;

            // 1. 根目录 <-> 根目录 排序
            if (dragRoot && dropRoot) {
                // 按 position 排序出当前数组
                const ordered = [...rootList].sort((a, b) => a.position - b.position);
                const from = ordered.findIndex(d => d.id === srcId);
                const to   = ordered.findIndex(d => d.id === target.id);
                if (from < 0 || to < 0) return;

                // 用户确认
                if (!window.confirm('确认要重新排序根目录下的文件夹吗？')) return;

                // 调接口 + 刷新
                ordered.splice(to, 0, ordered.splice(from, 1)[0]);
                await reorderDirectoriesApi(feature, null, ordered.map(d => d.id));
                await reloadDirs();
                return;
            }

            // 2. 根目录 → 子目录：禁止操作
            if (dragRoot && !dropRoot) {
                // 可以提示用户
                window.alert('根目录不能直接移动到子目录下');
                return;
            }

            // 3. 子目录 → 根目录或子目录：修改 parent
            if (!dragRoot && target.type === 'dir') {
                // 拖到某个目录上，变更父目录
                if (!window.confirm('确认要将此目录移动到目标目录下吗？')) return;
                await updateDirectoryApi(srcId, undefined, target.id);
                await reloadDirs();
                return;
            }

            // 4. 同级内重新排序
            // 找到共同父节点下的孩子列表
            const siblings = rootList
                .find(p => p.id === srcParent)?.children ?? [];
            const ordered = [...siblings].sort((a, b) => a.position - b.position);
            const from    = ordered.findIndex(d => d.id === srcId);
            const to      = ordered.findIndex(d => d.id === target.id);
            if (from < 0 || to < 0) return;

            if (!window.confirm('确认要在当前层级重新排序此目录吗？')) return;
            ordered.splice(to, 0, ordered.splice(from, 1)[0]);
            await reorderDirectoriesApi(feature, srcParent!, ordered.map(d => d.id));
            await reloadDirs();
            return;
        }

        // file dragging
        if (srcType === 'file') {
            // A. drop onto directory row
            if (target.type === 'dir') {
                if (srcId !== target.id) {
                    if (!confirm('确认要移动此文件到该目录吗？')) return;
                    await moveAndReorderContent(feature, srcId, target.id);
                    onSelectDir(target.id);
                }
                // props.reloadDirs();
                return;
            }
            // B. drop onto file row
            if (target.type === 'file') {
                const beforeId = target.id;
                if (!confirm('确认要在当前目录内重新排序文件吗？')) return;
                await moveAndReorderContent(feature, srcId, undefined, beforeId);
                const beforeItem = items.find(i => i.id === beforeId)!;
                onSelectDir(beforeItem.directoryId);
                // props.reloadDirs();
                return;
            }
        }
    };

    // toggle sort direction for files display
    const toggleSortOrder = () => {
        setSortAsc(prev => !prev);
        const ids = sortAsc
            ? files.map(f => f.id)            // current asc -> send asc
            : files.map(f => f.id).reverse(); // current desc -> send reversed
        onReorderFile(node.id, ids);
    };

    // apply sortAsc to files for render
    const sortedFiles = sortAsc
        ? [...files].reverse()
        : files;

    return (
        <li
            draggable
            onDragStart={e => { e.stopPropagation(); onDragStart(e, node.id, 'dir'); }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => onDrop(e, { id: node.id, type: 'dir' })}
        >
            {/* directory row */}
            <div
                className="group flex items-center pr-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                style={{ paddingLeft: indent }}
                onClick={() => { onSelectDir(node.id); toggleExpand(node.id); }}
            >
                <button
                    className={`mr-1 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    onClick={e => {
                        e.stopPropagation();
                        onSelectDir(node.id);
                        toggleExpand(node.id);
                    }}
                >
                    <ChevronRight size={14} />
                </button>
                {isOpen
                    ? <FolderOpen size={16} className="text-gray-600 mr-1" />
                    : <Folder     size={16} className="text-gray-600 mr-1" />}
                <span className="flex-1 truncate">{node.name}</span>
                <button
                    className="opacity-0 group-hover:opacity-100"
                    onClick={e => {
                        e.stopPropagation();
                        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setDirMenu({ x: r.right, y: r.bottom });
                    }}
                >
                    <MoreVertical size={16} />
                </button>
            </div>

            {/* directory context menu */}
            {dirMenu && createPortal(
                <div
                    id="dir-menu"
                    className="fixed w-28 bg-white border shadow rounded z-50"
                    style={{ left: dirMenu.x, top: dirMenu.y }}
                    onClick={e => e.stopPropagation()}
                >
                    <div
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => { addSubDir(node.id); setDirMenu(null); }}
                    >
                        新建子目录
                    </div>
                    <div
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => { onCreateContent?.(node.id); setDirMenu(null); }}
                    >
                        创建内容
                    </div>
                    <div
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => { renameDir(node.id, node.name); setDirMenu(null); }}
                    >
                        重命名
                    </div>
                    {!isRoot && (
                        <div
                            className="px-3 py-2 hover:bg-gray-100 text-red-600 cursor-pointer"
                            onClick={() => { removeDir(node.id, node.name); setDirMenu(null); }}
                        >
                            删除
                        </div>
                    )}
                </div>,
                document.body
            )}

            {/* children: subdirectories and files */}
            {isOpen && (
                <ul>
                    {node.children.map(child => (
                        <DirectoryNode key={child.id} {...props} node={child} level={level + 1} />
                    ))}
                    {sortedFiles.map(f => (
                        <li
                            key={f.id}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => onDrop(e, { id: f.id, type: 'file' })}
                        >
                            <div
                                draggable
                                onDragStart={e => { e.stopPropagation(); onDragStart(e, f.id, 'file'); }}
                                className="group flex items-center pr-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
                                style={{ paddingLeft: 12 + (level + 1) * 16 }}
                                onClick={() =>{
                                    // 1) 更新当前页选中状态
                                    onSelectItem(f.id);
                                    // 2) 同步修改 URL query
                                    const url = new URL(window.location.href);
                                    url.searchParams.set('dir', node.id);
                                    url.searchParams.set('doc', f.id);
                                    window.history.replaceState(null, '', url.toString());
                            }}
                            >
                                <FileText size={15} className="text-gray-500 mr-1" />
                                <span className="flex-1 truncate">{f.title}</span>
                                <button
                                    className="opacity-0 group-hover:opacity-100"
                                    onClick={e => {
                                        e.stopPropagation();
                                        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                        setFileMenu({ x: r.right, y: r.bottom, id: f.id });
                                    }}
                                >
                                    <MoreVertical size={14} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* file context menu */}
            {fileMenu && createPortal(
                <div
                    id="file-menu"
                    className="fixed w-20 bg-white border shadow rounded z-50"
                    style={{ left: fileMenu.x, top: fileMenu.y }}
                    onClick={e => e.stopPropagation()}
                >
                    <div
                        className="px-3 py-2 hover:bg-gray-100 text-red-600 cursor-pointer"
                        onClick={() => { onDeleteItem?.(fileMenu.id); setFileMenu(null); }}
                    >
                        删除
                    </div>
                </div>,
                document.body
            )}
        </li>
    );
}