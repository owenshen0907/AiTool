// app/components/ChatInput.tsx
'use client';

import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    KeyboardEvent,
    CompositionEvent,
} from 'react';
import { Send } from 'lucide-react';
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
    // 供应商 & 模型
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
    const [models, setModels] = useState<Model[]>([]);
    const [model, setModel] = useState<string>('');

    // 文本 / 图片 / URL / 语音
    const [text, setText] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [voiceBlob, setVoiceBlob] = useState<Blob>();
    const [listening, setListening] = useState(false);

    // IME 合成锁
    const [isComposing, setIsComposing] = useState(false);

    // 录音相关
    const mediaRef = useRef<MediaRecorder>();
    const chunks: Blob[] = [];

    // 拉供应商
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
    }, []);

    // 拉模型
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
                    const data: Model[] = await res.json();
                    data.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
                    setModels(data);
                    const defModel = data.find(m => m.isDefault) || data[0];
                    setModel(defModel?.name || '');
                }
            } catch (err) {
                console.error('获取模型失败', err);
            }
        }
        fetchModels();
    }, [selectedSupplierId]);

    // 录音
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

    // 真正发送
    const doSend = useCallback(() => {
        if (!selectedSupplierId) return alert('请先选择供应商');
        const supplier = suppliers.find(s => s.id === selectedSupplierId);
        if (!supplier) return alert('无效的供应商');
        if (!model) return alert('请先选择模型');
        if (!text.trim() && !images.length && !imageUrls.length && !voiceBlob) return;

        onSend({ text, images, imageUrls, voiceBlob, model, context, supplier });

        // 重置
        setText('');
        setImages([]);
        setImageUrls([]);
        setVoiceBlob(undefined);
    }, [
        selectedSupplierId,
        suppliers,
        model,
        text,
        images,
        imageUrls,
        voiceBlob,
        context,
        onSend,
    ]);

    const sendDisabled =
        !selectedSupplierId ||
        !model ||
        (!text.trim() && !images.length && !imageUrls.length && !voiceBlob);

    // 回车 & IME
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
                        listening={listening}
                        onStart={startRecording}
                        onStop={stopRecording}
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
                    disabled={sendDisabled}
                    className="justify-self-end px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    发送 <Send size={16} className="inline ml-1" />
                </button>
            </div>
        </div>
    );
}