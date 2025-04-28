// app/api/suppliers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSuppliersByUser, createSupplier } from '@/lib/repositories/supplierRepository';

/**
 * GET /api/suppliers
 * 返回当前登录用户的 AI 供应商列表
 */
export async function GET(req: NextRequest) {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const suppliers = await getSuppliersByUser(userId);
        return NextResponse.json(suppliers);
    } catch (err) {
        console.error('getSuppliersByUser error', err);
        return new NextResponse('Failed to fetch suppliers', { status: 500 });
    }
}

/**
 * POST /api/suppliers
 * 新增 AI 供应商
 */
export async function POST(req: NextRequest) {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name, abbreviation, api_key, api_url } = await req.json();
    if (!name || !abbreviation || !api_key || !api_url) {
        return new NextResponse('Missing required fields', { status: 400 });
    }

    try {
        const supplier = await createSupplier({
            name,
            abbreviation,
            apiKey: api_key,
            apiUrl: api_url,
            userId
        });
        return NextResponse.json(supplier);
    } catch (err) {
        console.error('createSupplier error', err);
        return new NextResponse('Failed to create supplier', { status: 500 });
    }
}