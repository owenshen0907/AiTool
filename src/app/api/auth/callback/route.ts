// src/app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';
import { upsertUser } from '@/lib/repositories/userRepository';

export async function GET(request: NextRequest) {
    // 1. 拿 code
    const code = request.nextUrl.searchParams.get('code');
    if (!code) return NextResponse.redirect('/login');

    // 2. 换 token
    const tokenRes = await fetch(
        `${CASDOOR_CONFIG.endpoint}/api/login/oauth/access_token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id:     CASDOOR_CONFIG.clientId,
                client_secret: CASDOOR_CONFIG.clientSecret,
                code,
                redirect_uri:  CASDOOR_CONFIG.redirectUri,
                grant_type:    'authorization_code',
            }),
        }
    );
    if (!tokenRes.ok) {
        console.error('Token 交换失败', await tokenRes.text());
        return NextResponse.redirect('/login');
    }
    const { access_token: accessToken } = await tokenRes.json();

    // 3. 拉用户
    const accountRes = await fetch(
        `${CASDOOR_CONFIG.endpoint}/api/get-account`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!accountRes.ok) {
        console.error('获取账户失败', await accountRes.text());
        return NextResponse.redirect('/login');
    }
    const accountData = (await accountRes.json()).data;
    const userId      = accountData.id;
    // （可选）同步到你自己的 DB
    try {
        await upsertUser({
            id:           userId,
            nickname:     accountData.displayName || accountData.name,
            email:        accountData.email  || '',
            phone:        accountData.phone  || '',
            wechat:       accountData.wechat || '',
            accountLevel: 1,
        });
    } catch (e) {
        console.error('同步用户失败', e);
    }

    // 4. 写 Cookie
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOpts = {
        httpOnly: true,
        secure:   isProd,
        sameSite: 'lax' as const,
        path:     '/',
        // 生产环境固定写给主域 .owenshen.top，开发时留空（localhost）
        ...(isProd ? { domain: '.owenshen.top' } : {}),
    };

    // 5. 返回一个自定义 HTML，脚本做一次顶层跳转——带上新 Cookie
    const page = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>登录中…</title></head>
<body>
  <script>
    // 请稍候，正在跳回首页…
    window.location.href = '/';
  </script>
</body>
</html>`;

    const res = new NextResponse(page, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
    });
    // 在这里写 Cookie，浏览器会在后续页面导航中带上
    res.cookies.set('sessionToken', accessToken, cookieOpts);
    res.cookies.set('userId',       userId,       cookieOpts);

    return res;
}