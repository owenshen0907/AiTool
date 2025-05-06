// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';

export function middleware(request: NextRequest) {
    const { hostname, pathname } = request.nextUrl;

    // 1) 登录子域不做鉴权，全部放行
    const loginHost = process.env.NEXT_PUBLIC_LOGIN_URL!.replace(/^https?:\/\//, '');
    if (hostname === loginHost) {
        return NextResponse.next();
    }

    // 2) 放行主站静态资源、回调、登出
    if (
        pathname === '/' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/public') ||
        pathname.startsWith('/api/auth/callback') ||
        pathname === '/api/auth/logout'
    ) {
        return NextResponse.next();
    }

    // 3) 对所有其余 /api 路由进行 JWT 解码 & 注入 x-user-id
    if (pathname.startsWith('/api/')) {
        const token = request.cookies.get('sessionToken')?.value;
        if (token) {
            try {
                const [, payloadB64] = token.split('.');
                const payloadJson = decodeURIComponent(
                    atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
                        .split('')
                        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                        .join('')
                );
                const { sub: userId, username } = JSON.parse(payloadJson) as any;
                const headers = new Headers(request.headers);
                headers.set('x-user-id', userId || username);
                return NextResponse.next({ request: { headers } });
            } catch {
                // 解码失败，跳登录
            }
        }
        // 未登录或 token 无效 ⇒ 跳转到 Casdoor 登录
        const loginUrl = new URL(`${process.env.NEXT_PUBLIC_LOGIN_URL}/login/oauth/authorize`);
        loginUrl.searchParams.set('client_id',     CASDOOR_CONFIG.clientId);
        loginUrl.searchParams.set('response_type', 'code');
        loginUrl.searchParams.set('redirect_uri',  CASDOOR_CONFIG.redirectUri);
        loginUrl.searchParams.set('scope',         'read');
        loginUrl.searchParams.set('state',         'casdoor');
        return NextResponse.redirect(loginUrl);
    }

    // 4) 其余页面也做同样鉴权（可选，可直接返回 NextResponse.next()）
    return NextResponse.next();
}

export const config = {
    matcher: '/:path*',
};