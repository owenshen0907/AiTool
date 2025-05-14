// app/api/suppliers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import {
    getSuppliersByUser,
    createSupplier,
    updateSupplier,
} from '@/lib/repositories/supplierRepository';

/** GET /api/suppliers */
export const GET = withUser(async (req: NextRequest, userId: string) => {
    const suppliers = await getSuppliersByUser(userId);
    return NextResponse.json(suppliers);
});

/** POST /api/suppliers */
export const POST = withUser(async (req: NextRequest, userId: string) => {
    const {
        name,
        abbreviation,
        api_key,
        api_url,
        wssurl,        // 新增：前端传递的 WebSocket URL
        is_default
    } = await req.json();

    if (!name || !abbreviation || !api_key || !api_url) {
        return new NextResponse('Missing required fields', { status: 400 });
    }

    const supplier = await createSupplier({
        name,
        abbreviation,
        apiKey: api_key,
        apiUrl: api_url,
        wssUrl: wssurl,               // 将 wssurl 传给 repository
        userId,
        isDefault: Boolean(is_default),
    });

    return NextResponse.json(supplier, { status: 201 });
});

/** PATCH /api/suppliers */
export const PATCH = withUser(async (req: NextRequest, userId: string) => {
    const body = await req.json();
    const {
        id,
        name,
        abbreviation,
        api_key,
        api_url,
        wssurl,        // 新增：允许更新 WebSocket URL
        is_default
    } = body;

    if (!id) {
        return new NextResponse('Missing supplier id', { status: 400 });
    }

    const updated = await updateSupplier(
        id,
        {
            name,
            abbreviation,
            apiKey: api_key,
            apiUrl: api_url,
            wssUrl: wssurl,                   // 将 wssurl 传给 repository
            isDefault: is_default === undefined
                ? undefined
                : Boolean(is_default),
        },
        userId
    );

    if (!updated) {
        return new NextResponse('Not found or forbidden', { status: 404 });
    }

    return NextResponse.json(updated);
});