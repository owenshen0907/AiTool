'use client';
import React, { useState } from 'react';
import styles from './CommonLeftPanel.module.css';
import { CommonNoteData, CommonNote } from '@/app/components/apiUtils';

interface TreeNode {
    label: string;         // 显示名称（即笔记的 title）
    note?: CommonNote;     // 关联的笔记记录（如果有）
    parent: string | null; // 父级记录的 id；虚拟根节点为 null
    children: TreeNode[];
}

/**
 * 根据 CommonNote 数组构建树，基于 note.parent_id 建立层级关系。
 */
function buildTree(notes: CommonNote[]): TreeNode[] {
    const nodeMap: Record<string, TreeNode> = {};
    notes.forEach(note => {
        nodeMap[note.id] = {
            label: note.title,
            note,
            parent: note.parent_id || null,
            children: []
        };
    });
    const roots: TreeNode[] = [];
    Object.values(nodeMap).forEach(node => {
        if (node.parent && nodeMap[node.parent]) {
            nodeMap[node.parent].children.push(node);
        } else {
            roots.push(node);
        }
    });
    return roots;
}

interface LeftPanelProps {
    notes: CommonNoteData;
    setSelectedNote: (note: CommonNote) => void;
    onEdit: (note: CommonNote | null) => void;
    refreshNotes: () => void;
}

export default function CommonLeftPanel({ notes = { notes: [] }, setSelectedNote, onEdit, refreshNotes }: LeftPanelProps) {
    // 构建目录树，如果没有数据则为空数组
    const treeData = (notes?.notes?.length ?? 0) > 0 ? buildTree(notes.notes) : [];
    // 虚拟根节点“目录”：其 children 为所有顶级目录（parent_id 为 null）
    const rootNode: TreeNode = { label: '目录', parent: null, children: treeData };

    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // 节点的唯一 key：如果节点有 note，则使用 note.id，否则为 'root'
    const getNodeKey = (node: TreeNode): string => (node.note ? node.note.id : 'root');

    const toggleExpand = (nodeKey: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(expandedNodes);
        if (newSet.has(nodeKey)) {
            newSet.delete(nodeKey);
        } else {
            newSet.add(nodeKey);
        }
        setExpandedNodes(newSet);
    };

    // 递归渲染树节点
    const renderTree = (node: TreeNode, level: number) => {
        const nodeKey = getNodeKey(node);
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedNodes.has(nodeKey);

        return (
            <li key={nodeKey} className={styles.treeNode} style={{ marginLeft: `${level * 1.2}rem` }}>
                <div className={styles.nodeRow} onClick={() => {
                    if (node.note) {
                        setSelectedNote(node.note);
                    } else {
                        setSelectedNote({
                            id: '',
                            title: node.label,
                            content: '',
                            created_at: '',
                            updated_at: '',
                            user_id: '',
                            is_public: false,
                        });
                    }
                }}>
                    <div className={styles.labelArea}>
                        {hasChildren && (
                            <span className={styles.arrowIcon} onClick={(e) => toggleExpand(nodeKey, e)}>
                {isExpanded ? '▾' : '▸'}
              </span>
                        )}
                        <span className={styles.nodeLabel}>{node.label}</span>
                    </div>
                    <div className={styles.iconsArea}>
            <span className={styles.menuIcon} onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(nodeKey === activeMenu ? null : nodeKey);
            }}>
              ⋮
            </span>
                        {activeMenu === nodeKey && (
                            <div className={styles.optionMenu}>
                                {node.label !== '目录' && (
                                    <div className={styles.menuItem} onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenu(null);
                                        onEdit(node.note || null);
                                    }}>
                                        编辑
                                    </div>
                                )}
                                <div className={styles.menuItem} onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenu(null);
                                    handleNewDir(node);
                                }}>
                                    新增
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <ul className={styles.childList}>
                        {node.children.map(child => renderTree(child, level + 1))}
                    </ul>
                )}
            </li>
        );
    };

    // 新增子目录：调用接口插入数据，成功后调用 refreshNotes 刷新数据
    const handleNewDir = async (parentNode: TreeNode) => {
        const parentLabel = parentNode.label;
        // 如果当前节点有 note，则使用其 id 作为 parent_id；否则（虚拟根）传 null
        const parentId = parentNode.note ? parentNode.note.id : null;
        const newTitle = prompt(`请输入 "${parentLabel}" 下的子目录名称:`);
        if (!newTitle) return;

        const newNoteData = {
            title: newTitle.trim(),
            parent_id: parentId,
            summary: '',
            content: '',
            tags: '',
            comments: [],
            update_log: '',
            user_id: '', // 由后端或 session 设置
            is_public: false,
        };

        let username = 'defaultUser';
        if (typeof window !== 'undefined') {
            const storedUserData = sessionStorage.getItem('userData');
            if (storedUserData) {
                const userData = JSON.parse(storedUserData);
                username = userData.name || 'defaultUser';
            }
        }

        try {
            const res = await fetch('/api/notes/operateCommonNotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operation: 'insert', userId: username, note: newNoteData }),
            });
            const data = await res.json();
            if (data.note) {
                alert(`新增目录 "${data.note.title}" 成功`);
                setSelectedNote(data.note);
                refreshNotes();
            } else {
                console.error('保存失败', data);
            }
        } catch (error) {
            console.error('保存接口调用出错', error);
        }
    };

    return (
        <div className={styles.leftPanel}>
            <ul className={styles.treeList}>
                {renderTree(rootNode, 0)}
            </ul>
        </div>
    );
}