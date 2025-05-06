// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    // 优先用环境变量，否则 fallback 到 request.origin
    const origin = process.env.NEXT_PUBLIC_BASE_URL ?? request.nextUrl.origin;
    const homeUrl = new URL('/', origin);

    const res = NextResponse.redirect(homeUrl);
    res.cookies.set('sessionToken', '', { httpOnly: true, secure: true, path: '/', maxAge: 0 });
    res.cookies.set('userId', '',       { httpOnly: true, secure: true, path: '/', maxAge: 0 });
    return res;
}