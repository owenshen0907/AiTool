import { NextRequest, NextResponse } from 'next/server';
import { updateTripItem } from '@/lib/trip/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readToken(req: NextRequest) {
    return req.headers.get('x-trip-token') || '';
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { slug: string; itemId: string } }
) {
    try {
        const body = await req.json();
        const snapshot = await updateTripItem({
            slug: params.slug,
            itemId: params.itemId,
            token: readToken(req),
            note: typeof body?.note === 'string' ? body.note : undefined,
            action: body?.action,
            delayMin: typeof body?.delayMin === 'number' ? body.delayMin : undefined,
        });

        return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        const message = error instanceof Error ? error.message : '更新失败';
        const status = message.includes('权限') ? 403 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}
