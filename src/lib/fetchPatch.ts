// src/lib/fetchPatch.ts
const LOGIN_URL =
    'https://login.owenshen.top/login/oauth/authorize' +
    '?client_id=bebdd6aebe8d08bba1a1' +
    '&response_type=code' +
    '&redirect_uri=https://owenshen.top/api/auth/callback' +
    '&scope=read' +
    '&state=casdoor';

function shouldRedirect(res: Response) {
    // ① middleware 把请求 302 → Casdoor，fetch “跟随”后 res.redirected = true
    if (res.redirected) return true;
    // ② 后端返回 401（未登录 / token 失效）
    if (res.status === 401) return true;
    return false;
}

// 只 patch 浏览器端；在 SSR / Node 环境保持原样
export function patchFetchOnce() {
    if (typeof window === 'undefined') return;
    if ((window as any).__FETCH_PATCHED__) return;          // 避免重复 patch
    (window as any).__FETCH_PATCHED__ = true;

    const nativeFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
        const res = await nativeFetch(input, {
            ...init,
            credentials: 'include',          // 统一带 cookie
            redirect: 'follow',              // 保持默认
        });

        if (shouldRedirect(res)) {
            window.location.href = LOGIN_URL;
            // 返回一个永不 resolve 的 Promise，阻止后续代码继续执行
            return new Promise<Response>(() => {});
        }

        return res;
    };
}