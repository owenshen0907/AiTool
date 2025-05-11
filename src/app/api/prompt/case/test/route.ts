// src/app/api/prompt/case/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import { promptTestService as svc } from '@/lib/services/promptTestDetailService';

/* GET  /api/prompt/case/test?case_list_id=xxx  → 查询测试明细 */
export const GET = withUser(async (req: NextRequest) => {
    const caseListId = new URL(req.url).searchParams.get('case_list_id');
    if (!caseListId)
        return NextResponse.json({ error: 'case_list_id required' }, { status: 400 });

    const list = await svc.list(caseListId);
    return NextResponse.json(list);
});

/* POST /api/prompt/case/test  → 新增测试明细 */
export const POST = withUser(async (req: NextRequest) => {
    const { case_list_id, model_name, test_result, passed, reason, trace_id } =
        await req.json();

    if (!case_list_id || !model_name || test_result == null || passed == null || !trace_id) {
        return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const created = await svc.create({
        caseListId: case_list_id,
        modelName: model_name,
        testResult: test_result,
        passed,
        reason,
        traceId: trace_id,
    });
    return NextResponse.json(created, { status: 201 });
});

/* DELETE /api/prompt/case/test?id=xxx  → 删除测试明细 */
export const DELETE = withUser(async (req: NextRequest) => {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await svc.delete(id);
    return NextResponse.json({ success: true });
});