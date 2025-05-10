// src/lib/models/prompt/promptCase.ts

/**
 * 内容项：Case 内容表对应的数据结构
 */
export interface CaseContentItem {
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
