// File: src/app/api/directory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/directoryService';

/**
 * GET /api/directory
 * - ?id=xxx
 * - ?feature=xxx[&parent_id=yyy]
 */
export const GET = withUser(async (req: NextRequest, userId: string) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
        const item = await service.getDirectoryService(userId, id);
        if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(item);
    }
    const feature = searchParams.get('feature');
    if (!feature) return NextResponse.json({ error: 'Missing feature' }, { status: 400 });
    const parent = searchParams.get('parent_id') || undefined;
    const list = await service.listDirectoriesService(userId, feature, parent);
    return NextResponse.json(list);
});

/**
 * POST /api/directory
 */
export const POST = withUser(async (req: NextRequest, userId: string) => {
    const body = await req.json();
    const { feature, parent_id, name } = body;
    if (!feature || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const created = await service.createDirectoryService(userId, feature, parent_id, name);
    return NextResponse.json(created, { status: 201 });
});

/**
 * PUT /api/directory
 */
export const PUT = withUser(async (req: NextRequest, userId: string) => {
    const body = await req.json();
    const { id, name, parent_id } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const updated = await service.updateDirectoryService(userId, id, { name, parentId: parent_id });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
});

/**
 * DELETE /api/directory?id=xxx
 */
export const DELETE = withUser(async (req: NextRequest, userId: string) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const ok = await service.deleteDirectoryService(userId, id);
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
});

/**
 * PATCH /api/directory/order
 */
export const PATCH = withUser(async (req: NextRequest, userId: string) => {
    const { feature, parent_id, ordered_ids } = await req.json();
    if (!feature || !Array.isArray(ordered_ids)) {
        return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }
    await service.reorderDirectoriesService(userId, feature, parent_id ?? null, ordered_ids);
    return NextResponse.json({ success: true });
});
