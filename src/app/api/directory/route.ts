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
    console.log('▶▶ POST /api/directory body:', body);
    const { feature, parent_id, name } = body;
    if (!feature || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    // 把空字符串也当成 undefined
    const parentId = parent_id || undefined;
    try {
        const created = await service.createDirectoryService(userId, feature, parentId, name);
        return NextResponse.json(created, { status: 201 });
    } catch (e: any) {
        console.error('❌ createDirectoryService failed:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
});

/**
 * PUT /api/directory
 */
export const PUT = withUser(async (req: NextRequest, userId: string) => {
    const body = await req.json();
    const { id, name, parent_id } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;

    // ✅ 只在 parent_id 非空字符串、非 null、非 undefined 时更新
    if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
        updateData.parentId = parent_id;
    }

    const updated = await service.updateDirectoryService(userId, id, updateData);
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

    try {
        const ok = await service.deleteDirectoryService(userId, id);
        if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        if (err.message === 'DirectoryNotEmpty') {
            return NextResponse.json(
                { error: '此目录下还有子目录，请先删除子目录' },
                { status: 400 }
            );
        }
        if (err.message === 'DirectoryHasContent') {
            return NextResponse.json(
                { error: '此目录下还有内容，请先删除内容' },
                { status: 400 }
            );
        }
        // 其他异常交给全局处理或返回 500
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
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
