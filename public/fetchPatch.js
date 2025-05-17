// public/fetchPatch.js
(() => {
    if (typeof window === 'undefined') return;
    if (window.__FETCH_PATCHED__) return;
    window.__FETCH_PATCHED__ = true;

    const nativeFetch = window.fetch.bind(window);

    function shouldRedirect(res) {
        return res.redirected || res.status === 401;
    }

    window.fetch = async (input, init = {}) => {
        const requestUrl = typeof input === 'string' ? input : input.url;
        const opts = { ...init };

        // 只有本地 /api/ 接口 或 login 域名，才带上 Cookie
        if (
            requestUrl.startsWith('/api/') ||
            requestUrl.startsWith(window.location.origin + '/api/') ||
            requestUrl.startsWith('https://login.owenshen.top')
        ) {
            opts.credentials = 'include';
        }

        const res = await nativeFetch(input, opts);

        if (shouldRedirect(res)) {
            const next = window.location.pathname + window.location.search;
            window.location.href = `/login-confirm?next=${encodeURIComponent(next)}`;
            return new Promise(() => {}); // 永不 resolve
        }
        return res;
    };
})();