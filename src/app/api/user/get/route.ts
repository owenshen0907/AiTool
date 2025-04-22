import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';

export async function GET(request: NextRequest) {
    // 从 Cookie 中获取 access token
    const tokenCookie = request.cookies.get('sessionToken');
    if (!tokenCookie || !tokenCookie.value) {
        return NextResponse.json({ error: '未登录或缺少访问令牌' }, { status: 401 });
    }
    const accessToken = tokenCookie.value;

    try {
        const accountResponse = await fetch(`${CASDOOR_CONFIG.endpoint}/api/get-account`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!accountResponse.ok) {
            return NextResponse.json({ error: '获取账户信息失败' }, { status: accountResponse.status });
        }

        const accountData = await accountResponse.json();
        return NextResponse.json({ user: accountData });
    } catch (error) {
        console.error('查询 Casdoor 用户信息出错：', error);
        return NextResponse.json({ error: '服务器错误' }, { status: 500 });
    }
}