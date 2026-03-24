import { NextRequest, NextResponse } from 'next/server';
import { uploadTripPhotos } from '@/lib/trip/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readToken(req: NextRequest) {
    return req.headers.get('x-trip-token') || '';
}

export async function POST(
    req: NextRequest,
    { params }: { params: { slug: string; itemId: string } }
) {
    try {
        const form = await req.formData();
        const files = Array.from(form.values()).filter(
            (value): value is File => value instanceof File
        );

        const snapshot = await uploadTripPhotos({
            slug: params.slug,
            itemId: params.itemId,
            token: readToken(req),
            files: files.map((file) => ({
                name: file.name,
                type: file.type,
                arrayBuffer: () => file.arrayBuffer(),
            })),
        });

        return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        const message = error instanceof Error ? error.message : '上传失败';
        const status = message.includes('权限') ? 403 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}
