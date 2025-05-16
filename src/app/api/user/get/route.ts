// File: src/app/api/user/get/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';

/**
 * 可匿名获取当前用户信息
 * 未登录时返回 { loggedIn:false }
 */
export async function GET(request: NextRequest) {
    const token = request.cookies.get('sessionToken')?.value;

    // ───────── ① 无 Token：直接返回未登录 ─────────
    if (!token) {
        return NextResponse.json({ loggedIn: false }, { status: 200 });
    }

    // ───────── ② 有 Token：去 Casdoor 验证 ─────────
    try {
        const resp = await fetch(`${CASDOOR_CONFIG.endpoint}/api/get-account`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        // token 失效 / 无效 → 当作未登录
        if (resp.status === 401 || resp.status === 403) {
            return NextResponse.json({ loggedIn: false }, { status: 200 });
        }

        if (!resp.ok) {
            // 其它错误，如 500，直接透传
            return NextResponse.json(
                { error: '获取账户信息失败' },
                { status: resp.status }
            );
        }

        const account = await resp.json();
        return NextResponse.json({ loggedIn: true, user: account }, { status: 200 });
    } catch (err) {
        console.error('查询 Casdoor 用户信息出错:', err);
        return NextResponse.json({ error: '服务器错误' }, { status: 500 });
    }
}