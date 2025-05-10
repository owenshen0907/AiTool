// src/app/api/content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/contentService';

export const GET = withUser(async (req: NextRequest, userId: string) => {
    const { searchParams } = new URL(req.url);
    const feature = searchParams.get('feature');
    if (!feature) {
        return NextResponse.json({ error: 'Missing feature' }, { status: 400 });
    }

    // 支持 ?directory_id=xxx 列表，或 ?id=xxx 单条
    const id = searchParams.get('id');
    if (id) {
        const item = await service.getContentById(userId, feature, id);
        if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(item);
    }
    const dir = searchParams.get('directory_id');
    if (dir) {
        const list = await service.listContentByDirectory(userId, feature, dir);
        return NextResponse.json(list);
    }
    return NextResponse.json({ error: 'Missing id or directory_id' }, { status: 400 });
});

export const POST = withUser(async (req: NextRequest, userId: string) => {
    const body = await req.json();
    const { feature, directory_id, title, summary, body: content } = body;
    if (!feature || !directory_id || !title) {
        return NextResponse.json({ error: 'feature, directory_id and title are required' }, { status: 400 });
    }
    const created = await service.createContent(userId, feature, {
        directoryId: directory_id,
        title,
        summary,
        body: content,
    });
    return NextResponse.json(created, { status: 201 });
});

export const PUT = withUser(async (req: NextRequest, userId: string) => {
    const body = await req.json();
    const { feature, id, directory_id, title, summary, body: content } = body;
    if (!feature || !id || !title) {
        return NextResponse.json({ error: 'feature, id and title are required' }, { status: 400 });
    }
    const updated = await service.updateContent(userId, feature, {
        id,
        directoryId: directory_id,
        title,
        summary,
        body: content,
    });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
});

export const DELETE = withUser(async (req: NextRequest, userId: string) => {
    const { searchParams } = new URL(req.url);
    const feature = searchParams.get('feature');
    const id = searchParams.get('id');
    if (!feature || !id) {
        return NextResponse.json({ error: 'feature and id are required' }, { status: 400 });
    }
    await service.deleteContent(userId, feature, id);
    return NextResponse.json({ success: true });
});

export const PATCH = withUser(async (req: NextRequest, userId: string) => {
    // 用于排序：{ feature, directory_id, ordered_ids: [] }
    const { feature, directory_id, ordered_ids } = await req.json();
    if (!feature || !directory_id || !Array.isArray(ordered_ids)) {
        return NextResponse.json({ error: 'feature, directory_id, ordered_ids required' }, { status: 400 });
    }
    await service.reorderContent(userId, feature, directory_id, ordered_ids);
    return NextResponse.json({ success: true });
});