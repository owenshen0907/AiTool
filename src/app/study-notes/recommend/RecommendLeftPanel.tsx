'use client';
import React from 'react';
import leftStyles from './recommendLeftPanel.module.css';
import { NoteData, NoteItem, familiarityText, isGrammarNote } from "@/app/components/apiUtils";

interface LeftPanelProps {
    notes: NoteData;
    selectedTypes: { word: boolean; grammar: boolean };
    setSelectedTypes: React.Dispatch<React.SetStateAction<{ word: boolean; grammar: boolean }>>;
    familiarityFilters: {
        listening: Set<string>;
        speaking: Set<string>;
        writing: Set<string>;
        reading: Set<string>;
    };
    setFamiliarityFilters: React.Dispatch<
        React.SetStateAction<{
            listening: Set<string>;
            speaking: Set<string>;
            writing: Set<string>;
            reading: Set<string>;
        }>
    >;
    searchText: string;
    setSearchText: React.Dispatch<React.SetStateAction<string>>;
    previewResults: NoteItem[];
    setPreviewResults: React.Dispatch<React.SetStateAction<NoteItem[]>>;
    addNoteToDisplay: (note: NoteItem) => void;
}

export default function RecommendLeftPanel(props: LeftPanelProps) {
    const {
        notes,
        selectedTypes,
        setSelectedTypes,
        familiarityFilters,
        setFamiliarityFilters,
        searchText,
        setSearchText,
        previewResults,
        setPreviewResults,
        addNoteToDisplay,
    } = props;

    // 更新后的类型切换逻辑
    const toggleType = (type: 'word' | 'grammar') => {
        setSelectedTypes((prev) => {
            const other = type === 'word' ? 'grammar' : 'word';
            if (prev.word && prev.grammar) {
                // 两个都选中，点击一个则取消该项
                return { ...prev, [type]: false };
            } else if (prev[type] && !prev[other]) {
                // 只有当前选中，点击已选中的则切换为另一项
                return type === 'word' ? { word: false, grammar: true } : { word: true, grammar: false };
            } else if (!prev[type] && prev[other]) {
                // 只有另一项选中，点击未选中的则把其选中（结果为两个都选中）
                return { word: true, grammar: true };
            } else {
                // 万一两个都未选中，则选中点击项
                return { ...prev, [type]: true };
            }
        });
    };

    // 切换熟悉度过滤（保持原有逻辑）
    const toggleFamiliarity = (
        dimension: 'listening' | 'speaking' | 'writing' | 'reading',
        levelText: string
    ) => {
        setFamiliarityFilters((prev) => {
            const newSet = new Set(prev[dimension]);
            if (newSet.has(levelText)) newSet.delete(levelText);
            else newSet.add(levelText);
            return { ...prev, [dimension]: newSet };
        });
    };

    // 执行搜索：保持原有逻辑
    const handleSearch = () => {
        let results: NoteItem[] = [];
        if (selectedTypes.word) {
            results = results.concat(
                notes.wordNotes.filter((note) =>
                    note.kana.includes(searchText) ||
                    note.kanji.includes(searchText) ||
                    note.romaji.includes(searchText)
                )
            );
        }
        if (selectedTypes.grammar) {
            results = results.concat(
                notes.grammarNotes.filter((note) =>
                    note.grammar_formula.includes(searchText)
                )
            );
        }
        const dims: ('listening' | 'speaking' | 'writing' | 'reading')[] = ['listening', 'speaking', 'writing', 'reading'];
        const filterByFamiliarity = (note: NoteItem) => {
            for (const dim of dims) {
                const sets = familiarityFilters[dim];
                if (sets.size > 0) {
                    const textVal = familiarityText(note[dim]);
                    if (!sets.has(textVal)) return false;
                }
            }
            return true;
        };
        results = results.filter(filterByFamiliarity);
        setPreviewResults(results);
    };

    return (
        <div className={leftStyles.leftPanel}>
            {/* 去掉了“类型选择”文字 */}
            <div className={leftStyles.filterSection}>
                <div className={leftStyles.toggleGroup}>
                    <div
                        className={`${leftStyles.toggleButton} ${leftStyles.leftButton} ${selectedTypes.word ? leftStyles.wordSelected : ''}`}
                        onClick={() => toggleType('word')}
                    >
                        单词
                    </div>
                    <div
                        className={`${leftStyles.toggleButton} ${leftStyles.rightButton} ${selectedTypes.grammar ? leftStyles.grammarSelected : ''}`}
                        onClick={() => toggleType('grammar')}
                    >
                        语法
                    </div>
                </div>
            </div>
            {(['listening', 'speaking', 'writing', 'reading'] as const).map((dim) => {
                // 定义每个维度的图标和提示文字
                const icons: Record<typeof dim, { icon: string; title: string }> = {
                    listening: { icon: '👂', title: '听力' },
                    speaking: { icon: '💬', title: '口语' },
                    writing:  { icon: '✏️', title: '写作' },
                    reading:  { icon: '👁️', title: '阅读' },
                };
                const { icon, title } = icons[dim];

                return (
                    <div key={dim} className={leftStyles.filterSection}>
                        <div className={leftStyles.familiarityGroup}>
                            {/* 显示图标，同时用 title 提示具体维度 */}
                            <span className={leftStyles.dimensionIcon} title={title}>
          {icon}
        </span>
                            <button
                                className={`${leftStyles.familiarityButton} ${leftStyles.leftButton}`}
                                style={{
                                    backgroundColor: familiarityFilters[dim].has('生疏') ? '#6C757D' : '#fff',
                                    color: familiarityFilters[dim].has('生疏') ? '#fff' : '#000',
                                }}
                                onClick={() => toggleFamiliarity(dim, '生疏')}
                            >
                                生疏
                            </button>
                            <button
                                className={leftStyles.familiarityButton}
                                style={{
                                    backgroundColor: familiarityFilters[dim].has('模糊') ? '#FFC107' : '#fff',
                                    color: familiarityFilters[dim].has('模糊') ? '#fff' : '#000',
                                }}
                                onClick={() => toggleFamiliarity(dim, '模糊')}
                            >
                                模糊
                            </button>
                            <button
                                className={leftStyles.familiarityButton}
                                style={{
                                    backgroundColor: familiarityFilters[dim].has('熟悉') ? '#20C997' : '#fff',
                                    color: familiarityFilters[dim].has('熟悉') ? '#fff' : '#000',
                                }}
                                onClick={() => toggleFamiliarity(dim, '熟悉')}
                            >
                                熟悉
                            </button>
                            <button
                                className={`${leftStyles.familiarityButton} ${leftStyles.rightButton}`}
                                style={{
                                    backgroundColor: familiarityFilters[dim].has('精通') ? '#2A3F8F' : '#fff',
                                    color: familiarityFilters[dim].has('精通') ? '#fff' : '#000',
                                }}
                                onClick={() => toggleFamiliarity(dim, '精通')}
                            >
                                精通
                            </button>
                        </div>
                    </div>
                );
            })}

            {/* 搜索区域：只保留按钮内“搜索”两个字 */}
            <div className={leftStyles.filterSection}>
                <div className={leftStyles.searchGroup}>
                    <input
                        type="text"
                        placeholder="输入搜索内容..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className={leftStyles.searchInput}
                    />
                    <button onClick={handleSearch} className={leftStyles.searchButton}>
                        搜索
                    </button>
                </div>
            </div>

            {/* 预览结果 */}
            <div className={leftStyles.previewArea}>
                <h3>预览结果</h3>
                {previewResults.map((note) => (
                    <div key={note.id} className={leftStyles.previewItem}>
                        {isGrammarNote(note) ? (
                            <span>语法: {note.grammar_formula}</span>
                        ) : (
                            <span>单词: {note.kana} / {note.kanji} / {note.romaji}</span>
                        )}
                        <button onClick={() => addNoteToDisplay(note)} className={leftStyles.detailButton}>
                            详情
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}