// app/prompt/manage/PromptLeftPanel.tsx
'use client';
import React, { useState } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FileText,
    MoreVertical,
} from 'lucide-react';

export interface PromptNode {
    id: string;
    title: string;
    parentId: string | null;
    children?: PromptNode[];
}

interface PromptLeftPanelProps {
    nodes: PromptNode[];
    selectedId: string | null;
    onSelect: (node: PromptNode) => void;
    onEdit: (node: PromptNode) => void;
    onNewDir: (parent: PromptNode | null) => void;
    onReorder: (sourceId: string, targetId: string) => void;
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
                                            onNewDir,
                                            onReorder,
                                        }: PromptLeftPanelProps) {
    const tree = buildTree(nodes);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const toggle = (id: string) => {
        const s = new Set(expanded);
        s.has(id) ? s.delete(id) : s.add(id);
        setExpanded(s);
    };

    const renderNode = (node: PromptNode, level = 0): JSX.Element => {
        const isExpanded = expanded.has(node.id);
        const hasChildren = !!node.children && node.children.length > 0;
        const isSelected = node.id === selectedId;

        return (
            <li key={node.id} className="list-none">
                <div
                    className={
                        `group flex items-center justify-between p-2 cursor-pointer select-none transition-colors ` +
                        (isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100')
                    }
                    style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
                    onClick={() => onSelect(node)}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', node.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => onReorder(e.dataTransfer.getData('text/plain'), node.id)}
                >
                    <div className="flex items-center space-x-2">
                        {/* 保持对齐：有子目录显示切换箭头，无子目录显示占位 */}
                        {hasChildren ? (
                            <button
                                className="w-4 h-4 flex items-center justify-center focus:outline-none"
                                onClick={e => { e.stopPropagation(); toggle(node.id); }}
                            >
                                {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                            </button>
                        ) : (
                            <span className="w-4 h-4" />
                        )}

                        {/* 图标：文件或文件夹 */}
                        <span className="w-4 h-4 flex items-center justify-center text-gray-500">
              {hasChildren ? <Folder size={16}/> : <FileText size={16}/>}
            </span>

                        <span className="truncate font-medium">{node.title}</span>
                    </div>

                    {/* 操作菜单 */}
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            className="p-1 hover:bg-gray-200 rounded"
                            onClick={e => { e.stopPropagation(); setActiveMenu(node.id === activeMenu ? null : node.id); }}
                        >
                            <MoreVertical size={16} />
                        </button>
                        {activeMenu === node.id && (
                            <div
                                className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 shadow-lg rounded z-10"
                                onClick={e => e.stopPropagation()}
                            >
                                <div
                                    className="px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer"
                                    onClick={() => onEdit(node)}
                                >编辑</div>
                                <div
                                    className="px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer"
                                    onClick={() => onNewDir(node)}
                                >新增子目录</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 子节点 */}
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
            {/* 搜索与新增 */}
            <div className="flex items-center px-2 py-2 border-b border-gray-200 space-x-2">
                <input
                    type="text"
                    placeholder="搜索目录..."
                    className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
                <button
                    className="flex items-center space-x-1 px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => onNewDir(null)}
                >
                    <span>＋</span><span>新建</span>
                </button>
            </div>

            {/* 目录列表 */}
            <ul className="flex-1 overflow-auto px-1 pt-1">
                {tree.map(node => renderNode(node))}
            </ul>
        </div>
    );
}