import { NextResponse } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';
import { upsertUser } from '@/lib/repositories/userRepository';

export interface CasdoorAccount {
    id: string;
    name: string;
    displayName?: string;
    email?: string;
    phone?: string;
    wechat?: string;
}

const isProd = process.env.NODE_ENV === 'production';
const hasCasdoorClientSecret = Boolean(CASDOOR_CONFIG.clientSecret);

function withClientSecret(params: URLSearchParams) {
    if (hasCasdoorClientSecret) {
        params.set('client_secret', CASDOOR_CONFIG.clientSecret);
    }
}

function withClientSecretQuery(url: URL) {
    if (hasCasdoorClientSecret) {
        url.searchParams.set('clientSecret', CASDOOR_CONFIG.clientSecret);
    }
}

function requireClientSecret(action: string) {
    if (!hasCasdoorClientSecret) {
        throw new Error(`Casdoor client secret 未配置，暂时无法${action}`);
    }
}

function getAuthCookieOptions() {
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax' as const,
        path: '/',
        ...(isProd ? { domain: '.owenshen.top' } : {}),
    };
}

async function readJsonSafely<T>(response: Response): Promise<T | null> {
    try {
        return (await response.json()) as T;
    } catch {
        return null;
    }
}

async function getErrorMessage(response: Response, fallback: string) {
    const payload = await readJsonSafely<any>(response);
    if (payload?.error_description) return payload.error_description as string;
    if (payload?.msg) return payload.msg as string;

    try {
        const text = await response.text();
        return text || fallback;
    } catch {
        return fallback;
    }
}

export function clearAuthCookies(response: NextResponse) {
    const cookieOptions = {
        ...getAuthCookieOptions(),
        maxAge: 0,
    } as const;

    response.cookies.set('sessionToken', '', cookieOptions);
    response.cookies.set('userId', '', cookieOptions);
    response.cookies.set('postLoginRedirect', '', { maxAge: 0, path: '/' });
}

export function setAuthCookies(response: NextResponse, accessToken: string, userId: string) {
    const cookieOptions = getAuthCookieOptions();
    response.cookies.set('sessionToken', accessToken, cookieOptions);
    response.cookies.set('userId', userId, cookieOptions);
    response.cookies.set('postLoginRedirect', '', { maxAge: 0, path: '/' });
}

export async function fetchCasdoorAccount(accessToken: string): Promise<CasdoorAccount> {
    const response = await fetch(`${CASDOOR_CONFIG.endpoint}/api/get-account`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, '获取 Casdoor 账户信息失败'));
    }

    const payload = await response.json();
    const account = payload?.data as CasdoorAccount | undefined;
    if (!account?.id) {
        throw new Error('Casdoor 账户信息不完整');
    }

    return account;
}

export async function syncCasdoorAccount(account: CasdoorAccount) {
    await upsertUser({
        id: account.id,
        nickname: account.displayName || account.name,
        email: account.email || '',
        phone: account.phone || '',
        wechat: account.wechat || '',
        accountLevel: 1,
    });
}

export async function exchangePasswordForAccessToken(loginId: string, password: string) {
    const body = new URLSearchParams({
        grant_type: 'password',
        client_id: CASDOOR_CONFIG.clientId,
        username: loginId,
        password,
        scope: 'read',
    });
    withClientSecret(body);

    const response = await fetch(`${CASDOOR_CONFIG.endpoint}/api/login/oauth/access_token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
        cache: 'no-store',
    });

    if (!response.ok) {
        const payload = await readJsonSafely<any>(response);
        if (payload?.error === 'invalid_grant') {
            throw new Error('邮箱或密码错误');
        }

        throw new Error(
            payload?.error_description || payload?.msg || '邮箱或密码错误'
        );
    }

    const payload = await response.json();
    const accessToken = payload?.access_token as string | undefined;
    if (!accessToken) {
        throw new Error('Casdoor 未返回 access token');
    }

    return accessToken;
}

export async function getUserByEmail(email: string) {
    requireClientSecret('查询 Casdoor 用户');

    const url = new URL(`${CASDOOR_CONFIG.endpoint}/api/get-users`);
    url.searchParams.set('owner', CASDOOR_CONFIG.orgName);
    url.searchParams.set('p', '1');
    url.searchParams.set('pageSize', '1');
    url.searchParams.set('field', 'email');
    url.searchParams.set('value', email);
    url.searchParams.set('clientId', CASDOOR_CONFIG.clientId);
    withClientSecretQuery(url);

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(await getErrorMessage(response, '查询 Casdoor 用户失败'));
    }

    const payload = await response.json();
    const users = Array.isArray(payload?.data) ? payload.data : [];
    return users[0] ?? null;
}

function buildGeneratedUsername() {
    return `user_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export async function createCasdoorUser(email: string, password: string, displayName?: string) {
    requireClientSecret('创建 Casdoor 用户');

    const payload = {
        owner: CASDOOR_CONFIG.orgName,
        name: buildGeneratedUsername(),
        displayName: displayName?.trim() || email.split('@')[0],
        email,
        password,
        signupApplication: CASDOOR_CONFIG.appName,
    };

    const url = new URL(`${CASDOOR_CONFIG.endpoint}/api/add-user`);
    url.searchParams.set('clientId', CASDOOR_CONFIG.clientId);
    withClientSecretQuery(url);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Casdoor 注册失败'));
    }

    const result = await response.json();
    if (result?.status !== 'ok') {
        throw new Error(result?.msg || 'Casdoor 注册失败');
    }

    return payload;
}
