'use client';
import React, { useState } from 'react';
import styles from './AddNoteButton.module.css';

interface AddNoteButtonProps {
    noteType: 'word' | 'grammar';
    pageId: string;
    // 选中的笔记 ID 数组（可能传多个）
    selectedIds: string[];
    // 添加成功后的回调，用于父组件进一步处理
    onAddNotes: (addedIds: string[], noteType: 'word' | 'grammar') => void;
}

const AddNoteButton: React.FC<AddNoteButtonProps> = ({
                                                         noteType,
                                                         pageId,
                                                         selectedIds,
                                                         onAddNotes,
                                                     }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [encouragement, setEncouragement] = useState('');

    const handleAddNote = async () => {
        if (selectedIds.length === 0) {
            alert('请先勾选需要添加的笔记');
            return;
        }
        const storedUserData = sessionStorage.getItem('userData');
        if (!storedUserData) {
            alert('用户未登录');
            return;
        }
        const userData = JSON.parse(storedUserData);
        const userId = userData.id || userData.name;
        // 根据 pageId 判断 dimension 参数
        const dimension = pageId === 'study-assistant' ? '阅' : 'default';
        // study_status 默认设置为 1
        const study_status = 1;
        // payload 中 note 字段传入的是选中的笔记 ID 数组
        const payload = { userId, type: noteType, note: selectedIds, dimension, study_status };

        setIsLoading(true);
        setErrorMsg('');
        setShowSuccess(false);
        setEncouragement('');

        try {
            const res = await fetch('/api/notes/addNote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                setErrorMsg('添加笔记失败');
                alert('添加笔记失败');
                setIsLoading(false);
                return;
            }
            await res.json();
            setIsLoading(false);
            // 触发成功动画
            setShowSuccess(true);
            onAddNotes(selectedIds, noteType);
            // 设置鼓励语
            const encouragementMessages = ["你真棒", "继续加油", "你真厉害", "干得漂亮", "棒极了"];
            const randomMsg = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
            setEncouragement(randomMsg);
            // 3 秒后自动隐藏成功动画
            setTimeout(() => {
                setShowSuccess(false);
                setEncouragement('');
            }, 3000);
        } catch (error) {
            console.error('调用添加笔记接口出错:', error);
            setErrorMsg('调用添加笔记接口出错');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.buttonWrapper}>
            <button
                className={styles.addNoteButton}
                onClick={handleAddNote}
                disabled={isLoading}
            >
                {isLoading ? '处理中...' : '添加笔记'}
            </button>
            {errorMsg && <div className={styles.error}>{errorMsg}</div>}
            {showSuccess && (
                <div className={styles.successContainer}>
                    {Array.from({ length: 15 }).map((_, idx) => (
                        <div key={idx} className={styles.particle}></div>
                    ))}
                    <div className={styles.encouragement}>{encouragement}</div>
                </div>
            )}
        </div>
    );
};

export default AddNoteButton;