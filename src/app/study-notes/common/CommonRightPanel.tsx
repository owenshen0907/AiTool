'use client';
import React from 'react';
import styles from './CommonRightPanel.module.css';
import { CommonNote } from '@/app/components/apiUtils';

interface RightPanelProps {
    note: CommonNote | null;
}

export default function CommonRightPanel({ note }: RightPanelProps) {
    if (!note) return <div className={styles.rightPanel}>暂无笔记信息</div>;

    const tags = note.tags ? note.tags.split(',') : [];

    return (
        <div className={styles.rightPanel}>
            <div className={styles.tags}>
                <h4>标签</h4>
                <ul>
                    {tags.map((tag, idx) => (
                        <li key={idx}>{tag.trim()}</li>
                    ))}
                </ul>
            </div>
            <div className={styles.comments}>
                <h4>评论反馈</h4>
                {note.comments && note.comments.length > 0 ? (
                    <ul>
                        {note.comments.map((comment, idx) => (
                            <li key={idx}>
                                <div className={styles.commentAuthor}>{comment.author}</div>
                                <div className={styles.commentContent}>{comment.content}</div>
                                <div className={styles.commentTime}>{comment.time}</div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>暂无评论</p>
                )}
            </div>
        </div>
    );
}