// app/components/ChatInput.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, ImageIcon, Send } from 'lucide-react';
import type { Supplier, Model } from '@/lib/models/model';

export interface ChatInputProps<CTX = any> {
    context?: CTX;
    placeholder?: string;
    enableImage?: boolean;
    enableVoice?: boolean;
    onSend: (args: {
        text: string;
        images: File[];
        imageUrls: string[];
        voiceBlob?: Blob;
        model: string;
        context?: CTX;
        supplier: Supplier;
    }) => void;
}

export default function ChatInput<CTX = any>({
                                                 context,
                                                 placeholder = '请输入内容…',
                                                 enableImage = true,
                                                 enableVoice = true,
                                                 onSend,
                                             }: ChatInputProps<CTX>) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
    const [models, setModels] = useState<Model[]>([]);
    const [model, setModel] = useState<string>('');

    const [text, setText] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [voiceBlob, setVoiceBlob] = useState<Blob>();
    const [listening, setListening] = useState(false);

    const mediaRef = useRef<MediaRecorder>();
    const chunks: Blob[] = [];

    // 拉取供应商列表
    useEffect(() => {
        async function fetchSuppliers() {
            try {
                const res = await fetch('/api/suppliers');
                if (res.ok) {
                    let data: Supplier[] = await res.json();
                    // 默认供应商排在最前
                    data.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
                    setSuppliers(data);
                    // 如果还未选择，自动选默认或首个
                    if (!selectedSupplierId) {
                        const def = data.find(s => s.isDefault) || data[0];
                        if (def) setSelectedSupplierId(def.id);
                    }
                }
            } catch (err) {
                console.error('获取供应商失败', err);
            }
        }
        fetchSuppliers();
    }, []);

    // 拉取模型列表
    useEffect(() => {
        async function fetchModels() {
            if (!selectedSupplierId) {
                setModels([]);
                setModel('');
                return;
            }
            try {
                const res = await fetch(`/api/models?supplier_id=${selectedSupplierId}`);
                if (res.ok) {
                    let data: Model[] = await res.json();
                    // 默认模型排最前
                    data.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
                    setModels(data);
                    // 自动选默认或首个
                    const defModel = data.find(m => m.isDefault) || data[0];
                    setModel(defModel?.name || '');
                }
            } catch (err) {
                console.error('获取模型失败', err);
            }
        }
        fetchModels();
    }, [selectedSupplierId]);

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

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) setImages(prev => [...prev, ...Array.from(files)]);
    };

    const onAddUrl = () => {
        const url = prompt('请输入图片 URL');
        if (url) setImageUrls(prev => [...prev, url]);
    };

    const handleSend = () => {
        if (!selectedSupplierId) {
            alert('请先选择供应商');
            return;
        }
        const supplier = suppliers.find(s => s.id === selectedSupplierId);
        if (!supplier) {
            alert('无效的供应商');
            return;
        }
        if (!model) {
            alert('请先选择模型');
            return;
        }
        if (!text.trim() && images.length + imageUrls.length === 0 && !voiceBlob) return;

        onSend({ text, images, imageUrls, voiceBlob, model, context, supplier });
        setText('');
        setImages([]);
        setImageUrls([]);
        setVoiceBlob(undefined);
    };

    const sendDisabled = !selectedSupplierId || !model || (!text.trim() && images.length === 0 && imageUrls.length === 0 && !voiceBlob);

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={placeholder}
                className="w-full h-24 p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring"
            />

            <div className="mt-2 grid grid-cols-2 gap-4 items-center">
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
                            className={listening ? 'text-red-500 hover:text-red-700' : 'hover:text-gray-800'}
                        >
                            <Mic size={20} />
                        </button>
                    )}

                    <select
                        value={selectedSupplierId}
                        onChange={e => setSelectedSupplierId(e.target.value)}
                        className="border rounded px-3 py-1"
                    >
                        <option value="">选择供应商</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <select
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        disabled={!selectedSupplierId}
                        className="border rounded px-3 py-1 disabled:opacity-50"
                    >
                        <option value="">选择模型</option>
                        {models.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleSend}
                    disabled={sendDisabled}
                    className="justify-self-end px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    发送 <Send size={16} className="inline ml-1" />
                </button>
            </div>
        </div>
    );
}
