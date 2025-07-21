// src/lib/services/agentConfigService.ts
import {
    AgentSceneConfigDBRow,
    AgentSceneConfigResponse,
    AgentSceneUpsert,
    SaveAgentConfigPayload
} from '@/lib/models/agentConfig';
import {
    getAgentConfigByAgentId,
    upsertAgentScenes,
    pruneAgentScenesForAgent,
    validateOwnership
} from '@/lib/repositories/agentConfigRepository';

function mapRows(rows: AgentSceneConfigDBRow[]): AgentSceneConfigResponse {
    return {
        agentId: rows[0]?.agentId || '',
        scenes: rows.map(r => ({
            sceneKey: r.sceneKey,
            supplier: {
                id: r.supplierId,
                name: r.supplierName,
                abbreviation: r.supplierAbbr,
                apiUrl: r.supplierApiUrl,
                apiKey: r.supplierApiKey, // 不脱敏
                wssUrl: r.supplierWssUrl
            },
            model: {
                id: r.modelId,
                name: r.modelName,
                modelType: r.modelType,
                capabilities: {
                    audioInput: r.supportsAudioInput,
                    imageInput: r.supportsImageInput,
                    videoInput: r.supportsVideoInput,
                    audioOutput: r.supportsAudioOutput,
                    imageOutput: r.supportsImageOutput,
                    videoOutput: r.supportsVideoOutput,
                    jsonMode: r.supportsJsonMode,
                    tool: r.supportsTool,
                    webSearch: r.supportsWebSearch,
                    deepThinking: r.supportsDeepThinking,
                    websocket: r.supportsWebsocket
                },
                isDefault: r.modelIsDefault
            },
            extras: r.extras || {},
            updatedAt: r.updatedAt
        }))
    };
}

export async function getAgentConfig(userId: string, agentId: string): Promise<AgentSceneConfigResponse> {
    const rows = await getAgentConfigByAgentId(userId, agentId);
    if (!rows.length) {
        return { agentId, scenes: [] };
    }
    return mapRows(rows);
}

export async function saveAgentConfig(userId: string, payload: SaveAgentConfigPayload) {
    if (!payload || !payload.agentId) {
        throw new Error('agentId is required');
    }
    if (!Array.isArray(payload.scenes)) {
        throw new Error('scenes must be an array');
    }

    // 过滤掉不完整的场景（也可以选择直接抛错）
    const cleaned: AgentSceneUpsert[] = payload.scenes
        .filter(s => s.sceneKey && s.supplierId && s.modelId)
        .map(s => ({
            sceneKey: s.sceneKey,
            supplierId: s.supplierId,
            modelId: s.modelId,
            extras: s.extras ?? {}
        }));

    if (!cleaned.length) {
        // 返回原样（无有效条目）
        return { updated: 0, data: { agentId: payload.agentId, scenes: [] } };
    }

    // 授权校验（确保 supplier/model 属于该用户）—— 如果不需要可注释掉
    await validateOwnership(userId, cleaned.map(c => ({ supplierId: c.supplierId, modelId: c.modelId })));

    await upsertAgentScenes(userId, payload.agentId, cleaned);

    if (payload.prune) {
        const keepKeys = cleaned.map(c => c.sceneKey);
        await pruneAgentScenesForAgent(userId, payload.agentId, keepKeys);
    }

    const latest = await getAgentConfig(userId, payload.agentId);
    return { updated: cleaned.length, data: latest };
}