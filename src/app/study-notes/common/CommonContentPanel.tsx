'use client';
import React, { useState, useEffect } from 'react';
import BeautifulContent from './BeautifulContent';
import styles from './CommonContentPanel.module.css';
import { CommonNote } from '@/app/components/apiUtils';

interface ContentPanelProps {
    note: CommonNote | null;
    editable?: boolean;
    onEdit?: () => void;
    onSave?: (updatedNote: CommonNote) => void;
    onCancelEdit?: () => void;
}

export default function CommonContentPanel({
                                               note,
                                               editable = false,
                                               onEdit,
                                               onSave,
                                               onCancelEdit,
                                           }: ContentPanelProps) {
    const [editTitle, setEditTitle] = useState(note ? note.title : '');
    const [editSummary, setEditSummary] = useState(note ? note.summary || '' : '');
    const [editContent, setEditContent] = useState(note ? note.content : '');

    useEffect(() => {
        if (note) {
            setEditTitle(note.title);
            setEditSummary(note.summary || '');
            setEditContent(note.content);
        }
    }, [note]);

    // 打印功能：获取 id="printContent" 的内容，并注入打印窗口内，同时注入样式
    const handlePrint = () => {
        if (!note) return;
        const printContainer = document.getElementById('printContent');
        if (!printContainer) return;
        const contentHtml = printContainer.innerHTML;
        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>${note.title}</title>
            <style>
              /* 以下样式可以根据 BeautifulContent.module.css 的样式调整 */
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
              }
              h1 {
                font-size: 2.5rem;
                margin-bottom: 1rem;
              }
              .prose {
                max-width: 800px;
                margin: 0 auto;
                line-height: 1.75;
                font-family: Georgia, serif;
                color: #333;
                padding: 1rem;
              }
              .prose h1 {
                font-size: 2.5rem;
                margin-top: 1.5rem;
                margin-bottom: 1rem;
              }
              .prose h2 {
                font-size: 2rem;
                margin-top: 1.5rem;
                margin-bottom: 1rem;
              }
              .prose h3 {
                font-size: 1.75rem;
                margin-top: 1.5rem;
                margin-bottom: 1rem;
              }
              .prose p {
                margin-bottom: 1rem;
                font-size: 1rem;
              }
              .prose ul, .prose ol {
                margin-left: 1.5rem;
                margin-bottom: 1rem;
              }
              .prose li {
                margin-bottom: 0.5rem;
              }
              .prose table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 1rem;
              }
              .prose th, .prose td {
                border: 1px solid #ddd;
                padding: 0.5rem;
                text-align: left;
              }
              .prose blockquote {
                border-left: 4px solid #ddd;
                padding-left: 1rem;
                color: #666;
                margin: 1rem 0;
                font-style: italic;
              }
            </style>
          </head>
          <body>
            <h1>${note.title}</h1>
            ${contentHtml}
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    if (!note) return <div className={styles.content}>请选择一个笔记</div>;

    return (
        <div className={styles.content}>
            <div className={styles.header}>
                {editable ? (
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={styles.titleInput}
                        placeholder="请输入标题"
                    />
                ) : (
                    <h1 className={styles.title}>{note.title}</h1>
                )}
                <div className={styles.headerButtons}>
                    {!editable && onEdit && (
                        <button className={styles.editButton} onClick={onEdit}>
                            编辑
                        </button>
                    )}
                    {!editable && (
                        <button className={styles.printButton} onClick={handlePrint}>
                            打印
                        </button>
                    )}
                </div>
            </div>
            {editable ? (
                <div className={styles.editArea}>
          <textarea
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              className={styles.summaryInput}
              placeholder="请输入概述"
          />
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className={styles.contentTextArea}
                        placeholder="请输入详细内容（Markdown 格式）"
                    />
                    <div className={styles.editButtons}>
                        <button className={styles.saveButton} onClick={() => onSave && onSave({ ...note, title: editTitle, summary: editSummary, content: editContent })}>
                            保存
                        </button>
                        <button className={styles.cancelButton} onClick={() => onCancelEdit && onCancelEdit()}>
                            取消
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {note.summary && <div className={styles.summary}>{note.summary}</div>}
                    <div id="printContent">
                        <BeautifulContent content={note.content} />
                    </div>
                </>
            )}
            <div className={styles.footer}>
                创建时间：{new Date(note.created_at).toLocaleString()}
            </div>
        </div>
    );
}