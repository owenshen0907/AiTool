// File: src/app/agent/image/right/hooks/useAgentScenes.ts
'use client';

import { useEffect, useState } from 'react';

export interface AgentSceneConfig {
    sceneKey: string;
    supplier: {
        id: string;
        name: string;
        apiUrl: string;
        apiKey: string;
        wssUrl?: string | null;
    };
    model: {
        id: string;
        name: string;
        modelType: string;
    };
    extras: Record<string, any>;
    updatedAt: string;
}
interface AgentConfigResponse {
    data: { agentId: string; scenes: AgentSceneConfig[] };
}

export function useAgentScenes(agentId: string) {
    const [scenes, setScenes] = useState<AgentSceneConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!agentId) return;
        setLoading(true);
        (async () => {
            try {
                const res = await fetch(`/api/config/agent?agentId=${agentId}`);
                if (!res.ok) throw new Error('获取 agent 配置失败');
                const json: AgentConfigResponse = await res.json();
                setScenes(json.data.scenes || []);
                setError(null);
            } catch (e: any) {
                setError(e.message || '加载失败');
            } finally {
                setLoading(false);
            }
        })();
    }, [agentId]);

    const getScene = (key: string) => scenes.find(s => s.sceneKey === key);

    return { scenes, loading, error, getScene };
}