'use client';
import React, { useState } from 'react';
import styles from './GenerateNoteButton.module.css';

interface GenerateNoteButtonProps {
    content: string; // 当前对话或页面内容
    onGenerated: (data: any) => void; // 生成笔记后回调，返回笔记数据
}

export default function GenerateNoteButton({ content, onGenerated }: GenerateNoteButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!content.trim()) {
            setError('当前内容为空');
            return;
        }
        // 从 sessionStorage 中取出 userData
        const storedUserData = sessionStorage.getItem('userData');
        if (!storedUserData) {
            setError('请登录后重试');
            return;
        }
        let userData;
        try {
            userData = JSON.parse(storedUserData);
        } catch (err) {
            setError('请登录后重试');
            return;
        }
        if (!userData?.name) {
            setError('请登录后重试');
            return;
        }
        const userName = userData.name;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/notes/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // 将 userName 一并传递到后端
                body: JSON.stringify({ content, configKey: "GENERATE_NOTE", userName }),
            });
            if (!res.ok) {
                throw new Error(`请求失败：${res.status}`);
            }
            // 接口返回的数据已经是 JSON 对象，直接传递给 onGenerated
            const result = await res.json();
            onGenerated(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleGenerate}
                disabled={loading}
                className={`${styles.button} ${loading ? styles.loading : ''}`}
            >
                {loading && <span className={styles.spinner}></span>}
                {loading ? '生成中...' : '生成笔记'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}