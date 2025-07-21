// src/lib/models/agentConfig.ts

export interface AgentSceneConfigDBRow {
    id: string;
    userId: string;
    agentId: string;
    sceneKey: string;
    supplierId: string;
    modelId: string;
    extras: any;
    updatedAt: string;
    createdAt: string;

    supplierName: string;
    supplierAbbr: string;
    supplierApiUrl: string;
    supplierApiKey: string;
    supplierWssUrl: string | null;

    modelName: string;
    modelType: string;
    supportsAudioInput: boolean;
    supportsImageInput: boolean;
    supportsVideoInput: boolean;
    supportsAudioOutput: boolean;
    supportsImageOutput: boolean;
    supportsVideoOutput: boolean;
    supportsJsonMode: boolean;
    supportsTool: boolean;
    supportsWebSearch: boolean;
    supportsDeepThinking: boolean;
    supportsWebsocket: boolean;
    modelIsDefault: boolean;
}

export interface AgentSceneConfigResponseScene {
    sceneKey: string;
    supplier: {
        id: string;
        name: string;
        abbreviation: string;
        apiUrl: string;
        apiKey: string;
        wssUrl: string | null;
    };
    model: {
        id: string;
        name: string;
        modelType: string;
        capabilities: {
            audioInput: boolean;
            imageInput: boolean;
            videoInput: boolean;
            audioOutput: boolean;
            imageOutput: boolean;
            videoOutput: boolean;
            jsonMode: boolean;
            tool: boolean;
            webSearch: boolean;
            deepThinking: boolean;
            websocket: boolean;
        };
        isDefault: boolean;
    };
    extras: any;
    updatedAt: string;
}

export interface AgentSceneConfigResponse {
    agentId: string;
    scenes: AgentSceneConfigResponseScene[];
}

export interface AgentSceneUpsert {
    sceneKey: string;
    supplierId: string;
    modelId: string;
    extras?: any;
}

export interface SaveAgentConfigPayload {
    agentId: string;
    scenes: AgentSceneUpsert[];
    prune?: boolean;            // 可选：true 时删除未提交的旧场景
}