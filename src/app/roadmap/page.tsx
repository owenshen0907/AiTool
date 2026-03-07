import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { planStatusMeta, systemPlan } from '@/lib/sitePlan';

export default function RoadmapPage() {
    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,#f4f7fb_0%,#ffffff_48%,#f8fafc_100%)] px-4 py-10 md:px-8">
            <div className="mx-auto max-w-6xl space-y-8">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                    <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:px-10 md:py-10">
                        <div>
                            <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                                {systemPlan.title}
                            </div>
                            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                                从 AI 工具箱，收敛成 AI 工作台
                            </h1>
                            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                                {systemPlan.summary}
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                                >
                                    返回首页
                                    <ArrowRight size={16} />
                                </Link>
                                <Link
                                    href="/prompt/manage"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    进入 Prompt Studio
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                            <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                Current Focus
                            </div>
                            <p className="mt-4 text-lg leading-8 text-slate-700">
                                {systemPlan.currentFocus}
                            </p>
                            <div className="mt-6 text-sm text-slate-500">
                                最近更新：{systemPlan.updatedAt}
                            </div>
                            <div className="mt-6 space-y-3">
                                {systemPlan.principles.map((principle) => (
                                    <div
                                        key={principle}
                                        className="rounded-2xl border border-white bg-white px-4 py-3 text-sm leading-7 text-slate-600"
                                    >
                                        {principle}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6">
                    {systemPlan.phases.map((phase) => {
                        const phaseMeta = planStatusMeta[phase.status];
                        return (
                            <article
                                key={phase.name}
                                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8"
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="max-w-3xl">
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${phaseMeta.badgeClass}`}>
                                                {phaseMeta.label}
                                            </span>
                                            <span className="text-sm uppercase tracking-[0.18em] text-slate-400">
                                                Product Iteration
                                            </span>
                                        </div>
                                        <h2 className="mt-4 text-2xl font-semibold text-slate-900 md:text-3xl">
                                            {phase.name}
                                        </h2>
                                        <p className="mt-3 text-base leading-8 text-slate-600">
                                            {phase.goal}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    {phase.tasks.map((task) => {
                                        const taskMeta = planStatusMeta[task.status];
                                        return (
                                            <div
                                                key={task.title}
                                                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`h-2.5 w-2.5 rounded-full ${taskMeta.dotClass}`} />
                                                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                        {taskMeta.label}
                                                    </span>
                                                </div>
                                                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                                                    {task.title}
                                                </h3>
                                                <p className="mt-3 text-sm leading-7 text-slate-600">
                                                    {task.note}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </article>
                        );
                    })}
                </section>
            </div>
        </main>
    );
}
