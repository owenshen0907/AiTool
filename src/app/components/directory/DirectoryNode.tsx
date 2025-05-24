// File: src/components/directory/DirectoryNode.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronRight,
    FolderOpen,
    Folder,
    FileText,
    MoreVertical,
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
        feature, node, level, items,
        expand, toggleExpand, collapsed,
        onSelectDir, onSelectItem,
        onCreateContent, onDeleteItem,
        addSubDir, renameDir, removeDir,
        onMoveItem, onReorderFile,
        reloadDirs, rootList,
    } = props;

    // 只显示当前目录下的文件，并按 position/updatedAt 排序
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

    // 点击空白关闭菜单
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

    // 开始拖拽
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

    // 放下处理
    const onDrop = async (
        e: React.DragEvent,
        target: { id: string; type: 'dir' | 'file' }
    ) => {
        e.preventDefault();
        e.stopPropagation();
        const raw = e.dataTransfer.getData('text/plain');
        if (!raw) return;
        const { id: srcId, type: srcType, parentId: srcParent } = JSON.parse(raw) as {
            id: string; type: 'dir' | 'file'; parentId: string | null;
        };

        // ── 拖拽目录 ──
        if (srcType === 'dir') {
            if (srcId === target.id) return;
            const dragRoot = srcParent === null;
            const dropRoot = node.parentId === null;
            if (dragRoot && !dropRoot) return;
            // 根↔根 同级排序
            if (dragRoot && dropRoot) {
                const ordered = [...rootList].sort((a, b) => a.position - b.position);
                const from = ordered.findIndex(d => d.id === srcId);
                const to = ordered.findIndex(d => d.id === target.id);
                if (from < 0 || to < 0) return;
                ordered.splice(to, 0, ordered.splice(from, 1)[0]);
                await reorderDirectoriesApi(feature, null, ordered.map(d => d.id));
                await reloadDirs();
                return;
            }
            // 放到目录上：改 parentId
            if (target.type === 'dir') {
                await updateDirectoryApi(srcId, undefined, target.id);
                await reloadDirs();
                return;
            }
            // 子级同父排序
            const siblings = rootList.find(p => p.id === srcParent)?.children ?? [];
            const ordered = [...siblings].sort((a, b) => a.position - b.position);
            const from = ordered.findIndex(d => d.id === srcId);
            const to = ordered.findIndex(d => d.id === target.id);
            if (from < 0 || to < 0) return;
            ordered.splice(to, 0, ordered.splice(from, 1)[0]);
            await reorderDirectoriesApi(feature, srcParent!, ordered.map(d => d.id));
            await reloadDirs();
            return;
        }

        // ── 拖拽文件 ──
        if (srcType === 'file') {
            // A. 拖到目录行：移动到末尾并切换视图
            if (target.type === 'dir') {
                if (srcId !== target.id) {
                    await moveAndReorderContent(feature, srcId, target.id);
                    onSelectDir(target.id);
                }
                return;
            }
            // B. 拖到文件行：统一「移动+排序」
            if (target.type === 'file') {
                const beforeId = target.id;
                // 调接口一次性完成移动和排序
                await moveAndReorderContent(feature, srcId, undefined, beforeId);
                // 后端完成后，本地重新取当前目录列表
                const beforeItem = items.find(i => i.id === beforeId)!;
                onSelectDir(beforeItem.directoryId);
                return;
            }
        }
    };

    return (
        <li
            draggable
            onDragStart={e => { e.stopPropagation(); onDragStart(e, node.id, 'dir'); }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => onDrop(e, { id: node.id, type: 'dir' })}
        >
            {/* 目录行 */}
            <div
                className="group flex items-center pr-2 py-1 rounded hover:bg-gray-100"
                style={{ paddingLeft: indent }}
                onClick={() => { onSelectDir(node.id); toggleExpand(node.id); }}
            >
                <button
                    className={`mr-1 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    onClick={e => {
                        e.stopPropagation();
                        // onSelectDir(node.id);
                        props.onSelectDir(node.id);
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

            {/* 目录上下文菜单 */}
            {dirMenu && createPortal(
                <div
                    id="dir-menu"
                    className="fixed w-28 bg-white border shadow rounded z-50"
                    style={{ left: dirMenu.x, top: dirMenu.y }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { addSubDir(node.id); setDirMenu(null); }}>新建子目录</div>
                    <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { onCreateContent?.(node.id); setDirMenu(null); }}>创建内容</div>
                    <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { renameDir(node.id, node.name); setDirMenu(null); }}>重命名</div>
                    <div className="px-3 py-2 hover:bg-gray-100 text-red-600 cursor-pointer" onClick={() => { removeDir(node.id, node.name); setDirMenu(null); }}>删除</div>
                </div>,
                document.body
            )}

            {/* 子目录 & 文件 */}
            {isOpen && (
                <ul>
                    {node.children.map(child => (
                        <DirectoryNode key={child.id} {...props} node={child} level={level + 1} />
                    ))}
                    {files.map(f => (
                        <li
                            key={f.id}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => onDrop(e, { id: f.id, type: 'file' })}
                        >
                            <div
                                draggable
                                onDragStart={e => { e.stopPropagation(); onDragStart(e, f.id, 'file'); }}
                                className="group flex items-center pr-2 py-1 rounded hover:bg-gray-50"
                                style={{ paddingLeft: 12 + (level + 1) * 16 }}
                                onClick={() => onSelectItem(f.id)}
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

            {/* 文件上下文菜单 */}
            {fileMenu && createPortal(
                <div
                    id="file-menu"
                    className="fixed w-20 bg-white border shadow rounded z-50"
                    style={{ left: fileMenu.x, top: fileMenu.y }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-3 py-2 hover:bg-gray-100 text-red-600 cursor-pointer" onClick={() => { onDeleteItem?.(fileMenu.id); setFileMenu(null); }}>删除</div>
                </div>,
                document.body
            )}
        </li>
    );
}