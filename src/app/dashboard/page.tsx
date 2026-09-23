import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
    ArrowRight,
    BookOpen,
    Globe2,
    KeyRound,
    LockKeyhole,
    Radio,
    Server,
    ShieldCheck,
    Wrench,
} from 'lucide-react';
import {
    fetchUnifiedProfile,
    getUnifiedProfileAccountName,
    getUnifiedProfileDisplayName,
} from '@/lib/auth/unifiedBackend';
import { buildLoginModalHomePath } from '@/lib/auth/loginModal';
import { isAdminProfile } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

type NavLink = {
    title: string;
    href: string;
    description: string;
    icon: typeof Server;
    badge?: string;
};

const publicBenefits = [
    {
        title: '公开内容不需要登录',
        body: '首页、记录、产品页和公开链接保持纯对外访问。',
        icon: Globe2,
    },
    {
        title: '账号用于后续能力',
        body: '登录后可以承接找回密码、学习记录同步、私有工具权限等能力。',
        icon: KeyRound,
    },
    {
        title: '管理员有独立入口',
        body: '管理员登录后集中打开后台、AI API、密码相关服务和本地调试入口。',
        icon: ShieldCheck,
    },
];

function configuredUrl(envName: string, fallback: string) {
    return process.env[envName]?.trim() || fallback;
}

function adminLinks(): NavLink[] {
    return [
        {
            title: '国内后台',
            href: 'https://appapi.owenshen.top/admin/',
            description: 'Mainland unified-app-backend 管理台。',
            icon: Server,
            badge: 'Aliyun',
        },
        {
            title: '东京后台',
            href: 'https://jp-appapi.owenshen.top/admin/',
            description: 'Tokyo unified-app-backend 管理台。',
            icon: Server,
            badge: 'Tokyo',
        },
        {
            title: '本地后台',
            href: 'http://localhost:8788/admin/',
            description: '本机 unified-app-backend 管理台。',
            icon: Wrench,
            badge: 'Local',
        },
        {
            title: 'AI API',
            href: configuredUrl('AITOOL_AI_API_URL', 'https://appapi.owenshen.top/admin/ai'),
            description: 'AI 网关、模型路由和用量入口。',
            icon: Radio,
            badge: 'AI',
        },
        {
            title: '密码服务',
            href: configuredUrl('AITOOL_PASSWORD_SERVICE_URL', 'https://appapi.owenshen.top/admin/users'),
            description: '用户密码状态查看、临时密码生成和账号安全入口。',
            icon: LockKeyhole,
            badge: 'Auth',
        },
        {
            title: '欧文日语工坊',
            href: 'https://nihonngo.owenshen.top',
            description: '词汇与语法图鉴前台。',
            icon: BookOpen,
            badge: 'Public',
        },
    ];
}

function ExternalCard({ item }: { item: NavLink }) {
    const Icon = item.icon;
    return (
        <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="group flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white/[0.82] p-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-white"
        >
            <div>
                <div className="flex items-center justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
                        <Icon size={19} />
                    </span>
                    {item.badge ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-500">
                            {item.badge}
                        </span>
                    ) : null}
                </div>
                <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3 text-xs font-mono text-slate-500">
                <span className="truncate">{item.href.replace(/^https?:\/\//, '')}</span>
                <ArrowRight size={15} className="shrink-0 transition group-hover:translate-x-0.5" />
            </div>
        </a>
    );
}

export default async function DashboardPage() {
    const token = (await cookies()).get('sessionToken')?.value;
    if (!token) {
        redirect(buildLoginModalHomePath('/dashboard'));
    }

    let profile;
    try {
        profile = await fetchUnifiedProfile(token);
    } catch {
        redirect(buildLoginModalHomePath('/dashboard'));
    }

    const isAdmin = isAdminProfile(profile);
    const displayName = getUnifiedProfileDisplayName(profile);
    const accountName = getUnifiedProfileAccountName(profile);

    return (
        <main className="aios-page min-h-screen px-4 py-8 text-slate-950 md:px-8 md:py-12">
            <section className="mx-auto max-w-7xl rounded-lg border border-slate-900/10 bg-white/[0.82] p-6 shadow-[0_22px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-5">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-600">
                            <ShieldCheck size={16} />
                            {isAdmin ? 'OWNER NAVIGATION' : 'ACCOUNT'}
                        </div>
                        <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
                            {isAdmin ? '个人后台导航' : '登录后的个人页'}
                        </h1>
                        <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
                            当前账号：{displayName} / {accountName}
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-400"
                    >
                        回到公开首页
                    </Link>
                </div>
            </section>

            <section className="mx-auto mt-6 grid max-w-7xl gap-4 md:grid-cols-3">
                {publicBenefits.map((item) => {
                    const Icon = item.icon;
                    return (
                        <article
                            key={item.title}
                            className="rounded-lg border border-slate-200 bg-white/[0.82] p-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)]"
                        >
                            <Icon size={20} className="text-slate-700" />
                            <h2 className="mt-3 text-lg font-black text-slate-950">{item.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                        </article>
                    );
                })}
            </section>

            {isAdmin ? (
                <section className="mx-auto mt-10 max-w-7xl">
                    <div className="mb-4">
                        <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                            Admin
                        </div>
                        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                            常用后台入口
                        </h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {adminLinks().map((item) => (
                            <ExternalCard key={item.title} item={item} />
                        ))}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-500">
                        这里不保存密码或后台 token。统一后台会优先使用 AiTool 登录态校验管理员邮箱；手动 admin token 只作为兜底。
                        生产环境可用 <code className="rounded bg-white px-1.5 py-0.5">AITOOL_ADMIN_EMAILS</code>、<code className="rounded bg-white px-1.5 py-0.5">AITOOL_AI_API_URL</code> 和 <code className="rounded bg-white px-1.5 py-0.5">AITOOL_PASSWORD_SERVICE_URL</code> 调整权限与入口。
                    </p>
                </section>
            ) : (
                <section className="mx-auto mt-10 max-w-7xl rounded-lg border border-slate-200 bg-white/[0.82] p-6 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">这个账号不是管理员</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                        普通登录用户不会看到后台地址。公开博客仍然无需登录；后续如果开放学习记录同步或私有工具权限，会从这里承接。
                    </p>
                </section>
            )}
        </main>
    );
}
