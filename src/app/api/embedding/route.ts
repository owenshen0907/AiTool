import { NextResponse } from 'next/server';
import configurations from '@/config';

interface RequestBody {
    text: string;
    configKey?: string; // 可选，根据实际情况选择配置，这里默认使用 VECTOR_EMBEDDING
}

export async function POST(req: Request) {
    try {
        const { text, configKey } = (await req.json()) as RequestBody;
        // 使用 VECTOR_EMBEDDING 配置，如果需要支持多个配置可以根据 configKey 进行选择
        const config = configurations["VECTOR_EMBEDDING"];

        const payload = {
            input: text,
            model: config.model,
        };

        const response = await fetch(config.apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            return new Response("Error", { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Embedding API error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}