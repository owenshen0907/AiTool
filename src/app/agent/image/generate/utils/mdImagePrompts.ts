// File: src/app/agent/image/utils/mdImagePrompts.ts
export interface ImagePrompt {
    title: string;
    description: string;
    prompt: string;
    text: string | string[];
}

export function parseImagePromptsBlock(markdown: string): ImagePrompt[] {
    const re = /<!--\s*IMAGE_PROMPT START\s*-->[\s\S]*?```json[\r\n]+([\s\S]*?)[\r\n]+```/i;
    const m = re.exec(markdown);
    if (!m) return [];

    const raw = m[1].trim();
    try {
        const obj = JSON.parse(raw);
        return Array.isArray(obj.images) ? obj.images : [];
    } catch (err) {
        console.warn('IMAGE_PROMPT JSON 解析失败:', err);
        return [];
    }
}