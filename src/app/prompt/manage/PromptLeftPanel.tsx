// app/prompt/manage/PromptLeftPanel.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FileText,
    MoreVertical,
} from 'lucide-react';
import type { PromptNode } from '@/lib/models/prompt/prompt';

interface Props {
    nodes: PromptNode[];
    selectedId: string | null;
    collapsed: boolean;
    onSelect: (node: PromptNode) => void;
    onRenameDir: (id: string, newTitle: string) => void;
    onCreatePrompt: (parent: PromptNode | null) => void;
    onNewDir: (parent: PromptNode | null) => void;
    onDelete: (node: PromptNode) => void;
    onReorder: (srcId: string, dstId: string) => void;
    onMove: (srcId: string, newParentId: string) => void;
    searchResults: PromptNode[] | null;
    onSearch: (term: string) => void;
}

type TreeNode = Omit<PromptNode, 'children'> & { children: TreeNode[] };

function buildTree(nodes: PromptNode[]): TreeNode[] {
    const map: Record<string, TreeNode> = {};
    nodes.forEach(n => (map[n.id] = { ...n, children: [] }));
    const roots: TreeNode[] = [];
    Object.values(map).forEach(node => {
        if (node.parentId != null && map[node.parentId]) {
            map[node.parentId].children.push(node);
        } else {
            roots.push(node);
        }
    });
    return roots;
}

