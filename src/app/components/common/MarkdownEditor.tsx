// File: src/components/common/MarkdownEditor.tsx
'use client';

import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface Props {
    value: string;
    onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: Props) {
    return (
        <div className="flex flex-col flex-1">
            <div className="flex-1 overflow-auto">
                <MDEditor
                    value={value}
                    onChange={(v) => onChange(v || '')}
                    preview="preview"
                    height="100%"
                />
            </div>
        </div>
    );
}
