// File: src/app/prompt/manage/PromptContent/Experience/ExperiencePanel.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatInput from '@/app/components/ChatInput';
import type { Supplier } from '@/lib/models/model';
import { parseSSEStream } from '@/lib/utils/sse';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Trash2 } from 'lucide-react';
import GeneratePromptModal from './GeneratePrompt/GeneratePromptModal';

export type Message = { role: 'system' | 'user' | 'assistant'; content: string };

interface ExperiencePanelProps {
    promptId: string;
    initialPrompt: string;
    onPromptUpdated: () => void;
}

export default function ExperiencePanel({
                                            promptId,
                                            initialPrompt,
                                            onPromptUpdated,
                                        }: ExperiencePanelProps) {
    const [systemPrompt, setSystemPrompt] = useState(initialPrompt);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'system', content: initialPrompt },
    ]);
    const messagesRef = useRef<Message[]>(messages);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        setSystemPrompt(initialPrompt);
        const init: Message[] = [{ role: 'system', content: initialPrompt }];
        setMessages(init);
        messagesRef.current = init;
    }, [initialPrompt]);

    const handleSave = useCallback(async () => {
        try {
            const res = await fetch('/api/prompt', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: promptId, content: systemPrompt }),
            });
            if (!res.ok) throw new Error(await res.text());
            onPromptUpdated();
            alert('Prompt 已保存');
        } catch (err: any) {
            console.error('保存失败', err);
            alert('保存失败：' + err.message);
        }
    }, [promptId, systemPrompt, onPromptUpdated]);

    const handleClear = useCallback(() => {
        const init: Message[] = [{ role: 'system', content: systemPrompt }];
        setMessages(init);
        messagesRef.current = init;
    }, [systemPrompt]);

    const handleSend = useCallback(
        async ({ text, model, supplier }: { text: string; model: string; supplier: Supplier }) => {
            setMessages(prev => {
                const next: Message[] = [
                    ...prev,
                    { role: 'user', content: text },
                    { role: 'assistant', content: '' },
                ];
                messagesRef.current = next;
                return next;
            });

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId: supplier.id,
                    model,
                    messages: messagesRef.current,
                }),
            });

            if (!res.body) {
                const data = await res.json();
                const reply = data.choices?.[0]?.message?.content ?? '';
                setMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1] = { role: 'assistant', content: reply };
                    messagesRef.current = next;
                    return next;
                });
                return;
            }

            await parseSSEStream(res.body, (evt: any) => {
                const chunk = evt.choices?.[0]?.delta?.content;
                if (chunk) {
                    setMessages(prev => {
                        const next = [...prev];
                        next[next.length - 1] = {
                            role: 'assistant',
                            content: next[next.length - 1].content + chunk,
                        };
                        messagesRef.current = next;
                        return next;
                    });
                }
            });
        },
        []
    );

    const handleGenerate   = useCallback(() => setIsModalOpen(true), []);
    const handleRegenerate = useCallback(() => setIsModalOpen(true), []);

    const handleGenerateConfirm = useCallback((config: {
        contentParts: unknown[];
        intent: string;
        outputFormat: string;
        schema?: string;
        outputExample?: string;
    }) => {
        const { contentParts, intent, outputFormat, schema, outputExample } = config;
        const partsStr = JSON.stringify(contentParts);
        let promptText = [
            `内容Parts：${partsStr}`,
            `意图：${intent}`,
            `输出格式：${outputFormat}`,
        ].join('\n');
        if (schema)       promptText += `\nSchema 约束：${schema}`;
        if (outputExample) promptText += `\n输出示例：${outputExample}`;

        setSystemPrompt(promptText);
        const init: Message[] = [{ role: 'system', content: promptText }];
        setMessages(init);
        messagesRef.current = init;
        setIsModalOpen(false);
    }, []);

    return (
        <div className="flex h-full">
            {/* 左侧 */}
            <div className="w-1/5 p-4 bg-white rounded-lg shadow mr-4 flex flex-col">
                <div className="flex items-center mb-2">
                    <h3 className="font-semibold">System Prompt</h3>
                    {systemPrompt.trim() === '' ? (
                        <button
                            onClick={handleGenerate}
                            className="ml-auto px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                            一键生成
                        </button>
                    ) : (
                        <div className="ml-auto flex space-x-2">
                            <button
                                onClick={handleRegenerate}
                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                            >
                                重新生成
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                                立即保存
                            </button>
                        </div>
                    )}
                </div>
                <textarea
                    className="flex-1 w-full p-2 border rounded resize-none focus:outline-none"
                    value={systemPrompt}
                    onChange={e => setSystemPrompt(e.target.value)}
                />
            </div>

            {/* 右侧 */}
            <div className="flex-1 flex flex-col">
                <div className="flex justify-end mb-2">
                    <button
                        onClick={handleClear}
                        className="flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                        <Trash2 size={14} /> 清空会话
                    </button>
                </div>
                <div className="flex-1 overflow-auto bg-gray-50 p-4 rounded space-y-3">
                    {messages.slice(1).map((msg, idx) => (
                        <div
                            key={idx}
                            className={`relative max-w-[80%] px-4 py-2 rounded whitespace-pre-wrap ${
                                msg.role === 'user'
                                    ? 'self-end bg-blue-500 text-white'
                                    : 'self-start bg-white text-gray-800'
                            }`}
                        >
                            <button
                                onClick={() => navigator.clipboard.writeText(msg.content)}
                                className="absolute top-1 right-1 text-gray-500 hover:text-gray-800"
                            >
                                <Copy size={14} />
                            </button>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm">
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                    ))}
                </div>
                <div className="mt-2">
                    <ChatInput
                        context={{ promptId }}
                        placeholder="输入对话…"
                        enableImage
                        enableVoice
                        onSend={handleSend}
                    />
                </div>
            </div>

            <GeneratePromptModal
                promptId={promptId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}