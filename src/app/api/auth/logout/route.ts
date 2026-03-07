// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clearAuthCookies } from '@/lib/auth/casdoorServer';

export async function GET(req: NextRequest) {
    const appBase = req.nextUrl.origin;
    const redirectRes = NextResponse.redirect(appBase + '/');

    clearAuthCookies(redirectRes);
    return redirectRes;
}
