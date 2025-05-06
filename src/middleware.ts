// File: middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';

export function middleware(request: NextRequest) {
    const { hostname, pathname } = request.nextUrl;

    // 1) 登录域名完全放行
    const loginHost = process.env.NEXT_PUBLIC_LOGIN_URL!
        .replace(/^https?:\/\//, '');
    if (hostname === loginHost) {
        return NextResponse.next();
    }

    // 2) 主站静态资源、回调、登出、聊天转发都放行
    if (
        pathname === '/' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/public') ||
        pathname.startsWith('/api/auth/callback') ||
        pathname === '/api/auth/logout' ||
        pathname === '/api/chat' // 关键：放行 /api/chat，才能让客户端带上 Cookie 并命中路由
    ) {
        return NextResponse.next();
    }

    // 3) 其余路径检查 sessionToken
    const token = request.cookies.get('sessionToken')?.value;
    if (token) {
        try {
            // 简易解码 JWT payload
            const [, payloadB64] = token.split('.');
            const payloadJson = atob(
                payloadB64.replace(/-/g, '+').replace(/_/g, '/')
            );
            const { sub, username } = JSON.parse(payloadJson);
            const userId = sub || username;
            if (userId) {
                const headers = new Headers(request.headers);
                headers.set('x-user-id', userId);
                return NextResponse.next({ request: { headers } });
            }
        } catch (_e) {
            // 解码失败 = 当作未登录
        }
    }

    // 4) 无登录跳转到 Casdoor
    const loginUrl = new URL(
        `${process.env.NEXT_PUBLIC_LOGIN_URL}/login/oauth/authorize`
    );
    loginUrl.searchParams.set('client_id',    CASDOOR_CONFIG.clientId);
    loginUrl.searchParams.set('response_type','code');
    loginUrl.searchParams.set('redirect_uri', CASDOOR_CONFIG.redirectUri);
    loginUrl.searchParams.set('scope',        'read');
    loginUrl.searchParams.set('state',        'casdoor');

    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: '/:path*',
};