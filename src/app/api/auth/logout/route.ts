// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    // 一律跳回主站根路径
    const appBase = process.env.NEXT_PUBLIC_APP_URL!;
    const res = NextResponse.redirect(appBase + '/');
    res.cookies.set('sessionToken','',{ httpOnly:true, secure:true, path:'/', maxAge:0 });
    res.cookies.set('userId','',      { httpOnly:true, secure:true, path:'/', maxAge:0 });
    return res;
}