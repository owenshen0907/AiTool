// File: src/app/prompt/manage/PromptContent/Experience/GeneratePrompt/ConfirmGenerateModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Copy } from 'lucide-react';
import { parseSSEStream } from '@/lib/utils/sse';
import promptConfig from './promptConfig.json';

export type ConfirmData = {
    step0 : 'TEXT' | 'IMG_TEXT' | 'VIDEO_TEXT' | 'AUDIO_TEXT';
    step1 : string | string[];               // 示例输入
    step2 : string;                          // intent code
    step3 : { fmt: string; schema: string };
    step4 : string;
};

interface Props {
    isOpen  : boolean;
    onClose : () => void;
    data    : ConfirmData;
}

/** 文本→标签映射 */
const INPUT_LABEL = {
    TEXT      : '纯文本',
    IMG_TEXT  : '图文混合',
    VIDEO_TEXT: '视频 + 文本',
    AUDIO_TEXT: '音频 + 文本',
} as const;

/**
 * 生成预览 URL：
 * - 本地开发：保留 base64 / 本地相对路径
 * - 生产环境：自动拼上 NEXT_PUBLIC_APP_URL
 */
function toPreview(p: string) {
    if (p.startsWith('http') || p.startsWith('data:')) {
        return p;
    }
    const prefix = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    return `${prefix}/${p.replace(/^\/+/, '')}`;
}

/** 判断当前是否本地（localhost/127） */
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i
    .test(typeof window === 'undefined' ? '' : window.location.origin);

