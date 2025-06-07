// File: src/components/common/MarkdownEditor.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-markdown-editor-lite/lib/index.css';
import MarkdownIt from 'markdown-it';

// 由于 react-markdown-editor-lite 依赖 window，Next.js 需要动态加载
const MdEditor = dynamic(() => import('react-markdown-editor-lite'), {
    ssr: false,
});

interface Props {
    value: string;
    onChange: (val: string) => void;
}

const mdParser = new MarkdownIt({
    html:        true,
    linkify:     true,
    typographer: true,
    breaks:      true,     // 支持换行
})
    .use(require('markdown-it-footnote'))
    .use(require('markdown-it-deflist'))
    .use(require('markdown-it-abbr'))
    .use(require('markdown-it-mark'))
    .use(require('markdown-it-ins'))
    .use(require('markdown-it-sub'))
    .use(require('markdown-it-sup'));

export default function MarkdownEditor({ value, onChange }: Props) {
    return (
        <div className="markdown-editor-container h-full flex flex-col">
            <MdEditor
                value={value}
                style={{ flex: 1 }}
                renderHTML={(text) => mdParser.render(text)}
                onChange={({ text }) => onChange(text)}
                view={{
                    menu: true,           // 工具栏
                    md: true,             // 编辑区
                    html: true,           // 预览区
                }}
                config={{
                    view: {
                        menu: true,
                        md: true,
                        html: true,
                        hideMenu: false,
                    },
                    canView: {
                        fullScreen: true,        // 全屏按钮
                        hideMenu: false,
                        html: true,
                        md: true,
                        both: true,              // side-by-side
                        syncScrollMode: ['leftFollowRight', 'rightFollowLeft'],
                    },
                    markdownClass: 'prose max-w-none', // Tailwind prose 支持
                }}
            />
        </div>
    );
}