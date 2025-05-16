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

    const nativeFetch = window.fetch.bind(window);

    function shouldRedirect(res) {
        return res.redirected || res.status === 401;
    }

    window.fetch = async (input, init = {}) => {
        const res = await nativeFetch(input, {
            credentials: 'include',
            ...init,
        });
        if (shouldRedirect(res)) {
            const next = window.location.pathname + window.location.search;
            window.location.href = `/login-confirm?next=${encodeURIComponent(next)}`;

            return new Promise(() => {});          // 永不 resolve
        }
        return res;
    };
})();