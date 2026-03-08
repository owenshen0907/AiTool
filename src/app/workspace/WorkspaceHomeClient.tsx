'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    ArrowRight,
    BookOpenText,
    CheckSquare,
    Compass,
    Languages,
    LibraryBig,
    MessageSquarePlus,
    Sparkles,
    Undo2,
    Wand2,
    Zap,
} from 'lucide-react';
import { useUser } from '@/app/providers/UserProvider';
import { getAppliedHomeConfigKey, type GeneratedHomepagePlan } from '@/lib/personalHome';
import { planStatusMeta, systemPlan } from '@/lib/sitePlan';

const quickCapture = [
    {
        title: '记一条 Prompt 灵感',
        description: '把临时想到的结构、场景和变量快速沉到 Prompt Studio。',
        href: '/prompt/manage',
        icon: MessageSquarePlus,
    },
    {
        title: '记一条日语句子',
        description: '把今天学到的表达、语法和 shadowing 句子先存进学习流。',
        href: '/docs/japanese',
        icon: Languages,
    },
    {
        title: '开一个图像任务',
        description: '把创意快速推进到图片工作流，减少来回切换入口。',
        href: '/agent/image/generate',
        icon: Sparkles,
    },
];

const recentEntries = [
    {
        title: 'Prompt Studio',
        note: '当前最成熟的生产流，适合继续承担日常创作主入口。',
        href: '/prompt/manage',
    },
    {
        title: 'Prompt 调试',
        note: '延续用例调试和对比测试，继续强化 AiTool 的核心差异点。',
        href: '/prompt/case',
    },
    {
        title: 'Japanese Notes',
        note: '把学习内容沉淀成长期资产，后续再接 review 和 TTS practice。',
        href: '/docs/japanese',
    },
];

const pinnedShortcuts = [
    {
        title: '打开系统规划',
        description: '随时确认当前阶段、完成状态与下一步，不让规划失真。',
        href: '/roadmap',
    },
    {
        title: '开始个性首页定制',
        description: '选择生活 / 学习 / 工作 / 综合模板，生成你的专属首页。',
        href: '/workspace/home-builder',
    },
    {
        title: '查看内部需求',
        description: '把产品迭代、验证备注和下一步都集中收进 Requirements Space。',
        href: '/requirements',
    },
    {
        title: '进入 TTS',
        description: '为 Japanese Today 预留语音练习和内容输出的承接入口。',
        href: '/audio/tts',
    },
    {
        title: '查看文件工具',
        description: '继续保留高频可用工具，但从 Workspace 统一进入。',
        href: '/stepfun/file',
    },
];

const japaneseToday = [
    '继续整理日语笔记的结构，把知识点、例句、复习任务拆开。',
    '把 TTS 和 shadowing 的入口挂回学习流，而不是单独漂在导航里。',
    '后续将 review queue 放进 Workspace，而不是继续散落在页面之间。',
];

function getTodayLabel() {
    return new Intl.DateTimeFormat('zh-CN', {
        dateStyle: 'full',
        timeZone: 'Asia/Tokyo',
    }).format(new Date());
}

function getUserStorageKey(userName?: string) {
    return userName?.trim() || 'guest';
}

