// src/app/api/agent/web/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { withUser } from '@/lib/api/auth';
import { getAgentConfig } from '@/lib/services/agentConfigService';

const AGENT_ID = 'webPageAgent';
const SCENE_KEY = 'web_generate';

const DEFAULT_SYSTEM_PROMPT = `
你是一名高级网页设计师，负责输出一份精美的静态 H5。
要求：
- 输出完整 HTML（含 head/body），只使用内联样式，不依赖外链、不引用外部字体/脚本。
- 风格：简洁现代，可用渐变背景、卡片、圆角、阴影，保证移动端与桌面端响应式。
- 可用轻微过渡/悬浮效果，但不要插入 <script>。
- 文案使用中文；所有资源使用纯 CSS（无图片外链）。
请直接输出 HTML 字符串。`.trim();

interface GenerateRequest {
    title: string;
    description?: string;
    theme?: string;
    sections?: string[];
    extra?: string;
}

export const POST = withUser(async (req: NextRequest, userId: string) => {
    let body: GenerateRequest;
    try {
        body = await req.json();
    } catch {
        return new NextResponse('Invalid JSON', { status: 400 });
    }

    if (!body.title?.trim()) {
        return new NextResponse('title is required', { status: 400 });
    }

    const agentCfg = await getAgentConfig(userId, AGENT_ID);
    const scene = agentCfg.scenes.find(s => s.sceneKey === SCENE_KEY);
    if (!scene) {
        return new NextResponse('请先在 Agent 管理里为网页生成配置模型', { status: 400 });
    }

    const systemPrompt = (scene.extras && scene.extras.systemPrompt) || DEFAULT_SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt(body);

    try {
        const resp = await fetch(`${scene.supplier.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${scene.supplier.apiKey}`
            },
            body: JSON.stringify({
                model: scene.model.name,
                stream: false,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            })
        });

        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new Error(`上游模型调用失败：${resp.status} ${text}`);
        }

        const data = await resp.json();
        const html: string = data?.choices?.[0]?.message?.content?.trim();
        if (!html) {
            throw new Error('模型未返回内容');
        }

        const { url, filePath } = await persistHtml(userId, body.title, html);
        return NextResponse.json({ url, filePath });
    } catch (err: any) {
        console.error('[web-generate]', err);
        return new NextResponse(err?.message || '生成失败', { status: 500 });
    }
});

function buildUserPrompt(payload: GenerateRequest) {
    const lines = [
        `页面标题：${payload.title}`,
        payload.theme ? `主题/风格：${payload.theme}` : '',
        payload.description ? `简介：${payload.description}` : '',
        payload.sections?.length ? `期望模块：${payload.sections.join('；')}` : '',
        payload.extra ? `附加说明：${payload.extra}` : '',
        '请产出一份视觉层次清晰的单页 H5，包含 Hero、亮点/功能、内容模块和行动按钮。'
    ].filter(Boolean);
    return lines.join('\n');
}

async function persistHtml(userId: string, title: string, html: string) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
    const safeTitle = slugify(title) || 'page';
    const filename = `${safeTitle}-${timeStr}.html`;

    const baseDir = path.join(process.cwd(), 'public', 'share', userId, dateStr);
    await fs.mkdir(baseDir, { recursive: true });

    const filePath = path.join(baseDir, filename);
    await fs.writeFile(filePath, html, 'utf8');

    const url = `/share/${userId}/${dateStr}/${filename}`;
    return { url, filePath };
}

function slugify(input: string) {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
}