export default function PromptLeftPanel({
                                            nodes,
                                            selectedId,
                                            collapsed,
                                            onSelect,
                                            onRenameDir,
                                            onCreatePrompt,
                                            onNewDir,
                                            onDelete,
                                            onReorder,
                                            onMove,
                                            searchResults,
                                            onSearch,
                                        }: Props) {
    const fullTree = useMemo(() => buildTree(nodes), [nodes]);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const hideTimer = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!searchResults) return;
        const toOpen = new Set<string>();
        const matched = new Set(searchResults.map(n => n.id));
        const parentMap = new Map(nodes.map(n => [n.id, n.parentId] as const));
        matched.forEach(id => {
            let p = parentMap.get(id) ?? null;
            while (p) {
                toOpen.add(p);
                p = parentMap.get(p) ?? null;
            }
            toOpen.add(id);
        });
        setExpanded(toOpen);
    }, [searchResults, nodes]);

    useEffect(() => () => hideTimer.current && clearTimeout(hideTimer.current), []);

    const toggleNode = (id: string) => {
        setExpanded(s => {
            const nxt = new Set(s);
            nxt.has(id) ? nxt.delete(id) : nxt.add(id);
            return nxt;
        });
    };

    const renderNode = (node: TreeNode, level = 0): JSX.Element => {
        const isDir = node.type === 'dir';
        const isExpanded = expanded.has(node.id);
        const hasChildren = node.children.length > 0;
        const isSel = node.id === selectedId;
        const srcNode = nodes.find(n => n.id === node.id);

        return (
            <li key={node.id}>
                <div
                    className={`group flex items-center justify-between p-2 cursor-pointer transition-colors ${
                        isSel ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                    }`}
                    style={{ paddingLeft: `${0.5 + level * 1.5}rem` }}
                    draggable
                    onClick={() => {
                        onSelect(node);
                        if (isDir) toggleNode(node.id);
                    }}
                    onDragStart={e => e.dataTransfer.setData('text/plain', node.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                        e.preventDefault();
                        const srcId = e.dataTransfer.getData('text/plain');
                        const src = nodes.find(n => n.id === srcId);
                        if (!src) return;

                        // 根目录仅能在根级排序
                        if (src.type === 'dir' && src.parentId == null) {
                            if (node.parentId != null) {
                                alert('根目录只能在根级内排序');
                                return;
                            }
                            if (srcId === node.id) return;
                            if (confirm(`确定将根目录 "${src.title}" 排序到 "${node.title}" 之前吗？`)) {
                                onReorder(srcId, node.id);
                            }
                            return;
                        }

                        // 目录节点（非根）
                        if (src.type === 'dir') {
                            if (node.type === 'dir') {
                                // 拖到目录上：移动目录
                                if (confirm(`确定将目录 "${src.title}" 移动到目录 "${node.title}" 吗？`)) {
                                    onMove(srcId, node.id);
                                }
                            } else {
                                // 拖到文件上：同级排序
                                if (src.parentId !== node.parentId) {
                                    alert('请在同一目录内排序目录');
                                    return;
                                }
                                if (srcId === node.id) return;
                                if (confirm(`确定将目录 "${src.title}" 排序到 "${node.title}" 之前吗？`)) {
                                    onReorder(srcId, node.id);
                                }
                            }
                            return;
                        }

                        // 文件节点
                        if (node.type === 'dir') {
                            // 拖到目录上：移动文件
                            if (confirm(`确定将文件 "${src.title}" 移动到目录 "${node.title}" 吗？`)) {
                                onMove(srcId, node.id);
                            }
                        } else {
                            // 拖到文件上：同级排序
                            if (src.parentId !== node.parentId) {
                                alert('请将文件拖至目标目录以移动');
                                return;
                            }
                            if (srcId === node.id) return;
                            if (confirm(`确定将文件 "${src.title}" 排序到文件 "${node.title}" 之前吗？`)) {
                                onReorder(srcId, node.id);
                            }
                        }
                    }}
                >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {isDir ? (
                            <button
                                className="w-4 h-4 flex-shrink-0"
                                onClick={e => {
                                    e.stopPropagation();
                                    toggleNode(node.id);
                                }}
                            >
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                        ) : (
                            <span className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-gray-500">
              {isDir ? <Folder size={16} /> : <FileText size={16} />}
            </span>
                        <div className="truncate">{node.title}</div>
                    </div>

                    <div className="relative flex-shrink-0">
                        <button
                            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={e => {
                                e.stopPropagation();
                                setActiveMenu(id => (id === node.id ? null : node.id));
                            }}
                        >
                            <MoreVertical size={16} />
                        </button>
                        {activeMenu === node.id && (
                            <div
                                className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 shadow-lg rounded z-10"
                                onMouseEnter={() => hideTimer.current && clearTimeout(hideTimer.current)}
                                onMouseLeave={() => {
                                    hideTimer.current = setTimeout(() => setActiveMenu(null), 300);
                                }}
                            >
                                {isDir && (
                                    <div
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                            setActiveMenu(null);
                                            const nt = prompt('重命名目录', node.title);
                                            nt?.trim() && onRenameDir(node.id, nt.trim());
                                        }}
                                    >
                                        重命名目录
                                    </div>
                                )}
                                {isDir && (
                                    <div
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                            setActiveMenu(null);
                                            onCreatePrompt(node);
                                        }}
                                    >
                                        创建 Prompt
                                    </div>
                                )}
                                {isDir && (
                                    <div
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                            setActiveMenu(null);
                                            onNewDir(node);
                                        }}
                                    >
                                        新增子目录
                                    </div>
                                )}
                                <div
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
                                    onClick={() => {
                                        setActiveMenu(null);
                                        if (isDir && hasChildren) {
                                            alert('目录非空，无法删除，请先删除子项。');
                                        } else {
                                            onDelete(node);
                                        }
                                    }}
                                >
                                    删除
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {hasChildren && isExpanded && <ul>{node.children.map(c => renderNode(c, level + 1))}</ul>}
            </li>
        );
    };

    return (
        <div className="h-full overflow-auto bg-white">
            {!collapsed && (
                <div className="flex items-center space-x-2 px-2 py-1 border-b border-gray-200">
                    <input
                        type="text"
                        placeholder="搜索目录，回车查询"
                        className="flex-1 px-2 py-1 border rounded focus:outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                onSearch(search);
                            }
                        }}
                    />
                    <button
                        className="flex items-center px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => onNewDir(null)}
                    >
                        ＋ 新建目录
                    </button>
                </div>
            )}
            <ul className="px-1 pt-1">{fullTree.map(n => renderNode(n))}</ul>
        </div>
    );
}