
// =============================
// File: src/app/prompt/manage/PromptContent/Experience/GeneratePrompt/GeneratePromptModal.tsx
// =============================
'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import promptConfig from './promptConfig.json';
import Step0TypeSelect from './Step0TypeSelect';
import Step1InputExample from './Step1InputExample';
import Step2IntentSelect from './Step2IntentSelect';
import Step3OutputFormatSelect from './Step3OutputFormatSelect';
import Step4OutputExample from './Step4OutputExample';
import ConfirmGenerateModal, { ConfirmData } from './ConfirmGenerateModal';
import useGeneratePrompt from './useGeneratePrompt';
import { buildPayload } from './persistStep';

interface Props {
    promptId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function GeneratePromptModal({ promptId, isOpen, onClose }: Props) {
    /* ---------- 常量 ---------- */
    const { inputOptions, intentOptions, outputFormats } = promptConfig;
    const { initialData, persist } = useGeneratePrompt(promptId);

    /* ---------- 步骤状态 ---------- */
    const [step, setStep] = useState(0);

    // step-1
    const [scenario, setScenario] = useState<'TEXT' | 'IMG_TEXT' | 'VIDEO_TEXT' | 'AUDIO_TEXT'>(
        inputOptions[0].code as any,
    );
    const [textContent, setTextContent] = useState('');
    const [imagePaths, setImagePaths] = useState<string[]>([]);
    const [imageDesc, setImageDesc] = useState('');
    const [videoPath, setVideoPath] = useState<string | null>(null);
    const [videoDesc, setVideoDesc] = useState('');
    const [audioPath, setAudioPath] = useState<string | null>(null);
    const [audioDesc, setAudioDesc] = useState('');

    // step-2
    const [selectedIntent, setSelectedIntent] = useState('');
    const [customIntent, setCustomIntent] = useState('');

    // step-3
    const [outputFormat, setOutputFormat] = useState(outputFormats[0].code);
    const [schema, setSchema] = useState('');

    // step-4
    const [outputExample, setOutputExample] = useState('');

    /* ---------- 回填 ---------- */
    useEffect(() => {
        if (!initialData.length) return;
        initialData.forEach((row) => {
            switch (row.part_index) {
                case 0:
                    row.content.text && setScenario(row.content.text as any);
                    break;
                case 1: {
                    if (row.part_type === 'text' && row.content.text) {
                        setScenario('TEXT');
                        setTextContent(row.content.text);
                    } else if (row.part_type === 'image_url' && Array.isArray(row.content.urls)) {
                        setScenario('IMG_TEXT');
                        setImagePaths(row.content.urls);
                        setImageDesc(row.content.text || '');
                    } else if (row.part_type === 'video_url' && row.content.url) {
                        setScenario('VIDEO_TEXT');
                        setVideoPath(row.content.url);
                        setVideoDesc(row.content.text || '');
                    } else if (row.part_type === 'input_audio' && row.content.data) {
                        setScenario('AUDIO_TEXT');
                        setAudioPath(row.content.data);
                        setAudioDesc(row.content.text || '');
                    }
                    break;
                }
                case 2:
                    if (row.content.text) {
                        intentOptions.some((i) => i.code === row.content.text)
                            ? setSelectedIntent(row.content.text)
                            : setCustomIntent(row.content.text);
                    }
                    break;
                case 3:
                    row.content.text && setOutputFormat(row.content.text);
                    row.content.schema && setSchema(row.content.schema);
                    break;
                case 4:
                    row.content.text && setOutputExample(row.content.text);
                    break;
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData]);

    /* ---------- 校验 ---------- */
    const validateStep = () => {
        switch (step) {
            case 0:
                return !!scenario;
            case 1:
                switch (scenario) {
                    case 'TEXT':
                        return !!textContent.trim();
                    case 'IMG_TEXT':
                        return imagePaths.length > 0;
                    case 'VIDEO_TEXT':
                        return !!videoPath;
                    case 'AUDIO_TEXT':
                        return !!audioPath;
                }
            case 2:
                return !!selectedIntent || !!customIntent.trim();
            case 3:
                return outputFormat !== 'JSON' || !!schema.trim();
            case 4:
                return true;
            default:
                return false;
        }
    };

    /* ---------- 下一步 ---------- */
    const handleNext = async () => {
        if (!validateStep()) return;
        const payload = buildPayload(
            step,
            promptId,
            scenario,
            textContent,
            imagePaths,
            imageDesc,
            videoPath,
            videoDesc,
            audioPath,
            audioDesc,
            selectedIntent,
            customIntent,
            outputFormat,
            schema,
            outputExample,
        );
        await persist([payload]);
        setStep((s) => Math.min(s + 1, 4));
    };

    /* ---------- 生成 ---------- */
    const [showConfirm, setShowConfirm] = useState(false);
    const handleBeginGenerate = async () => {
        if (!validateStep()) return;
        const payload = buildPayload(
            4,
            promptId,
            scenario,
            textContent,
            imagePaths,
            imageDesc,
            videoPath,
            videoDesc,
            audioPath,
            audioDesc,
            selectedIntent,
            customIntent,
            outputFormat,
            schema,
            outputExample,
        );
        await persist([payload]);
        setShowConfirm(true);
    };

    /* ---------- 预览数据 ---------- */
    const previewData: ConfirmData = {
        step0: scenario,
        step1:
            scenario === 'TEXT'
                ? textContent
                : scenario === 'IMG_TEXT'
                    ? imagePaths
                    : scenario === 'VIDEO_TEXT'
                        ? videoPath || ''
                        : audioPath || '',
        step2: customIntent.trim() || selectedIntent,
        step3: { fmt: outputFormat, schema },
        step4: outputExample,
    };

    /* ---------- UI ---------- */
    if (!isOpen) return null;
    const titles = ['输入类型*', '输入示例*', '目标意图*', '输出格式*', '输出示例'];

    return (
        <>
            {/* 编辑弹窗 */}
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto">
                <div className="absolute inset-0 bg-black/40" onClick={onClose} />
                <div className="relative w-[820px] max-w-full bg-white rounded-lg mt-10 p-8 shadow-xl z-10">
                    <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={onClose}>
                        <X size={20} />
                    </button>

                    <h3 className="text-2xl font-bold mb-6 text-center">一键生成 Prompt</h3>

                    {/* 步骤条 */}
                    <div className="flex justify-center space-x-4 mb-6">
                        {titles.map((t, i) => (
                            <div
                                key={t}
                                onClick={() => setStep(i)}
                                className={`px-4 py-2 rounded-lg cursor-pointer ${
                                    step === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {t}
                            </div>
                        ))}
                    </div>

                    {/* 步骤内容 */}
                    <div className="min-h-[240px] space-y-4">
                        {step === 0 && <Step0TypeSelect options={inputOptions} selected={scenario} onSelect={(v) => setScenario(v as any)} />}

                        {step === 1 && (
                            <Step1InputExample
                                scenario={scenario}
                                text={textContent}
                                onText={setTextContent}
                                paths={imagePaths}
                                onPaths={setImagePaths}
                                desc={imageDesc}
                                onDesc={setImageDesc}
                            />
                        )}

                        {step === 2 && (
                            <Step2IntentSelect
                                options={intentOptions}
                                selected={selectedIntent}
                                custom={customIntent}
                                onSelect={(c) => {
                                    setSelectedIntent(c);
                                    setCustomIntent('');
                                }}
                                onCustom={(t) => {
                                    setCustomIntent(t);
                                    setSelectedIntent('');
                                }}
                            />
                        )}

                        {step === 3 && (
                            <Step3OutputFormatSelect
                                options={outputFormats}
                                selected={outputFormat}
                                onSelect={setOutputFormat}
                                schema={schema}
                                onSchemaChange={setSchema}
                            />
                        )}

                        {step === 4 && <Step4OutputExample example={outputExample} onExample={setOutputExample} />}
                    </div>

                    {/* 底部按钮 */}
                    <div className="mt-8 flex justify-between">
                        <button
                            onClick={() => setStep((s) => Math.max(s - 1, 0))}
                            disabled={step === 0}
                            className="px-6 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
                        >
                            上一步
                        </button>
                        {step < 4 ? (
                            <button
                                onClick={handleNext}
                                disabled={!validateStep()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                            >
                                下一步
                            </button>
                        ) : (
                            <button
                                onClick={handleBeginGenerate}
                                disabled={!validateStep()}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                            >
                                开始生成 Prompt
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 预览弹窗 */}
            <ConfirmGenerateModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} data={previewData} />
        </>
    );
}
