// File: src/app/prompt/manage/ExperiencePanel.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatInput from '@/app/components/ChatInput';
import type { Supplier } from '@/lib/models/model';
import { parseSSEStream } from '@/lib/utils/sse';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Trash2 } from 'lucide-react';

interface ExperiencePanelProps {
    promptId: string;
    initialPrompt: string;
    /** 当用户立即保存后，通知上层重新加载最新 prompt */
    onPromptUpdated: () => void;
}

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

export default function ExperiencePanel({
                                            promptId,
                                            initialPrompt,
                                            onPromptUpdated,
                                        }: ExperiencePanelProps) {
    const [systemPrompt, setSystemPrompt] = useState(initialPrompt);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'system', content: initialPrompt },
    ]);
    const messagesRef = useRef(messages);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // 当 initialPrompt 变更，重置编辑区和对话
    useEffect(() => {
        setSystemPrompt(initialPrompt);
        const init: Message[] = [{ role: 'system', content: initialPrompt }];
        setMessages(init);
        messagesRef.current = init;
    }, [initialPrompt]);

    /** 立即保存 System Prompt，并触发上层 onPromptUpdated */
    const handleSave = useCallback(async () => {
        try {
            const res = await fetch('/api/prompt', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: promptId, content: systemPrompt }),
            });
            if (!res.ok) throw new Error(await res.text());
            // 刷新上层 prompt 数据
            onPromptUpdated();
            alert('Prompt 已保存');
        } catch (err: any) {
            console.error('保存失败', err);
            alert('保存失败：' + err.message);
        }
    }, [promptId, systemPrompt, onPromptUpdated]);

    // 清空会话
    const handleClear = useCallback(() => {
        const init: Message[] = [{ role: 'system', content: systemPrompt }];
        setMessages(init);
        messagesRef.current = init;
    }, [systemPrompt]);

    // 复制消息内容
    const handleCopyText = useCallback((txt: string) => {
        navigator.clipboard.writeText(txt).catch(console.error);
    }, []);

    // 发送并流式追加
    const handleSend = useCallback(
        async ({
                   text,
                   model,
                   supplier,
               }: {
            text: string;
            model: string;
            supplier: Supplier;
        }) => {
            // 1. 追加用户和空助手
            setMessages((prev) => {
                const next: Message[] = [
                    ...prev,
                    { role: 'user', content: text },
                    { role: 'assistant', content: '' },
                ];
                messagesRef.current = next;
                return next;
            });

            // 2. 调用代理 Chat 接口
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId: supplier.id,
                    model,
                    messages: messagesRef.current,
                }),
            });

            // 3. 没有流式返回，则降级
            if (!res.body) {
                const data = await res.json();
                const reply = data.choices?.[0]?.message?.content ?? '';
                setMessages((prev) => {
                    const next = [...prev];
                    next[next.length - 1] = { role: 'assistant', content: reply };
                    messagesRef.current = next;
                    return next;
                });
                return;
            }

            // 4. 流式更新
            await parseSSEStream(res.body, (evt: any) => {
                const chunk = evt.choices?.[0]?.delta?.content;
                if (chunk) {
                    setMessages((prev) => {
                        const next = [...prev];
                        const idx = next.length - 1;
                        next[idx] = {
                            role: 'assistant',
                            content: next[idx].content + chunk,
                        };
                        messagesRef.current = next;
                        return next;
                    });
                }
            });
        },
        []
    );

    return (
        <div className="flex h-full">
            {/* 左侧：System Prompt 编辑区 */}
            <div className="w-1/3 p-4 bg-white rounded-lg shadow mr-4 flex flex-col">
                <div className="flex items-center mb-2">
                    <h3 className="font-semibold">System Prompt</h3>
                    <button
                        onClick={handleSave}
                        className="ml-auto px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                        立即保存
                    </button>
                </div>
                <textarea
                    className="flex-1 w-full p-2 border rounded resize-none focus:outline-none"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                />
            </div>

            {/* 右侧：对话区 */}
            <div className="flex-1 flex flex-col">
                {/* 工具栏 */}
                <div className="flex justify-end mb-2 space-x-2">
                    <button
                        onClick={handleClear}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                        <Trash2 size={14} /> <span>清空会话</span>
                    </button>
                </div>

                {/* 消息列表（跳过 System Prompt） */}
                <div className="flex-1 overflow-auto bg-gray-50 p-4 rounded space-y-3">
                    {messages.slice(1).map((msg, i) => (
                        <div
                            key={i}
                            className={`relative max-w-[80%] px-4 py-2 rounded whitespace-pre-wrap ${
                                msg.role === 'user'
                                    ? 'self-end bg-blue-500 text-white'
                                    : 'self-start bg-white text-gray-800'
                            }`}
                        >
                            <button
                                onClick={() => handleCopyText(msg.content)}
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

                {/* 输入区 */}
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
        </div>
    );
}