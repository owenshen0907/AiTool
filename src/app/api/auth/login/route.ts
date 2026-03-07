import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CASDOOR_CONFIG } from '@/config';
import { normalizeLoginNext } from '@/lib/auth/loginModal';

export async function GET(request: NextRequest) {
    const next = normalizeLoginNext(request.nextUrl.searchParams.get('next'));
    const loginUrl = new URL(
        `${process.env.NEXT_PUBLIC_LOGIN_URL}/login/oauth/authorize`
    );

    loginUrl.searchParams.set('client_id', CASDOOR_CONFIG.clientId);
    loginUrl.searchParams.set('response_type', 'code');
    loginUrl.searchParams.set(
        'redirect_uri',
        `${request.nextUrl.origin}/api/auth/callback`
    );
    loginUrl.searchParams.set('scope', 'read');
    loginUrl.searchParams.set('state', 'casdoor');
    loginUrl.searchParams.set('next', next);

    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('postLoginRedirect', next, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 10,
    });

    return response;
}
