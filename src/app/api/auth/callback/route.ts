import { NextResponse } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';
import { Client } from 'pg';

export async function GET(request: Request) {
    // 从回调 URL 中提取参数
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    console.log('接收到回调参数：', { code, state });

    if (!code) {
        console.error('回调中未找到 code 参数，重定向至登录页');
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // 构造向 Casdoor 交换 access_token 的请求体
        const tokenRequestBody = {
            client_id: CASDOOR_CONFIG.clientId,
            client_secret: CASDOOR_CONFIG.clientSecret,
            code,
            redirect_uri: CASDOOR_CONFIG.redirectUri,
            grant_type: 'authorization_code'
        };
        console.log('准备请求 access_token，请求体：', tokenRequestBody);

        const tokenResponse = await fetch(`${CASDOOR_CONFIG.endpoint}/api/login/oauth/access_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tokenRequestBody)
        });

        const tokenRawText = await tokenResponse.text();
        console.log('交换 token 原始响应：', tokenRawText);

        if (!tokenResponse.ok) {
            console.error('Token 交换失败');
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const tokenData = JSON.parse(tokenRawText);
        console.log('解析后的 token 数据：', tokenData);

        const accessToken = tokenData.access_token;
        if (!accessToken) {
            console.error('未收到 access_token，返回的数据：', tokenData);
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // 使用 access_token 获取账户信息（完整用户对象）
        const accountResponse = await fetch(`${CASDOOR_CONFIG.endpoint}/api/get-account`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const accountRawText = await accountResponse.text();
        console.log('获取账户信息原始响应：', accountRawText);

        if (!accountResponse.ok) {
            console.error('获取账户信息失败');
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const accountData = JSON.parse(accountRawText);
        console.log('获取到的账户数据：', accountData);

        // 假设账户信息在 accountData.data 中
        const userInfo = accountData.data;
        if (!userInfo || !userInfo.name) {
            console.error('账户数据格式异常：', accountData);
            return NextResponse.redirect(new URL('/login', request.url));
        }
        // 根据要求：data.name 对应 user_id，data.displayName 对应 nickname，email、phone、wechat 对应各自字段
        const userId = userInfo.name;
        const nickname = userInfo.displayName || userInfo.name;
        const email = userInfo.email || "";
        const phone = userInfo.phone || "";
        const wechat = userInfo.wechat || "";
        const accountLevel = 1; // 根据实际情况设置

        // 同步用户信息到数据库
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
        });
        try {
            await client.connect();
            const upsertQuery = `
                INSERT INTO user_info (user_id, nickname, phone, email, wechat, account_level)
                VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (user_id) DO NOTHING;
            `;
            await client.query(upsertQuery, [userId, nickname, phone, email, wechat, accountLevel]);
            console.log('用户信息已同步到数据库。');
        } catch (dbError) {
            console.error('同步用户数据出错：', dbError);
        } finally {
            await client.end();
        }

        const headers = request.headers;
        const host = headers.get('x-forwarded-host') || headers.get('host');
        const protocol = headers.get('x-forwarded-proto') || 'http';
        // 暂时强制http，等后面申请好证书再换https
        // const protocol = 'http'
        console.log('⚠️ redirect protocol resolved as:', protocol);

        const redirectUrl = `${protocol}://${host}/`;

        const response = NextResponse.redirect(redirectUrl);
        response.cookies.set('sessionToken', accessToken, { httpOnly: true, secure: true });
        response.cookies.set('userId', userId, { httpOnly: true, secure: true });
        console.log('登录成功，已设置 Cookie，重定向到首页：', redirectUrl);
        return response;
    } catch (error) {
        console.error('认证回调过程中出现错误：', error);
        return NextResponse.redirect(new URL('/login', request.url));
    }
}