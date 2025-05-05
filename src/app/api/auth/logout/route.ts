// File: src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    // 直接用相对根路径，不再构造绝对 URL
    // ✅ 使用 request 的 origin 构造完整 URL
    const origin = request.nextUrl.origin;
    const homeUrl = new URL(origin); // 即根目录 "/"

    const res = NextResponse.redirect(homeUrl);
    // 清除 Cookie
    res.cookies.set('sessionToken', '', {
        httpOnly: true,
        secure:   true,
        path:     '/',
        maxAge:   0,
    })
    res.cookies.set('userId', '', {
        httpOnly: true,
        secure:   true,
        path:     '/',
        maxAge:   0,
    })

    return res
}