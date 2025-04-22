'use client';
import React, { useState, useEffect } from 'react';
import styles from './ExtensionButton.module.css';
import ExtensionDisplay from './ExtensionDisplay';
import { WordNote, GrammarNote, NoteItem } from '@/app/components/apiUtils';

interface ExtensionButtonProps {
    note: NoteItem;
    isGrammar?: boolean;
    onUpdateExtension: (noteId: string, newExtension: any) => void;
}

const ExtensionButton: React.FC<ExtensionButtonProps> = ({ note, isGrammar, onUpdateExtension }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [extensionContent, setExtensionContent] = useState(note.extension);

    // 当 note.extension 更新时，同步更新组件的 state
    useEffect(() => {
        setExtensionContent(note.extension);
    }, [note.extension]);

    const handleExpand = async () => {
        // 判断 extension 是否为空（如果是空对象或 falsy）
        let isEmpty =
            !extensionContent ||
            (typeof extensionContent === 'object' && Object.keys(extensionContent).length === 0);
        if (isEmpty) {
            try {
                const storedUserData = sessionStorage.getItem('userData');
                if (!storedUserData) {
                    alert('用户未登录');
                    return;
                }
                const userData = JSON.parse(storedUserData);
                const userName = userData.name;
                const noteType = isGrammar ? 'grammar' : 'word';
                // 如果是单词，则拼接 kanji/kana，如 "勉強/べんきょう"
                const content =
                    noteType === 'word'
                        ? `${(note as WordNote).kanji}/${(note as WordNote).kana}`
                        : (note as GrammarNote).grammar_formula;
                const payload = {
                    content,
                    noteType,
                    userName,
                    id: note.id,
                };
                console.log("ExtensionButton 调用生成扩展接口，payload:", JSON.stringify(payload, null, 2));
                const res = await fetch('/api/notes/generateExtension', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                console.log("ExtensionButton 生成扩展接口返回状态:", res.status);
                if (!res.ok) {
                    alert('生成扩展内容失败');
                    return;
                }
                const newExtension = await res.json();
                console.log("ExtensionButton 新扩展内容:", newExtension);
                setExtensionContent(newExtension);
                onUpdateExtension(note.id, newExtension);
                // 更新 localStorage
                const storageKey = `notes_${userName}`;
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const noteData = JSON.parse(stored);
                    // 根据你的数据结构更新对应 note 的 extension 字段
                    // 这里假设 noteData 中有 wordNotes 和 grammarNotes 数组
                    const updateNotes = (notes: NoteItem[]) =>
                        notes.map(n => n.id === note.id ? { ...n, extension: newExtension } : n);
                    const updatedData = {
                        ...noteData,
                        wordNotes: updateNotes(noteData.wordNotes || []),
                        grammarNotes: updateNotes(noteData.grammarNotes || [])
                    };
                    localStorage.setItem(storageKey, JSON.stringify(updatedData));
                }
            } catch (error) {
                console.error("ExtensionButton 生成扩展内容错误", error);
            }
        }
        setModalOpen(true);
    };

    return (
        <>
            <button className={styles.expandButton} onClick={handleExpand}>扩展</button>
            {modalOpen && (
                <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setModalOpen(false)}>关闭</button>
                        <ExtensionDisplay data={extensionContent} />
                    </div>
                </div>
            )}
        </>
    );
};

export default ExtensionButton;