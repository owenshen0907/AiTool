// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';

export function middleware(request: NextRequest) {
    const { hostname, pathname } = request.nextUrl;

    // 1) 登录域名不做任何校验，全部放行
    if (hostname === process.env.NEXT_PUBLIC_LOGIN_URL!.replace(/^https?:\/\//, '')) {
        return NextResponse.next();
    }

    // 2) 主站的静态资源、登录回调、登出 API 也放行
    if (
        pathname === '/' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/api/auth/callback') ||
        pathname === '/api/auth/logout'
    ) {
        return NextResponse.next();
    }

    // 3) 主站其余路径需要检查 sessionToken
    const token = request.cookies.get('sessionToken')?.value;
    if (token) {
        try {
            // 简易解码 JWT Payload
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
            // 解码失败就当作未登录
        }
    }

    // 4) 无 token，跳转到 Casdoor 登录页（在登录域名下）
    const loginUrl = new URL(`${process.env.NEXT_PUBLIC_LOGIN_URL}/login/oauth/authorize`);
    loginUrl.searchParams.set('client_id',    CASDOOR_CONFIG.clientId);
    loginUrl.searchParams.set('response_type','code');
    loginUrl.searchParams.set('redirect_uri', CASDOOR_CONFIG.redirectUri);
    loginUrl.searchParams.set('scope',        'read');
    loginUrl.searchParams.set('state',        'casdoor');
    // loginUrl.searchParams.set('app_name',     CASDOOR_CONFIG.appName);
    // loginUrl.searchParams.set('org_name',     CASDOOR_CONFIG.orgName);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: '/:path*',
};