export default function ConfirmGenerateModal({ isOpen, onClose, data }: Props) {
    const [extra, setExtra]       = useState('');
    const [thinking, setThinking] = useState('');
    const [answer, setAnswer]     = useState('');
    const [loading, setLoading]   = useState(false);

    if (!isOpen) return null;

    //—— intent 描述 ——//
    const intentObj  = promptConfig.intentOptions.find(i => i.code === data.step2);
    const intentDesc = intentObj
        ? `${intentObj.label}：${intentObj.description}`
        : data.step2;
    const fmtLabel = promptConfig.outputFormats.find(f => f.code === data.step3.fmt)?.label
        || data.step3.fmt;

    //—— 渲染第②步示例 ——//
    const renderStep1 = () => {
        switch (data.step0) {
            case 'TEXT':
                return <p className="whitespace-pre-wrap">{data.step1 as string}</p>;

            case 'IMG_TEXT':
                return (
                    <div className="grid grid-cols-3 gap-2">
                        {(data.step1 as string[]).map((raw, i) => (
                            <img
                                key={i}
                                src={toPreview(raw)}
                                alt={`img-${i}`}
                                className="w-full h-24 object-cover rounded"
                            />
                        ))}
                    </div>
                );

            case 'VIDEO_TEXT':
                return (
                    <video
                        src={toPreview(data.step1 as string)}
                        controls
                        className="w-full max-h-60 rounded"
                    />
                );

            case 'AUDIO_TEXT':
                return (
                    <audio
                        src={toPreview(data.step1 as string)}
                        controls
                        className="w-full"
                    />
                );
        }
    };

    //—— 构造 meta ——//
    const meta = {
        INPUT_TYPE : INPUT_LABEL[data.step0],
        INTENT_CODE: intentDesc,
        OUTPUT_FMT : fmtLabel,
        SCHEMA_JSON: data.step3.fmt === 'JSON' ? data.step3.schema : '',
    };

    //—— 构造 messages ——//
    const buildMessages = async () => {
        const parts: any[] = [{ type: 'text', text: '示例输入：' }];

        switch (data.step0) {
            case 'TEXT':
                parts[0].text += data.step1 as string;
                break;

            case 'IMG_TEXT': {
                const paths = data.step1 as string[];
                const items = await Promise.all(
                    paths.map(async (p) => {
                        const url = toPreview(p);
                        // 本地 dev 下把 URL 转 base64
                        if (isLocal && !url.startsWith('data:')) {
                            try {
                                const blob = await fetch(url).then(r => r.blob());
                                const base64 = await new Promise<string>(res => {
                                    const fr = new FileReader();
                                    fr.onload = () => res(fr.result as string);
                                    fr.readAsDataURL(blob);
                                });
                                return {
                                    type: 'image_url',
                                    image_url: { url: base64, detail: 'high' }
                                };
                            } catch {
                                // 转失败则继续用 URL
                            }
                        }
                        // 线上或转 base64 失败，直接用 URL，带 detail
                        return {
                            type: 'image_url',
                            image_url: { url, detail: 'high' }
                        };
                    })
                );
                parts.push(...items);
                break;
            }

            case 'VIDEO_TEXT':
                parts.push({
                    type: 'video_url',
                    video_url: { url: toPreview(data.step1 as string), detail: 'high' }
                });
                break;

            case 'AUDIO_TEXT':
                parts.push({
                    type: 'input_audio',
                    input_audio: { data: data.step1 as string, format: 'mp3', detail: 'high' }
                });
                break;
        }

        if (extra.trim()) {
            parts.push({ type: 'text', text: `补充说明：${extra.trim()}` });
        }
        return [{ role: 'user', content: parts.length === 1 ? parts[0].text : parts }];
    };

    //—— 发请求 ——//
    const handleGenerate = async () => {
        setThinking(''); setAnswer(''); setLoading(true);
        try {
            const messages = await buildMessages();
            const res = await fetch('/api/chat', {
                method : 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type':'application/json' },
                body   : JSON.stringify({ scene: 'PROMPT_MATE_GEN', meta, messages }),
            });
            if (!res.body) throw new Error(await res.text());
            await parseSSEStream(res.body, ({ type, text }) => {
                if (type === 'reasoning') setThinking(prev => prev + text);
                else                   setAnswer(prev => prev + text);
            });
        } catch (e: any) {
            setAnswer(`❌ 生成失败：${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    //—— 渲染 ——//
    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-auto">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative w-[860px] max-w-full bg-white rounded-lg shadow-xl mt-10 p-6 z-10">
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    <X size={20}/>
                </button>
                <h3 className="text-xl font-bold mb-4">生成前预览</h3>
                <div className="space-y-4 max-h-[340px] overflow-auto border p-4 rounded">
                    <p><b>① 输入类型：</b>{INPUT_LABEL[data.step0]}</p>
                    <div><b>② 输入示例：</b>{renderStep1()}</div>
                    <p><b>③ 目标意图：</b>{intentDesc}</p>
                    <p><b>④ 输出格式：</b>{fmtLabel}</p>
                    {data.step3.fmt === 'JSON' && (
                        <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
              {data.step3.schema}
            </pre>
                    )}
                    <p><b>⑤ 输出示例：</b>{data.step4 || '（无）'}</p>
                </div>

                <textarea
                    rows={3}
                    className="w-full mt-4 p-2 border rounded"
                    placeholder="补充说明（可选，将作为额外 user 消息）"
                    value={extra}
                    onChange={e => setExtra(e.target.value)}
                />

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="mt-4 px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? '生成中…' : '生成 Prompt'}
                </button>

                {thinking && (
                    <pre className="mt-5 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm whitespace-pre-wrap">
            🧠 <b className="text-yellow-700">深度思考：</b>{"\n"}{thinking}
          </pre>
                )}

                {answer && (
                    <div className="relative mt-4">
                        <button
                            onClick={() => navigator.clipboard.writeText(answer)}
                            className="absolute top-0 right-0 text-gray-500 hover:text-gray-800"
                            title="复制"
                        >
                            <Copy size={16}/>
                        </button>
                        <pre className="p-3 bg-gray-100 rounded max-h-[260px] overflow-auto text-sm whitespace-pre-wrap">
              {answer}
            </pre>
                    </div>
                )}
            </div>
        </div>
    );
}