// src/lib/models/content.ts
export interface ContentItem {
    id: string;
    directoryId: string;
    title: string;
    summary?: string;
    body?: string;
    position: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}
