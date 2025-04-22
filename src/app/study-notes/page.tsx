'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './studyNotes.module.css';

const RecommendNotes = dynamic(() => import('./recommend/page'));
const LatestNotes = dynamic(() => import('./latest/page'));
const CommonNotes = dynamic(() => import('./common/page'));

export default function StudyNotesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 从 URL query 参数中获取 tab 值，默认为 'recommend'
    const initialTab = (searchParams.get('tab') as 'recommend' | 'latest' | 'common') || 'recommend';
    const [selectedTab, setSelectedTab] = useState<'recommend' | 'latest' | 'common'>(initialTab);

    // 当选项发生变化时更新 URL query 参数
    useEffect(() => {
        // 获取当前路径
        const currentPath = window.location.pathname;
        // 更新 URL 参数（使用 router.replace 更新而不刷新页面）
        router.replace(`${currentPath}?tab=${selectedTab}`);
    }, [selectedTab, router]);

    const renderContent = () => {
        switch (selectedTab) {
            case 'recommend':
                return <RecommendNotes />;
            case 'latest':
                return <LatestNotes />;
            case 'common':
                return <CommonNotes />;
            default:
                return null;
        }
    };

    return (
        <main className={styles.mainContainer}>
            {/* 顶部导航区域：标题和页面切换按钮 */}
            <div className={styles.headerRow}>
                <div className={styles.functionSelect}>
                    <span className={styles.navItem}>学习笔记</span>
                    <div className={styles.activeIndicator}></div>
                </div>
                <div className={styles.pageSwitcher}>
                    <button
                        className={`${styles.switchButton} ${selectedTab === 'recommend' ? styles.activeButton : ''}`}
                        onClick={() => setSelectedTab('recommend')}
                    >
                        推荐
                    </button>
                    <button
                        className={`${styles.switchButton} ${selectedTab === 'latest' ? styles.activeButton : ''}`}
                        onClick={() => setSelectedTab('latest')}
                    >
                        最新
                    </button>
                    <button
                        className={`${styles.switchButton} ${selectedTab === 'common' ? styles.activeButton : ''}`}
                        onClick={() => setSelectedTab('common')}
                    >
                        通用
                    </button>
                </div>
            </div>
            {/* 内容区域 */}
            <div className={styles.contentArea}>
                {renderContent()}
            </div>
        </main>
    );
}