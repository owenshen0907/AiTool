// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import configurations from '@/config';

interface RequestBody {
    message: Array<{ type: string; [key: string]: any }>;
    configKey?: string;
}

export async function POST(req: Request) {
    try {
        const { message, configKey } = (await req.json()) as RequestBody;

        // 根据 configKey 取配置，默认为 STEP_FUN
        const config = configurations[configKey || 'STUDY_ASSISTANT'];

        const payload = {
            model: config.model,
            stream: true,
            messages: [
                {
                    role: "system",
                    content: config.systemMessage
                },
                {
                    role: "user",
                    content: message
                }
            ]
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

        return new Response(response.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });
    } catch (error) {
        console.error("API error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}