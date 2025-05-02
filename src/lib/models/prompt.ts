// src/lib/models/prompt.ts
export interface AttributeItem {
    name: string;
    value: boolean;
    suggestion?: string;
    locked: boolean;
}

export interface UpdateLog {
    at: string;   // ISO timestamp
    by: string;
    change: string;
}

export interface GoodCaseItem {
    id: string;
    prompt_id: string;
    user_input: string;
    expected: string;
    images?: string[];
    audios?: string[];
    videos?: string[];
    position: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface BadCaseItem {
    id: string;
    prompt_id: string;
    user_input: string;
    bad_output: string;
    expected: string;
    images?: string[];
    audios?: string[];
    videos?: string[];
    position: number;
    error_type?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface Prompt {
    id: string;
    parent_id?: string;
    type: 'dir' | 'prompt';
    title: string;
    content?: string;
    description?: string;
    tags: string[];
    attributes: AttributeItem[];
    comments?: string[];
    is_public: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
    update_log?: UpdateLog[];
    good_cases?: GoodCaseItem[];
    bad_cases?: BadCaseItem[];
}

/** 左侧目录树节点（目录或 Prompt） */
export interface PromptNode {
    id: string;
    parentId: string | null;
    title: string;
    type: 'dir' | 'prompt';
    children?: PromptNode[];
}

/** 右侧面板用的“Prompt 详情” */
export interface PromptItem extends PromptNode {
    content: string;
    description: string;
    tags: string[];
    attributes: AttributeItem[];
    good_cases?: GoodCaseItem[];
    bad_cases?: BadCaseItem[];
}
