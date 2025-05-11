// ================================
// File: src/app/api/prompt/case/list/route.ts
// -------------------------------------------
// Next.js Route Handler (App Router)
// ✅ 权限校验：使用 withUser(userId)
// ✅ 功能：CRUD + 排序
// ================================
import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import { promptCaseService as svc } from '@/lib/services/promptCaseListService';

/**
 * GET ?content_id=xxx           → list all CaseList in a content
 * GET ?id=xxx                   → get single CaseList
 */
export const GET = withUser(async (req: NextRequest, userId: string) => {
    const sp = new URL(req.url).searchParams;
    const contentId = sp.get('content_id');
    const id = sp.get('id');

    if (id) {
        // TODO: 权限校验 id 属于 userId
        const list = await svc.list(contentId || ''); // need retrieval by id; not implemented
        const item = list.find(i => i.id === id);
        if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(item);
    }
    if (contentId) {
        const all = await svc.list(contentId);
        return NextResponse.json(all);
    }
    return NextResponse.json({ error: 'content_id or id required' }, { status: 400 });
});

/**
 * POST 新建 CaseList
 * body: { case_content_id, seq, case_text?, ground_truth }
 */
export const POST = withUser(async (req: NextRequest, userId: string) => {
    const { case_content_id, seq, case_text, ground_truth } = await req.json();
    if (!case_content_id || seq == null || !ground_truth)
        return NextResponse.json({ error: 'case_content_id, seq, ground_truth required' }, { status: 400 });
    const created = await svc.create({ caseContentId: case_content_id, seq, caseText: case_text, groundTruth: ground_truth });
    return NextResponse.json(created, { status: 201 });
});

/**
 * PUT 完整更新
 */
export const PUT = withUser(async (req: NextRequest) => {
    const { id, ...patch } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await svc.update(id, patch);
    return NextResponse.json({ success: true });
});

/**
 * DELETE ?id=xxx
 */
export const DELETE = withUser(async (req: NextRequest) => {
    const sp = new URL(req.url).searchParams;
    const id = sp.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await svc.delete(id);
    return NextResponse.json({ success: true });
});

/**
 * PATCH 排序
 * body: { content_id, ordered_ids: [] }
 */
export const PATCH = withUser(async (req: NextRequest) => {
    const { content_id, ordered_ids } = await req.json();
    if (!content_id || !Array.isArray(ordered_ids))
        return NextResponse.json({ error: 'content_id & ordered_ids required' }, { status: 400 });
    await svc.reorder(content_id, ordered_ids);
    return NextResponse.json({ success: true });
});
