'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { CASDOOR_CONFIG } from '@/config';

export default function LoginConfirm() {
    const params   = useSearchParams();
    const nextUrl  = params?.get('next') ?? '/';

    /* 组装 Casdoor 登录 URL */
    const loginUrl = new URL(
        `${process.env.NEXT_PUBLIC_LOGIN_URL}/login/oauth/authorize`
    );
    loginUrl.searchParams.set('client_id',     CASDOOR_CONFIG.clientId);
    loginUrl.searchParams.set('response_type', 'code');
    loginUrl.searchParams.set('redirect_uri',  CASDOOR_CONFIG.redirectUri);
    loginUrl.searchParams.set('scope',         'read');
    loginUrl.searchParams.set('state',         'casdoor');
    loginUrl.searchParams.set('next',          nextUrl);   // 把原目标透传
    const loginHref = loginUrl.toString();                 // ← 转成字符串

    const router = useRouter();

    return (
        <main className="min-h-screen flex flex-col items-center justify-center gap-6">
            <h1 className="text-2xl font-semibold">需要登录</h1>
            <p>您正在访问的功能需要先登录。</p>

            <div className="flex gap-4">
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    /* loginHref 是 string，不再触发 TS2322 */
                    onClick={() => (window.location.href = loginHref)}
                >
                    去登录
                </button>

                <button
                    className="px-4 py-2 border rounded"
                    onClick={() => router.replace('/')}
                >
                    先逛首页
                </button>
            </div>
        </main>
    );
}