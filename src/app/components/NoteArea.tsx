'use client';
import React, { useState, useEffect } from 'react';
import styles from './NoteArea.module.css';
import { WordNote, GrammarNote, NoteData, NoteItem } from '@/app/components/apiUtils';
import ExtensionButton from '@/app/components/ExtensionButton';
import AddNoteButton from '@/app/components/AddNoteButton';

interface NoteCardProps {
    note: NoteItem;
    isGrammar?: boolean;
    selected: boolean; // 新增受控属性
    onUpdateExtension: (noteId: string, newExtension: any) => void;
    // 用来将该笔记的选中状态传递给父组件
    onSelectChange?: (noteId: string, selected: boolean) => void;
}
function NoteCard({ note, isGrammar,selected, onUpdateExtension, onSelectChange }: NoteCardProps) {
    // 默认设为选中（true）
    // const [selected, setSelected] = useState(true);
    //
    // const handleToggleSelect = () => {
    //     const newSelected = !selected;
    //     setSelected(newSelected);
    //     if (onSelectChange) {
    //         onSelectChange(note.id, newSelected);
    //     }
    // };
    const handleToggleSelect = () => {
        if (onSelectChange) {
            onSelectChange(note.id, !selected);
        }
    };
    return (
        <div className={styles.card}>
            <div className={styles.cardGrid}>
                {/* 左侧选择区域 */}
                <div
                    className={`${styles.selectionArea} ${selected ? styles.selected : ''}`}
                    onClick={handleToggleSelect}
                ></div>
                {/* 中间内容区域 */}
                <div className={styles.cardContent}>
                    {isGrammar ? (
                        <>
                            <div className={styles.cardRow}>
                <span className={styles.primaryText}>
                  {(note as GrammarNote).grammar_formula}
                </span>
                            </div>
                            <div className={styles.cardRow}>
                <span className={styles.secondaryText}>
                  {(note as GrammarNote).explanation}
                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.cardRow}>
                <span className={styles.primaryText}>
                  {(note as WordNote).kanji}
                    {(note as WordNote).romaji ? ` (${(note as WordNote).romaji})` : ''}
                </span>
                            </div>
                            <div className={styles.cardRow}>
                <span className={styles.secondaryText}>
                  {(note as WordNote).translation}
                </span>
                            </div>
                        </>
                    )}
                </div>
                {/* 右侧扩展按钮使用独立组件 */}
                <div className={styles.expandArea}>
                    <ExtensionButton note={note} isGrammar={isGrammar} onUpdateExtension={onUpdateExtension} />
                </div>
            </div>
        </div>
    );
}

interface NoteAreaProps {
    noteData?: NoteData;
    pageId: string;
}

export default function NoteArea({ noteData, pageId }: NoteAreaProps) {
    // 将 props.noteData 拷贝到本地 state，方便更新 extension 后写入 localStorage
    const [noteDataState, setNoteDataState] = useState<NoteData | undefined>(noteData);
    const [hydrated, setHydrated] = useState(false);
    // 分别维护单词和语法笔记的勾选状态（存储 note.id），初始时全部选中
    const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
    const [selectedGrammarIds, setSelectedGrammarIds] = useState<string[]>([]);

    useEffect(() => {
        setNoteDataState(noteData);
        if (noteData) {
            setSelectedWordIds(noteData.wordNotes.map(note => note.id));
            setSelectedGrammarIds(noteData.grammarNotes.map(note => note.id));
        }
    }, [noteData]);

    useEffect(() => {
        setHydrated(true);
    }, []);

    let username = 'defaultUser';
    if (typeof window !== 'undefined') {
        const storedUserData = sessionStorage.getItem('userData');
        if (storedUserData) {
            const userData = JSON.parse(storedUserData);
            username = userData.name || 'defaultUser';
        }
    }

    useEffect(() => {
        if (noteDataState && hydrated) {
            localStorage.setItem(`note_${username}`, JSON.stringify(noteDataState));
        }
    }, [noteDataState, hydrated, username]);

    // 回调函数：更新指定 note 的 extension 字段
    const handleUpdateExtension = (noteId: string, newExtension: any) => {
        if (!noteDataState) return;
        const updatedWordNotes = noteDataState.wordNotes.map((w) =>
            w.id === noteId ? { ...w, extension: newExtension } : w
        );
        const updatedGrammarNotes = noteDataState.grammarNotes.map((g) =>
            g.id === noteId ? { ...g, extension: newExtension } : g
        );
        setNoteDataState({
            wordNotes: updatedWordNotes,
            grammarNotes: updatedGrammarNotes,
        });
    };

    // 处理单词笔记选择变化
    const handleWordSelectChange = (noteId: string, selected: boolean) => {
        if (selected) {
            setSelectedWordIds((prev) => [...prev, noteId]);
        } else {
            setSelectedWordIds((prev) => prev.filter((id) => id !== noteId));
        }
    };

    // 处理语法笔记选择变化
    const handleGrammarSelectChange = (noteId: string, selected: boolean) => {
        if (selected) {
            setSelectedGrammarIds((prev) => [...prev, noteId]);
        } else {
            setSelectedGrammarIds((prev) => prev.filter((id) => id !== noteId));
        }
    };

    // 添加笔记后的回调：清空对应的勾选状态（或保持当前选中状态，根据需要调整）
    const handleAddNotes = (addedIds: string[], noteType: 'word' | 'grammar') => {
        // 此处示例为添加成功后清空对应的勾选状态
        if (noteType === 'word') {
            setSelectedWordIds([]);
        } else {
            setSelectedGrammarIds([]);
        }
    };

    if (!hydrated) return null;

    return (
        <div className={styles.noteArea}>
            {/* 单词笔记部分 */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h4>单词笔记</h4>
                    <AddNoteButton
                        noteType="word"
                        pageId={pageId}
                        selectedIds={selectedWordIds}
                        onAddNotes={handleAddNotes}
                    />
                </div>
                {(noteDataState?.wordNotes?.length ?? 0) > 0 ? (
                    <div className={styles.cardsContainer}>
                        {noteDataState?.wordNotes.map((note, index) => (
                            <NoteCard
                                key={index}
                                note={note}
                                selected={selectedWordIds.includes(note.id)}  // 传入受控状态
                                onUpdateExtension={handleUpdateExtension}
                                onSelectChange={handleWordSelectChange}
                            />
                        ))}
                    </div>
                ) : (
                    <p>暂无单词笔记</p>
                )}
            </div>

            {/* 语法笔记部分 */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h4>语法笔记</h4>
                    <AddNoteButton
                        noteType="grammar"
                        pageId={pageId}
                        selectedIds={selectedGrammarIds}
                        onAddNotes={handleAddNotes}
                    />
                </div>
                {(noteDataState?.grammarNotes?.length ?? 0) > 0 ? (
                    <div className={styles.cardsContainer}>
                        {noteDataState?.grammarNotes.map((note, index) => (
                            <NoteCard
                                key={index}
                                note={note}
                                isGrammar
                                selected={selectedGrammarIds.includes(note.id)}
                                onUpdateExtension={handleUpdateExtension}
                                onSelectChange={handleGrammarSelectChange}
                            />
                        ))}
                    </div>
                ) : (
                    <p>暂无语法笔记</p>
                )}
            </div>
        </div>
    );
}