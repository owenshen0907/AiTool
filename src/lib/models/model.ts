// src/lib/models/model.ts

export interface Supplier {
    id: string;
    name: string;
    abbreviation: string;
    apiKey: string;
    apiUrl: string;
    wssUrl:      string | null;
    isDefault: boolean;
}

export interface Model {
    id: string;
    supplierId: string;
    name: string;
    modelType: 'chat' | 'audio' | 'image' | 'video' | 'other';
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
    isDefault: boolean;
}

export interface VoiceTone {
    /** 与 voice_tones.id 对应 */
    id: string;
    /** 供应商 ID */
    supplierId: string;
    /** 供应商接口生成的音色 ID */
    toneId: string;
    /** 音色名称 */
    name: string;
    /** 音色描述 */
    description: string | null;
    /**
     * 可用模型列表
     * - 空数组表示对所有 supportsAudioOutput = true 的模型全局可用
     * - 否则只对数组中指定的模型 ID 可用
     */
    availableModelIds: string[];
    /** 试听文件路径 */
    sampleAudioPath: string;
    /** 创建时间 */
    createdAt: string;
    /** 最后更新时间 */
    updatedAt: string;
}