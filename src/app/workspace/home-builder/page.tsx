'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/app/providers/UserProvider';
import { buildLoginModalPath } from '@/lib/auth/loginModal';
import {
    getAppliedHomeConfigKey,
    getHomeBuilderDraftKey,
    getPersonalHomeTemplate,
    personalHomeTemplates,
    type GeneratedHomepagePlan,
    type HomeBuilderDraft,
    type HomepageFormAnswers,
    type PersonalHomeTemplate,
    type PersonalHomeTemplateId,
} from '@/lib/personalHome';
import {
    ArrowRight,
    Check,
    Copy,
    Loader2,
    Sparkles,
    Wand2,
} from 'lucide-react';

interface GenerateResponse {
    ok?: boolean;
    message?: string;
    plan?: GeneratedHomepagePlan;
}

function createBlankAnswers(template: PersonalHomeTemplate): HomepageFormAnswers {
    return template.fields.reduce<HomepageFormAnswers>((acc, field) => {
        acc[field.id] = '';
        return acc;
    }, {});
}

function getUserStorageKey(userName?: string) {
    return userName?.trim() || 'guest';
}

export default function HomeBuilderPage() {
    const { user } = useUser();
    const isSignedIn = Boolean(user);
    const userKey = useMemo(() => getUserStorageKey(user?.name || user?.displayName), [user?.displayName, user?.name]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<PersonalHomeTemplateId>('hybrid');
    const [answers, setAnswers] = useState<HomepageFormAnswers>({});
    const [generatedPlan, setGeneratedPlan] = useState<GeneratedHomepagePlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [notice, setNotice] = useState('');
    const selectedTemplate = useMemo(
        () => getPersonalHomeTemplate(selectedTemplateId) || personalHomeTemplates[0],
        [selectedTemplateId]
    );
    const loginHref = buildLoginModalPath('/workspace/home-builder', '', '/workspace/home-builder');

    useEffect(() => {
        const draftKey = getHomeBuilderDraftKey(userKey);
        const raw = window.localStorage.getItem(draftKey);

        if (!raw) {
            const defaultTemplate = getPersonalHomeTemplate('hybrid') || personalHomeTemplates[0];
            setSelectedTemplateId(defaultTemplate.id);
            setAnswers(createBlankAnswers(defaultTemplate));
            setGeneratedPlan(null);
            return;
        }

        try {
            const draft = JSON.parse(raw) as HomeBuilderDraft;
            const template = getPersonalHomeTemplate(draft.templateId) || personalHomeTemplates[0];
            setSelectedTemplateId(template.id);
            setAnswers({ ...createBlankAnswers(template), ...(draft.answers || {}) });
            setGeneratedPlan(draft.generatedPlan || null);
        } catch {
            window.localStorage.removeItem(draftKey);
            const defaultTemplate = getPersonalHomeTemplate('hybrid') || personalHomeTemplates[0];
            setSelectedTemplateId(defaultTemplate.id);
            setAnswers(createBlankAnswers(defaultTemplate));
            setGeneratedPlan(null);
        }
    }, [userKey]);

    useEffect(() => {
        const draft: HomeBuilderDraft = {
            templateId: selectedTemplate.id,
            answers,
            generatedPlan,
        };
        window.localStorage.setItem(getHomeBuilderDraftKey(userKey), JSON.stringify(draft));
    }, [answers, generatedPlan, selectedTemplate.id, userKey]);

    const handleTemplateChange = (templateId: PersonalHomeTemplateId) => {
        const template = getPersonalHomeTemplate(templateId);
        if (!template) return;

        setSelectedTemplateId(templateId);
        setAnswers(createBlankAnswers(template));
        setGeneratedPlan(null);
        setErrorMessage('');
        setNotice('已切换模板，请填写这个模板的关键信息。');
    };

    const handleAnswerChange = (fieldId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [fieldId]: value }));
        setNotice('');
        setErrorMessage('');
    };

    const handleGenerate = async () => {
        if (!isSignedIn) {
            setErrorMessage('请先登录，再生成你的个性化首页。');
            return;
        }

        setLoading(true);
        setErrorMessage('');
        setNotice('');

        try {
            const response = await fetch('/api/homepage/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    templateId: selectedTemplate.id,
                    answers,
                }),
            });

            const result = (await response.json().catch(() => null)) as GenerateResponse | null;
            if (!response.ok || !result?.ok || !result.plan) {
                setErrorMessage(result?.message || '首页生成失败，请稍后再试。');
                return;
            }

            setGeneratedPlan(result.plan);
            setNotice(
                result.plan.generationMode === 'ai'
                    ? 'AI 已生成一版更细的首页方案。'
                    : '当前使用了回退生成方案，但已经生成可预览的个性首页。'
            );
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : '请求失败');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (!generatedPlan) return;
        window.localStorage.setItem(
            getAppliedHomeConfigKey(userKey),
            JSON.stringify(generatedPlan)
        );
        setNotice('已经应用到你的 Workspace。现在回去就能看到个性化首页。');
    };

    const handleCopyCode = async () => {
        if (!generatedPlan?.code) return;
        try {
            await navigator.clipboard.writeText(generatedPlan.code);
            setNotice('首页代码已复制。');
        } catch {
            setErrorMessage('复制失败，请手动复制代码。');
        }
    };

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_40%,#ffffff_100%)] px-4 py-10 md:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                    <article className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
                        <div className="bg-[radial-gradient(circle_at_top_left,#dceafe_0%,#eef4fb_38%,#ffffff_100%)] px-6 py-8 md:px-10 md:py-10">
                            <div className="inline-flex items-center rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm font-medium text-sky-700">
                                Personalized Home Builder
                            </div>
                            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
                                先选一个首页模板，再让 AI 把它变成你的专属 Workspace
                            </h1>
                            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                                这里不是随便拼几块卡片，而是先确定生活、学习、工作或综合导向，再用少量关键信息生成完整首页结构、文案和 React 页面代码。
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                {isSignedIn ? (
                                    <button
                                        type="button"
                                        onClick={handleGenerate}
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        生成我的首页
                                    </button>
                                ) : (
                                    <Link
                                        href={loginHref}
                                        scroll={false}
                                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                                    >
                                        登录后开始生成
                                        <ArrowRight size={16} />
                                    </Link>
                                )}
                                <Link
                                    href="/workspace"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    返回 Workspace
                                </Link>
                            </div>
                        </div>
                    </article>

                    <article className="rounded-[36px] border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.16)] md:p-8">
                        <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-300">
                            How It Works
                        </div>
                        <div className="mt-4 space-y-4">
                            {[
                                '选择一个适合你的首页模板：生活向、学习向、工作向或综合向。',
                                '填写 5 个左右的关键问题，让 AI 理解你真正想先看到什么。',
                                '系统生成首页结构、区块文案、推荐入口和可继续修改的 React 代码。',
                                '满意后点击“应用到 Workspace”，你的工作台就会切换成个性化首页。',
                            ].map((item, index) => (
                                <div key={item} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Step {index + 1}
                                    </div>
                                    <div className="mt-2 text-sm leading-7 text-slate-200">{item}</div>
                                </div>
                            ))}
                        </div>
                    </article>
                </section>

                <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                        <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                            Template Library
                        </div>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                            我先给用户 4 个足够清晰的首页起点
                        </h2>
                        <div className="mt-6 grid gap-4">
                            {personalHomeTemplates.map((template) => {
                                const active = template.id === selectedTemplate.id;
                                return (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => handleTemplateChange(template.id)}
                                        className={`rounded-[28px] border p-5 text-left transition ${
                                            active
                                                ? 'border-slate-900 bg-slate-900 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]'
                                                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                                        }`}
                                    >
                                        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${active ? 'bg-white/10 text-slate-200' : 'bg-white text-slate-500'}`}>
                                            {template.accentLabel}
                                        </div>
                                        <div className="mt-4 flex items-start justify-between gap-4">
                                            <div>
                                                <div className="text-2xl font-semibold tracking-tight">{template.name}</div>
                                                <p className={`mt-3 text-sm leading-7 ${active ? 'text-slate-200' : 'text-slate-600'}`}>
                                                    {template.description}
                                                </p>
                                            </div>
                                            {active ? <Check size={18} className="shrink-0" /> : null}
                                        </div>
                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {template.suggestedSections.map((section) => (
                                                <span
                                                    key={section}
                                                    className={`rounded-full px-3 py-1 text-xs ${active ? 'bg-white/10 text-slate-100' : 'bg-white text-slate-500'}`}
                                                >
                                                    {section}
                                                </span>
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </article>

                    <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                    Template Form
                                </div>
                                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                                    {selectedTemplate.name}
                                </h2>
                            </div>
                            <div className={`rounded-full bg-gradient-to-r px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 ${selectedTemplate.themeClass}`}>
                                {selectedTemplate.shortDescription}
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
                            {selectedTemplate.description}
                        </p>

                        <div className="mt-6 grid gap-5">
                            {selectedTemplate.fields.map((field) => {
                                const value = answers[field.id] || '';
                                return (
                                    <label key={field.id} className="block">
                                        <div className="text-base font-semibold text-slate-900">{field.label}</div>
                                        <div className="mt-2 text-sm leading-7 text-slate-500">{field.helper}</div>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                value={value}
                                                onChange={(event) => handleAnswerChange(field.id, event.target.value)}
                                                placeholder={field.placeholder}
                                                rows={4}
                                                className="mt-3 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
                                            />
                                        ) : (
                                            <input
                                                value={value}
                                                onChange={(event) => handleAnswerChange(field.id, event.target.value)}
                                                placeholder={field.placeholder}
                                                className="mt-3 h-14 w-full rounded-[999px] border border-slate-200 bg-slate-50 px-5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
                                            />
                                        )}
                                    </label>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={loading || !isSignedIn}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                生成首页方案
                            </button>
                            {generatedPlan ? (
                                <button
                                    type="button"
                                    onClick={handleApply}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    应用到 Workspace
                                </button>
                            ) : null}
                        </div>

                        {errorMessage ? (
                            <div className="mt-5 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
                                {errorMessage}
                            </div>
                        ) : null}
                        {notice ? (
                            <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-700">
                                {notice}
                            </div>
                        ) : null}
                    </article>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                    <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                    Live Preview
                                </div>
                                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                                    {generatedPlan ? '生成后的首页预览' : '等你生成后，这里会出现首页预览'}
                                </h2>
                            </div>
                            {generatedPlan ? (
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                    {generatedPlan.generationMode === 'ai' ? 'AI' : 'Fallback'}
                                </span>
                            ) : null}
                        </div>

                        {generatedPlan ? (
                            <div className="mt-6 space-y-5">
                                <div
                                    className="rounded-[30px] p-6 text-white"
                                    style={{ background: generatedPlan.palette.background }}
                                >
                                    <div className="rounded-full bg-white/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 inline-flex">
                                        {generatedPlan.heroEyebrow}
                                    </div>
                                    <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                                        {generatedPlan.heroHeadline}
                                    </div>
                                    <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-700 md:text-base">
                                        {generatedPlan.heroDescription}
                                    </p>
                                </div>

                                <div className="grid gap-4">
                                    {generatedPlan.sections.map((section) => (
                                        <div key={section.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                {section.kind}
                                            </div>
                                            <div className="mt-2 text-xl font-semibold text-slate-900">{section.title}</div>
                                            <p className="mt-3 text-sm leading-7 text-slate-600">{section.description}</p>
                                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                {section.items.map((item) => (
                                                    <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-slate-700">
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-sm leading-8 text-slate-500">
                                先选模板并填写信息。生成后，这里会展示首页 Hero、核心模块和推荐入口的完整预览。
                            </div>
                        )}
                    </article>

                    <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                    Generated Code
                                </div>
                                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                                    详细首页代码也一起给出来
                                </h2>
                            </div>
                            {generatedPlan?.code ? (
                                <button
                                    type="button"
                                    onClick={handleCopyCode}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    <Copy size={15} />
                                    复制代码
                                </button>
                            ) : null}
                        </div>

                        {generatedPlan?.code ? (
                            <pre className="mt-6 max-h-[760px] overflow-auto rounded-[28px] bg-slate-950 p-5 text-xs leading-6 text-slate-100">
                                <code>{generatedPlan.code}</code>
                            </pre>
                        ) : (
                            <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-sm leading-8 text-slate-500">
                                生成完成后，这里会给出一份可继续修改的 React 页面代码。第一版先保证结构清晰、组件稳定、可复制再迭代。
                            </div>
                        )}
                    </article>
                </section>
            </div>
        </main>
    );
}
