// src/app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';
import { buildLoginModalHomePath, normalizeLoginNext } from '@/lib/auth/loginModal';
import {
    fetchCasdoorAccount,
    setAuthCookies,
    syncCasdoorAccount,
} from '@/lib/auth/casdoorServer';

export async function GET(request: NextRequest) {
    const redirectUri = `${request.nextUrl.origin}/api/auth/callback`;
    const postLoginRedirect = normalizeLoginNext(
        request.cookies.get('postLoginRedirect')?.value
    );
    const redirectToLoginModal = () => {
        const response = NextResponse.redirect(
            new URL(buildLoginModalHomePath(postLoginRedirect), request.nextUrl.origin)
        );
        response.cookies.set('postLoginRedirect', '', { maxAge: 0, path: '/' });
        return response;
    };

    // 1. 拿 code
    const code = request.nextUrl.searchParams.get('code');
    if (!code) return redirectToLoginModal();

    // 2. 换 token
    const tokenRes = await fetch(
        `${CASDOOR_CONFIG.endpoint}/api/login/oauth/access_token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id:     CASDOOR_CONFIG.clientId,
                ...(CASDOOR_CONFIG.clientSecret
                    ? { client_secret: CASDOOR_CONFIG.clientSecret }
                    : {}),
                code,
                redirect_uri:  redirectUri,
                grant_type:    'authorization_code',
            }),
        }
    );
    if (!tokenRes.ok) {
        console.error('Token 交换失败', await tokenRes.text());
        return redirectToLoginModal();
    }
    const { access_token: accessToken } = await tokenRes.json();

    // 3. 拉用户
    let accountData;
    try {
        accountData = await fetchCasdoorAccount(accessToken);
        await syncCasdoorAccount(accountData);
    } catch (error) {
        console.error('获取账户失败', error);
        return redirectToLoginModal();
    }
    const userId = accountData.id;

    // 5. 返回一个自定义 HTML，脚本做一次顶层跳转——带上新 Cookie
    const page = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>登录中…</title></head>
<body>
  <script>
    window.location.href = ${JSON.stringify(postLoginRedirect)};
  </script>
</body>
</html>`;

    const res = new NextResponse(page, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
    });
    // 在这里写 Cookie，浏览器会在后续页面导航中带上
    setAuthCookies(res, accessToken, userId);

    return res;
}
