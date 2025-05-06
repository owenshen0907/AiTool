// File: src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const res = NextResponse.redirect('/');
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