// File: src/lib/openai/imageGenerator.ts
import type { AgentSceneConfig } from 'src/hooks/useAgentScenes';

export interface GenerateImagesOptions {
    prompt: string;
    scene: AgentSceneConfig;
    n?: number;
    response_format?: 'b64_json' | 'url';
    size?: string;
    background?: 'transparent' | 'opaque' | 'auto';
    model?: string;
    user?: string;
    // …你可以按需继续添加接口支持的字段
}

/**
 * 调用 OpenAI 图片生成接口，返回 base64 或 url 数组
 */
export async function generateImages(opts: GenerateImagesOptions): Promise<string[]> {
    const {
        prompt,
        scene,
        n = 1,
        response_format = 'b64_json',
        size,
        background,
        model
    } = opts;

    const url = `${scene.supplier.apiUrl}/images/generations`;
    const body: any = {
        prompt,
        n,
        // response_format,
        model: model ?? undefined,
        size,
        // background
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${scene.supplier.apiKey}`
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error?.message || '生成图片失败');
    }

    if (response_format === 'b64_json') {
        // 返回的是纯 base64，不带 data:image/png;base64, 前缀
        return data.data.map((item: any) => item.b64_json as string);
    } else {
        return data.data.map((item: any) => item.url as string);
    }
}