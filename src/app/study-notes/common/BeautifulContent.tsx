'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './BeautifulContent.module.css';

interface BeautifulContentProps {
    content: string;
}

export default function BeautifulContent({ content }: BeautifulContentProps) {
    return (
        <article className={styles.prose}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </article>
    );
}