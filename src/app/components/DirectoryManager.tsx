// src/components/DirectoryManager.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { DirectoryItem } from '@/lib/models/directory';
import type { ContentItem }   from '@/lib/models/content';

import {
    fetchDirectories,
    createDirectoryApi,
    updateDirectoryApi,
    deleteDirectoryApi
} from '@/lib/api/directory';

import {
    ChevronRight, ChevronDown, ChevronLeft,
    MoreVertical, Folder, FileText
} from 'lucide-react';

/* ---------- props ---------- */
export interface DirectoryManagerProps {
    feature:            string;
    selectedDirId:      string | null;
    selectedItemId:     string | null;
    items:              ContentItem[];
    onSelectDir:        (id: string) => void;
    onSelectItem:       (id: string) => void;
    onCreateContent?:   (dirId: string) => void;
    onDeleteItem?:      (id: string) => void;
}

/* ---------- build tree ---------- */
type TreeNode = DirectoryItem & { children: TreeNode[] };
function buildTree(list: DirectoryItem[]): TreeNode[] {
    const map: Record<string, TreeNode> = {};
    list.forEach(d => (map[d.id] = { ...d, children: [] }));
    const roots: TreeNode[] = [];
    list.forEach(d => {
        if (d.parentId && map[d.parentId]) map[d.parentId].children.push(map[d.id]);
        else roots.push(map[d.id]);
    });
    const sort = (a: DirectoryItem, b: DirectoryItem) => a.position - b.position;
    const dfs  = (n: TreeNode) => { n.children.sort(sort).forEach(dfs); };
    roots.sort(sort).forEach(dfs);
    return roots;
}

