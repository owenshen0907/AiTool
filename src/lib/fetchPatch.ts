// src/lib/fetchPatch.ts
const LOGIN_URL =
    'https://login.owenshen.top/login/oauth/authorize' +
    '?client_id=bebdd6aebe8d08bba1a1' +
    '&response_type=code' +
    '&redirect_uri=https://owenshen.top/api/auth/callback' +
    '&scope=read' +
    '&state=casdoor';

function shouldRedirect(res: Response) {
    return res.redirected || res.status === 401;
}

// —— 小工具：安全拿到 URL（避免跨 realm 的 instanceof 失效）——
function toUrl(input: RequestInfo | URL): string {
    try {
        if (typeof input === 'string') return input;
        if (input instanceof URL) return input.href;
        // Duck typing：只要像 Request 就取 .url
        if (input && typeof (input as any).url === 'string') return (input as any).url;
    } catch {}
    return '';
}

// —— 仅匹配“同源 /api/*” ——
// 注意：内部所有字符串操作都先把 url 正常化，避免 undefined 触发 startsWith。
function isSameOriginApi(raw: string): boolean {
    try {
        const url = String(raw || '');
        if (!url) return false;
        if (url[0] === '/') return url.startsWith('/api/');
        const u = new URL(url, window.location.origin);
        return u.origin === window.location.origin && u.pathname.startsWith('/api/');
    } catch {
        return false;
    }
}

export function patchFetchOnce() {
    if (typeof window === 'undefined') return;
    const g = window as any;
    if (g.__FETCH_PATCHED__) return;
    g.__FETCH_PATCHED__ = true;

    const nativeFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const DEBUG = localStorage.getItem('FETCH_DEBUG') === '1';

        try {
            const url = toUrl(input);
            if (DEBUG) console.debug('[FETCH_PATCH] input url =', url, 'init =', init);

            // 非 /api/* 的请求一律放行（包括 RSC 预取）
            if (!isSameOriginApi(url)) {
                // @ts-ignore
                return nativeFetch(input, init);
            }

            // 对 API 请求设定更安全的默认值，调用方传了就以调用方为准
            const mergedInit: RequestInit = {
                credentials: init?.credentials ?? 'include',
                redirect: init?.redirect ?? 'follow',
                ...init,
            };

            const res = await nativeFetch(input as any, mergedInit);
            if (DEBUG) console.debug('[FETCH_PATCH] response:', res.status, res.redirected, res.url);

            if (shouldRedirect(res)) {
                if (DEBUG) console.debug('[FETCH_PATCH] redirect to login:', LOGIN_URL);
                // 触发浏览器跳转
                window.location.href = LOGIN_URL;
                // 同时返回一个 401 Response，避免调用方 await 一个永不 resolve 的 Promise
                return new Response(null, { status: 401 });
            }

            return res;
        } catch (err) {
            // 任何我们补丁内部的错误都不应该影响页面
            console.error('[FETCH_PATCH] wrapper error -> fallback to native fetch', err, input, init);
            // @ts-ignore
            return nativeFetch(input, init);
        }
    };
}