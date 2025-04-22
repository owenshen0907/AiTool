// ./src/app/study-assistant/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import ChatArea from './chat/ChatArea';
import { NoteData } from '@/app/components/apiUtils';
import NoteArea from '../components/NoteArea'
import GenerateNoteButton from '../components/GenerateNoteButton';


// 从 sessionStorage 获取 username
const userData = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('userData') || '{}') : {};
const username = userData.name || 'defaultUser';

export default function StudyAssistantPage() {
    // 初始化时尝试从 localStorage 读取缓存
    const [noteData, setNoteData] = useState<NoteData | undefined>(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(`note_${username}`);
            if (cached) {
                try {
                    return JSON.parse(cached);
                } catch (e) {
                    console.error('Error parsing cached noteData', e);
                }
            }
        }
        return undefined;
    });
    const [hydrated, setHydrated] = useState(false);
    const [latestChat, setLatestChat] = useState<string>('');

    // 组件挂载后设置 hydrated 状态
    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        console.log(`note_${username} updated: `, noteData);
        if (noteData) {
            localStorage.setItem(`note_${username}`, JSON.stringify(noteData));
        }
    }, [noteData, username]);

    // 未挂载前不渲染
    if (!hydrated) return null;

    return (
        <main className={styles.mainContainer}>
            <div className={styles.headerRow}>
                <div className={styles.functionSelect}>
                    <span className={styles.navItem}>学习助手</span>
                    <div className={styles.activeIndicator}></div>
                </div>
            </div>
            <div className={styles.bodyRow}>
                <div className={styles.chatColumn}>
                    <ChatArea onLatestChat={(text) => setLatestChat(text)} />
                    <div className={styles.floatingButton}>
                        <GenerateNoteButton
                            content={latestChat}
                            onGenerated={(data: any) => {
                                console.log('Generated note data: ', data);
                                setNoteData(data);
                            }}
                        />
                    </div>
                </div>
                <div className={styles.notesColumn}>
                    {/* 传递 pageId 用来判断使用哪种维度参数 */}
                    <NoteArea pageId="study-assistant" noteData={noteData} />
                </div>
            </div>
        </main>
    );
}