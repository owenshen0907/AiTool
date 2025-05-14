// File: src/app/components/common/DataImport/FileImportInput.tsx
'use client';

import React, { forwardRef, ChangeEvent } from 'react';

export interface FileImportInputProps {
    accept?: string;
    onFileParsed: (file: File) => void;
}

// 用 forwardRef 暴露出真实 <input>
const FileImportInput = forwardRef<HTMLInputElement, FileImportInputProps>(
    ({ accept = '.csv,.xlsx', onFileParsed }, ref) => {
        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) onFileParsed(file);
            e.target.value = '';
        };

        return (
            <input
                ref={ref}
                type="file"
                accept={accept}
                className="sr-only"
                onChange={handleChange}
            />
        );
    }
);

FileImportInput.displayName = 'FileImportInput';
export default FileImportInput;