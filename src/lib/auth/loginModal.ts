export const LOGIN_MODAL_QUERY_KEY = 'login';
export const LOGIN_MODAL_NEXT_QUERY_KEY = 'loginNext';
export const DEFAULT_POST_LOGIN_PATH = '/workspace';

function toSearchParams(search: string = '') {
    return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
}

export function normalizeLoginNext(
    next: string | null | undefined,
    fallback: string = DEFAULT_POST_LOGIN_PATH
) {
    if (!next) return fallback;
    if (!next.startsWith('/') || next.startsWith('//')) return fallback;
    return next;
}

export function stripLoginModalParams(search: string = '') {
    const params = toSearchParams(search);
    params.delete(LOGIN_MODAL_QUERY_KEY);
    params.delete(LOGIN_MODAL_NEXT_QUERY_KEY);
    return params.toString();
}

export function getCurrentRouteForLogin(pathname: string, search: string = '') {
    const query = stripLoginModalParams(search);
    return normalizeLoginNext(`${pathname}${query ? `?${query}` : ''}`);
}

export function buildLoginModalPath(
    pathname: string,
    search: string = '',
    next?: string | null
) {
    const params = toSearchParams(search);
    params.set(LOGIN_MODAL_QUERY_KEY, '1');
    params.set(
        LOGIN_MODAL_NEXT_QUERY_KEY,
        normalizeLoginNext(next, getCurrentRouteForLogin(pathname, search))
    );

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
}

export function buildLoginModalHomePath(next?: string | null) {
    const params = new URLSearchParams();
    params.set(LOGIN_MODAL_QUERY_KEY, '1');
    params.set(LOGIN_MODAL_NEXT_QUERY_KEY, normalizeLoginNext(next));
    return `/?${params.toString()}`;
}

export function buildLoginModalClosePath(pathname: string, search: string = '') {
    const query = stripLoginModalParams(search);
    return query ? `${pathname}?${query}` : pathname;
}

export function isLoginModalOpen(search: string = '') {
    return toSearchParams(search).get(LOGIN_MODAL_QUERY_KEY) === '1';
}

export function readLoginModalNext(search: string = '', fallback: string = '/') {
    return normalizeLoginNext(
        toSearchParams(search).get(LOGIN_MODAL_NEXT_QUERY_KEY),
        fallback
    );
}
