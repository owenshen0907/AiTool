'use client';
import React, { useState, useEffect, useRef } from 'react';
import ChatInput, { ImageEntry } from '@/app/components/chat/ChatInput';
import dynamic from 'next/dynamic';
import styles from './ChatArea.module.css';
import { openDB, getChatMessages, setChatMessages } from '@/db/indexdb';

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

// 定义消息部分结构
interface ChatPartText {
    type: "text";
    text: string;
}
interface ChatPartImage {
    type: "image_url";
    image_url: { url: string };
}
type ChatPart = ChatPartText | ChatPartImage;

// 定义对话消息结构
export interface ChatMessage {
    sender: "user" | "bot";
    parts: ChatPart[];
}

interface ChatAreaParentProps {
    onLatestChat?: (text: string) => void;
}

export default function ChatAreaParent({ onLatestChat }: ChatAreaParentProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [hydrated, setHydrated] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // 从 IndexedDB 恢复消息数据
    useEffect(() => {
        setHydrated(true);
        getChatMessages()
            .then(cached => {
                if (cached) {
                    try {
                        setMessages(cached as ChatMessage[]);
                    } catch (err) {
                        console.error("Error parsing cached chatMessages", err);
                    }
                }
            })
            .catch(err => console.error("IndexedDB get error:", err));
    }, []);

    // 每次消息更新后保存到 IndexedDB，并自动滚动到底部
    useEffect(() => {
        if (hydrated) {
            setChatMessages(messages).catch(err =>
                console.error("IndexedDB set error:", err)
            );
            if (onLatestChat && messages.length > 0) {
                const last = messages[messages.length - 1];
                const lastText = last.parts
                    .filter(p => p.type === "text")
                    .map(p => (p as ChatPartText).text)
                    .join(" ");
                if (lastText) {
                    onLatestChat(lastText);
                }
            }
            if (contentRef.current) {
                contentRef.current.scrollTop = contentRef.current.scrollHeight;
            }
        }
    }, [messages, hydrated, onLatestChat]);

    // 清空对话
    const handleClear = () => {
        setMessages([]);
        setChatMessages([]).catch(err => console.error("IndexedDB clear error:", err));
    };

    // 当 ChatInput 发送消息时调用 onSend 回调
    const handleSend = async (text: string, images: ImageEntry[]) => {
        const parts: ChatPart[] = [];
        if (text) {
            parts.push({ type: "text", text });
        }
        images.forEach(img => {
            parts.push({ type: "image_url", image_url: { url: img.url } });
        });
        const userMessage: ChatMessage = { sender: "user", parts };
        setMessages(prev => [...prev, userMessage]);

        // 构造发送给后端的 payload（示例）
        const payload = {
            message: parts,
            configKey: "STUDY_ASSISTANT"
        };

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok || !response.body) {
                console.error("API response error");
                return;
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let botText = '';

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value);
                const lines = chunkValue.split('\n').filter(line => line.trim() !== '');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '');
                        if (dataStr.includes("Copy to clipboard") || !dataStr.trim().startsWith('{')) continue;
                        if (dataStr === '[DONE]') {
                            done = true;
                            break;
                        }
                        try {
                            const json = JSON.parse(dataStr);
                            const delta = json.choices[0]?.delta?.content;
                            if (delta) {
                                botText += delta;
                                const formatted = botText.replace(/\s+$/g, '');
                                setMessages(prev => {
                                    const last = prev[prev.length - 1];
                                    if (last && last.sender === "bot") {
                                        const newParts = [...last.parts];
                                        if (newParts.length > 0 && newParts[0].type === "text") {
                                            newParts[0] = { type: "text", text: formatted };
                                        } else {
                                            newParts.push({ type: "text", text: formatted });
                                        }
                                        const updated = [...prev];
                                        updated[updated.length - 1] = { ...last, parts: newParts };
                                        return updated;
                                    } else {
                                        return [...prev, { sender: "bot", parts: [{ type: "text", text: formatted }] }];
                                    }
                                });
                            }
                        } catch (err) {
                            console.error("JSON parse error:", err);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };

    return (
        <div className={styles.chatContainer}>
            <button className={styles.clearButton} onClick={handleClear}>清空对话</button>
            <div ref={contentRef} className={styles.contentArea}>
                {messages.map((msg, index) => (
                    <div key={index} className={msg.sender === "user" ? styles.userMessage : styles.botMessage}>
                        {/* 只对机器人显示前缀 */}
                        {msg.sender === "bot" && <strong>机器人:</strong>}
                        <div className={styles.messageImages}>
                            {msg.parts.filter(p => p.type === "image_url").map((part, idx) => (
                                <img
                                    key={idx}
                                    src={(part as ChatPartImage).image_url.url}
                                    alt="sent image"
                                    className={styles.sentImage}
                                />
                            ))}
                        </div>
                        <div className={styles.messageText}>
                            {msg.parts.filter(p => p.type === "text").map((part, idx) => (
                                msg.sender === "bot" ? (
                                    <ReactMarkdown key={idx}>{(part as ChatPartText).text}</ReactMarkdown>
                                ) : (
                                    <span key={idx}>{(part as ChatPartText).text}</span>
                                )
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <ChatInput onSend={handleSend} />
        </div>
    );
}