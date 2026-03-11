'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivitySquare,
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
import {
    getAppliedHomeConfigKey,
    getPersonalHomeTemplate,
    type GeneratedHomepagePlan,
} from '@/lib/personalHome';
import { planStatusMeta, systemPlan } from '@/lib/sitePlan';
import {
    type RequirementFreshness,
    requirementFreshnessMeta,
    requirementStatusMeta,
    type RequirementsSummaryResponse,
} from '@/lib/requirements';

const quickCapture = [
    {
        title: '记一条 Prompt 灵感',
        description: '把临时想到的结构、场景和变量快速沉到提示词工作台。',
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
        title: '提示词工作台',
        note: '当前最成熟的生产流，适合继续承担日常创作主入口。',
        href: '/prompt/manage',
    },
    {
        title: '提示词调试',
        note: '延续用例调试和对比测试，继续强化 AiTool 的核心差异点。',
        href: '/prompt/case',
    },
    {
        title: '日语笔记',
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
        description: '把产品迭代、验证备注和下一步都集中收进需求空间。',
        href: '/requirements',
    },
    {
        title: '进入 TTS',
        description: '为今日日语预留语音练习和内容输出的承接入口。',
        href: '/audio/tts',
    },
    {
        title: '查看文件工具',
        description: '继续保留高频可用工具，但从工作台统一进入。',
        href: '/stepfun/file',
    },
];

const todayLearningStack = [
    {
        title: '先记一条日语表达',
        note: '把今天遇到的句子、语法点和你自己的改写一起沉到日语笔记里。',
        href: '/docs/japanese',
        cta: '打开日语笔记',
    },
    {
        title: '做一轮 TTS / shadowing',
        note: '把刚整理好的内容送进 TTS，听一遍、跟一遍，再决定哪些句子值得反复练。',
        href: '/audio/tts',
        cta: '进入 TTS',
    },
    {
        title: '回到学习流入口',
        note: '继续把学习入口收回工作台，而不是把复习、跟读和笔记拆散在不同页面。',
        href: '/roadmap',
        cta: '查看系统规划',
    },
];

const WORKSPACE_TIME_ZONE = 'Asia/Shanghai';

function getCurrentHour() {
    const hourPart = new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        hourCycle: 'h23',
        timeZone: WORKSPACE_TIME_ZONE,
    })
        .formatToParts(new Date())
        .find((part) => part.type === 'hour')?.value;

    return Number(hourPart ?? '0');
}

function getTodayLabel() {
    return new Intl.DateTimeFormat('zh-CN', {
        dateStyle: 'full',
        timeZone: WORKSPACE_TIME_ZONE,
    }).format(new Date());
}

function getGreeting() {
    const hour = getCurrentHour();
    if (hour < 6) return '夜深了，注意休息';
    if (hour < 9) return '早上好，新的一天开始了';
    if (hour < 12) return '上午好，保持专注';
    if (hour < 14) return '中午好，吃饭了吗';
    if (hour < 18) return '下午好，继续加油';
    if (hour < 21) return '晚上好，还在忙吗';
    return '夜间模式，放松一下';
}

