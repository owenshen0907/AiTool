'use client';
import React, { useState, useRef } from 'react';
import styles from './ChatInput.module.css';

export interface ImageEntry {
    id: string;
    type: "local" | "url";
    file?: File;
    url: string;
}

interface ChatInputProps {
    onSend: (text: string, images: ImageEntry[]) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
    const [inputValue, setInputValue] = useState('');
    const [images, setImages] = useState<ImageEntry[]>([]);
    const [urlInput, setUrlInput] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [isComposing, setIsComposing] = useState(false); // 用于处理输入法候选状态
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];

    // Helper：将 File 转换为 Base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject('转换失败');
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // 处理文件上传
    const handleFiles = async (files: FileList) => {
        const newImages: ImageEntry[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!allowedTypes.includes(file.type)) {
                alert('仅支持 PNG、JPEG 或 WEBP 格式');
                continue;
            }
            if (images.length + newImages.length >= 10) {
                alert('最多只能上传 10 张图片');
                break;
            }
            const id = Date.now().toString() + i;
            try {
                const base64 = await fileToBase64(file);
                newImages.push({ id, type: 'local', file, url: base64 });
            } catch (err) {
                console.error('图片转换失败', err);
            }
        }
        setImages(prev => [...prev, ...newImages]);
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            await handleFiles(e.target.files);
        }
    };

    // 点击上传图片触发隐藏的 file input
    const handleUploadClick = () => {
        fileInputRef.current?.click();
        setShowOptions(false);
        setShowUrlInput(false);
    };

    const handleAddUrl = () => {
        if (!urlInput.trim()) return;
        if (images.length >= 10) {
            alert('最多只能上传 10 张图片');
            return;
        }
        const id = Date.now().toString();
        const newImage: ImageEntry = { id, type: 'url', url: urlInput.trim() };
        setImages(prev => [...prev, newImage]);
        setUrlInput('');
        setShowUrlInput(false);
        setShowOptions(false);
    };

    const handleRemoveImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    // 自动增高 textarea（最多 5 行）
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            const lineHeight = 24; // 根据实际情况调整
            const maxHeight = lineHeight * 5;
            textAreaRef.current.style.height =
                textAreaRef.current.scrollHeight < maxHeight
                    ? `${textAreaRef.current.scrollHeight}px`
                    : `${maxHeight}px`;
        }
    };

    // 处理粘贴事件，支持粘贴图片
    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const clipboardItems = e.clipboardData.items;
        for (let i = 0; i < clipboardItems.length; i++) {
            const item = clipboardItems[i];
            if (item.type.indexOf('image/') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    try {
                        const base64 = await fileToBase64(file);
                        const id = Date.now().toString() + i;
                        setImages(prev => [...prev, { id, type: 'local', file, url: base64 }]);
                    } catch (err) {
                        console.error('粘贴图片转换失败', err);
                    }
                }
            }
        }
    };

    // 按回车键发送消息，同时规避输入法候选过程中的回车
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault(); // 阻止默认换行行为
            handleSendClick();
        }
    };

    const handleSendClick = () => {
        if (!inputValue.trim() && images.length === 0) return;
        onSend(inputValue.trim(), images);
        setInputValue('');
        setImages([]);
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
        }
    };

    // 控制选项区域显示/隐藏
    const toggleOptions = () => {
        setShowOptions(!showOptions);
        setShowUrlInput(false);
    };

    return (
        <div className={styles.chatInputContainer}>
            {images.length > 0 && (
                <div className={styles.imagePreviewArea}>
                    {images.map(img => (
                        <div key={img.id} className={styles.thumbnail}>
                            <img src={img.url} alt="预览" onClick={() => window.open(img.url, '_blank')} />
                            <button className={styles.removeButton} onClick={() => handleRemoveImage(img.id)}>×</button>
                        </div>
                    ))}
                </div>
            )}
            <div className={styles.bubbleContainer}>
                <textarea
                    ref={textAreaRef}
                    className={styles.textArea}
                    placeholder="请输入内容..."
                    value={inputValue}
                    onChange={handleTextChange}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                />
                <div className={styles.bottomBar}>
                    <div className={styles.leftArea}>
                        <button className={styles.plusButton} onClick={toggleOptions}>＋</button>
                        {showOptions && (
                            <div className={styles.optionMenu}>
                                <div className={styles.menuItem} onClick={handleUploadClick}>
                                    <span className={styles.smallIcon}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
                                            <path fill="#1E2539" d="M9.318 2h5.364c1.066 0 1.925 0 2.621.056.717.058 1.347.18 1.932.471a5 5 0 0 1 2.238 2.238c.292.585.414 1.215.471 1.932C22 7.393 22 8.252 22 9.318v5.364c0 1.066 0 1.925-.056 2.621-.057.717-.18 1.347-.471 1.932a5 5 0 0 1-2.238 2.238c-.585.292-1.215.414-1.932.471-.696.056-1.555.056-2.621.056H9.318c-1.066 0-1.925 0-2.621-.056-.717-.057-1.347-.18-1.932-.471a5 5 0 0 1-2.238-2.238c-.292-.585-.413-1.215-.471-1.932C2 16.607 2 15.748 2 14.683V9.317c0-1.066 0-1.925.056-2.621.058-.717.18-1.347.471-1.932a5 5 0 0 1 2.238-2.238c.585-.292 1.215-.413 1.932-.471Z"/>
                                        </svg>
                                    </span>
                                    <span className={styles.menuText}>上传图片</span>
                                </div>
                                <div className={styles.menuItem} onClick={() => setShowUrlInput(true)}>
                                    <span className={styles.smallIcon}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
                                            <path fill="#1E2539" d="M10 13a5 5 0 0 1 0-7.07l1.414 1.414a3 3 0 0 0 0 4.242L10 13Zm4 1a5 5 0 0 1 0 7.07l-1.414-1.414a3 3 0 0 0 0-4.242L14 14Zm-6.707 2.293L5.293 16.707a7 7 0 0 1 0-9.9l1.414 1.414a5 5 0 0 0 0 6.07ZM18.707 7.293l1.414-1.414a7 7 0 0 1 0 9.9l-1.414-1.414a5 5 0 0 0 0-6.07Z"/>
                                        </svg>
                                    </span>
                                    <span className={styles.menuText}>图片链接</span>
                                </div>
                                {showUrlInput && (
                                    <div className={styles.urlRow}>
                                        <input
                                            type="text"
                                            placeholder="图片链接"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                        />
                                        <button onClick={handleAddUrl}>确定</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className={styles.rightArea}>
                        <button className={styles.sendButton} onClick={handleSendClick}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path fill="#fff" d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpeg,.jpg,.webp"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
            />
        </div>
    );
};

export default ChatInput;