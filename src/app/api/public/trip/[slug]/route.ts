import { NextRequest, NextResponse } from 'next/server';
import { getTripSnapshot } from '@/lib/trip/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readToken(req: NextRequest) {
    return req.headers.get('x-trip-token') || req.nextUrl.searchParams.get('token') || '';
}

export async function GET(
    req: NextRequest,
    { params }: { params: { slug: string } }
) {
    const snapshot = await getTripSnapshot(params.slug, readToken(req));
    if (!snapshot) {
        return NextResponse.json({ error: '无效链接或 token 失效' }, { status: 401 });
    }

    return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'no-store' } });
}
