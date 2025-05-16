// src/lib/utils/safeFetch.ts
const LOGIN_CONFIRM = (next: string) =>
    `/login-confirm?next=${encodeURIComponent(next)}`;

export async function safeFetch(
    input: RequestInfo | URL,
    init: RequestInit = {}
) {
    const res = await fetch(input, { credentials: 'include', ...init });

    if (res.redirected || res.status === 401) {
        window.location.href = LOGIN_CONFIRM(window.location.pathname);
        // 返回永不 resolve 的 Promise，阻止后续代码运行
        return new Promise<Response>(() => {});
    }

    return res;
}