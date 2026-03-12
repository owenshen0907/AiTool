import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import ApiLabClient from './ApiLabClient';
import {
    getApiLabAccountNameByToken,
    isApiLabOwnerAccount,
} from '@/lib/api-lab/access';

export default async function ApiLabPage() {
    const sessionToken = cookies().get('sessionToken')?.value ?? null;
    const accountName = await getApiLabAccountNameByToken(sessionToken);

    if (!isApiLabOwnerAccount(accountName)) {
        notFound();
    }

    return <ApiLabClient />;
}
