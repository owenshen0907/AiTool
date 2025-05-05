// File: src/app/prompt/manage/PromptContent/Experience/GeneratePrompt/Step1InputExample.tsx
'use client';

import React, { useMemo, useState } from 'react';
import promptConfig from './promptConfig.json';
import FileUploader from '@/lib/utils/FileUploader';

type ScenarioCode = typeof promptConfig.inputOptions[number]['code'];
const toPreview = (p: string) =>
    p.startsWith('http') ? p : `${process.env.NEXT_PUBLIC_SITE_ORIGIN ?? ''}/${p}`;

interface Props {
    scenario: ScenarioCode;
    text: string;
    onText: (v: string) => void;

    /** 把 “相对路径数组” 回传给父组件（存 DB） */
    onPaths: (paths: string[]) => void;
    /** 父组件传入的相对路径（编辑回显） */
    paths?: string[];

    desc: string;
    onDesc: (v: string) => void;
}

export default function Step1InputExample({
                                              scenario, text, onText,
                                              onPaths, paths = [],
                                              desc, onDesc,
                                          }: Props) {

    const [newPreviews, setNewPreviews] = useState<string[]>([]);

    /** 展示缩略图：新上传 + 历史 */
    const thumbs = useMemo(
        () => [...newPreviews, ...paths.map(toPreview)],
        [newPreviews, paths],
    );

    /** 删除 */
    const remove = (idx: number) => {
        if (idx < newPreviews.length) {
            setNewPreviews(prev => prev.filter((_, i) => i !== idx));
        } else {
            const real = idx - newPreviews.length;
            onPaths(paths.filter((_, i) => i !== real));
        }
    };

    /* ---------- UI ---------- */
    return (
        <div className="space-y-4">
            <p className="text-gray-500">说明：在此处输入示例内容，供大模型处理。</p>

            {/* TEXT */}
            {scenario === 'TEXT' && (
                <textarea
                    value={text}
                    onChange={e => onText(e.target.value)}
                    placeholder="示例：请总结以下内容。"
                    className="w-full h-48 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                />
            )}

            {/* IMG + TEXT */}
            {scenario === 'IMG_TEXT' && (
                <>
                    <FileUploader
                        accept="image/*"
                        multiple
                        label="点击或拖拽上传图片（最多 50 张）"
                        onUploaded={list => {
                            onPaths([...paths, ...list.map(f => f.path)]);
                            setNewPreviews(prev => [...prev, ...list.map(f => f.url)]);
                        }}
                    />

                    <div className="grid grid-cols-4 gap-3 max-h-60 overflow-auto p-1">
                        {thumbs.map((src, i) => (
                            <div key={i} className="relative group">
                                <img src={src} alt={`img-${i}`} className="w-full h-24 object-cover rounded" />
                                <button
                                    onClick={() => remove(i)}
                                    className="absolute -top-1 -right-1 hidden group-hover:block bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-5"
                                    title="删除"
                                >×</button>
                            </div>
                        ))}
                    </div>

                    <textarea
                        value={desc}
                        onChange={e => onDesc(e.target.value)}
                        placeholder="示例：请根据以上图片生成描述。"
                        className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                    />
                </>
            )}

            {/* VIDEO + TEXT */}
            {scenario === 'VIDEO_TEXT' && (
                <>
                    <FileUploader
                        accept="video/*"
                        label="上传视频"
                        onUploaded={list => {
                            if (!list.length) return;
                            onPaths([list[0].path]);
                            setNewPreviews([list[0].url]);
                        }}
                    />
                    {newPreviews[0] && <video src={newPreviews[0]} controls className="w-full mt-2 max-h-60 rounded" />}
                    <textarea
                        value={desc}
                        onChange={e => onDesc(e.target.value)}
                        placeholder="示例：请对该视频内容进行摘要。"
                        className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                    />
                </>
            )}

            {/* AUDIO + TEXT */}
            {scenario === 'AUDIO_TEXT' && (
                <>
                    <FileUploader
                        accept="audio/mp3,audio/wav"
                        label="上传音频(mp3 / wav)"
                        onUploaded={list => {
                            if (!list.length) return;
                            onPaths([list[0].path]);
                            setNewPreviews([list[0].url]);
                        }}
                    />
                    {newPreviews[0] && <audio src={newPreviews[0]} controls className="w-full mt-2" />}
                    <textarea
                        value={desc}
                        onChange={e => onDesc(e.target.value)}
                        placeholder="示例：请将该音频转写为文字。"
                        className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                    />
                </>
            )}
        </div>
    );
}