// File: src/app/api/prompt/case/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/promptCaseContentService';

/**
 * GET /api/prompt/case
 * - ?id=xxx              获取单条 Case 内容
 * - ?directory_id=yyy    列出目录下内容列表
 */
export const GET = withUser(async (req: NextRequest, userId: string) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
        const item = await service.getPromptCaseContentService(userId, id);
        if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(item);
    }
    const directoryId = searchParams.get('directory_id');
    if (!directoryId) {
        return NextResponse.json({ error: 'Missing directory_id' }, { status: 400 });
    }
    const list = await service.listPromptCaseContentService(userId, directoryId);
    return NextResponse.json(list);
});

/**
 * POST /api/prompt/case
 */
export const POST = withUser(async (req: NextRequest, userId: string) => {
    const { directory_id, title, summary, body } = await req.json();
    if (!directory_id || !title) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const created = await service.createPromptCaseContentService(
        userId,
        directory_id,
        title,
        summary,
        body
    );
    return NextResponse.json(created, { status: 201 });
});

/**
 * PUT /api/prompt/case
 */
export const PUT = withUser(async (req: NextRequest, userId: string) => {
    const body = await req.json();
    const id = body.id;
    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    // 构建变更对象，仅包含传入字段
    const changes: Partial<import('@/lib/models/prompt/promptCase').CaseContentItem> = {};
    if (body.directory_id !== undefined) changes.directoryId = body.directory_id;
    if (body.title !== undefined) changes.title = body.title;
    if (body.summary !== undefined) changes.summary = body.summary;
    if (body.body !== undefined) changes.body = body.body;
    const updated = await service.updatePromptCaseContentService(
        userId,
        id,
        changes
    );
    if (!updated) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
});

export const DELETE = withUser(async (req: NextRequest, userId: string) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const ok = await service.deletePromptCaseContentService(userId, id);
    if (!ok) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
});

/**
 * PATCH /api/prompt/case/order
 */
export const PATCH = withUser(async (req: NextRequest, userId: string) => {
    const { directory_id, ordered_ids } = await req.json();
    if (!directory_id || !Array.isArray(ordered_ids)) {
        return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }
    await service.reorderPromptCaseContentService(
        userId,
        directory_id,
        ordered_ids
    );
    return NextResponse.json({ success: true });
});
