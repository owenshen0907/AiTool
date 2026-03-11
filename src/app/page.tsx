import Link from 'next/link';
import { ArrowRight, BookOpenText, FolderKanban, Languages, Sparkles, Wand2 } from 'lucide-react';
import { planStatusMeta, systemPlan } from '@/lib/sitePlan';

const pillars = [
    {
        title: '工作台',
        description: '把提示词、文档、任务与最近产出收束成一个真正可每天打开的入口。',
        icon: Sparkles,
    },
    {
        title: '创作',
        description: '继续保留 Prompt、图片、音频、视频等已有强项，但作为创作能力层存在。',
        icon: Wand2,
    },
    {
        title: '学习',
        description: '把日语学习、阅读、TTS 练习变成持续积累的个人学习流。',
        icon: Languages,
    },
    {
        title: '资料库',
        description: '让模板、资料、生成结果和复用资产可沉淀、可回看、可继续加工。',
        icon: BookOpenText,
    },
];

const routes = [
    {
        title: '提示词工作台',
        description: 'AiTool 当前最成熟的能力，继续承担核心生产流入口。',
        href: '/prompt/manage',
    },
    {
        title: '日语笔记',
        description: '把学习内容沉淀成可回顾、可检索、可语音练习的长期资产。',
        href: '/docs/japanese',
    },
    {
        title: '图片生成',
        description: '保留图像生成与模板化工作流，后续并入创作体系。',
        href: '/agent/image/generate',
    },
];

export default function HomePage() {
    const currentPhase = systemPlan.phases.find((phase) => phase.status === 'in_progress') || systemPlan.phases[0];
    const currentPhaseMeta = planStatusMeta[currentPhase.status];

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#ffffff_42%,#f8fafc_100%)] text-slate-900">
            <section className="px-4 pb-12 pt-10 md:px-8 md:pt-14">
                <div className="animate-fade-in-up mx-auto grid max-w-6xl gap-8 overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_28px_100px_rgba(15,23,42,0.08)] md:grid-cols-[1.08fr_0.92fr]">
                    <div className="px-6 py-8 md:px-10 md:py-12">
                        <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                            AI 原生工作台
                        </div>
                        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
                            AiTool 正在从“工具集合”重构成“可持续使用的 AI 工作台”
                        </h1>
                        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                            这里不再只是展示很多功能，而是围绕创作、学习、开发执行与个人资产沉淀，建立一个你每天都能重新打开的入口。
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href="/roadmap"
                                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                            >
                                查看系统规划
                                <ArrowRight size={16} />
                            </Link>
                            <Link
                                href="/prompt/manage"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                进入提示词工作台
                            </Link>
                        </div>
                    </div>

                    <div className="bg-[radial-gradient(circle_at_top,#dce8f8_0%,#edf3fb_42%,#f8fafc_100%)] px-6 py-8 md:px-8 md:py-10">
                        <div className="rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-[0_18px_45px_rgba(148,163,184,0.18)] backdrop-blur">
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${currentPhaseMeta.badgeClass}`}>
                                    {currentPhaseMeta.label}
                                </span>
                                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                    当前阶段
                                </span>
                            </div>
                            <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                                {currentPhase.name}
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
                                {currentPhase.goal}
                            </p>
                            <div className="mt-6 space-y-3">
                                {currentPhase.tasks.map((task) => {
                                    const meta = planStatusMeta[task.status];
                                    return (
                                        <div
                                            key={task.title}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                        >
                                            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClass}`} />
                                                {meta.label}
                                            </div>
                                            <div className="mt-2 text-base font-semibold text-slate-900">
                                                {task.title}
                                            </div>
                                            <div className="mt-2 text-sm leading-7 text-slate-600">
                                                {task.note}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 py-6 md:px-8 md:py-10">
                <div className="mx-auto max-w-6xl">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                产品骨架
                            </div>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                                以后所有功能，都要回到这四个骨架里
                            </h2>
                        </div>
                    </div>
                    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {pillars.map((pillar, i) => (
                            <article
                                key={pillar.title}
                                className={`animate-fade-in-up stagger-${i + 1} card-hover rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]`}
                            >
                                <div className="inline-flex rounded-2xl bg-slate-100 p-3 text-slate-700 transition-transform duration-200 group-hover:scale-110">
                                    <pillar.icon size={24} />
                                </div>
                                <h3 className="mt-5 text-2xl font-semibold text-slate-900">
                                    {pillar.title}
                                </h3>
                                <p className="mt-4 text-sm leading-7 text-slate-600">
                                    {pillar.description}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 py-6 md:px-8 md:py-10">
                <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[0.92fr_1.08fr]">
                    <article className="animate-fade-in-up stagger-1 card-hover rounded-[32px] border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_20px_80px_rgba(15,23,42,0.18)] md:p-8">
                        <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-slate-200">
                            系统规划
                        </div>
                        <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                            首页展示方向，独立页面沉淀执行状态
                        </h2>
                        <p className="mt-4 text-sm leading-8 text-slate-300 md:text-base">
                            你刚刚提到的“把系统规划直接放到首页”，我理解成两层：一层对外解释产品正在往哪儿走，一层对内记录当前阶段、完成项和下一步，避免规划只躺在文档里。
                        </p>
                        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
                            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                                <FolderKanban size={18} />
                                当前 Focus
                            </div>
                            <p className="mt-3 text-sm leading-7 text-slate-200 md:text-base md:leading-8">
                                {systemPlan.currentFocus}
                            </p>
                        </div>
                        <Link
                            href="/roadmap"
                            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                        >
                            打开完整规划页
                            <ArrowRight size={16} />
                        </Link>
                    </article>

                    <article className="animate-fade-in-up stagger-2 card-hover rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                        <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                            当前入口
                        </div>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                            当前先保留这些高价值入口
                        </h2>
                        <div className="mt-6 grid gap-4">
                            {routes.map((route) => (
                                <Link
                                    key={route.title}
                                    href={route.href}
                                    className="link-card-hover rounded-[24px] border border-slate-200 bg-slate-50 p-5 hover:border-slate-300 hover:bg-white"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900">
                                                {route.title}
                                            </h3>
                                            <p className="mt-2 text-sm leading-7 text-slate-600">
                                                {route.description}
                                            </p>
                                        </div>
                                        <ArrowRight size={18} className="shrink-0 text-slate-400" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </article>
                </div>
            </section>
        </main>
    );
}
