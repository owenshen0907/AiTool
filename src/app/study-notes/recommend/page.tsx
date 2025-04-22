'use client';
import React, { useState, useEffect } from 'react';
import styles from './recommend.module.css';
import RecommendLeftPanel from './RecommendLeftPanel';
import RecommendRightPanel from './RecommendRightPanel';
import { NoteData, NoteItem } from "@/app/components/apiUtils";

export default function RecommendNotesPage() {
    const [notes, setNotes] = useState<NoteData>({ wordNotes: [], grammarNotes: [] });
    const [loading, setLoading] = useState(true);

    // 左侧类型选择
    const [selectedTypes, setSelectedTypes] = useState<{ word: boolean; grammar: boolean }>({ word: true, grammar: true });
    // 听说写阅熟悉度筛选
    const [familiarityFilters, setFamiliarityFilters] = useState({
        listening: new Set<string>(['生疏', '模糊']),
        speaking: new Set<string>(['生疏', '模糊']),
        writing: new Set<string>(['生疏', '模糊']),
        reading: new Set<string>(['生疏', '模糊']),
    });

    // 搜索文本
    const [searchText, setSearchText] = useState('');
    // 左侧预览结果
    const [previewResults, setPreviewResults] = useState<NoteItem[]>([]);
    // 右侧展示区
    const [displayedNotes, setDisplayedNotes] = useState<NoteItem[]>([]);

    // 从 sessionStorage 获取 username
    const userData = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('userData') || '{}') : {};
    const username = userData.name || 'defaultUser';

    // 页面加载时，先从 localStorage 或 API 获取数据
    useEffect(() => {
        const localData = localStorage.getItem(`notes_${username}`);
        if (localData) {
            const parsed: NoteData = JSON.parse(localData);
            setNotes(parsed);
            // 默认显示前 10 条
            const merged = [...parsed.wordNotes, ...parsed.grammarNotes];
            setDisplayedNotes(merged.slice(0, 10));
            setLoading(false);
        } else {
            // 改为 POST 请求
            fetch(`/api/notes/queryNotes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: username, noteType: 'recommend' })
            })
                .then((res) => res.json())
                .then((data: NoteData) => {
                    setNotes(data);
                    localStorage.setItem(`notes_${username}`, JSON.stringify(data));
                    const merged = [...data.wordNotes, ...data.grammarNotes];
                    setDisplayedNotes(merged.slice(0, 10));
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Fetch notes error', err);
                    setLoading(false);
                });
        }
    }, [username]);

    // 将选中的笔记添加到右侧最上方
    const addNoteToDisplay = (note: NoteItem) => {
        setDisplayedNotes((prev) => [note, ...prev]);
    };

    if (loading) return <div>加载中...</div>;

    return (
        <div className={styles.container}>
            {/* 左侧筛选 & 搜索面板 */}
            <RecommendLeftPanel
                notes={notes}
                selectedTypes={selectedTypes}
                setSelectedTypes={setSelectedTypes}
                familiarityFilters={familiarityFilters}
                setFamiliarityFilters={setFamiliarityFilters}
                searchText={searchText}
                setSearchText={setSearchText}
                previewResults={previewResults}
                setPreviewResults={setPreviewResults}
                addNoteToDisplay={addNoteToDisplay}
            />
            {/* 右侧内容面板 */}
            <RecommendRightPanel displayedNotes={displayedNotes} />
        </div>
    );
}