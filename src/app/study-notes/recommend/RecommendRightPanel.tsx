'use client';
import React, { useState } from 'react';
import rightStyles from './recommendRightPanel.module.css';
import { NoteItem, familiarityText, isGrammarNote } from "@/app/components/apiUtils";
import ExtensionButton from '@/app/components/ExtensionButton';

// 辅助函数：根据熟悉度文本返回对应的背景颜色
const getFamiliarityColor = (level: any) => {
    const text = familiarityText(level);
    switch (text) {
        case '生疏':
            return '#6C757D';
        case '模糊':
            return '#FFC107';
        case '熟悉':
            return '#20C997';
        case '精通':
            return '#2A3F8F';
        default:
            return '#ccc';
    }
};

// 辅助函数：格式化时间，精确到秒
const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

interface RightPanelProps {
    displayedNotes: NoteItem[];
}

// 单个卡片组件
const NoteCard: React.FC<{ note: NoteItem }> = ({ note }) => {
    const [selected, setSelected] = useState(true);
    const isGrammar = isGrammarNote(note);

    return (
        <div className={rightStyles.noteCard}>
            <div className={rightStyles.firstRow}>
                <div className={rightStyles.textGroup}>
                    {isGrammar ? (
                        <span className={rightStyles.grammarFormula}>
              <strong>{note.grammar_formula}</strong>
            </span>
                    ) : (
                        <>
              <span className={rightStyles.kanji}>
                <strong>{note.kanji}</strong>
              </span>
                            <span className={rightStyles.readings}>
                {note.kana} / {note.romaji}
              </span>
                            <span className={rightStyles.pos}>【{note.pos}】</span>
                        </>
                    )}
                </div>
                <div className={rightStyles.familiarityWrapper}>
                    {/* 左侧选择框 */}
                    <div
                        className={`${rightStyles.selectionArea} ${selected ? rightStyles.selected : ''}`}
                        onClick={() => setSelected(!selected)}
                    ></div>
                    {/* 中间熟悉度 */}
                    <span className={rightStyles.familiarity}>
            <span
                className={rightStyles.familiarityItem}
                style={{ backgroundColor: getFamiliarityColor(note.listening) }}
            >
              听
            </span>
            <span
                className={rightStyles.familiarityItem}
                style={{ backgroundColor: getFamiliarityColor(note.speaking) }}
            >
              说
            </span>
            <span
                className={rightStyles.familiarityItem}
                style={{ backgroundColor: getFamiliarityColor(note.writing) }}
            >
              写
            </span>
            <span
                className={rightStyles.familiarityItem}
                style={{ backgroundColor: getFamiliarityColor(note.reading) }}
            >
              阅
            </span>
          </span>
                    {/* 右侧扩展按钮 */}
                    <div className={rightStyles.expandArea}>
                        <ExtensionButton note={note} isGrammar={isGrammar} onUpdateExtension={() => {}} />
                    </div>
                </div>
            </div>
            <div className={rightStyles.secondRow}>
                {isGrammar ? (
                    <>
                        <span className={rightStyles.explanation}>{note.explanation}</span>
                        <span className={rightStyles.studyTime}>{formatTime(note.updated_at)}</span>
                    </>
                ) : (
                    <>
                        <span className={rightStyles.translation}>{note.translation}</span>
                        <span className={rightStyles.studyTime}>{formatTime(note.updated_at)}</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default function RecommendRightPanel({ displayedNotes }: RightPanelProps) {
    return (
        <div className={rightStyles.rightPanel}>
            <div className={rightStyles.header}>
                <h3>记忆卡片</h3>
                <div className={rightStyles.legend}>
                    <div className={rightStyles.legendItem}>
                        <span className={rightStyles.legendColor} style={{ backgroundColor: '#6C757D' }}></span> 生疏
                    </div>
                    <div className={rightStyles.legendItem}>
                        <span className={rightStyles.legendColor} style={{ backgroundColor: '#FFC107' }}></span> 模糊
                    </div>
                    <div className={rightStyles.legendItem}>
                        <span className={rightStyles.legendColor} style={{ backgroundColor: '#20C997' }}></span> 熟悉
                    </div>
                    <div className={rightStyles.legendItem}>
                        <span className={rightStyles.legendColor} style={{ backgroundColor: '#2A3F8F' }}></span> 精通
                    </div>
                </div>
            </div>
            {displayedNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
            ))}
        </div>
    );
}