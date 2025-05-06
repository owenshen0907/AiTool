// File: src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    // 直接给相对根路径
    const res = NextResponse.redirect('/');
    // 清除登录相关的 Cookie
    res.cookies.set('sessionToken', '', {
        httpOnly: true, secure: true, path: '/', maxAge: 0
    });
    res.cookies.set('userId', '', {
        httpOnly: true, secure: true, path: '/', maxAge: 0
    });
    return res;
}