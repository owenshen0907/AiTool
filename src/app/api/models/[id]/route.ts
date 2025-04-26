import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';

/* PUT /api/models/:id  —— 更新模型 */
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    const body = await req.json();
    const { userId } = body;
    if (!userId) {
        return NextResponse.json({ error: 'missing userId' }, { status: 400 });
    }

    await sql`
        UPDATE models SET
                          name        = COALESCE(${body.name},        name),
                          url         = COALESCE(${body.url},         url),
                          api_key     = COALESCE(${body.apiKey},      api_key),
                          is_default  = COALESCE(${body.isDefault},   is_default),
                          supplier    = COALESCE(${body.supplier},    supplier),
                          model_type  = COALESCE(${body.modelType},   model_type),
                          notes       = COALESCE(${body.notes},       notes),
                          passed_test = COALESCE(${body.passedTest},  passed_test),
                          updated_at  = NOW()
        WHERE id = ${params.id} AND user_id = ${userId}
    `;
    return NextResponse.json({ ok: true });
}

/* DELETE /api/models/:id?userId=xxx  —— 删除模型 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
        return NextResponse.json({ error: 'missing userId' }, { status: 400 });
    }

    await sql`
        DELETE FROM models
        WHERE id = ${params.id} AND user_id = ${userId}
    `;
    return NextResponse.json({ ok: true });
}