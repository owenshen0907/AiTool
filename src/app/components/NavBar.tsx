// components/NavBar.tsx
'use client';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import styles from './NavBar.module.css';

export default function NavBar() {
    const [userData, setUserData] = useState<any>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/user/get', {
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!res.ok) throw new Error(`请求失败：${res.status}`);
                const data = await res.json();
                setUserData(data.user);
                sessionStorage.setItem('userData', JSON.stringify(data.user));
            } catch (err) {
                console.error('获取用户信息出错：', err);
            }
        };
        const cached = sessionStorage.getItem('userData');
        if (cached) setUserData(JSON.parse(cached));
        else fetchUserData();
    }, []);

    const handleLogout = () => {
        // 清本地缓存
        sessionStorage.removeItem('userData');
        // 让浏览器去调用后端注销接口
        window.location.href = '/api/auth/logout';
    };

    const nickname = userData?.data.displayName || userData?.data.name || '未登录';

    return (
        <nav className={styles.navContainer}>
            <div className={styles.logo}>AiTool</div>

            <ul className={styles.navMenu}>
                <li><Link href="/">首页</Link></li>

                <li className={styles.navItem}>
                    <span>Prompt</span>
                    <ul className={styles.dropdownMenu}>
                        <li><Link href="/prompt/manage">Prompt管理</Link></li>
                        <li><Link href="/prompt/create">Prompt生成</Link></li>
                        <li><Link href="/prompt/debug">Prompt调试</Link></li>
                    </ul>
                </li>

                <li className={styles.navItem}>
                    <span>知识库</span>
                    <ul className={styles.dropdownMenu}>
                        <li><Link href="/kb/manage">知识库管理</Link></li>
                        <li><Link href="/kb/files">文件管理</Link></li>
                    </ul>
                </li>

                <li className={styles.navItem}>
                    <span>模型微调</span>
                    <ul className={styles.dropdownMenu}>
                        <li><Link href="/fine-tune/manage">微调管理</Link></li>
                        <li><Link href="/fine-tune/datasets">数据集管理</Link></li>
                    </ul>
                </li>

                <li className={styles.navItem}>
                    <span>语音</span>
                    <ul className={styles.dropdownMenu}>
                        <li><Link href="/speech/asr">ASR</Link></li>
                        <li><Link href="/speech/tts">TTS</Link></li>
                        <li><Link href="/speech/real-time">Real‑Time</Link></li>
                    </ul>
                </li>

                <li className={styles.navItem}>
                    <span>图片</span>
                    <ul className={styles.dropdownMenu}>
                        <li><Link href="/image/generate">图片生成</Link></li>
                    </ul>
                </li>

                <li className={styles.navItem}>
                    <span>实用Agent</span>
                    <ul className={styles.dropdownMenu}>
                        <li className={styles.navItem}>
                            <span>视频</span>
                            <ul className={styles.subDropdownMenu}>
                                <li><Link href="/agent/video/summary">视频总结</Link></li>
                                <li><Link href="/agent/video/script">生成剪辑脚本</Link></li>
                                <li><Link href="/agent/video/copy">生成文案</Link></li>
                            </ul>
                        </li>
                        <li className={styles.navItem}>
                            <span>图片</span>
                            <ul className={styles.subDropdownMenu}>
                                <li><Link href="/agent/image/batch-analysis">图片批量分析</Link></li>
                                <li><Link href="/agent/image/batch-annotate">图片批量标注</Link></li>
                            </ul>
                        </li>
                        <li className={styles.navItem}>
                            <span>文件</span>
                            <ul className={styles.subDropdownMenu}>
                                <li><Link href="/agent/file/text-summary">一键总结（文本）</Link></li>
                                <li><Link href="/agent/file/image-summary">一键总结（图片）</Link></li>
                            </ul>
                        </li>
                        <li className={styles.navItem}>
                            <span>代码</span>
                            <ul className={styles.subDropdownMenu}>
                                <li><Link href="/agent/code/readme">一键生成README</Link></li>
                                <li><Link href="/agent/code/docs">一键生成接口文档</Link></li>
                            </ul>
                        </li>
                        <li className={styles.navItem}>
                            <span>其它</span>
                            <ul className={styles.subDropdownMenu}>
                                <li><Link href="/agent/other/custom-test">自定义接口测试</Link></li>
                            </ul>
                        </li>
                    </ul>
                </li>
            </ul>

            <div
                className={styles.userInfo}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
            >
                <div className={styles.userAvatar}>{nickname.charAt(0)}</div>
                {dropdownOpen && (
                    <div className={styles.dropdown}>
                        <div className={styles.dropdownItem} onClick={() => setShowModal(true)}>个人信息</div>
                        <div className={styles.dropdownItem} onClick={handleLogout}>注销登录</div>
                    </div>
                )}
            </div>

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2>个人信息</h2>
                        {userData ? (
                            <>
                                <p><strong>用户ID：</strong>{userData.data.name || '未知'}</p>
                                <p><strong>昵称：</strong>{userData.data.displayName || '未知'}</p>
                                <p><strong>邮箱：</strong>{userData.data.email || '未提供'}</p>
                                <p><strong>电话：</strong>{userData.data.phone || '未提供'}</p>
                                <p><strong>微信：</strong>{userData.data.wechat || '未提供'}</p>
                            </>
                        ) : (
                            <p>未获取到用户信息</p>
                        )}
                        <button onClick={() => setShowModal(false)}>关闭</button>
                    </div>
                </div>
            )}
        </nav>
    );
}