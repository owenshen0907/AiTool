import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    console.log("Middleware 被调用，当前路径：", path);

    // 如果请求的是首页，则直接放行
    if (path === '/'  ||
        path.startsWith('/_next') ||
        path.startsWith('/favicon.ico') ||
        path.startsWith('/static')) {
        return NextResponse.next();
    }

    // 排除登录回调接口
    if (path.startsWith('/api/auth/callback')) {
        return NextResponse.next();
    }

    // 检查 sessionToken Cookie 是否存在
    const token = request.cookies.get('sessionToken');
    if (!token) {
        const loginUrl = new URL(`${CASDOOR_CONFIG.endpoint}/login/oauth/authorize`);
        loginUrl.searchParams.set('client_id', CASDOOR_CONFIG.clientId);
        loginUrl.searchParams.set('response_type', 'code'); // 授权码模式
        loginUrl.searchParams.set('redirect_uri', CASDOOR_CONFIG.redirectUri);
        loginUrl.searchParams.set('scope', 'read');          // 根据需要设置 scope
        loginUrl.searchParams.set('state', 'casdoor');         // 自定义 state 值
        loginUrl.searchParams.set('app_name', CASDOOR_CONFIG.appName);
        loginUrl.searchParams.set('org_name', CASDOOR_CONFIG.orgName);
        console.log("Redirecting to login: ", loginUrl.toString());
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/:path*',
};