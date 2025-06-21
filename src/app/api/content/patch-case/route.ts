// File: src/app/api/content/patch-case/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool }     from '@/lib/db/client';
import { withUser } from '@/lib/api/auth';

export const PATCH = withUser(async (req: NextRequest, uid: string) => {
    const { feature, contentId, caseId, patch } = await req.json();

    if (!feature || !contentId || !caseId || !patch) {
        return new NextResponse('Missing fields', { status: 400 });
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(feature)) {
        return new NextResponse('Invalid feature name', { status: 400 });
    }
    const tbl = `${feature}_content`;

    /* ---------- 校验所有权（created_by 而不是 user_id） ---------- */
    const own = await pool.query<{ created_by: string }>(
        `SELECT created_by FROM ${tbl} WHERE id = $1`,
        [contentId],
    );
    if (own.rowCount === 0 || own.rows[0].created_by !== uid) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    /* ---------- 只更新匹配行 ---------- */
    await pool.query(
        `
            UPDATE ${tbl}
            SET body = jsonb_set(                        -- 更新 JSON
                    body::jsonb,                    -- ① text → jsonb
                    '{cases}',
                    (
                        SELECT jsonb_agg(
                                       CASE
                                           WHEN elem->>'id' = $2
                                               THEN elem || $3::jsonb  -- 合并 patch
                                           ELSE elem
                                           END
                               )
                        FROM jsonb_array_elements((body::jsonb)->'cases') AS elem
                    )
                       )::text,                          -- ② jsonb → text
        updated_at = NOW()
            WHERE id = $1
        `,
        [contentId, caseId, JSON.stringify(patch)],
    );

    return NextResponse.json({ ok: true });
});