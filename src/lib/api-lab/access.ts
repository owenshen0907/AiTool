import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import { fetchCasdoorAccount } from '@/lib/auth/casdoorServer';

const API_LAB_ALLOWED_ACCOUNT_NAMES = new Set(['owenshen']);

export function isApiLabOwnerAccount(name: string | null | undefined): boolean {
    return Boolean(name && API_LAB_ALLOWED_ACCOUNT_NAMES.has(name.toLowerCase()));
}

export async function getApiLabAccountNameByToken(
    sessionToken: string | null | undefined,
): Promise<string | null> {
    if (!sessionToken) {
        return null;
    }

    try {
        const account = await fetchCasdoorAccount(sessionToken);
        return account.name || null;
    } catch (error) {
        console.warn('API Lab access check failed', error);
        return null;
    }
}

export function withApiLabUser<TRest extends any[] = []>(
    handler: (req: NextRequest, userId: string, ...rest: TRest) => Promise<NextResponse>,
) {
    return withUser(async (req: NextRequest, userId: string, ...rest: TRest) => {
        const accountName = await getApiLabAccountNameByToken(
            req.cookies.get('sessionToken')?.value ?? null,
        );

        if (!isApiLabOwnerAccount(accountName)) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        return handler(req, userId, ...rest);
    });
}