/* ---------- component ---------- */
export default function DirectoryManager({
                                             feature, selectedDirId, selectedItemId,
                                             items, onSelectDir, onSelectItem,
                                             onCreateContent, onDeleteItem
                                         }: DirectoryManagerProps) {

    /* data + ui state */
    const [dirs, setDirs]   = useState<DirectoryItem[]>([]);
    const [expand, setEx]   = useState<Set<string>>(new Set());
    const [collapsed, setCollapsed] = useState(false);
    const [menuId, setMenuId] = useState<string | null>(null);
    const hideTimer = useRef<NodeJS.Timeout>();

    /* load directories on mount / feature change */
    useEffect(() => {
        (async () => {
            const list = await fetchDirectories(feature);
            setDirs(list);
            setEx(new Set(list.filter(d => !d.parentId).map(d => d.id)));
        })();
    }, [feature]);

    /* helpers */
    const addSubDir = async (parent: string | null) => {
        const name = prompt('新目录名称')?.trim();
        if (!name) return;
        await createDirectoryApi(feature, parent ?? undefined, name);
        setDirs(await fetchDirectories(feature));
    };
    const renameDir = async (dir: DirectoryItem) => {
        const name = prompt('重命名', dir.name)?.trim();
        if (!name || name === dir.name) return;
        await updateDirectoryApi(dir.id, name);
        setDirs(await fetchDirectories(feature));
    };
    const removeDir = async (dir: DirectoryItem) => {
        if (!confirm(`确认删除目录「${dir.name}」？`)) return;
        await deleteDirectoryApi(dir.id);
        setDirs(await fetchDirectories(feature));
    };

    const tree = useMemo(() => buildTree(dirs), [dirs]);

    /* render one node */
    const renderNode = (node: TreeNode, level = 0) => {
        const hasChild  = node.children.length > 0;
        const open      = expand.has(node.id);
        const dirActive = selectedDirId === node.id;

        const contents = items
            .filter(i => (i as any).directoryId === node.id || (i as any).directory_id === node.id)
            .sort((a,b) => a.position - b.position);

        return (
            <li key={node.id}>
                {/* directory row */}
                <div
                    className={`group flex items-center pr-2 py-1 ${dirActive ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                    style={{ paddingLeft: collapsed ? 8 : 12 + level * 20 }}
                    onClick={() => {
                        onSelectDir(node.id);
                        if (hasChild) setEx(s => {
                            const n = new Set(s); n.has(node.id) ? n.delete(node.id) : n.add(node.id); return n;
                        });
                    }}
                >
                    {!collapsed && (
                        <>
                            {hasChild
                                ? <button
                                    className="mr-1"
                                    onClick={e => { e.stopPropagation();
                                        setEx(s => { const n=new Set(s); n.has(node.id)?n.delete(node.id):n.add(node.id); return n; });
                                    }}
                                >
                                    {open ? <ChevronDown size={14}/> : <ChevronRight size={14}/> }
                                </button>
                                : <span className="mr-1" style={{width:14}}/>
                            }

                            <Folder size={16} className="text-gray-600 mr-1"/>
                            <span className="flex-1 truncate">{node.name}</span>

                            {/* menu btn */}
                            <div
                                className="relative"
                                onMouseLeave={() => (hideTimer.current = setTimeout(() => setMenuId(null), 200))}
                                onMouseEnter={() => hideTimer.current && clearTimeout(hideTimer.current)}
                            >
                                <button
                                    className="opacity-0 group-hover:opacity-100 transition"
                                    onClick={e => { e.stopPropagation(); setMenuId(m => m===node.id?null:node.id); }}
                                ><MoreVertical size={16}/></button>

                                {menuId===node.id && (
                                    <div
                                        className="absolute top-full left-0 -translate-x-full mt-1 w-28 bg-white border shadow rounded z-50"
                                        onMouseEnter={() => hideTimer.current && clearTimeout(hideTimer.current)}
                                        onMouseLeave={() => (hideTimer.current = setTimeout(() => setMenuId(null), 200))}
                                    >
                                        <div
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={e => { e.stopPropagation(); setMenuId(null); addSubDir(node.id);} }
                                        >新建子目录</div>
                                        <div
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={e => {
                                                e.stopPropagation();
                                                /* ① 立即把菜单关了 */
                                                setMenuId(null);
                                                /* ② 下一帧再调用父组件 —— 不会被重新渲染冲掉 */
                                                requestAnimationFrame(() => onCreateContent?.(node.id));
                                                console.log('create-content clicked', node.id);
                                            }}
                                        >
                                            创建内容
                                        </div>
                                        <div
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={e => { e.stopPropagation(); setMenuId(null); renameDir(node);} }
                                        >重命名</div>
                                        <div
                                            className="px-3 py-2 hover:bg-gray-100 text-red-600 cursor-pointer"
                                            onClick={e => { e.stopPropagation(); setMenuId(null); removeDir(node);} }
                                        >删除</div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* children + content */}
                {open && !collapsed && (
                    <ul>
                        {node.children.map(c => renderNode(c, level + 1))}
                        {contents.map(c => (
                            <li key={c.id}>
                                <div
                                    className={`group flex items-center pr-2 py-1 ${
                                        selectedItemId === c.id ? 'bg-blue-100' : 'hover:bg-gray-50'
                                    }`}
                                    style={{ paddingLeft: 12 + (level + 1) * 20 }}
                                    onClick={() => onSelectItem(c.id)}
                                >
                                    <FileText size={15} className="text-gray-500 mr-1"/>
                                    <span className="flex-1 truncate">{c.title}</span>

                                    {onDeleteItem && (
                                        <div
                                            className="relative"
                                            onMouseLeave={() => (hideTimer.current = setTimeout(() => setMenuId(null), 200))}
                                            onMouseEnter={() => hideTimer.current && clearTimeout(hideTimer.current)}
                                        >
                                            <button
                                                className="opacity-0 group-hover:opacity-100 transition"
                                                onClick={e => { e.stopPropagation(); setMenuId(m => m===c.id?null:c.id); }}
                                            ><MoreVertical size={14}/></button>

                                            {menuId===c.id && (
                                                <div
                                                    className="absolute top-full left-0 -translate-x-full mt-1 w-24 bg-white border shadow rounded z-50"
                                                    onMouseEnter={() => hideTimer.current && clearTimeout(hideTimer.current)}
                                                    onMouseLeave={() => (hideTimer.current = setTimeout(() => setMenuId(null), 200))}
                                                >
                                                    <div
                                                        className="px-3 py-2 hover:bg-gray-100 text-red-600 cursor-pointer"
                                                        onClick={e => { e.stopPropagation(); setMenuId(null); onDeleteItem(c.id);} }
                                                    >删除</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </li>
        );
    };

    /* ---------- render sidebar ---------- */
    return (
        <aside className={`flex flex-col h-screen bg-white border-r transition-all duration-200
                       ${collapsed ? 'w-12' : 'w-80'}`}>
            <div className="flex items-center justify-between px-2 py-1 border-b">
                {!collapsed && <span className="font-semibold">目录</span>}

                <div className="flex items-center space-x-1">
                    {!collapsed && (
                        <button
                            onClick={() => addSubDir(null)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                        >＋目录</button>
                    )}
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        className="p-1 hover:bg-gray-100 rounded"
                    >{collapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/> }</button>
                </div>
            </div>

            <ul className="flex-1 overflow-auto text-sm select-none">
                {tree.map(n => renderNode(n))}
            </ul>
        </aside>
    );
}