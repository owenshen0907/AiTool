// File: src/app/prompt/manage/PromptContent/Experience/GeneratePrompt/ImageUploader.tsx
'use client'

import React from 'react'
import { fileToBase64 } from '@/lib/utils/imageToBase64'

interface ImageUploaderProps {
    onFiles: (base64s: string[]) => void
}

export default function ImageUploader({ onFiles }: ImageUploaderProps) {
    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const arr = Array.from(e.target.files).slice(0, 50)
        try {
            const base64s = await Promise.all(arr.map(file => fileToBase64(file)))
            onFiles(base64s)
        } catch (err) {
            console.error('convert to base64 failed', err)
        }
        e.target.value = ''
    }

    return (
        <label className="block border-dashed border-2 border-gray-300 p-6 text-center cursor-pointer hover:border-gray-500">
            <span className="text-gray-600">点击或拖拽上传图片（最多 50 张）</span>
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
            />
        </label>
    )
}