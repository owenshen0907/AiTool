import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://api.stepfun.com';

function getAuthHeader(req: NextRequest) {
    const auth = req.headers.get('authorization');
    return auth && /^Bearer\s.+/i.test(auth) ? auth : null;
}

// GET /api/stepfun/files?purpose=...
export async function GET(req: NextRequest) {
    const auth = getAuthHeader(req);
    if (!auth) {
        return NextResponse.json({ error: 'Missing Authorization: Bearer <API_KEY>' }, { status: 401 });
    }

    const purpose = req.nextUrl.searchParams.get('purpose') ?? '';
    const url = new URL('/v1/files', BASE_URL);
    if (purpose) url.searchParams.set('purpose', purpose);

    const upstream = await fetch(url.toString(), {
        method: 'GET',
        headers: { Authorization: auth },
        cache: 'no-store',
    });

    const text = await upstream.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return new NextResponse(JSON.stringify(data), {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
    });
}

// DELETE /api/stepfun/files  body: { id: string }
export async function DELETE(req: NextRequest) {
    const auth = getAuthHeader(req);
    if (!auth) {
        return NextResponse.json({ error: 'Missing Authorization: Bearer <API_KEY>' }, { status: 401 });
    }

    let payload: { id?: string };
    try { payload = await req.json(); } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const id = payload?.id?.trim();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const upstream = await fetch(`${BASE_URL}/v1/files/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
            Authorization: auth,
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    });

    const text = await upstream.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return new NextResponse(JSON.stringify(data), {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
    });
}