import React from 'react';
import styles from './page.module.css';

export default function HomePage() {
    return (
        <main className={styles.main}>
            {/* 上部分：统计区域 */}
            <section className={styles.statistics}>
                {/* 单词统计 */}
                <div className={styles.statsBlock}>
                    <div className={styles.statsRow}>
                        <div className={`${styles.statsCell} ${styles.cellWide}`}>单词</div>
                        <div className={styles.statsCell}>N5</div>
                        <div className={styles.statsCell}>N4</div>
                        <div className={styles.statsCell}>N3</div>
                        <div className={styles.statsCell}>N2</div>
                        <div className={styles.statsCell}>N1</div>
                    </div>
                    <div className={styles.statsRow}>
                        <div className={`${styles.statsCell} ${styles.cellWideLarge}`}>17,446</div>
                        <div className={styles.statsCell}>1,124</div>
                        <div className={styles.statsCell}>1,674</div>
                        <div className={styles.statsCell}>3,741</div>
                        <div className={styles.statsCell}>3,575</div>
                        <div className={styles.statsCell}>7,332</div>
                    </div>
                </div>
                {/* 语法统计 */}
                <div className={styles.statsBlock}>
                    <div className={styles.statsRow}>
                        <div className={`${styles.statsCell} ${styles.cellWide}`}>语法</div>
                        <div className={styles.statsCell}>N5</div>
                        <div className={styles.statsCell}>N4</div>
                        <div className={styles.statsCell}>N3</div>
                        <div className={styles.statsCell}>N2</div>
                        <div className={styles.statsCell}>N1</div>
                    </div>
                    <div className={styles.statsRow}>
                        <div className={`${styles.statsCell} ${styles.cellWideLarge}`}>445</div>
                        <div className={styles.statsCell}>75</div>
                        <div className={styles.statsCell}>64</div>
                        <div className={styles.statsCell}>93</div>
                        <div className={styles.statsCell}>100</div>
                        <div className={styles.statsCell}>123</div>
                    </div>
                </div>
            </section>

            {/* 中部分：网站介绍 */}
            <section className={styles.introduction}>
                <h2>关于本站</h2>
                <p>
                    本日语学习网站兼顾考试与实用日语，采用最先进的人工智能技术，让学习变得如同游戏般有趣。
                    本站提供多维度线上学习工具，从听、说、写、阅四个方面逐步提升您的日语能力，
                    每一步学习都清晰展示进度，系统会根据您的学习情况生成个性化内容，让学习更轻松高效。
                </p>
            </section>

            {/* 下部分：轮播导航模块 */}
            <section className={styles.carousel}>
                <nav className={styles.carouselNav}>
                    <button className={styles.navButton}>体验</button>
                    <button className={styles.navButton}>学习助手</button>
                    <button className={styles.navButton}>听说写阅</button>
                    <button className={styles.navButton}>学习笔记</button>
                    <button className={styles.navButton}>考试</button>
                </nav>
                <div className={styles.carouselContent}>
                    <p>根据导航选项展示相应功能的预览内容。</p>
                </div>
            </section>
        </main>
    );
}