import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { normalizeLoginNext } from '@/lib/auth/loginModal';
import {
    exchangePasswordForAccessToken,
    fetchCasdoorAccount,
    setAuthCookies,
    syncCasdoorAccount,
} from '@/lib/auth/casdoorServer';

function badRequest(message: string, status: number = 400) {
    return NextResponse.json({ ok: false, msg: message }, { status });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const rawIdentifier = String(body?.identifier || body?.email || '').trim();
        const identifier = rawIdentifier.includes('@')
            ? rawIdentifier.toLowerCase()
            : rawIdentifier;
        const password = String(body?.password || '');
        const next = normalizeLoginNext(body?.next);

        if (!identifier) return badRequest('请输入邮箱或用户名');
        if (!password) return badRequest('请输入密码');

        const accessToken = await exchangePasswordForAccessToken(identifier, password);
        const account = await fetchCasdoorAccount(accessToken);
        await syncCasdoorAccount(account);

        const response = NextResponse.json({
            ok: true,
            redirectTo: next,
            user: {
                name: account.name,
                displayName: account.displayName || account.name,
            },
        });
        setAuthCookies(response, accessToken, account.id);

        return response;
    } catch (error) {
        const message = error instanceof Error ? error.message : '登录失败';
        return badRequest(message, 401);
    }
}
