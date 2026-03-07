import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { normalizeLoginNext } from '@/lib/auth/loginModal';
import {
    createCasdoorUser,
    exchangePasswordForAccessToken,
    fetchCasdoorAccount,
    getUserByEmail,
    setAuthCookies,
    syncCasdoorAccount,
} from '@/lib/auth/casdoorServer';

function badRequest(message: string, status: number = 400) {
    return NextResponse.json({ ok: false, msg: message }, { status });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = String(body?.email || '').trim().toLowerCase();
        const password = String(body?.password || '');
        const confirmPassword = String(body?.confirmPassword || '');
        const displayName = String(body?.displayName || '').trim();
        const next = normalizeLoginNext(body?.next);

        if (!email) return badRequest('请输入邮箱');
        if (!EMAIL_REGEX.test(email)) return badRequest('邮箱格式不正确');
        if (!password) return badRequest('请输入密码');
        if (password.length < 8) return badRequest('密码至少需要 8 位');
        if (password !== confirmPassword) return badRequest('两次输入的密码不一致');

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return badRequest('该邮箱已经注册', 409);
        }

        await createCasdoorUser(email, password, displayName);
        const accessToken = await exchangePasswordForAccessToken(email, password);
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
        const message = error instanceof Error ? error.message : '注册失败';
        return badRequest(message);
    }
}
