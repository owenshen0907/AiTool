// File: src/app/prompt/manage/PromptContent/Experience/ExperiencePanel.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatInput from '@/app/components/input/ChatInput';
import type { Supplier } from '@/lib/models/model';
import { parseSSEStream } from '@/lib/utils/sse';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

    // 保持 ref 与 state 同步
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // initialPrompt 变更时重置
    useEffect(() => {
        setSystemPrompt(initialPrompt);
        const init: Message[] = [{ role: 'system', content: initialPrompt }];
        setMessages(init);
        messagesRef.current = init;
    }, [initialPrompt]);

    const handleClear = useCallback(() => {
        const init: Message[] = [{ role: 'system', content: systemPrompt }];
        setMessages(init);
        messagesRef.current = init;
    }, [systemPrompt]);

    const handleSend = useCallback(
        async ({ text, model, supplier }: { text: string; model: string; supplier: Supplier }) => {
            // 追加用户与占位 assistant
            setMessages((prev: Message[]) => {
                const next: Message[] = [
                    ...prev,
                    { role: 'user', content: text },
                    { role: 'assistant', content: '' },
                ];
                messagesRef.current = next;
                return next;
            });

            const res = await fetch('/api/completions', {
                method: 'POST',
                credentials: 'same-origin',
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
                setMessages((prev: Message[]) => {
                    const next = [...prev] as Message[];
                    next[next.length - 1] = { role: 'assistant', content: reply };
                    messagesRef.current = next;
                    return next;
                });
                return;
            }

            await parseSSEStream(res.body, ({ text: chunk }) => {
                setMessages((prev: Message[]) => {
                    const next = [...prev] as Message[];
                    const i = next.length - 1;
                    next[i] = { role: 'assistant', content: next[i].content + chunk };
                    messagesRef.current = next;
                    return next;
                });
            });
        },
        []
    );

    const handleGenerate = useCallback(() => setIsModalOpen(true), []);
    const handleRegenerate = useCallback(() => setIsModalOpen(true), []);
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

    const handleGenerateConfirm = useCallback(
        (config: {
            contentParts: unknown[];
            intent: string;
            outputFormat: string;
            schema?: string;
            outputExample?: string;
        }) => {
            const { contentParts, intent, outputFormat, schema, outputExample } = config;
            const partsStr = JSON.stringify(contentParts);
            let promptText = [
                `内容 Parts：${partsStr}`,
                `意图：${intent}`,
                `输出格式：${outputFormat}`,
            ].join('\n');
            if (schema) promptText += `\nSchema 约束：${schema}`;
            if (outputExample) promptText += `\n输出示例：${outputExample}`;

            setSystemPrompt(promptText);
            const init: Message[] = [{ role: 'system', content: promptText }];
            setMessages(init);
            messagesRef.current = init;
            setIsModalOpen(false);
        },
        []
    );

    return (
        <div className="flex h-full gap-6 px-6 pb-6 pt-0">
            {/* 左侧 1/3 */}
            <div className="w-1/3 p-6 bg-white rounded-2xl shadow-lg flex flex-col">
                <div className="flex items-center mb-4">
                    <h3 className="text-lg font-semibold">System Prompt</h3>
                    {systemPrompt.trim() === '' ? (
                        <button
                            onClick={handleGenerate}
                            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                            一键生成
                        </button>
                    ) : (
                        <div className="ml-auto flex space-x-3">
                            <button
                                onClick={handleRegenerate}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                            >
                                重新生成
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                                保存
                            </button>
                        </div>
                    )}
                </div>
                <textarea
                    className="flex-1 w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={systemPrompt}
                    onChange={e => setSystemPrompt(e.target.value)}
                />
            </div>

            {/* 右侧 2/3 */}
            <div className="w-2/3 flex flex-col">
                <div className="flex-1 overflow-auto bg-gray-50 p-6 rounded-2xl flex flex-col space-y-4 relative">
                    {/* 清空按钮放在对话框左上角 */}
                    <button
                        onClick={handleClear}
                        className="absolute top-4 left-4 px-3 py-1 bg-red-200 text-red-800 rounded-lg hover:bg-red-300 text-sm"
                    >
                        清空
                    </button>

                    {messages.slice(1).map((msg, idx) => (
                        <div
                            key={idx}
                            className={`relative px-5 py-3 rounded-3xl whitespace-pre-wrap shadow-sm max-w-[70%] ${
                                msg.role === 'user'
                                    ? 'self-end bg-pink-50 text-pink-800 text-right'
                                    : 'self-start bg-green-50 text-green-800 text-left'
                            }`}
                        >
                            <button
                                onClick={() => navigator.clipboard.writeText(msg.content)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                            >
                                📋
                            </button>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm">
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                    ))}
                </div>

                {/* 输入区 */}
                <div className="flex items-center pt-4 border-t border-gray-200">
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