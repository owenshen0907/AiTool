// public/fetchPatch.js
(() => {
    if (typeof window === 'undefined') return;
    if (window.__FETCH_PATCHED__) return;
    window.__FETCH_PATCHED__ = true;

    const LOGIN_URL =
        'https://login.owenshen.top/login/oauth/authorize' +
        '?client_id=bebdd6aebe8d08bba1a1' +
        '&response_type=code' +
        '&redirect_uri=https://owenshen.top/api/auth/callback' +
        '&scope=read' +
        '&state=casdoor';

    // 保留原生 fetch
    const nativeFetch = window.fetch.bind(window);

    function shouldRedirect(res) {
        return res.redirected || res.status === 401;
    }

    window.fetch = async (input, init = {}) => {
        // 取请求的字符串形式（cover String 和 Request 两种）
        const requestUrl = typeof input === 'string' ? input : input.url;
        const origin = window.location.origin;

        // ── 绕过你项目里的所有 /api/** 调用 ──d
        // if (
        //     requestUrl.startsWith('/api/') ||
        //     requestUrl.startsWith(origin + '/api/')
        // ) {
        //     return nativeFetch(input, {
        //         credentials: 'include',
        //         ...init,
        //     });
        // }

        // ── 其余请求继续原来的拦截/跳转逻辑 ──
        const res = await nativeFetch(input, {
            // credentials: 'include',
            ...init,
        });
        if (shouldRedirect(res)) {
            const next = window.location.pathname + window.location.search;
            window.location.href = `/login-confirm?next=${encodeURIComponent(next)}`;
            return new Promise(() => {}); // 永不 resolve
        }
        return res;
    };
})();