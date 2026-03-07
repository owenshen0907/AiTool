import { cookies } from 'next/headers';
import { buildLoginModalPath } from '@/lib/auth/loginModal';
import WorkspaceHomeClient from './WorkspaceHomeClient';

export default function WorkspacePage() {
    const signedIn = Boolean(cookies().get('sessionToken')?.value);
    const loginHref = buildLoginModalPath('/workspace', '', '/workspace');

    return <WorkspaceHomeClient signedIn={signedIn} loginHref={loginHref} />;
}