function PersonalizedWorkspaceHome({
    plan,
    onReset,
}: {
    plan: GeneratedHomepagePlan;
    onReset: () => void;
}) {
    return (
        <main
            className="min-h-screen px-4 py-10 md:px-8"
            style={{ background: plan.palette.background, color: plan.palette.text }}
        >
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <article
                        className="overflow-hidden rounded-[36px] border p-8 shadow-[0_28px_90px_rgba(15,23,42,0.08)] md:p-10"
                        style={{ backgroundColor: '#ffffff', borderColor: plan.palette.accentSoft }}
                    >
                        <div
                            className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium"
                            style={{ borderColor: plan.palette.accentSoft, color: plan.palette.accent }}
                        >
                            {plan.heroEyebrow}
                        </div>
                        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                            {plan.heroHeadline}
                        </h1>
                        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                            {plan.heroDescription}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href="/workspace/home-builder"
                                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                                style={{ backgroundColor: plan.palette.accent }}
                            >
                                继续微调首页
                                <ArrowRight size={16} />
                            </Link>
                            <button
                                type="button"
                                onClick={onReset}
                                className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition hover:bg-white"
                                style={{ borderColor: plan.palette.accentSoft, color: plan.palette.accent }}
                            >
                                <Undo2 size={16} />
                                恢复默认工作台
                            </button>
                        </div>
                    </article>

                    <article
                        className="rounded-[36px] border p-6 shadow-[0_24px_90px_rgba(15,23,42,0.12)] md:p-8"
                        style={{
                            background: `linear-gradient(160deg, ${plan.palette.accent} 0%, #0f172a 100%)`,
                            borderColor: plan.palette.accent,
                            color: '#ffffff',
                        }}
                    >
                        <div className="text-sm font-medium uppercase tracking-[0.18em] text-white/70">
                            首页摘要
                        </div>
                        <div className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
                            {plan.pageTitle}
                        </div>
                        <p className="mt-4 text-sm leading-8 text-white/80 md:text-base">
                            {plan.pageSummary}
                        </p>
                        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/10 p-5">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                                AI Notes
                            </div>
                            <div className="mt-4 space-y-3">
                                {plan.aiNotes.map((note) => (
                                    <div key={note} className="rounded-2xl bg-white/10 px-4 py-3 text-sm leading-7 text-white/85">
                                        {note}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </article>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="grid gap-6">
                        {plan.sections.map((section) => (
                            <article
                                key={section.id}
                                className="rounded-[32px] border bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8"
                                style={{ borderColor: plan.palette.accentSoft }}
                            >
                                <div
                                    className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                                    style={{ backgroundColor: plan.palette.accentSoft, color: plan.palette.accent }}
                                >
                                    {section.kind}
                                </div>
                                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                                    {section.title}
                                </h2>
                                <p className="mt-3 text-sm leading-8 text-slate-600 md:text-base">
                                    {section.description}
                                </p>
                                <div className="mt-6 grid gap-3 md:grid-cols-2">
                                    {section.items.map((item) => (
                                        <div
                                            key={item}
                                            className="rounded-[22px] px-4 py-3 text-sm leading-7"
                                            style={{ backgroundColor: plan.palette.surface, color: '#334155' }}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="grid gap-6">
                        <article
                            className="rounded-[32px] border bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8"
                            style={{ borderColor: plan.palette.accentSoft }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="inline-flex rounded-2xl p-3"
                                    style={{ backgroundColor: plan.palette.accentSoft, color: plan.palette.accent }}
                                >
                                    <Wand2 size={22} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                        Quick Routes
                                    </div>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                        你的首页优先展示这些入口
                                    </h2>
                                </div>
                            </div>
                            <div className="mt-6 space-y-4">
                                {plan.recommendedRoutes.map((route) => (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        className="block rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <div className="text-lg font-semibold text-slate-900">{route.title}</div>
                                                <p className="mt-2 text-sm leading-7 text-slate-600">{route.reason}</p>
                                            </div>
                                            <ArrowRight size={18} className="shrink-0 text-slate-400" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </article>

                        <article
                            className="rounded-[32px] border bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8"
                            style={{ borderColor: plan.palette.accentSoft }}
                        >
                            <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                Generation
                            </div>
                            <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                                这套首页已应用到你的 Workspace
                            </div>
                            <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
                                当前模式：{plan.generationMode === 'ai' ? 'AI 生成' : '规则回退生成'}。你可以继续编辑模板信息，重新生成更细的首页结构。
                            </p>
                            <Link
                                href="/workspace/home-builder"
                                className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                            >
                                打开首页生成器
                                <ArrowRight size={16} />
                            </Link>
                        </article>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default function WorkspaceHomeClient({
    signedIn,
    loginHref,
}: {
    signedIn: boolean;
    loginHref: string;
}) {
    const { user } = useUser();
    const [personalPlan, setPersonalPlan] = useState<GeneratedHomepagePlan | null>(null);
    const userKey = useMemo(() => getUserStorageKey(user?.name || user?.displayName), [user?.displayName, user?.name]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const storageKey = getAppliedHomeConfigKey(userKey);
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
            setPersonalPlan(null);
            return;
        }

        try {
            setPersonalPlan(JSON.parse(raw) as GeneratedHomepagePlan);
        } catch {
            window.localStorage.removeItem(storageKey);
            setPersonalPlan(null);
        }
    }, [userKey]);

    const activePhase = systemPlan.phases.find((phase) => phase.status === 'in_progress') || systemPlan.phases[0];
    const phaseMeta = planStatusMeta[activePhase.status];
    const nextTasks = systemPlan.phases
        .flatMap((phase) => phase.tasks)
        .filter((task) => task.status === 'next')
        .slice(0, 3);

    if (personalPlan) {
        return (
            <PersonalizedWorkspaceHome
                plan={personalPlan}
                onReset={() => {
                    if (typeof window === 'undefined') return;
                    window.localStorage.removeItem(getAppliedHomeConfigKey(userKey));
                    setPersonalPlan(null);
                }}
            />
        );
    }

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,#edf4fb_0%,#f8fafc_44%,#ffffff_100%)] px-4 py-10 md:px-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                    <article className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
                        <div className="bg-[radial-gradient(circle_at_top_left,#dfeaf9_0%,#eef4fb_40%,#ffffff_100%)] px-6 py-8 md:px-10 md:py-10">
                            <div className="inline-flex items-center rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm font-medium text-sky-700">
                                Workspace / Daily Entry
                            </div>
                            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                                从这里开始今天的创作、学习和下一步开发
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                                Workspace 首版先不追求复杂，而是把你真正会反复打开的入口收进来：今天要做什么、先记到哪里、最近做到哪、接下来该推进什么。
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                {signedIn ? (
                                    <span className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">
                                        已登录，可继续把这里做成默认入口
                                    </span>
                                ) : (
                                    <Link
                                        href={loginHref}
                                        scroll={false}
                                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                                    >
                                        登录后把 Workspace 作为默认入口
                                        <ArrowRight size={16} />
                                    </Link>
                                )}
                                <Link
                                    href="/workspace/home-builder"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    开始定制我的首页
                                </Link>
                            </div>
                        </div>
                    </article>

                    <article className="rounded-[36px] border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.16)] md:p-8">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-300">
                                    Today
                                </div>
                                <div className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                                    {getTodayLabel()}
                                </div>
                            </div>
                            <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${phaseMeta.badgeClass}`}>
                                {phaseMeta.label}
                            </div>
                        </div>
                        <p className="mt-5 text-sm leading-8 text-slate-300 md:text-base">
                            当前主线：{systemPlan.currentFocus}
                        </p>
                        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
                            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                                <Compass size={16} />
                                当前阶段
                            </div>
                            <div className="mt-3 text-xl font-semibold text-white">
                                {activePhase.name}
                            </div>
                            <div className="mt-3 text-sm leading-7 text-slate-300">
                                {activePhase.goal}
                            </div>
                        </div>
                    </article>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                        <div className="flex items-center gap-3">
                            <div className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-700">
                                <Zap size={22} />
                            </div>
                            <div>
                                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                    Quick Capture
                                </div>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                    先把想法收进去，再决定做成什么
                                </h2>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {quickCapture.map((item) => (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
                                >
                                    <div className="inline-flex rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                                        <item.icon size={20} />
                                    </div>
                                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                                        {item.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-600">
                                        {item.description}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                        <div className="flex items-center gap-3">
                            <div className="inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                                <CheckSquare size={22} />
                            </div>
                            <div>
                                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                    Suggested Next
                                </div>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                    当前最值得继续推进的 3 件事
                                </h2>
                            </div>
                        </div>
                        <div className="mt-6 space-y-4">
                            {nextTasks.map((task) => (
                                <div
                                    key={task.title}
                                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
                                >
                                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                                        下一步
                                    </div>
                                    <div className="mt-2 text-lg font-semibold text-slate-900">
                                        {task.title}
                                    </div>
                                    <p className="mt-3 text-sm leading-7 text-slate-600">
                                        {task.note}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </article>
                </section>

                <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                        <div className="flex items-center gap-3">
                            <div className="inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700">
                                <BookOpenText size={22} />
                            </div>
                            <div>
                                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                    Recents
                                </div>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                    当前值得频繁回来的高价值入口
                                </h2>
                            </div>
                        </div>
                        <div className="mt-6 space-y-4">
                            {recentEntries.map((entry) => (
                                <Link
                                    key={entry.title}
                                    href={entry.href}
                                    className="block rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <div className="text-lg font-semibold text-slate-900">
                                                {entry.title}
                                            </div>
                                            <p className="mt-2 text-sm leading-7 text-slate-600">
                                                {entry.note}
                                            </p>
                                        </div>
                                        <ArrowRight size={18} className="shrink-0 text-slate-400" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </article>

                    <div className="grid gap-6">
                        <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                            <div className="flex items-center gap-3">
                                <div className="inline-flex rounded-2xl bg-violet-100 p-3 text-violet-700">
                                    <LibraryBig size={22} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                        Pinned Shortcuts
                                    </div>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                        先把你会反复打开的入口钉住
                                    </h2>
                                </div>
                            </div>
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                {pinnedShortcuts.map((shortcut) => (
                                    <Link
                                        key={shortcut.title}
                                        href={shortcut.href}
                                        className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
                                    >
                                        <div className="text-lg font-semibold text-slate-900">
                                            {shortcut.title}
                                        </div>
                                        <p className="mt-3 text-sm leading-7 text-slate-600">
                                            {shortcut.description}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </article>

                        <article className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#fffaf0_0%,#fff4d6_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                            <div className="flex items-center gap-3">
                                <div className="inline-flex rounded-2xl bg-white/80 p-3 text-amber-700 shadow-sm">
                                    <Languages size={22} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium uppercase tracking-[0.18em] text-amber-800/70">
                                        Japanese Today
                                    </div>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                        为学习流预留固定位置
                                    </h2>
                                </div>
                            </div>
                            <div className="mt-6 space-y-3">
                                {japaneseToday.map((item) => (
                                    <div key={item} className="rounded-[22px] border border-white/70 bg-white/70 px-4 py-3 text-sm leading-7 text-slate-700">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </article>
                    </div>
                </section>
            </div>
        </main>
    );
}
