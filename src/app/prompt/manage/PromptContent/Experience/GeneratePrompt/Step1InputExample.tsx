// File: src/app/prompt/manage/PromptContent/Experience/GeneratePrompt/Step1InputExample.tsx
'use client';

import React, { useMemo, useState } from 'react';
import promptConfig from './promptConfig.json';
import FileUploader, { UploadedFile } from '@/lib/utils/FileUploader';

type ScenarioCode = typeof promptConfig.inputOptions[number]['code'];
const toPreview = (p: string) =>
    p.startsWith('http')
        ? p
        : `${process.env.NEXT_PUBLIC_SITE_ORIGIN?.replace(/\/$/, '') || ''}/${p.replace(/^\//, '')}`;

interface Props {
    scenario: ScenarioCode;
    text: string;
    onText: (v: string) => void;

    /** 把“相对路径数组”回传给父组件（存 DB） */
    onPaths: (paths: string[]) => void;
    /** 父组件传入的相对路径（编辑回显） */
    paths?: string[];

    desc: string;
    onDesc: (v: string) => void;
}

export default function Step1InputExample({
                                              scenario,
                                              text,
                                              onText,
                                              onPaths,
                                              paths = [],
                                              desc,
                                              onDesc,
                                          }: Props) {
    // 新上传的 URL 列表
    const [newPreviews, setNewPreviews] = useState<string[]>([]);

    // 合并历史 + 新，并去重
    const thumbs = useMemo(() => {
        const all = [...newPreviews, ...paths.map(toPreview)];
        return Array.from(new Set(all));
    }, [newPreviews, paths]);

    // 删除第 idx 个缩略图
    const remove = (idx: number) => {
        const src = thumbs[idx];
        // 1) 如果在 newPreviews 中，删它
        if (newPreviews.includes(src)) {
            setNewPreviews(prev => prev.filter(u => u !== src));
        }
        // 2) 同时，如果是历史 paths，也删掉它对应的相对路径
        //    先把 preview URL 转回相对路径
        const rel = src
            .replace(process.env.NEXT_PUBLIC_SITE_ORIGIN?.replace(/\/$/, '') || '', '')
            .replace(/^\//, '');
        onPaths(paths.filter(p => p !== rel));
    };

    return (
        <div className="space-y-4">
            <p className="text-gray-500">说明：在此处输入示例内容，供大模型处理。</p>

            {/* -------- TEXT -------- */}
            {scenario === 'TEXT' && (
                <textarea
                    value={text}
                    onChange={e => onText(e.target.value)}
                    placeholder="示例：请总结以下内容。"
                    className="w-full h-48 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                />
            )}

            {/* -------- IMG + TEXT -------- */}
            {scenario === 'IMG_TEXT' && (
                <>
                    <FileUploader
                        accept="image/*"
                        multiple
                        label="点击或拖拽上传图片（最多 50 张）"
                        onUploaded={(
                            files: UploadedFile[],
                            errors: Error[] = []   // <- 给 errors 一个默认空数组
                        ) => {
                            // 1) 如果有失败的文件，提醒一下
                            if (errors.length > 0) {
                                alert(
                                    '以下文件上传失败：\n' +
                                    errors.map(e => e.message).join('\n')
                                );
                            }
                            // 2) 回传所有成功的相对路径给父组件
                            onPaths([...paths, ...files.map(f => f.path)]);
                            // 3) 把新上传的 URL 加进预览列表
                            setNewPreviews(prev => [...prev, ...files.map(f => f.url)]);
                        }}
                    />

                    <div className="grid grid-cols-4 gap-3 max-h-60 overflow-auto p-1">
                        {thumbs.map((src, i) => (
                            <div key={i} className="relative group">
                                <img
                                    src={src}
                                    alt={`img-${i}`}
                                    className="w-full h-24 object-cover rounded"
                                />
                                <button
                                    onClick={() => remove(i)}
                                    className="absolute -top-1 -right-1 hidden group-hover:block bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-5"
                                    title="删除"
                                >
                                    ×
                                </button>
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

            {/* -------- VIDEO + TEXT -------- */}
            {scenario === 'VIDEO_TEXT' && (
                <>
                    <FileUploader
                        accept="video/*"
                        label="上传视频"
                        onUploaded={(
                            files: UploadedFile[],
                            errors: Error[] = []
                        ) => {
                            if (errors.length > 0) {
                                alert(errors.map(e => e.message).join('\n'));
                            }
                            if (files[0]) {
                                onPaths([files[0].path]);
                                setNewPreviews([files[0].url]);
                            }
                        }}
                    />

                    {newPreviews[0] && (
                        <video
                            src={newPreviews[0]}
                            controls
                            className="w-full mt-2 max-h-60 rounded"
                        />
                    )}

                    <textarea
                        value={desc}
                        onChange={e => onDesc(e.target.value)}
                        placeholder="示例：请对该视频内容进行摘要。"
                        className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                    />
                </>
            )}

            {/* -------- AUDIO + TEXT -------- */}
            {scenario === 'AUDIO_TEXT' && (
                <>
                    <FileUploader
                        accept="audio/mp3,audio/wav"
                        label="上传音频(mp3 / wav)"
                        onUploaded={(
                            files: UploadedFile[],
                            errors: Error[] = []
                        ) => {
                            if (errors.length > 0) {
                                alert(errors.map(e => e.message).join('\n'));
                            }
                            if (files[0]) {
                                onPaths([files[0].path]);
                                setNewPreviews([files[0].url]);
                            }
                        }}
                    />

                    {newPreviews[0] && (
                        <audio
                            src={newPreviews[0]}
                            controls
                            className="w-full mt-2"
                        />
                    )}

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