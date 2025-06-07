// File: src/components/common/MarkdownEditor.tsx
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import SimpleMdeReact from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

interface MarkdownEditorProps {
    value: string;
    onChange: (val: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
    const editorRef = useRef<any>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isToggled = useRef(false);

    // toolbar 配置，替换内置 fullscreen 为自定义 containerFullscreen
    const options = useMemo(() => {
        const items: any[] = [
            'bold','italic','strikethrough','heading','|',
            'code','quote','unordered-list','ordered-list','|',
            'link','image','|',
            'preview',
            // 'side-by-side',
            {
                name: 'containerFullscreen',
                action: (editor: any) => {
                    const wr = wrapperRef.current;
                    if (!wr) return;
                    wr.classList.toggle('md-fullscreen');
                },
                className: 'fa fa-arrows-alt', // 使用 fontawesome icon
                title: '切换全屏',
            },
            '|',
            'guide'
        ];
        return {
            // @ts-ignore
            toolbar: items,
            spellChecker: false,
            status: false,
            autoDownloadFontAwesome: true,
            minHeight: '200px',
        };
    }, []);

    // 首次挂载自动切预览（可选）
    useEffect(() => {
        if (editorRef.current && !isToggled.current) {
            isToggled.current = true;
            try {
                if (!editorRef.current.isPreviewActive()) {
                    editorRef.current.togglePreview();
                }
            } catch {}
        }
    }, []);

    return (
        <>
            <style jsx global>{`
        /* ---------- 容器级全屏 ---------- */
        .md-fullscreen {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 9999 !important;
          background: #fff;
        }
        /* 工具栏固定在容器顶部 */
        .md-fullscreen .editor-toolbar {
          position: sticky !important;
          top: 0;
          z-index: 10000 !important;
        }
        /* 编辑区撑满容器 */
        .md-fullscreen .CodeMirror,
        .md-fullscreen .editor-preview-full,
        .md-fullscreen .editor-preview-side {
          height: calc(100% - 42px) !important; /* 42px = toolbar 高度 */
        }
      `}</style>

            <div
                ref={wrapperRef}
                className="markdown-editor-container flex flex-col h-full"
            >
                <SimpleMdeReact
                    value={value}
                    // @ts-ignore
                    onChange={(v) => onChange(v || '')}
                    getMdeInstance={(inst: any) => {
                        editorRef.current = inst;
                    }}
                    options={options}
                />
            </div>
        </>
    );
}