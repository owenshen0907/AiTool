// src/lib/models/prompt/prompt.ts
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
    position: number;
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
    position: number;
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
/**
 * 原始生成输入数据，对应数据库表 prompt_generation_input_data
 */
export interface PromptGenerationInputData {
    /** 主键 UUID */
    id: string;
    /** 关联的 Prompt ID */
    prompt_id: string;
    /** 输入片段顺序 */
    part_index: number;
    /** 片段类型：text | image_url | video_url | input_audio */
    part_type: 'text' | 'image_url' | 'video_url' | 'input_audio';
    /** JSON 格式的内容，依据 part_type 结构化 */
    content: {
        text?: string;
        url?: string;
        urls?: string[];
        detail?: 'low' | 'high';
        data?: string;
        format?: 'mp3' | 'wav';
        schema?: string;
    };
    /** 创建时间 ISO 字符串 */
    created_at: string;
}