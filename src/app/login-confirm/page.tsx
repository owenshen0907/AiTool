import { redirect } from 'next/navigation';
import {
    buildLoginModalHomePath,
    DEFAULT_POST_LOGIN_PATH,
    normalizeLoginNext,
} from '@/lib/auth/loginModal';

export default function LoginConfirm({
    searchParams,
}: {
    searchParams?: { next?: string | string[] };
}) {
    const rawNext = Array.isArray(searchParams?.next)
        ? searchParams?.next[0]
        : searchParams?.next;

    redirect(buildLoginModalHomePath(normalizeLoginNext(rawNext, DEFAULT_POST_LOGIN_PATH)));
}
