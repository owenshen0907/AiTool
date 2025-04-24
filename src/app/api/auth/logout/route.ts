// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    // 构造指向首页的绝对 URL
    const homeUrl = new URL('/', request.url);

    // 清除 Cookie，并重定向到首页
    const res = NextResponse.redirect(homeUrl);
    res.cookies.set('sessionToken', '', {
        httpOnly: true,
        secure:   true,
        path:     '/',
        maxAge:   0,
    });
    res.cookies.set('userId', '', {
        httpOnly: true,
        secure:   true,
        path:     '/',
        maxAge:   0,
    });
    return res;
}