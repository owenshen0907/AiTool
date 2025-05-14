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