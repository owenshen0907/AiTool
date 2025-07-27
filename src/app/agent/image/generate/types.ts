// File: src/app/agent/image/generate/types.ts

/** 支持的 Prompt 类型键 */
export type PromptKey = 'intent_prompt' | 'image_prompt';

/** 单个 Prompt 的文本片段定义 */
export interface PromptContent {
    role: string;
    task: string;
    steps?: string[];
    description?: string;
    notes?: string[];
}

/** 每个 agent 的 Prompt 定义，仅包含文本片段 */
export interface PromptDefinition {
    id: string;
    title: string;
    purpose?: string;
    prompts: Partial<Record<PromptKey, PromptContent>>;
}

export type PromptDefinitions = PromptDefinition[];

/** intent_prompt 输出的 JSON 结构 */
export interface IntentPromptOutput {
    intents: Array<{
        id: string;
        title: string;
        level?: string;
        description: string;
        category: string;
        subcategory: string;
        confidence: number;
    }>;
}

/** image_prompt 输出的 JSON 结构 */
export interface ImagePromptOutput {
    images: Array<{
        title: string;
        description: string;
        prompt: string;
        text: string;
    }>;
    design_notes: string[];
    suggested_image_count: number;
}