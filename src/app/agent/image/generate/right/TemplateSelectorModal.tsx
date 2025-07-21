import React, { useState, useEffect } from 'react';
import templatesData from './templates.json';

export interface TemplatePrompts {
    intent_prompt?: string;
    image_prompt?: string;
}

export interface Template {
    id: string;
    title: string;
    purpose: string;
    prompts: TemplatePrompts;
}

interface Props {
    feature: string;
    onSelect: (template: Template) => void;
    defaultTemplateId?: string;
}

// 将可能仍含旧结构的数据标准化
function normalizeTemplates(raw: any[]): Template[] {
    return raw.map((t: any) => {
        if (t.prompts) return t as Template;
        return {
            id: t.id,
            title: t.title,
            purpose: t.purpose || '',
            prompts: { image_prompt: t.content || '' }
        } as Template;
    });
}

const predefinedTemplates: Template[] = normalizeTemplates(templatesData as any[]);

export default function TemplateSelectorModal({
                                                  feature,
                                                  onSelect,
                                                  defaultTemplateId
                                              }: Props) {
    const initialId = defaultTemplateId || predefinedTemplates[0]?.id;
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string>(initialId);

    const selectedTemplate =
        predefinedTemplates.find(t => t.id === selectedId) || predefinedTemplates[0];

    useEffect(() => {
        if (selectedTemplate) onSelect(selectedTemplate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openModal = () => setOpen(true);
    const closeModal = () => setOpen(false);

    const confirmSelect = () => {
        if (selectedTemplate) onSelect(selectedTemplate);
        closeModal();
    };

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className="px-4 py-2 border rounded hover:bg-gray-100"
            >
                选择笔记模板
            </button>

            {open && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white w-3/4 h-3/4 flex rounded shadow-lg overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* 左侧列表 */}
                        <div className="w-1/3 border-r p-4 overflow-auto">
                            <ul>
                                {predefinedTemplates.map(t => (
                                    <li
                                        key={t.id}
                                        className={`py-2 px-3 cursor-pointer ${
                                            t.id === selectedId
                                                ? 'bg-gray-200 font-semibold rounded'
                                                : 'hover:bg-gray-50'
                                        }`}
                                        onClick={() => setSelectedId(t.id)}
                                    >
                                        {t.title}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 右侧详情 */}
                        <div className="w-2/3 p-4 flex flex-col">
                            <h3 className="text-lg font-semibold mb-2">模板用途</h3>
                            <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">
                                {selectedTemplate?.purpose}
                            </p>

                            {/* 显示该模板有哪些步骤 */}
                            <div className="mt-2 text-xs text-gray-600 space-y-1">
                                {selectedTemplate?.prompts.intent_prompt && (
                                    <div>
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      Step 1: 意图抽取
                    </span>
                                    </div>
                                )}
                                {selectedTemplate?.prompts.image_prompt && (
                                    <div>
                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded">
                      Step 2: 插画/图文生成
                    </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={confirmSelect}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    type="button"
                                >
                                    确定
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}