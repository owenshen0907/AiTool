// File: src/app/docs/japanese/TemplateSelectorModal.tsx

'use client';
console.log('[TRACE] Using /docs/demo/right/GenerateSection.tsx', import.meta.url);
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Template {
    id: string;
    name: string;
    content: string;
}

interface Props {
    feature: string;
    onSelect: (template: Template) => void;
}

export default function TemplateSelectorModal({ feature, onSelect }: Props) {
    const [open, setOpen] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [content, setContent] = useState('');

    const storageKey = `templates_${feature}`;
    const lastTplKey = `lastSelectedTemplate_${feature}`;

    useEffect(() => {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
            try { setTemplates(JSON.parse(raw)); } catch {}
        }
    }, [storageKey]);
    // 读取上次选中
    useEffect(() => {
        if (templates.length === 0) return;
        const lastId = localStorage.getItem(lastTplKey);
        if (lastId && templates.find(t => t.id === lastId)) {
            const t = templates.find(t => t.id === lastId)!;
            setSelectedId(lastId);
            setName(t.name);
            setContent(t.content);
            onSelect(t);
        }
    }, [templates]);

    const saveAll = (arr: Template[]) => {
        setTemplates(arr);
        localStorage.setItem(storageKey, JSON.stringify(arr));
    };

    const openModal = () => setOpen(true);
    const closeModal = () => setOpen(false);

    const addTemplate = () => {
        const tpl: Template = { id: uuidv4(), name: '', content: '' };
        saveAll([...templates, tpl]);
        setSelectedId(tpl.id);
        setName(''); setContent('');
    };

    const selectTemplate = (t: Template) => {
        setSelectedId(t.id);
        setName(t.name); setContent(t.content);
    };

    const saveTemplate = () => {
        if (!selectedId) return;
        saveAll(templates.map(t =>
            t.id === selectedId ? { ...t, name, content } : t
        ));
    };

    const confirmSelect = () => {
        if (selectedId) {
            const t = templates.find(t => t.id === selectedId);
            if (t) {
                onSelect(t);
                localStorage.setItem(lastTplKey, t.id);
            }

        }
        closeModal();
    };

    return (
        <>
            <button onClick={openModal} className="px-4 py-2 border rounded hover:bg-gray-100">
                选择日记模板
            </button>

            {open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
                    <div className="bg-white w-3/4 h-3/4 flex rounded shadow-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* 左侧 */}
                        <div className="w-1/3 border-r p-4 flex flex-col">
                            <div className="flex justify-between mb-2">
                                <h3 className="text-lg font-semibold">模板列表</h3>
                                <button onClick={addTemplate} className="text-blue-500">新增</button>
                            </div>
                            <ul className="flex-1 overflow-auto">
                                {templates.map(t => (
                                    <li key={t.id}
                                        className={`py-1 px-2 cursor-pointer ${t.id === selectedId ? 'bg-gray-200' : ''}`}
                                        onClick={() => selectTemplate(t)}>
                                        {t.name || '未命名'}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* 右侧 */}
                        <div className="w-2/3 p-4 flex flex-col">
                            <input value={name} onChange={e => setName(e.target.value)}
                                   placeholder="模板名称" className="border rounded px-2 py-1 mb-2" />
                            <textarea value={content} onChange={e => setContent(e.target.value)}
                                      placeholder="编辑模板内容" className="border rounded flex-1 p-2 resize-none" />
                            <div className="mt-2 flex justify-end space-x-2">
                                <button onClick={saveTemplate} className="px-4 py-2 bg-green-500 text-white rounded">保存</button>
                                <button onClick={confirmSelect} className="px-4 py-2 bg-blue-500 text-white rounded">确定并关闭</button>
                            </div>
                        </div>
                        <button onClick={closeModal} className="absolute top-2 right-2 text-gray-500 hover:text-black">×</button>
                    </div>
                </div>
            )}
        </>
    );
}