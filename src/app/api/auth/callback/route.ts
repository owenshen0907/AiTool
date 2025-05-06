// src/app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';
import { upsertUser } from '@/lib/repositories/userRepository';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.redirect('/login');

    // 1. 交换 access_token
    const tokenRes = await fetch(`${CASDOOR_CONFIG.endpoint}/api/login/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id:     CASDOOR_CONFIG.clientId,
            client_secret: CASDOOR_CONFIG.clientSecret,
            code,
            redirect_uri:  CASDOOR_CONFIG.redirectUri,
            grant_type:    'authorization_code',
        }),
    });
    if (!tokenRes.ok) {
        console.error('Token 交换失败', await tokenRes.text());
        return NextResponse.redirect('/login');
    }
    const { access_token: accessToken } = await tokenRes.json();

    // 2. 用 token 获取用户信息
    const accountRes = await fetch(`${CASDOOR_CONFIG.endpoint}/api/get-account`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!accountRes.ok) {
        console.error('获取账户信息失败', await accountRes.text());
        return NextResponse.redirect('/login');
    }
    const accountData = (await accountRes.json()).data;
    const userId      = accountData.id;
    const nickname    = accountData.displayName || accountData.name;
    const email       = accountData.email     || '';
    const phone       = accountData.phone     || '';
    const wechat      = accountData.wechat    || '';
    const accountLevel = 1;

    // 3. 同步到 user_info 表
    try {
        await upsertUser({ id: userId, nickname, email, phone, wechat, accountLevel });
        console.log('用户信息已同步到数据库：', userId);
    } catch (err) {
        console.error('用户同步出错：', err);
    }

    // 4. 设置 Cookie 并跳转到首页
    const response = NextResponse.redirect('/');
    response.cookies.set('sessionToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });
    response.cookies.set('userId', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });
    return response;
}