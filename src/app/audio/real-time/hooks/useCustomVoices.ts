// File: src/app/audio/real-time/hooks/useCustomVoices.ts
import { useEffect, useState } from 'react';
import { voices } from '@/lib';

interface CustomVoice {
    id: string;
    file_id: string;
    created_at: number;
}

export function useCustomVoices(wsUrl: string, apiKey: string) {
    const [allVoices, setAllVoices] = useState(voices);

    useEffect(() => {
        async function fetchCustomVoices() {
            if (!apiKey) return;
            try {
                // 从 wsUrl 中提取 origin
                const domain = new URL(wsUrl).origin;
                const httpDomain = domain
                    .replace(/^ws:\/\//, 'http://')
                    .replace(/^wss:\/\//, 'https://');
                const res = await fetch(`${httpDomain}/v1/audio/voices?limit=100`, {
                    headers: { Authorization: `Bearer ${apiKey}` },
                });
                if (!res.ok) {
                    console.warn('获取自定义音色失败，状态码:', res.status);
                    return;
                }
                const data = await res.json();
                if (data.object === 'list' && data.data) {
                    const merged = [
                        ...voices,
                        ...data.data.map((voice: CustomVoice) => ({
                            name: `自定义音色-${voice.id}`,
                            value: voice.id,
                        })),
                    ];
                    setAllVoices(merged);
                }
            } catch (e) {
                console.error('获取自定义音色出错:', e);
            }
        }
        fetchCustomVoices();
    }, [wsUrl, apiKey]);

    return allVoices;
}