'use client';
import React, { useState, useRef } from 'react';
import styles from './ImageUploader.module.css';

export interface ImageEntry {
    id: string;
    type: "local" | "url";
    file?: File;
    url: string; // 本地图片转换成 Base64 后的字符串；或直接使用外部链接
}

interface ImageUploaderProps {
    onImagesChange: (images: ImageEntry[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange }) => {
    const [images, setImages] = useState<ImageEntry[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [urlInput, setUrlInput] = useState('');

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];

    // Helper函数：将File转换为Base64字符串
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === "string") {
                    resolve(reader.result);
                } else {
                    reject("转换失败");
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFiles = async (files: FileList) => {
        const newImages: ImageEntry[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!allowedTypes.includes(file.type)) {
                alert("不支持该图片格式，请选择 PNG、JPEG 或 WEBP 格式");
                continue;
            }
            if (images.length + newImages.length >= 10) {
                alert("最多只能上传10张图片");
                break;
            }
            const id = Date.now().toString() + i;
            try {
                // 转换为Base64
                const base64 = await fileToBase64(file);
                newImages.push({ id, type: "local" as "local", file, url: base64 });
            } catch (err) {
                console.error("转换图片失败", err);
            }
        }
        const updated = [...images, ...newImages];
        setImages(updated);
        onImagesChange(updated);
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            await handleFiles(e.target.files);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleAddUrl = () => {
        if (!urlInput.trim()) return;
        if (images.length >= 10) {
            alert("最多只能上传10张图片");
            return;
        }
        const id = Date.now().toString();
        const newImage = { id, type: "url" as "url", url: urlInput.trim() };
        const updated = [...images, newImage];
        setImages(updated);
        onImagesChange(updated);
        setUrlInput('');
    };

    const handleRemoveImage = (id: string) => {
        const updated = images.filter(img => img.id !== id);
        setImages(updated);
        onImagesChange(updated);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
            await handleFiles(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div className={styles.imageUploader}>
            <div
                className={styles.previewArea}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {images.map(img => (
                    <div key={img.id} className={styles.thumbnail}>
                        <img src={img.url} alt="预览" onClick={() => window.open(img.url, '_blank')} />
                        <button className={styles.removeButton} onClick={() => handleRemoveImage(img.id)}>×</button>
                    </div>
                ))}
            </div>
            <div className={styles.controls}>
                <button onClick={handleUploadClick}>上传图片</button>
                <input
                    type="file"
                    accept=".png,.jpeg,.jpg,.webp"
                    multiple
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                />
                <input
                    type="text"
                    placeholder="或输入图片链接"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                />
                <button onClick={handleAddUrl}>添加链接</button>
            </div>
        </div>
    );
};

export default ImageUploader;