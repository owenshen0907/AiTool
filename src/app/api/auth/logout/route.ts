// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(_req: NextRequest) {
    const appBase = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const redirectRes = NextResponse.redirect(appBase + '/');

    /* ───── 清 cookie ───── */
    const isProd  = process.env.NODE_ENV === 'production';
    const cookieOptions = {
        httpOnly : true,
        secure   : isProd,     // 本地开发必须是 false
        path     : '/',        // 和写入时保持一致
        ...(isProd
            ? { domain: '.owenshen.top' }
            : {}),
        maxAge   : 0,
    } as const;

    redirectRes.cookies.set('sessionToken', '', cookieOptions);
    redirectRes.cookies.set('userId',       '', cookieOptions);

    /* 只返回这一个 Response */
    return redirectRes;
}