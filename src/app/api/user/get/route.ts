// src/app/api/user/get/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';

export async function GET(request: NextRequest) {
    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
        return NextResponse.json({ loggedIn: false }, { status: 200 });
    }

    try {
        const resp = await fetch(
            `${CASDOOR_CONFIG.endpoint}/api/get-account`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // 401/403 当匿名
        if (resp.status === 401 || resp.status === 403) {
            return NextResponse.json({ loggedIn: false }, { status: 200 });
        }
        if (!resp.ok) {
            console.error('get-account error:', await resp.text());
            return NextResponse.json({ loggedIn: false }, { status: 200 });
        }

        // 取出真正的 user 对象
        const { data: user } = await resp.json();
        return NextResponse.json({ loggedIn: true, user }, { status: 200 });
    } catch (err) {
        console.error('user/get 出错:', err);
        return NextResponse.json({ loggedIn: false }, { status: 200 });
    }
}