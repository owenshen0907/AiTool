// app/layout.tsx
import './globals.css';
import Script from 'next/script';
import { cookies } from 'next/headers';
import { Inter } from 'next/font/google';
import NavBar from './components/NavBar';
import { CASDOOR_CONFIG } from '@/config';
import { UserProvider, User } from './providers/UserProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'AiTool',
    description: 'A Ai Tool site',
};

export default async function RootLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    // 从 sessionToken Cookie 直接调用 Casdoor 获取账户信息
    const tokenCookie = cookies().get('sessionToken')?.value;
    let initialUser: User | null = null;
    if (tokenCookie) {
        try {
            const accountRes = await fetch(
                `${CASDOOR_CONFIG.endpoint}/api/get-account`,
                {
                    headers: { Authorization: `Bearer ${tokenCookie}` },
                    cache: 'no-store',
                }
            );
            if (accountRes.ok) {
                const accountData = (await accountRes.json()).data;
                initialUser = {
                    name: accountData.name,
                    displayName: accountData.displayName || accountData.name,
                };
            }
        } catch (e) {
            console.error('SSR Casdoor fetch-account failed', e);
        }
    }

    return (
        <html lang="en">
        <head>
            <Script src="/fetchPatch.js" strategy="beforeInteractive" />
        </head>
        <body className={inter.className}>
        <UserProvider initialUser={initialUser}>
            <NavBar />
            {children}
        </UserProvider>
        </body>
        </html>
    );
}
