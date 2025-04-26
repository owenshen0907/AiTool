'use client';
import React, { useState, useRef } from 'react';
import { Mic, ImageIcon, Link2, Send, ChevronDown } from 'lucide-react';

export interface ChatInputProps<CTX = any> {
    /** 页面上下文，例如 promptId */
    context?: CTX;
    /** 可用模型列表 */
    models: string[];
    /** 文本框占位符 */
    placeholder?: string;
    /** 是否允许上传图片 */
    enableImage?: boolean;
    /** 是否允许语音录入 */
    enableVoice?: boolean;
    /** 点击发送时回调，携带所有输入 */
    onSend: (args: {
        text: string;
        images: File[];
        imageUrls: string[];
        voiceBlob?: Blob;
        model: string;
        context?: CTX;
    }) => void;
}

export default function ChatInput<CTX = any>({
                                                 context,
                                                 models,
                                                 placeholder = '请输入内容…',
                                                 enableImage = true,
                                                 enableVoice = true,
                                                 onSend,
                                             }: ChatInputProps<CTX>) {
    const [text, setText] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [voiceBlob, setVoiceBlob] = useState<Blob>();
    const [listening, setListening] = useState(false);
    const [model, setModel] = useState(models[0] || '');

    const mediaRef = useRef<MediaRecorder>();
    const chunks: Blob[] = [];

    // 录音逻辑
    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRef.current = recorder;
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => setVoiceBlob(new Blob(chunks, { type: 'audio/webm' }));
        recorder.start();
        setListening(true);
    };
    const stopRecording = () => {
        mediaRef.current?.stop();
        setListening(false);
    };

    // 图片上传
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        setImages(prev => [...prev, ...Array.from(files)]);
    };

    // 添加图片链接
    const onAddUrl = () => {
        const url = prompt('请输入图片 URL');
        if (url) setImageUrls(prev => [...prev, url]);
    };

    // 发送
    const handleSend = () => {
        if (!text.trim() && images.length + imageUrls.length === 0 && !voiceBlob) return;
        onSend({ text, images, imageUrls, voiceBlob, model, context });
        setText('');
        setImages([]);
        setImageUrls([]);
        setVoiceBlob(undefined);
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            {/* 文本输入框 */}
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={placeholder}
                className="w-full h-24 p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring"
            />

            {/* 底部操作: 左侧模型/上传/录音，右侧发送按钮 */}
            <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {enableImage && (
                        <label className="cursor-pointer hover:text-gray-800">
                            <ImageIcon size={20} />
                            <input type="file" accept="image/*" multiple hidden onChange={onFileChange} />
                        </label>
                    )}
                    {enableVoice && (
                        <button
                            onClick={listening ? stopRecording : startRecording}
                            className={"hover:text-gray-800 " + (listening ? 'text-red-500' : '')}
                        >
                            <Mic size={20} />
                        </button>
                    )}
                    <button
                        className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                        onClick={() => {/* TODO: 打开模型选择弹窗，调用 setModel */}}
                    >
                        <span>{model}</span>
                        <ChevronDown size={16} />
                    </button>
                </div>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={handleSend}
                >
                    发送 <Send size={16} className="inline ml-1" />
                </button>
            </div>
        </div>
    );
}
