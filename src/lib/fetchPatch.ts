// src/lib/fetchPatch.ts
const LOGIN_URL =
    'https://login.owenshen.top/login/oauth/authorize' +
    '?client_id=bebdd6aebe8d08bba1a1' +
    '&response_type=code' +
    '&redirect_uri=https://owenshen.top/api/auth/callback' +
    '&scope=read' +
    '&state=casdoor';

function shouldRedirect(res: Response) {
    // 302 被 middleware 重定向到登录；或 API 返回 401
    if (res.redirected) return true;
    if (res.status === 401) return true;
    return false;
}

// —— 小工具 —— //
function toUrl(input: RequestInfo | URL): string | null {
    try {
        if (typeof input === 'string') return input;
        if (input instanceof URL) return input.href;
        if (input instanceof Request) return input.url;
    } catch {}
    return null;
}

function isSameOriginApi(url: string) {
    try {
        if (!url) return false;
        if (url.startsWith('/')) return url.startsWith('/api/');
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
        const url = toUrl(input);

        if (!url) {
            // 这里就能抓到“input 是 undefined/奇怪对象”的情况
            if (DEBUG) console.warn('[FETCH_PATCH] missing url in fetch input =', input);
            // 交给原生 fetch 处理，避免干扰 Next 内部逻辑
            // @ts-ignore
            return nativeFetch(input, init);
        }

        // 非同源 / 非 /api/*：完全不处理
        if (!isSameOriginApi(url)) {
            // @ts-ignore
            return nativeFetch(input, init);
        }

        // 仅对 /api/* 设定默认 credentials，调用方传了就尊重调用方
        const mergedInit: RequestInit = {
            credentials: init?.credentials ?? 'include',
            redirect: init?.redirect ?? 'follow',
            ...init,
        };

        if (DEBUG) console.debug('[FETCH_PATCH] ->', url, mergedInit);

        const res = await nativeFetch(input as any, mergedInit);

        if (DEBUG) console.debug('[FETCH_PATCH] <-', res.status, res.redirected, res.url);

        if (shouldRedirect(res)) {
            if (DEBUG) console.debug('[FETCH_PATCH] redirect to login:', LOGIN_URL);
            // 触发浏览器跳转
            location.href = LOGIN_URL;
            // 同时返回一个“可读”的响应，避免调用方再去 await 一个永不 resolve 的 Promise
            return new Response(null, { status: 401 });
        }

        return res;
    };
}