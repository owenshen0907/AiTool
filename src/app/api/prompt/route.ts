// app/api/prompt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
    createPromptSchema,
    updatePromptSchema,
} from '@/lib/utils/validators';
import * as service from '@/lib/services/promptService';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    // —— 1. 如果 URL 上带了 id，就取单条 ——
    const id = searchParams.get('id');
    if (id) {
        const item = await service.getPromptById(id);
        if (!item) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        return NextResponse.json(item);
    }

    // —— 2. 否则按 parent_id 列表 ——
    const parent_id = searchParams.get('parent_id') || undefined;
    const list = await service.listPrompts(parent_id);
    return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const parse = createPromptSchema.safeParse(body);
    if (!parse.success) {
        return NextResponse.json({ error: parse.error.format() }, { status: 400 });
    }
    const userId = req.headers.get('x-user-id') || 'anonymous';
    const created = await service.createPrompt(userId, parse.data);
    return NextResponse.json(created, { status: 201 });
}

export async function PUT(req: NextRequest) {
    const body = await req.json();
    const parse = updatePromptSchema.safeParse(body);
    if (!parse.success) {
        return NextResponse.json({ error: parse.error.format() }, { status: 400 });
    }
    const userId = req.headers.get('x-user-id') || 'anonymous';
    const updated = await service.updatePromptService(
        userId,
        parse.data.id!,
        parse.data
    );
    if (!updated) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const userId = req.headers.get('x-user-id') || 'anonymous';
    const deleted = await service.deletePromptService(userId, id);
    if (!deleted) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
}