import { redirect } from 'next/navigation';
import {
    buildLoginModalHomePath,
    DEFAULT_POST_LOGIN_PATH,
    normalizeLoginNext,
} from '@/lib/auth/loginModal';

export default async function LoginConfirm({
    searchParams,
}: {
    searchParams?: Promise<{ next?: string | string[] }>;
}) {
    const { next } = (await searchParams) ?? {};
    const rawNext = Array.isArray(next) ? next[0] : next;

    redirect(buildLoginModalHomePath(normalizeLoginNext(rawNext, DEFAULT_POST_LOGIN_PATH)));
}
