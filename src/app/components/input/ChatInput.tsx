// File: app/components/input/ChatInput.tsx
'use client';

import React, {
    useState,
    useEffect,
    useCallback,
    KeyboardEvent,
    CompositionEvent,
    useRef,
} from 'react';
import { Send, Mic, Mic2 } from 'lucide-react';
import NonStreamVoiceInput from './NonStreamVoiceInput';
import type { Supplier, Model } from '@/lib/models/model';
import ChatImageInput from './ChatImageInput';
import ChatVoiceInput from './ChatVoiceInput';
import SupplierModelSelector from '../info/SupplierModelSelector';

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
    const [isComposing, setIsComposing] = useState(false);

    // 保存用户手动输入前缀
    const prefixRef = useRef<string>('');
    // 缓存流式语音文本
    const voiceBufferRef = useRef<string>('');

    useEffect(() => {
        async function fetchSuppliers() {
            try {
                const res = await fetch('/api/suppliers');
                if (res.ok) {
                    const data: Supplier[] = await res.json();
                    data.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
                    setSuppliers(data);
                    if (!selectedSupplierId && data.length) {
                        const def = data.find(s => s.isDefault) || data[0];
                        setSelectedSupplierId(def.id);
                    }
                }
            } catch (err) {
                console.error('获取供应商失败', err);
            }
        }
        fetchSuppliers();
    }, [selectedSupplierId]);

    useEffect(() => {
        async function fetchModels() {
            if (!selectedSupplierId) return;
            try {
                const res = await fetch(`/api/models?supplier_id=${selectedSupplierId}`);
                if (res.ok) {
                    const data: Model[] = await res.json();
                    data.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
                    setModels(data);
                    setModel(data.find(m => m.isDefault)?.name || data[0]?.name || '');
                }
            } catch (err) {
                console.error('获取模型失败', err);
            }
        }
        fetchModels();
    }, [selectedSupplierId]);

    // 流式转写回调，支持前缀保留与最终覆盖
    const onTranscript = useCallback(
        (msg: string, isFinal: boolean) => {
            // 去除两端引号
            const cleaned = msg.replace(/^"|"$/g, '');
            if (isFinal) {
                // 最终文本：更新 prefix 为完整文本，清空 buffer
                prefixRef.current = prefixRef.current + cleaned;
                voiceBufferRef.current = '';
                setText(prefixRef.current);
            } else {
                // 流式片段：首次片段，保存前缀
                if (voiceBufferRef.current === '') {
                    prefixRef.current = text;
                }
                voiceBufferRef.current += cleaned;
                setText(prefixRef.current + voiceBufferRef.current);
            }
        },
        [text]
    );

    const doSend = useCallback(() => {
        if (!selectedSupplierId) return alert('请先选择供应商');
        const supplier = suppliers.find(s => s.id === selectedSupplierId)!;
        if (!model) return alert('请先选择模型');
        if (!text.trim() && !images.length && !imageUrls.length) return;

        onSend({ text, images, imageUrls, voiceBlob: undefined, model, context, supplier });
        setText('');
        setImages([]);
        setImageUrls([]);
        prefixRef.current = '';
        voiceBufferRef.current = '';
    }, [selectedSupplierId, suppliers, model, text, images, imageUrls, onSend, context]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            doSend();
        }
    };
    const handleComposition = (e: CompositionEvent<HTMLTextAreaElement>) => {
        setIsComposing(e.type === 'compositionstart');
    };

    return (
        <div className="w-full p-4 bg-white rounded-lg shadow">
      <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full h-24 p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring"
          onKeyDown={handleKeyDown}
          onCompositionStart={handleComposition}
          onCompositionEnd={handleComposition}
      />

            <div className="mt-2 grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center space-x-4">
                    <ChatImageInput
                        enableImage={enableImage}
                        onFilesSelected={files => setImages(prev => [...prev, ...files])}
                        onUrlEntered={url => setImageUrls(prev => [...prev, url])}
                    />
                    <ChatVoiceInput
                        enableVoice={enableVoice}
                        language="auto"
                        onTranscript={onTranscript}
                    />
                    <NonStreamVoiceInput
                        enableVoice={enableVoice}
                        onTranscription={text => setText(t => t + text)}
                    />
                    <SupplierModelSelector
                        suppliers={suppliers}
                        selectedSupplierId={selectedSupplierId}
                        onSupplierChange={setSelectedSupplierId}
                        models={models}
                        selectedModelName={model}
                        onModelChange={setModel}
                    />
                </div>

                <button
                    onClick={doSend}
                    disabled={!selectedSupplierId || !model || (!text.trim() && !images.length && !imageUrls.length)}
                    className="justify-self-end px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    发送 <Send size={16} className="inline ml-1" />
                </button>
            </div>
        </div>
    );
}
