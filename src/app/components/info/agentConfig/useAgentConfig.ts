'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import metasRaw from './agentScenes.json';

export interface AgentSceneMeta {
    sceneKey: string;
    label: string;
    desc: string;
}
export interface AgentMeta {
    agentId: string;
    name: string;
    description: string;
    scenes: AgentSceneMeta[];
}

export interface SceneLocalConfig {
    sceneKey: string;
    supplierId: string | null;
    modelName: string | null;
    modelId: string | null;
    extras?: any;
}

export interface AgentLocalConfig {
    agentId: string;
    scenes: SceneLocalConfig[];
    loading: boolean;
    loaded: boolean;
    saving: boolean;
    dirty: boolean;
    error?: string | null;
}

interface BackendScene {
    sceneKey: string;
    supplier: { id: string; name: string; apiKey: string; apiUrl: string };
    model: { id: string; name: string; modelType: string };
    extras: any;
    updatedAt: string;
}
interface BackendAgentConfigResponse {
    agentId: string;
    scenes: BackendScene[];
}

const agentMetas: AgentMeta[] = metasRaw as AgentMeta[];

export function useAgentConfig() {
    const [configs, setConfigs] = useState<Record<string, AgentLocalConfig>>({});
    const fetchingRef = useRef<Set<string>>(new Set());                // 当前正在请求的 agentIds
    const modelIdCache = useRef<Map<string, string>>(new Map());        // key: supplierId::modelName -> modelId

    const getMeta = useCallback((agentId: string) => agentMetas.find(a => a.agentId === agentId), []);

    /** 初始化本地空壳 */
    const initShell = useCallback((agentId: string) => {
        const meta = getMeta(agentId);
        if (!meta) return;
        setConfigs(prev => prev[agentId] ? prev : ({
            ...prev,
            [agentId]: {
                agentId,
                scenes: meta.scenes.map(s => ({
                    sceneKey: s.sceneKey,
                    supplierId: null,
                    modelName: null,
                    modelId: null,
                    extras: {}
                })),
                loading: false,
                loaded: false,
                saving: false,
                dirty: false,
                error: null
            }
        }));
    }, [getMeta]);

    /** 拉取单 agent 配置（带防抖/防重复） */
    const fetchAgentConfig = useCallback(async (agentId: string) => {
        if (!agentId) return;
        const meta = getMeta(agentId);
        if (!meta) return;

        // 已在请求 / 已加载中的短路
        if (fetchingRef.current.has(agentId)) return;
        const cfg = configs[agentId];
        if (cfg && (cfg.loading || cfg.loaded)) return;

        // 标记 & 初始化 loading
        fetchingRef.current.add(agentId);
        setConfigs(prev => {
            const cur = prev[agentId];
            return {
                ...prev,
                [agentId]: cur
                    ? { ...cur, loading: true, error: null }
                    : {
                        agentId,
                        scenes: meta.scenes.map(s => ({
                            sceneKey: s.sceneKey, supplierId: null, modelName: null, modelId: null, extras: {}
                        })),
                        loading: true,
                        loaded: false,
                        saving: false,
                        dirty: false,
                        error: null
                    }
            };
        });

        try {
            const res = await fetch(`/api/config/agent?agentId=${encodeURIComponent(agentId)}`, { credentials: 'include' });
            if (!res.ok) throw new Error(await res.text());
            const { data } = await res.json() as { data: BackendAgentConfigResponse };
            const map = new Map(data.scenes.map(s => [s.sceneKey, s]));
            data.scenes.forEach(b => {
                modelIdCache.current.set(`${b.supplier.id}::${b.model.name}`, b.model.id);
            });

            const scenes: SceneLocalConfig[] = meta.scenes.map(s => {
                const b = map.get(s.sceneKey);
                if (!b) {
                    return { sceneKey: s.sceneKey, supplierId: null, modelName: null, modelId: null, extras: {} };
                }
                return {
                    sceneKey: s.sceneKey,
                    supplierId: b.supplier.id,
                    modelName: b.model.name,
                    modelId: b.model.id,
                    extras: b.extras || {}
                };
            });

            setConfigs(prev => ({
                ...prev,
                [agentId]: {
                    agentId,
                    scenes,
                    loading: false,
                    loaded: true,
                    saving: false,
                    dirty: false,
                    error: null
                }
            }));
        } catch (e: any) {
            setConfigs(prev => {
                const cur = prev[agentId];
                return {
                    ...prev,
                    [agentId]: {
                        ...(cur || {
                            agentId,
                            scenes: meta!.scenes.map(s => ({
                                sceneKey: s.sceneKey, supplierId: null, modelName: null, modelId: null, extras: {}
                            }))
                        }),
                        loading: false,
                        loaded: true,
                        saving: false,
                        dirty: cur?.dirty ?? false,
                        error: e.message
                    }
                };
            });
        } finally {
            fetchingRef.current.delete(agentId);
        }
    }, [configs, getMeta]);

    /** 确保已加载 */
    const ensureLoaded = useCallback((agentId: string) => {
        if (!agentId) return;
        initShell(agentId);
        fetchAgentConfig(agentId);
    }, [initShell, fetchAgentConfig]);

    /** 更新供应商（清空模型） */
    const updateSupplier = useCallback((agentId: string, sceneKey: string, supplierId: string) => {
        setConfigs(prev => {
            const cfg = prev[agentId];
            if (!cfg) return prev;
            return {
                ...prev,
                [agentId]: {
                    ...cfg,
                    dirty: true,
                    scenes: cfg.scenes.map(s =>
                        s.sceneKey === sceneKey
                            ? { ...s, supplierId, modelName: null, modelId: null }
                            : s
                    )
                }
            };
        });
    }, []);

    /** 更新模型（尝试补 modelId） */
    const updateModel = useCallback((agentId: string, sceneKey: string, supplierId: string, modelName: string, modelId?: string) => {
        const cacheKey = `${supplierId}::${modelName}`;
        if (modelId) modelIdCache.current.set(cacheKey, modelId);
        const resolvedId = modelId || modelIdCache.current.get(cacheKey) || null;
        setConfigs(prev => {
            const cfg = prev[agentId];
            if (!cfg) return prev;
            return {
                ...prev,
                [agentId]: {
                    ...cfg,
                    dirty: true,
                    scenes: cfg.scenes.map(s =>
                        s.sceneKey === sceneKey
                            ? { ...s, modelName, modelId: resolvedId }
                            : s
                    )
                }
            };
        });
    }, []);

    /** 外部同步模型列表（补足 modelId） */
    const syncModelIds = useCallback((supplierId: string, models: { id: string; name: string }[], agentId?: string) => {
        if (!models?.length) return;
        models.forEach(m => {
            const k = `${supplierId}::${m.name}`;
            if (!modelIdCache.current.has(k)) modelIdCache.current.set(k, m.id);
        });
        if (agentId) {
            setConfigs(prev => {
                const cfg = prev[agentId];
                if (!cfg) return prev;
                return {
                    ...prev,
                    [agentId]: {
                        ...cfg,
                        scenes: cfg.scenes.map(s => {
                            if (s.supplierId === supplierId && s.modelName && !s.modelId) {
                                const mid = modelIdCache.current.get(`${supplierId}::${s.modelName}`) || null;
                                return { ...s, modelId: mid };
                            }
                            return s;
                        })
                    }
                };
            });
        }
    }, []);

    /** 保存单 agent */
    const saveAgent = useCallback(async (agentId: string, { prune = true } = {}) => {
        const cfg = configs[agentId];
        if (!cfg) return;
        setConfigs(prev => ({ ...prev, [agentId]: { ...cfg, saving: true, error: null } }));
        try {
            const payloadScenes = cfg.scenes
                .filter(s => s.supplierId && s.modelName)
                .map(s => {
                    const key = `${s.supplierId}::${s.modelName}`;
                    const mid = s.modelId || modelIdCache.current.get(key);
                    if (!mid) throw new Error(`模型 ID 缺失：${s.sceneKey}`);
                    return {
                        sceneKey: s.sceneKey,
                        supplierId: s.supplierId!,
                        modelId: mid,
                        extras: s.extras || {}
                    };
                });

            const res = await fetch('/api/config/agent', {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, scenes: payloadScenes, prune })
            });
            if (!res.ok) throw new Error(await res.text());
            const json = await res.json() as { data: BackendAgentConfigResponse };

            // 覆盖
            const meta = getMeta(agentId);
            if (!meta) return;
            const map = new Map(json.data.scenes.map(s => [s.sceneKey, s]));
            json.data.scenes.forEach(b =>
                modelIdCache.current.set(`${b.supplier.id}::${b.model.name}`, b.model.id)
            );
            const merged: SceneLocalConfig[] = meta.scenes.map(s => {
                const b = map.get(s.sceneKey);
                if (!b) return { sceneKey: s.sceneKey, supplierId: null, modelName: null, modelId: null, extras: {} };
                return {
                    sceneKey: s.sceneKey,
                    supplierId: b.supplier.id,
                    modelName: b.model.name,
                    modelId: b.model.id,
                    extras: b.extras || {}
                };
            });

            setConfigs(prev => ({
                ...prev,
                [agentId]: {
                    agentId,
                    scenes: merged,
                    loading: false,
                    loaded: true,
                    saving: false,
                    dirty: false,
                    error: null
                }
            }));
        } catch (e: any) {
            setConfigs(prev => ({
                ...prev,
                [agentId]: {
                    ...(prev[agentId] || { agentId, scenes: [] }),
                    saving: false,
                    dirty: true,
                    error: e.message
                }
            }));
            throw e;
        }
    }, [configs, getMeta]);

    /** 读取某 agent 状态 */
    const useAgent = useCallback((agentId: string) => configs[agentId] || null, [configs]);

    const hasDirty = useMemo(
        () => Object.values(configs).some(c => c.dirty),
        [configs]
    );

    return {
        agentMetas,
        useAgent,
        ensureLoaded,
        updateSupplier,
        updateModel,
        syncModelIds,
        saveAgent,
        hasDirty
    };
}