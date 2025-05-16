// File: middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/* ────────────────────────────── 工具函数 ────────────────────────────── */
function decodeJwtPayload(token: string) {
    const [, b64] = token.split('.');
    const json = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
}

function isExpired(payload: any) {
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
}

/* ────────────────────────────── 中间件主体 ────────────────────────────── */
export function middleware(request: NextRequest) {
    const { pathname, origin, hostname } = request.nextUrl;

    /* 0️⃣ 放行  ── 登录域名（Casdoor 自己的页面） */
    const loginHost = process.env.NEXT_PUBLIC_LOGIN_URL!.replace(/^https?:\/\//, '');
    if (hostname === loginHost) return NextResponse.next();

    /* 1️⃣ 放行  ── 认证相关 API、静态资源、公开页面 */
    if (
        pathname.startsWith('/api/auth/') ||               // Casdoor callback & logout
        pathname === '/' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/public') ||
        pathname.startsWith('/login-confirm')              // 新增：确认页本身也要放行
    ) {
        return NextResponse.next();
    }

    /* 2️⃣ 鉴权检查 ── 读取 Cookie 中的 sessionToken */
    const token = request.cookies.get('sessionToken')?.value;
    if (token) {
        try {
            const payload = decodeJwtPayload(token);
            if (!isExpired(payload)) {
                const userId = payload.sub ?? payload.username;
                if (userId) {
                    const headers = new Headers(request.headers);
                    headers.set('x-user-id', userId);
                    return NextResponse.next({ request: { headers } });
                }
            }
        } catch {
            /* 解析失败视为未登录，继续下面逻辑 */
        }
    }

    /* 3️⃣ 未登录 ── 跳转到 /login-confirm?next=<原始路径> */
    const confirmUrl = new URL('/login-confirm', origin);
    confirmUrl.searchParams.set('next', pathname);

    // 同时把失效 token 清掉，避免死循环
    const res = NextResponse.redirect(confirmUrl);
    res.cookies.set('sessionToken', '', { maxAge: 0, path: '/' });
    return res;
}

/* 全站匹配 */
export const config = {
    matcher: '/:path*',
};