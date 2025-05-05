// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    console.log("Middleware 被调用，当前路径：", path);

    // 放行静态资源和登录回调
    if (
        path === '/' ||
        path.startsWith('/_next') ||
        path.startsWith('/favicon.ico') ||
        path.startsWith('/public') ||
        path.startsWith('/api/auth/callback')
    ) {
        return NextResponse.next();
    }

    // 读取 cookie 里的 sessionToken
    const token = request.cookies.get('sessionToken')?.value;
    if (token) {
        try {
            // edge 环境下简易解码 JWT Payload
            const [, payloadB64] = token.split('.');
            const payloadJson = decodeURIComponent(
                atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
                    .split('')
                    .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                    .join('')
            );
            const payload = JSON.parse(payloadJson);
            const userId = payload.sub || payload.username;

            // 注入 x-user-id 到请求头
            const headers = new Headers(request.headers);
            headers.set('x-user-id', userId);

            return NextResponse.next({
                request: { headers }
            });
        } catch (e) {
            console.error('JWT 解码失败', e);
        }
    }

    // 如果没登录就跳转到 Casdoor
    const loginUrl = new URL(`${CASDOOR_CONFIG.endpoint}/login/oauth/authorize`);
    loginUrl.searchParams.set('client_id', CASDOOR_CONFIG.clientId);
    loginUrl.searchParams.set('response_type', 'code');
    loginUrl.searchParams.set('redirect_uri', CASDOOR_CONFIG.redirectUri);
    loginUrl.searchParams.set('scope', 'read');
    loginUrl.searchParams.set('state', 'casdoor');
    loginUrl.searchParams.set('app_name', CASDOOR_CONFIG.appName);
    loginUrl.searchParams.set('org_name', CASDOOR_CONFIG.orgName);
    console.log("Redirecting to login: ", loginUrl.toString());
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: '/:path*',
};