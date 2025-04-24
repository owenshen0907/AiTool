// app/prompt/manage/PromptLeftPanel.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FileText,
    MoreVertical,
} from 'lucide-react';
import type { PromptNode } from '@/lib/models/prompt';

interface Props {
    nodes: PromptNode[];
    selectedId: string | null;
    onSelect: (node: PromptNode) => void;
    onEdit: (node: PromptNode) => void;
    onCreatePrompt: (parent: PromptNode | null) => void;
    onNewDir: (parent: PromptNode | null) => void;
    onDelete: (node: PromptNode) => void;
    onReorder: (srcId: string, dstId: string) => void;
}

const buildTree = (nodes: PromptNode[]): PromptNode[] => {
    const map: Record<string, PromptNode> = {};
    nodes.forEach(n => (map[n.id] = { ...n, children: [] }));
    const roots: PromptNode[] = [];
    Object.values(map).forEach(node => {
        if (node.parentId && map[node.parentId]) {
            map[node.parentId].children!.push(node);
        } else {
            roots.push(node);
        }
    });
    return roots;
};

export default function PromptLeftPanel({
                                            nodes,
                                            selectedId,
                                            onSelect,
                                            onEdit,
                                            onCreatePrompt,
                                            onNewDir,
                                            onDelete,
                                            onReorder,
                                        }: Props) {
    const tree = buildTree(nodes);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const hideTimer = useRef<NodeJS.Timeout>();

    // 清理定时器
    useEffect(() => () => hideTimer.current && clearTimeout(hideTimer.current), []);

    const toggle = (id: string) => {
        setExpanded(s => {
            const next = new Set(s);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const onNodeClick = (node: PromptNode) => {
        onSelect(node);
        if (node.type === 'dir') {
            toggle(node.id);
        }
    };

    const renderNode = (node: PromptNode, level = 0): JSX.Element => {
        const isDir = node.type === 'dir';
        const isExpanded = expanded.has(node.id);
        const hasChildren = isDir && node.children && node.children.length > 0;
        const isSelected = node.id === selectedId;

        return (
            <li key={node.id}>
                <div
                    className={
                        `group flex items-center justify-between p-2 cursor-pointer select-none transition-colors ` +
                        (isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100')
                    }
                    style={{ paddingLeft: `${0.5 + level * 1.5}rem` }}
                    onClick={() => onNodeClick(node)}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', node.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => onReorder(e.dataTransfer.getData('text/plain'), node.id)}
                >
                    <div className="flex items-center space-x-2">
                        {isDir ? (
                            <button
                                className="w-4 h-4 flex items-center justify-center focus:outline-none"
                                onClick={e => { e.stopPropagation(); toggle(node.id); }}
                            >
                                {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                            </button>
                        ) : (
                            <span className="w-4 h-4" />
                        )}

                        <span className="w-4 h-4 flex items-center justify-center text-gray-500">
              {isDir ? <Folder size={16}/> : <FileText size={16}/>}
            </span>
                        <span className="truncate font-medium">{node.title}</span>
                    </div>

                    <div className="relative">
                        <button
                            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={e => { e.stopPropagation(); setActiveMenu(id => id === node.id ? null : node.id); }}
                        >
                            <MoreVertical size={16}/>
                        </button>
                        {activeMenu === node.id && (
                            <div
                                className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 shadow-lg rounded z-10"
                                onMouseEnter={() => { hideTimer.current && clearTimeout(hideTimer.current); }}
                                onMouseLeave={() => {
                                    hideTimer.current = setTimeout(() => setActiveMenu(null), 300);
                                }}
                            >
                                <div className="px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer" onClick={() => onEdit(node)}>编辑</div>
                                <div className="px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer" onClick={() => onCreatePrompt(node)}>创建 Prompt</div>
                                <div className="px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer" onClick={() => onNewDir(node)}>新增子目录</div>
                                <div className="px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer text-red-600" onClick={() => onDelete(node)}>删除</div>
                            </div>
                        )}
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <ul>
                        {node.children!.map(child => renderNode(child, level + 1))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center px-2 py-1 border-b border-gray-200 space-x-2">
                <input
                    type="text"
                    placeholder="搜索目录..."
                    className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
                <button
                    className="flex items-center space-x-1 px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => onNewDir(null)}
                >
                    <span>＋</span><span>新建目录</span>
                </button>
            </div>
            <ul className="flex-1 overflow-auto px-1 pt-1">
                {tree.map(n => renderNode(n))}
            </ul>
        </div>
    );
}