// src/components/directory/DirectoryNode.tsx
'use client';

import React, { useRef, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, FolderOpen, Folder, FileText, MoreVertical } from 'lucide-react';
import type { TreeNode } from './types';
import type { ContentItem } from '@/lib/models/content';

export interface DirectoryNodeProps {
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
    onDeleteItem?: (id: string) => void;
    addSubDir: (parentId?: string) => void;
    renameDir: (id: string, name: string) => void;
    removeDir: (id: string, name: string) => void;
}

export default function DirectoryNode({
                                          node,
                                          level,
                                          items,
                                          expand,
                                          toggleExpand,
                                          collapsed,
                                          selectedDirId,
                                          selectedItemId,
                                          onSelectDir,
                                          onSelectItem,
                                          onCreateContent,
                                          onDeleteItem,
                                          addSubDir,
                                          renameDir,
                                          removeDir
                                      }: DirectoryNodeProps) {
    // Refs and state for directory menu
    const dirBtnRef = useRef<HTMLDivElement>(null);
    const [dirMenuPos, setDirMenuPos] = useState({ top: 0, left: 0 });
    const [dirMenuOpen, setDirMenuOpen] = useState(false);
    const dirHideTimer = useRef<number>();

    // Refs and state for content menu
    const contentBtnRef = useRef<HTMLDivElement>(null);
    const [contentMenuPos, setContentMenuPos] = useState({ top: 0, left: 0 });
    const [contentMenuOpen, setContentMenuOpen] = useState(false);
    const contentHideTimer = useRef<number>();

    // Prepare contents under this directory
    const contents = items
        .filter(i => i.directoryId === node.id || (i as any).directory_id === node.id)
        .sort((a, b) => a.position - b.position);

    const isCollapsible = node.children.length > 0 || contents.length > 0;
    const open = expand.has(node.id);
    const indent = collapsed ? 8 : 12 + level * 16;

    // Directory menu handlers
    const openDirMenu = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        const btn = e.currentTarget as HTMLElement;
        const rect = btn.getBoundingClientRect();
        setDirMenuPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
        setDirMenuOpen(true);
    };
    const clearDirTimer = () => { if (dirHideTimer.current) clearTimeout(dirHideTimer.current); };
    const scheduleCloseDirMenu = () => { dirHideTimer.current = window.setTimeout(() => setDirMenuOpen(false), 200); };

    // Content menu handlers
    const openContentMenu = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        const btn = e.currentTarget as HTMLElement;
        const rect = btn.getBoundingClientRect();
        setContentMenuPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
        setContentMenuOpen(true);
    };
    const clearContentTimer = () => { if (contentHideTimer.current) clearTimeout(contentHideTimer.current); };
    const scheduleCloseContentMenu = () => { contentHideTimer.current = window.setTimeout(() => setContentMenuOpen(false), 200); };

    // Global click to close any menu
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (dirMenuOpen) {
                const elm = document.getElementById('dir-node-menu');
                if (elm && !elm.contains(e.target as Node)) setDirMenuOpen(false);
            }
            if (contentMenuOpen) {
                const elm = document.getElementById('content-node-menu');
                if (elm && !elm.contains(e.target as Node)) setContentMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [dirMenuOpen, contentMenuOpen]);

    return (
        <li className="relative" style={{ '--level': level } as any}>
            {/* Directory row */}
            <div
                className="group flex items-center pr-2 py-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                style={{ paddingLeft: indent }}
                onClick={() => {
                    onSelectDir(node.id);
                    // if (isCollapsible) toggleExpand(node.id);
                    toggleExpand(node.id);
                }}
            >
                {!collapsed && (
                    <>
                        {/* Collapse arrow */}
                        <button
                            className={`mr-1 transform transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                            onClick={e => { e.stopPropagation();onSelectDir(node.id); toggleExpand(node.id); }}
                        >
                            <ChevronRight size={14} />
                        </button>
                        {/* Folder icon */}
                        {open
                            ? <FolderOpen size={16} className="text-gray-600 mr-1" />
                            : <Folder size={16} className="text-gray-600 mr-1" />
                        }
                        {/* Name */}
                        <span className="flex-1 truncate">{node.name}</span>
                        {/* Dir menu trigger */}
                        <div
                            ref={dirBtnRef}
                            onMouseEnter={clearDirTimer}
                            onMouseLeave={scheduleCloseDirMenu}
                        >
                            <button
                                className="opacity-0 group-hover:opacity-100 transition"
                                onClick={openDirMenu}
                            >
                                <MoreVertical size={16} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Directory menu portal */}
            {dirMenuOpen && createPortal(
                <div
                    id="dir-node-menu"
                    className="absolute w-28 bg-white border shadow rounded-lg z-50"
                    style={{ top: dirMenuPos.top, left: dirMenuPos.left, transform: 'translateX(-100%)' }}
                    onMouseEnter={clearDirTimer}
                    onMouseLeave={scheduleCloseDirMenu}
                >
                    <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { addSubDir(node.id); setDirMenuOpen(false); }}>
                        新建子目录
                    </div>
                    <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { onCreateContent?.(node.id); setDirMenuOpen(false); }}>
                        创建内容
                    </div>
                    <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { renameDir(node.id, node.name); setDirMenuOpen(false); }}>
                        重命名
                    </div>
                    <div className="px-3 py-2 hover:bg-gray-100 text-red-600 cursor-pointer" onClick={() => { removeDir(node.id, node.name); setDirMenuOpen(false); }}>
                        删除
                    </div>
                </div>,
                document.body
            )}

            {/* Collapse section */}
            {isCollapsible && (
                <div
                    className="overflow-hidden transition-[max-height] duration-200"
                    style={{ maxHeight: open && !collapsed ? 9999 : 0 }}
                >
                    <ul>
                        {/* Child directories */}
                        {node.children.map(child => (
                            <DirectoryNode
                                key={child.id}
                                node={child}
                                level={level + 1}
                                items={items}
                                expand={expand}
                                toggleExpand={toggleExpand}
                                collapsed={collapsed}
                                selectedDirId={selectedDirId}
                                selectedItemId={selectedItemId}
                                onSelectDir={onSelectDir}
                                onSelectItem={onSelectItem}
                                onCreateContent={onCreateContent}
                                onDeleteItem={onDeleteItem}
                                addSubDir={addSubDir}
                                renameDir={renameDir}
                                removeDir={removeDir}
                            />
                        ))}
                        {/* Content items */}
                        {contents.map(c => (
                            <li key={c.id}>
                                <div
                                    className="group flex items-center pr-2 py-1 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    style={{ paddingLeft: 12 + (level + 1) * 16 }}
                                    onClick={() => onSelectItem(c.id)}
                                >
                                    <FileText size={15} className="text-gray-500 mr-1" />
                                    <span className="flex-1 truncate">{c.title}</span>
                                    {/* Content delete menu */}
                                    <div
                                        ref={contentBtnRef}
                                        onMouseEnter={clearContentTimer}
                                        onMouseLeave={scheduleCloseContentMenu}
                                    >
                                        <button
                                            className="opacity-0 group-hover:opacity-100 transition"
                                            onClick={openContentMenu}
                                        >
                                            <MoreVertical size={14} />
                                        </button>
                                    </div>
                                    {contentMenuOpen && document.body && createPortal(
                                        <div
                                            id="content-node-menu"
                                            className="absolute w-20 bg-white border shadow rounded-lg z-50"
                                            style={{ top: contentMenuPos.top, left: contentMenuPos.left, transform: 'translateX(-100%)' }}
                                            onMouseEnter={clearContentTimer}
                                            onMouseLeave={scheduleCloseContentMenu}
                                        >
                                            <div className="px-3 py-2 hover:bg-gray-100 text-red-600 cursor-pointer" onClick={() => { onDeleteItem?.(c.id); setContentMenuOpen(false); }}>
                                                删除
                                            </div>
                                        </div>,
                                        document.body
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </li>
    );
}
