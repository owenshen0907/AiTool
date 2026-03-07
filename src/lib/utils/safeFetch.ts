// src/lib/utils/safeFetch.ts
import { buildLoginModalPath } from '@/lib/auth/loginModal';

export async function safeFetch(
    input: RequestInfo | URL,
    init: RequestInit = {}
) {
    const res = await fetch(input, { credentials: 'include', ...init });

    if (res.redirected || res.status === 401) {
        window.location.href = buildLoginModalPath(
            window.location.pathname,
            window.location.search
        );
        // 返回永不 resolve 的 Promise，阻止后续代码运行
        return new Promise<Response>(() => {});
    }

    return res;
}
