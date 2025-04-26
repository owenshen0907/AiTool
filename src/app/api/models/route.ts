// src/app/api/models/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';
import { sql } from '@/lib/db/client';
import { v4 as uuid } from 'uuid';

// helper: 根据 sessionToken 去 Casdoor 拿 userId
async function getUserIdFromToken(token: string) {
    const res = await fetch(`${CASDOOR_CONFIG.endpoint}/api/get-account`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    return data.id as string;
}

export async function GET(req: NextRequest) {
    const token = req.cookies.get('sessionToken')?.value;
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const userId = await getUserIdFromToken(token);
    if (!userId) return NextResponse.json({ error: '无法获取用户信息' }, { status: 401 });

    const { rows } = await sql`
        SELECT
            id,
            name,
            url,
            api_key      AS "apiKey",
            is_default   AS "isDefault",
            supplier,
            model_type   AS "modelType",
            notes,
            passed_test  AS "passedTest"
        FROM models
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
    return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
    const token = req.cookies.get('sessionToken')?.value;
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const userId = await getUserIdFromToken(token);
    if (!userId) return NextResponse.json({ error: '无法获取用户信息' }, { status: 401 });

    const { name, url, apiKey, isDefault, supplier, modelType, notes } =
        await req.json();

    const id = uuid();
    await sql`
        INSERT INTO models (
            id, name, url, api_key, is_default,
            supplier, model_type, user_id, notes, passed_test
        ) VALUES (
                     ${id}, ${name}, ${url}, ${apiKey}, ${isDefault},
                     ${supplier}, ${modelType}, ${userId}, ${notes ?? null}, false
                 )
    `;
    return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
    const token = req.cookies.get('sessionToken')?.value;
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const userId = await getUserIdFromToken(token);
    if (!userId) return NextResponse.json({ error: '无法获取用户信息' }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少模型 ID' }, { status: 400 });

    await sql`
    DELETE FROM models
    WHERE user_id = ${userId} AND id = ${id}
  `;
    // 这是修改后的关键行，直接返回空 204
    return new NextResponse(null, { status: 204 });
}

export async function PATCH(req: NextRequest) {
    const token = req.cookies.get('sessionToken')?.value;
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const userId = await getUserIdFromToken(token);
    if (!userId) return NextResponse.json({ error: '无法获取用户信息' }, { status: 401 });

    const { id, name, url, apiKey, isDefault, supplier, modelType, notes, passedTest } =
        await req.json();
    if (!id) return NextResponse.json({ error: '缺少模型 ID' }, { status: 400 });

    await sql`
    UPDATE models SET
      name        = ${name},
      url         = ${url},
      api_key     = ${apiKey},
      is_default  = ${isDefault},
      supplier    = ${supplier},
      model_type  = ${modelType},
      notes       = ${notes ?? null},
      passed_test = ${passedTest}
    WHERE user_id = ${userId} AND id = ${id}
  `;
    return NextResponse.json({}, { status: 200 });
}