function formatPulseUpdatedAt(value: string) {
    try {
        return new Intl.DateTimeFormat('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
            timeZone: WORKSPACE_TIME_ZONE,
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function getUserStorageKey(userName?: string) {
    return userName?.trim() || 'guest';
}

interface SuggestedAction {
    id: string;
    source: string;
    title: string;
    note: string;
    href: string;
    cta: string;
}

interface DailySummaryHighlight {
    label: string;
    value: string;
}

interface DailySummarySource {
    label: string;
    summary: string;
    detail: string;
    href?: string;
    cta?: string;
}

interface DailySummary {
    eyebrow: string;
    title: string;
    summary: string;
    highlights: DailySummaryHighlight[];
    sources: DailySummarySource[];
    primaryAction: SuggestedAction | null;
}

interface PersonalBriefContext {
    templateName: string;
    accentLabel: string;
    focusTitle: string | null;
    routeTitles: string[];
    primaryRouteHref: string | null;
}

function describeFreshness(freshness: RequirementFreshness | null) {
    if (freshness === 'stale') return '这条需求已经放了一段时间，应该优先回看。';
    if (freshness === 'aging') return '这条需求开始变旧，适合补一次 handoff 或验证说明。';
    if (freshness === 'fresh') return '这条需求刚推进过，适合直接接着往下做。';
    return '这条需求值得继续推进。';
}

function buildSuggestedActions(
    reqSummary: RequirementsSummaryResponse | null,
): SuggestedAction[] {
    const actions: SuggestedAction[] = [];
    const seen = new Set<string>();

    const pushAction = (action: SuggestedAction) => {
        if (seen.has(action.id) || actions.length >= 3) return;
        seen.add(action.id);
        actions.push(action);
    };

    const primaryAttentionItem = reqSummary?.attentionItems[0];
    if (primaryAttentionItem) {
        pushAction({
            id: `attention:${primaryAttentionItem.id}`,
            source: '需关注',
            title: `回看需求：${primaryAttentionItem.title}`,
            note: primaryAttentionItem.signal
                ? `${describeFreshness(primaryAttentionItem.freshness)} 当前焦点：${primaryAttentionItem.signal}`
                : describeFreshness(primaryAttentionItem.freshness),
            href: primaryAttentionItem.href,
            cta: '打开需求',
        });
    }

    if (reqSummary && reqSummary.countByStatus.inbox > 0) {
        pushAction({
            id: 'requirements:inbox',
            source: '待处理',
            title: `清理 ${reqSummary.countByStatus.inbox} 条待判断需求`,
            note: '先过滤掉不该继续做的项，再把值得推进的需求移进需求梳理。',
            href: '/requirements',
            cta: '开始清理',
        });
    }

    if (reqSummary && reqSummary.countByStatus.validating > 0) {
        pushAction({
            id: 'requirements:validating',
            source: '验证中',
            title: `补齐 ${reqSummary.countByStatus.validating} 条验证结论`,
            note: '把验证结果、剩余风险和最终结论写回文档，避免状态长时间卡在验证中。',
            href: '/requirements',
            cta: '查看验证项',
        });
    }

    if (reqSummary && reqSummary.countByStatus.ready > 0) {
        pushAction({
            id: 'requirements:ready',
            source: '待开始',
            title: `拆分 ${reqSummary.countByStatus.ready} 条待开始需求`,
            note: '把范围切成下一轮可交付的小步，再决定进入开发中的顺序。',
            href: '/requirements',
            cta: '打开待开始',
        });
    }

    const inProgressTasks = systemPlan.phases.flatMap((phase) =>
        phase.tasks
            .filter((task) => task.status === 'in_progress')
            .map((task) => ({
                id: `roadmap:${phase.name}:${task.title}`,
                source: '系统规划',
                title: task.title,
                note: task.note,
                href: '/roadmap',
                cta: '查看规划',
            })),
    );

    for (const task of inProgressTasks) {
        pushAction(task);
    }

    pushAction({
        id: 'workspace:builder',
        source: '工作台',
        title: '继续微调首页入口',
        note: '如果今天的主路径已经稳定，可以继续压缩首页信息密度，让入口更短更准。',
        href: '/workspace/home-builder',
        cta: '打开首页生成器',
    });

    pushAction({
        id: 'learn:japanese',
        source: '学习',
        title: '把学习流接回日语笔记',
        note: '继续补今日日语的复习和 TTS 承接，让学习入口不再漂在导航里。',
        href: '/docs/japanese',
        cta: '打开日语笔记',
    });

    return actions.slice(0, 3);
}

function buildPersonalBriefContext(plan: GeneratedHomepagePlan | null): PersonalBriefContext | null {
    if (!plan) return null;

    const template = getPersonalHomeTemplate(plan.templateId);
    const focusSection =
        plan.sections.find((section) => section.kind === 'focus' || section.kind === 'task')
        || plan.sections[0]
        || null;

    return {
        templateName: template?.name || plan.pageTitle,
        accentLabel: template?.accentLabel || plan.heroEyebrow,
        focusTitle: focusSection?.title || null,
        routeTitles: plan.recommendedRoutes.slice(0, 3).map((route) => route.title),
        primaryRouteHref: plan.recommendedRoutes[0]?.href || null,
    };
}

function buildDailySummary(
    plan: GeneratedHomepagePlan | null,
    reqSummary: RequirementsSummaryResponse | null,
    suggestedActions: SuggestedAction[],
    signedIn: boolean,
): DailySummary {
    const briefContext = buildPersonalBriefContext(plan);
    const primaryAction = suggestedActions[0] ?? null;
    const reqStale = reqSummary?.freshnessByActiveStatus.stale ?? 0;
    const reqActive = reqSummary?.active ?? 0;
    const reqInbox = reqSummary?.countByStatus.inbox ?? 0;
    const reqValidating = reqSummary?.countByStatus.validating ?? 0;

    let title = '今天先沿着已有进度继续推进';
    if (reqStale > 0 || reqInbox > 0 || reqValidating > 0) {
        title = '今天先把需求状态收紧';
    } else if (!signedIn) {
        title = '今天先把学习和创作入口收回来';
    } else if (briefContext) {
        if (plan?.templateId === 'learning') {
            title = '今天先把学习节奏带起来';
        } else if (plan?.templateId === 'work') {
            title = '今天先把执行主线压实';
        } else if (plan?.templateId === 'life') {
            title = '今天先把生活节奏稳住';
        } else if (plan?.templateId === 'hybrid') {
            title = '今天先沿着你的综合主轴推进';
        }
    }

    const summaryParts = [
        reqSummary
            ? reqStale > 0
                ? `需求看板里有 ${reqStale} 条搁置项需要回看`
                : reqActive > 0
                    ? `需求看板里有 ${reqActive} 条活跃项可以继续推进`
                    : reqInbox > 0
                        ? `需求看板里还有 ${reqInbox} 条待判断项`
                        : '需求看板当前没有明显阻塞'
            : '需求脉搏暂时不可用',
        primaryAction ? `建议先 ${primaryAction.title}` : '建议先打开一个核心入口开始推进',
    ];

    if (briefContext?.focusTitle) {
        summaryParts.push(`当前个性化首页主轴是 ${briefContext.focusTitle}`);
    }

    if (briefContext?.routeTitles.length) {
        summaryParts.push(`建议入口优先看 ${briefContext.routeTitles.join('、')}`);
    }

    const sources: DailySummarySource[] = [];

    sources.push({
        label: '需求脉搏',
        summary: reqSummary
            ? reqStale > 0
                ? `${reqStale} 条搁置 / ${reqActive} 条活跃`
                : `${reqActive} 条活跃 / ${reqInbox} 条待判断`
            : '暂时不可用',
        detail: reqSummary?.attentionItems[0]
            ? `${reqSummary.attentionItems[0].title}${reqSummary.attentionItems[0].signal ? `：${reqSummary.attentionItems[0].signal}` : ''}`
            : '当前需求主线没有显著阻塞。',
        href: '/requirements',
        cta: '打开看板',
    });

    if (briefContext) {
        sources.push({
            label: '个性主轴',
            summary: briefContext.focusTitle || briefContext.templateName,
            detail: briefContext.routeTitles.length
                ? `推荐入口：${briefContext.routeTitles.join(' / ')}`
                : briefContext.accentLabel,
            href: briefContext.primaryRouteHref || undefined,
            cta: briefContext.primaryRouteHref ? '打开入口' : undefined,
        });
    }

    if (primaryAction) {
        sources.push({
            label: '建议下一步',
            summary: primaryAction.title,
            detail: primaryAction.note,
            href: primaryAction.href,
            cta: primaryAction.cta,
        });
    }

    return {
        eyebrow: briefContext
            ? `${briefContext.accentLabel} / AI 每日简报`
            : '工作台 / AI 每日摘要',
        title,
        summary: `${summaryParts.join('，')}。`,
        highlights: [
            {
                label: '需求',
                value: reqSummary
                    ? reqStale > 0
                        ? `${reqStale} 条搁置，${reqInbox} 条待判断`
                        : `${reqActive} 条活跃，${reqValidating} 条验证中`
                    : '等待实时脉搏',
            },
            {
                label: '状态',
                value: signedIn
                    ? '已登录，可继续定制工作台入口'
                    : '未登录，先用公开入口组织今天',
            },
            {
                label: '主轴',
                value: briefContext?.focusTitle || briefContext?.templateName || '工作台默认入口',
            },
            {
                label: '入口',
                value: briefContext?.routeTitles.length
                    ? briefContext.routeTitles.join(' / ')
                    : primaryAction?.cta || '打开工作台',
            },
        ],
        sources,
        primaryAction,
    };
}

function BriefSourcesGrid({
    sources,
    accentColor,
    accentSoftColor,
    surfaceColor,
}: {
    sources: DailySummarySource[];
    accentColor?: string;
    accentSoftColor?: string;
    surfaceColor?: string;
}) {
    if (!sources.length) return null;

    const sectionStyle = accentSoftColor ? { borderColor: accentSoftColor } : undefined;
    const badgeStyle = accentColor && accentSoftColor
        ? { backgroundColor: accentSoftColor, color: accentColor }
        : undefined;
    const cardStyle = accentSoftColor && surfaceColor
        ? { borderColor: accentSoftColor, backgroundColor: surfaceColor }
        : undefined;
    const ctaStyle = accentColor ? { color: accentColor } : undefined;

    return (
        <div className="mt-6 border-t border-slate-200/80 pt-6" style={sectionStyle}>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <ActivitySquare size={14} />
                摘要来源
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
                这张 daily brief 主要由这些实时脉搏和入口主轴推出来。
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
                {sources.map((source) => {
                    const content = (
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div
                                    className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                                        badgeStyle ? '' : 'bg-slate-100 text-slate-600'
                                    }`}
                                    style={badgeStyle}
                                >
                                    {source.label}
                                </div>
                                <div className="mt-4 text-base font-semibold text-slate-900">
                                    {source.summary}
                                </div>
                                <p className="mt-2 text-sm leading-7 text-slate-600">
                                    {source.detail}
                                </p>
                                {source.cta ? (
                                    <div
                                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
                                        style={ctaStyle}
                                    >
                                        {source.cta}
                                        {source.href ? <ArrowRight size={14} /> : null}
                                    </div>
                                ) : null}
                            </div>
                            {source.href ? (
                                <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300" />
                            ) : null}
                        </div>
                    );

                    const className = `rounded-[24px] border px-4 py-4 ${
                        source.href ? 'link-card-hover block' : ''
                    } ${cardStyle ? '' : 'border-slate-200 bg-slate-50'}`;

                    return source.href ? (
                        <Link
                            key={`${source.label}-${source.summary}`}
                            href={source.href}
                            className={className}
                            style={cardStyle}
                        >
                            {content}
                        </Link>
                    ) : (
                        <div
                            key={`${source.label}-${source.summary}`}
                            className={className}
                            style={cardStyle}
                        >
                            {content}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PersonalizedWorkspaceHome({
    plan,
    dailySummary,
    suggestedActions,
    onReset,
}: {
    plan: GeneratedHomepagePlan;
    dailySummary: DailySummary;
    suggestedActions: SuggestedAction[];
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
                                AI 说明
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

                <section>
                    <article
                        className="rounded-[32px] border bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8"
                        style={{ borderColor: plan.palette.accentSoft }}
                    >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="max-w-3xl">
                                <div
                                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                                    style={{ backgroundColor: plan.palette.accentSoft, color: plan.palette.accent }}
                                >
                                    <Sparkles size={14} />
                                    {dailySummary.eyebrow}
                                </div>
                                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                                    {dailySummary.title}
                                </h2>
                                <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
                                    {dailySummary.summary}
                                </p>
                            </div>
                            {dailySummary.primaryAction ? (
                                <Link
                                    href={dailySummary.primaryAction.href}
                                    className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                                    style={{ backgroundColor: plan.palette.accent }}
                                >
                                    {dailySummary.primaryAction.cta}
                                    <ArrowRight size={16} />
                                </Link>
                            ) : null}
                        </div>
                        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {dailySummary.highlights.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-[22px] px-4 py-3 text-sm leading-7 text-slate-700"
                                    style={{ backgroundColor: plan.palette.surface }}
                                >
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        {item.label}
                                    </div>
                                    <div className="mt-2 text-sm leading-7 text-slate-700">
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <BriefSourcesGrid
                            sources={dailySummary.sources}
                            accentColor={plan.palette.accent}
                            accentSoftColor={plan.palette.accentSoft}
                            surfaceColor={plan.palette.surface}
                        />
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
                                        常用入口
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
                                        className="link-card-hover block rounded-[24px] border border-slate-200 bg-slate-50 p-5 hover:border-slate-300 hover:bg-white"
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
                                建议下一步
                            </div>
                            <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                                这套首页之外，当前更值得先推进的动作
                            </div>
                            <div className="mt-6 space-y-4">
                                {suggestedActions.map((action) => (
                                    <Link
                                        key={action.id}
                                        href={action.href}
                                        className="link-card-hover block rounded-[24px] border px-5 py-5"
                                        style={{ borderColor: plan.palette.accentSoft, backgroundColor: plan.palette.surface }}
                                    >
                                        <div
                                            className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                                            style={{ backgroundColor: plan.palette.accentSoft, color: plan.palette.accent }}
                                        >
                                            {action.source}
                                        </div>
                                        <div className="mt-4 text-lg font-semibold text-slate-900">
                                            {action.title}
                                        </div>
                                        <p className="mt-3 text-sm leading-7 text-slate-600">
                                            {action.note}
                                        </p>
                                        <div
                                            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"
                                            style={{ color: plan.palette.accent }}
                                        >
                                            {action.cta}
                                            <ArrowRight size={14} />
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
                                生成状态
                            </div>
                            <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                                这套首页已应用到你的工作台
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

    const [reqSummary, setReqSummary] = useState<RequirementsSummaryResponse | null>(null);
    const [isReqSummaryLoading, setIsReqSummaryLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        setIsReqSummaryLoading(true);
        fetch('/api/requirements/summary', { cache: 'no-store' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (cancelled) return;
                if (data && !data.error) {
                    setReqSummary(data as RequirementsSummaryResponse);
                    return;
                }
                setReqSummary(null);
            })
            .catch(() => {
                if (!cancelled) {
                    setReqSummary(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsReqSummaryLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const activePhase = systemPlan.phases.find((phase) => phase.status === 'in_progress') || systemPlan.phases[0];
    const phaseMeta = planStatusMeta[activePhase.status];
    const suggestedActions = buildSuggestedActions(reqSummary);
    const dailySummary = buildDailySummary(personalPlan, reqSummary, suggestedActions, signedIn);

    if (personalPlan) {
        return (
            <PersonalizedWorkspaceHome
                plan={personalPlan}
                dailySummary={dailySummary}
                suggestedActions={suggestedActions}
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
                    <article className="animate-fade-in-up overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
                        <div className="bg-[radial-gradient(circle_at_top_left,#dfeaf9_0%,#eef4fb_40%,#ffffff_100%)] px-6 py-8 md:px-10 md:py-10">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm font-medium text-sky-700">
                                    工作台 / 每日入口
                                </div>
                                <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-sm font-medium text-emerald-700">
                                    {getGreeting()}
                                </div>
                            </div>
                            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                                从这里开始今天的创作、学习和下一步开发
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                                工作台首版先不追求复杂，而是把你真正会反复打开的入口收进来：今天要做什么、先记到哪里、最近做到哪、接下来该推进什么。
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
                                        登录后把工作台作为默认入口
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

                    <article className="animate-fade-in-up stagger-2 rounded-[36px] border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.16)] md:p-8">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-300">
                                    今日
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
                        <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                                    需求脉搏
                                </div>
                                <Link
                                    href="/requirements"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-200 transition hover:text-white"
                                >
                                    打开看板
                                    <ArrowRight size={12} />
                                </Link>
                            </div>
                            {isReqSummaryLoading ? (
                                <div className="mt-4 space-y-3">
                                    <div className="flex flex-wrap gap-3">
                                        {[1, 2, 3, 4].map((item) => (
                                            <div
                                                key={item}
                                                className="h-8 w-20 animate-pulse rounded-full bg-white/10"
                                            />
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        {[1, 2].map((item) => (
                                            <div
                                                key={item}
                                                className="h-14 animate-pulse rounded-[18px] border border-white/8 bg-white/5"
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : reqSummary ? (
                                <>
                                    <div className="mt-3 flex flex-wrap gap-3">
                                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                                            {reqSummary.total} 总计
                                        </span>
                                        <span className="rounded-full border border-sky-400/30 bg-sky-500/20 px-3 py-1 text-sm font-semibold text-sky-200">
                                            {reqSummary.active} 活跃
                                        </span>
                                        <span className="rounded-full border border-rose-400/30 bg-rose-500/20 px-3 py-1 text-sm font-semibold text-rose-200">
                                            {reqSummary.freshnessByActiveStatus.stale} 需回看
                                        </span>
                                        <span className="rounded-full border border-amber-400/30 bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-200">
                                            {reqSummary.countByStatus.inbox} 待判断
                                        </span>
                                    </div>
                                    {reqSummary.attentionItems.length > 0 ? (
                                        <div className="mt-4 space-y-2">
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                需要关注
                                            </div>
                                            {reqSummary.attentionItems.map((item) => (
                                                <Link
                                                    key={item.id}
                                                    href={item.href}
                                                    className="link-card-hover flex items-start justify-between gap-3 rounded-[18px] border border-white/10 bg-white/5 px-3 py-3 hover:bg-white/10"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${requirementStatusMeta[item.status].badgeClass}`}>
                                                                {requirementStatusMeta[item.status].label}
                                                            </span>
                                                            {item.freshness ? (
                                                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${requirementFreshnessMeta[item.freshness].badgeClass}`}>
                                                                    {requirementFreshnessMeta[item.freshness].label}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div className="mt-2 truncate text-sm font-semibold text-white">
                                                            {item.title}
                                                        </div>
                                                        {item.signal ? (
                                                            <div className="mt-1 text-xs leading-6 text-slate-300">
                                                                {item.signal}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    <ArrowRight size={14} className="mt-1 shrink-0 text-slate-400" />
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-4 rounded-[18px] border border-emerald-400/20 bg-emerald-500/10 px-3 py-3 text-sm leading-7 text-emerald-100">
                                            当前没有需要优先回看的开发中 / 验证中项。
                                        </div>
                                    )}
                                    {reqSummary.recentItems.length > 0 ? (
                                        <div className="mt-4 space-y-2">
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                最近更新
                                            </div>
                                            {reqSummary.recentItems.map((item) => (
                                                <Link
                                                    key={`${item.id}-${item.updatedAt}`}
                                                    href={item.href}
                                                    className="flex items-center justify-between gap-3 rounded-[18px] border border-transparent px-1 py-1 text-sm text-slate-300 transition hover:border-white/5 hover:bg-white/5"
                                                >
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${requirementStatusMeta[item.status].badgeClass}`}>
                                                            {requirementStatusMeta[item.status].label}
                                                        </span>
                                                        <span className="truncate">{item.title}</span>
                                                    </div>
                                                    <span className="shrink-0 text-xs text-slate-400">
                                                        {formatPulseUpdatedAt(item.updatedAt)}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <div className="mt-4 rounded-[18px] border border-white/10 bg-white/5 px-3 py-3 text-sm leading-7 text-slate-300">
                                    当前没有拿到需求概览，直接打开需求看板查看实时状态。
                                </div>
                            )}
                        </div>
                    </article>
                </section>

                <section>
                    <article className="animate-fade-in-up stagger-3 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                                    <Sparkles size={14} />
                                    {dailySummary.eyebrow}
                                </div>
                                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                                    {dailySummary.title}
                                </h2>
                                <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
                                    {dailySummary.summary}
                                </p>
                            </div>
                            {dailySummary.primaryAction ? (
                                <Link
                                    href={dailySummary.primaryAction.href}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                                >
                                    {dailySummary.primaryAction.cta}
                                    <ArrowRight size={16} />
                                </Link>
                            ) : null}
                        </div>
                        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {dailySummary.highlights.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700"
                                >
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        {item.label}
                                    </div>
                                    <div className="mt-2 text-sm leading-7 text-slate-700">
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <BriefSourcesGrid sources={dailySummary.sources} />
                    </article>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <article className="animate-fade-in-up stagger-4 card-hover rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                        <div className="flex items-center gap-3">
                            <div className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-700">
                                <Zap size={22} />
                            </div>
                            <div>
                                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                    快速记录
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
                                    className="link-card-hover rounded-[26px] border border-slate-200 bg-slate-50 p-5 hover:border-slate-300 hover:bg-white"
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

                    <article className="animate-fade-in-up stagger-5 card-hover rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                        <div className="flex items-center gap-3">
                            <div className="inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                                <CheckSquare size={22} />
                            </div>
                            <div>
                                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                    建议下一步
                                </div>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                    根据当前状态，先推进这 3 件事
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-slate-600">
                                    这里优先参考需求脉搏，其次回落到系统规划中的进行中任务。
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 space-y-4">
                            {suggestedActions.map((action) => (
                                <Link
                                    key={action.id}
                                    href={action.href}
                                    className="link-card-hover block rounded-[24px] border border-slate-200 bg-slate-50 p-5 hover:border-slate-300 hover:bg-white"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                                {action.source}
                                            </div>
                                            <div className="mt-4 text-lg font-semibold text-slate-900">
                                                {action.title}
                                            </div>
                                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                                {action.note}
                                            </p>
                                            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                {action.cta}
                                                <ArrowRight size={14} />
                                            </div>
                                        </div>
                                        <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </article>
                </section>

                <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <article className="animate-fade-in-up stagger-6 card-hover rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                        <div className="flex items-center gap-3">
                            <div className="inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700">
                                <BookOpenText size={22} />
                            </div>
                            <div>
                                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                    最近常用
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
                                    className="link-card-hover block rounded-[24px] border border-slate-200 bg-slate-50 p-5 hover:border-slate-300 hover:bg-white"
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
                        <article className="animate-fade-in-up card-hover rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                            <div className="flex items-center gap-3">
                                <div className="inline-flex rounded-2xl bg-violet-100 p-3 text-violet-700">
                                    <LibraryBig size={22} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                        固定入口
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
                                        className="link-card-hover rounded-[24px] border border-slate-200 bg-slate-50 p-5 hover:border-slate-300 hover:bg-white"
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
                                        今日学习流
                                    </div>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                        把学习流和表达练习压回今天的上下文
                                    </h2>
                                </div>
                            </div>
                            <div className="mt-6">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800/60">
                                    今日学习
                                </div>
                                <div className="mt-3 space-y-3">
                                    {todayLearningStack.map((item) => (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            className="link-card-hover block rounded-[22px] border border-white/70 bg-white/70 px-4 py-4 hover:bg-white"
                                        >
                                            <div className="text-base font-semibold text-slate-900">
                                                {item.title}
                                            </div>
                                            <p className="mt-2 text-sm leading-7 text-slate-700">
                                                {item.note}
                                            </p>
                                            <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
                                                {item.cta}
                                                <ArrowRight size={14} />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </article>
                    </div>
                </section>
            </div>
        </main>
    );
}
