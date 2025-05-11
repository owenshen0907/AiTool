// File: app/prompt/case/content/FileImportInput.tsx
'use client';

import React, { useRef } from 'react';

interface Props {
    onFileParsed: (file: File) => void;
}

export default function FileImportInput({ onFileParsed }: Props) {
    const ref = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileParsed(file);
        e.target.value = '';
    };

    return (
        <input
            ref={ref}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={handleChange}
        />
    );
}