'use client';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import styles from './NavBar.module.css';

export default function NavBar() {
    // 存储从 /api/user/get 获取到的用户信息
    const [userData, setUserData] = useState<any>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/user/get', {
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!res.ok) {
                    throw new Error(`请求失败：${res.status}`);
                }
                const data = await res.json();
                console.log('获取到的用户数据：', data);
                setUserData(data.user);
                // 同时将数据存入 sessionStorage
                sessionStorage.setItem('userData', JSON.stringify(data.user));
            } catch (err) {
                console.error('获取用户信息出错：', err);
            }
        };

        // 尝试从 sessionStorage 获取数据，如果没有，再调用接口
        const cachedUser = sessionStorage.getItem('userData');
        if (cachedUser) {
            setUserData(JSON.parse(cachedUser));
        } else {
            fetchUserData();
        }
    }, []);

    const handleLogout = () => {
        document.cookie =
            "sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
            "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        sessionStorage.removeItem('userData');
        window.location.reload();
    };

    const nickname = userData?.data.displayName || userData?.data.name || "未登录";

    return (
        <nav className={styles.navContainer}>
            <div className={styles.logo}>NihonGO</div>
            <ul className={styles.navMenu}>
                <li>
                    <Link href="/">首页</Link>
                </li>
                <li>
                    <Link href="/study-assistant">学习助手</Link>
                </li>
                <li>
                    <Link href="/listen-speak-read-write">听说写阅</Link>
                </li>
                <li>
                    <Link href="/study-notes">学习笔记</Link>
                </li>
                <li>
                    <Link href="/exam">考试</Link>
                </li>
            </ul>
            <div
                className={styles.userInfo}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
            >
                <div className={styles.userAvatar}>
                    {nickname.charAt(0)}
                </div>
                {dropdownOpen && (
                    <div className={styles.dropdown}>
                        <div
                            className={styles.dropdownItem}
                            onClick={() => setShowModal(true)}
                        >
                            个人信息
                        </div>
                        <div
                            className={styles.dropdownItem}
                            onClick={handleLogout}
                        >
                            注销登录
                        </div>
                    </div>
                )}
            </div>
            {showModal && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>个人信息</h2>
                        {userData ? (
                            <div>
                                <p>
                                    <strong>用户ID：</strong>
                                    {userData.data.name || "未知"}
                                </p>
                                <p>
                                    <strong>昵称：</strong>
                                    {userData.data.displayName || "未知"}
                                </p>
                                <p>
                                    <strong>邮箱：</strong>
                                    {userData.data.email || "未提供"}
                                </p>
                                <p>
                                    <strong>电话：</strong>
                                    {userData.data.phone || "未提供"}
                                </p>
                                <p>
                                    <strong>微信：</strong>
                                    {userData.data.wechat || "未提供"}
                                </p>
                            </div>
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