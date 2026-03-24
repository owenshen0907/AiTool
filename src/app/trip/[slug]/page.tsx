import type { Metadata } from 'next';
import { ShieldAlert } from 'lucide-react';
import { xianTrip } from '@/lib/trip/data/xian';
import { getTripSnapshot } from '@/lib/trip/server';
import TripPlannerClient from './TripPlannerClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
    params,
}: {
    params: { slug: string };
}): Promise<Metadata> {
    if (params.slug === 'xian') {
        return {
            title: `${xianTrip.title} | AiTool`,
            description: xianTrip.intro,
            openGraph: {
                title: xianTrip.title,
                description: xianTrip.coverNote,
            },
        };
    }

    return {
        title: '旅行行程板 | AiTool',
        description: '按当前时间自动提示下一步的旅行行程页面。',
    };
}

function readToken(token: string | string[] | undefined) {
    if (Array.isArray(token)) return token[0] || '';
    return token || '';
}

export default async function TripPage({
    params,
    searchParams,
}: {
    params: { slug: string };
    searchParams?: Record<string, string | string[] | undefined>;
}) {
    const token = readToken(searchParams?.token);
    const snapshot = await getTripSnapshot(params.slug, token);

    if (!snapshot) {
        return (
            <main className="min-h-screen bg-[linear-gradient(180deg,#f6efe6_0%,#f8f5ef_38%,#efe3d0_100%)] px-4 py-12 text-[#2a1f18] md:px-8">
                <section className="mx-auto max-w-2xl rounded-[32px] border border-[#ddcbb8] bg-white/75 p-8 text-center shadow-[0_24px_90px_rgba(75,43,22,0.10)]">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff3e8] text-[#9c5423]">
                        <ShieldAlert size={28} />
                    </div>
                    <h1 className="mt-5 text-3xl font-semibold tracking-tight">这个行程链接现在打不开</h1>
                    <p className="mt-4 text-base leading-8 text-[#715b4d]">
                        一般是因为链接里缺少 `token`，或者你拿到的已经不是完整分享链接。直接把原始链接重新发一次就行。
                    </p>
                    <div className="mt-6 rounded-[24px] border border-[#ead8c5] bg-[#fff8ef] px-5 py-4 text-left text-sm leading-7 text-[#7a5d45]">
                        示例：`/trip/{params.slug}?token=你的分享口令`
                    </div>
                </section>
            </main>
        );
    }

    return <TripPlannerClient initialSnapshot={snapshot} token={token} />;
}
