// src/lib/models/model.ts

export interface Supplier {
    id: string;
    name: string;
    abbreviation: string;
    apiKey: string;
    apiUrl: string;
    isDefault: boolean;
}

export interface Model {
    id: string;
    supplierId: string;
    name: string;
    modelType: 'chat' | 'non-chat';
    supportsImageInput: boolean;
    supportsVideoInput: boolean;
    supportsAudioOutput: boolean;
    supportsJsonMode: boolean;
    supportsTool: boolean;
    supportsWebSearch: boolean;
    supportsDeepThinking: boolean;
    isDefault: boolean;
}