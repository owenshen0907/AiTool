import type {
    GeneratedHomepagePlan,
    GeneratedHomepageRoute,
    GeneratedHomepageSection,
    HomepageFormAnswers,
    PersonalHomeTemplate,
} from '@/lib/personalHome';

const availableRoutes: GeneratedHomepageRoute[] = [
    { title: 'Workspace', href: '/workspace', reason: '回到你的日常入口。' },
    { title: 'Prompt Studio', href: '/prompt/manage', reason: '继续你的核心创作与提示词流。' },
    { title: 'Prompt 调试', href: '/prompt/case', reason: '延续用例和结果验证。' },
    { title: 'Japanese Notes', href: '/docs/japanese', reason: '沉淀学习输入与复习内容。' },
    { title: 'TTS Practice', href: '/audio/tts', reason: '承接语音练习与输出。' },
    { title: 'Image Generate', href: '/agent/image/generate', reason: '继续图像创作任务。' },
    { title: 'Roadmap', href: '/roadmap', reason: '查看当前系统规划与下一步。' },
    { title: '文件工具', href: '/stepfun/file', reason: '快速处理文件和资料。' },
];

function compactList(value: string | undefined) {
    return (value || '')
        .split(/[\n,，、；;]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function firstNonEmpty(...values: Array<string | undefined>) {
    return values.map((value) => value?.trim()).find(Boolean) || '';
}

function clampItems(items: string[], fallback: string[]) {
    const safe = items.filter(Boolean).slice(0, 5);
    return safe.length ? safe : fallback;
}

function pickRoutes(template: PersonalHomeTemplate, answers: HomepageFormAnswers) {
    const preferred = [
        ...compactList(answers.mustSeeInfo),
        ...compactList(answers.studyMethods),
        ...compactList(answers.topPriorities),
        ...compactList(answers.currentProjects),
    ].join(' ');

    const scored = availableRoutes.map((route) => {
        let score = 0;
        if (/prompt/i.test(preferred) && /Prompt/.test(route.title)) score += 2;
        if (/日语|学习|shadowing|复习|TTS/i.test(preferred) && /(Japanese|TTS)/.test(route.title)) score += 2;
        if (/图片|图像|创作/i.test(preferred) && /Image/.test(route.title)) score += 2;
        if (/规划|路线|roadmap/i.test(preferred) && /Roadmap/.test(route.title)) score += 2;
        if (route.href === '/workspace') score += 1;
        if (template.id === 'work' && /Prompt|Roadmap/.test(route.title)) score += 1;
        if (template.id === 'learning' && /(Japanese|TTS)/.test(route.title)) score += 1;
        return { route, score };
    });

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map((entry) => entry.route);
}

function makeSection(id: string, kind: GeneratedHomepageSection['kind'], title: string, description: string, items: string[]): GeneratedHomepageSection {
    return { id, kind, title, description, items };
}

function paletteForTemplate(templateId: PersonalHomeTemplate['id']) {
    switch (templateId) {
        case 'life':
            return {
                background: 'linear-gradient(180deg,#fff7f2 0%,#fffdf8 44%,#ffffff 100%)',
                surface: '#fff8f2',
                accent: '#ea580c',
                accentSoft: '#ffedd5',
                text: '#431407',
            };
        case 'learning':
            return {
                background: 'linear-gradient(180deg,#eef8ff 0%,#f7fbff 44%,#ffffff 100%)',
                surface: '#f0f9ff',
                accent: '#0284c7',
                accentSoft: '#dbeafe',
                text: '#082f49',
            };
        case 'work':
            return {
                background: 'linear-gradient(180deg,#f5f5f4 0%,#fafaf9 44%,#ffffff 100%)',
                surface: '#f5f5f4',
                accent: '#334155',
                accentSoft: '#e2e8f0',
                text: '#0f172a',
            };
        case 'hybrid':
        default:
            return {
                background: 'linear-gradient(180deg,#f0fdf4 0%,#f7fee7 30%,#eff6ff 100%)',
                surface: '#f7fee7',
                accent: '#15803d',
                accentSoft: '#dcfce7',
                text: '#14532d',
            };
    }
}

export function buildHomepageCode(plan: Omit<GeneratedHomepagePlan, 'code'>) {
    const prettySections = JSON.stringify(plan.sections, null, 2);
    const prettyRoutes = JSON.stringify(plan.recommendedRoutes, null, 2);

    return `import Link from 'next/link';

const sections = ${prettySections};
const routes = ${prettyRoutes};

export default function PersonalHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            ${plan.heroEyebrow}
          </div>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">
            ${plan.heroHeadline}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            ${plan.heroDescription}
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
            {sections.map((section) => (
              <article key={section.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{section.description}</p>
                <div className="mt-5 space-y-3">
                  {section.items.map((item) => (
                    <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Quick Routes
            </div>
            <div className="mt-5 space-y-4">
              {routes.map((route) => (
                <Link key={route.href} href={route.href} className="block rounded-2xl bg-slate-50 px-4 py-4 transition hover:bg-slate-100">
                  <div className="text-base font-semibold text-slate-900">{route.title}</div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{route.reason}</p>
                </Link>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
`;
}

export function buildFallbackHomepagePlan(template: PersonalHomeTemplate, answers: HomepageFormAnswers): GeneratedHomepagePlan {
    const homeName = firstNonEmpty(answers.homeName, `${template.name}`);
    const identity = firstNonEmpty(answers.identity, answers.role, answers.learningFocus);
    const priorities = compactList(firstNonEmpty(answers.topPriorities, answers.goals, answers.currentProjects));
    const habits = compactList(firstNonEmpty(answers.routines, answers.dailyCadence, answers.mustSeeInfo));
    const style = firstNonEmpty(answers.stylePreference, answers.workStyle, '清晰、友好、可持续使用');
    const palette = paletteForTemplate(template.id);

    const sections: GeneratedHomepageSection[] = [];

    if (template.id === 'life') {
        sections.push(
            makeSection('today-rhythm', 'focus', '今日节奏', '让首页先把今天的生活节奏稳下来。', clampItems(habits, ['安排一个轻量开始动作', '留一个记录当下的时刻', '晚上做一次简单复盘'])),
            makeSection('life-focus', 'list', '近期生活重点', '把最近最重要的生活主题放在眼前。', clampItems(priorities, ['维持稳定作息', '推进下一次旅行计划', '持续记录照片与灵感'])),
            makeSection('capture', 'journal', '生活记录入口', '把照片、旅行想法和日常感受沉淀下来。', ['今天拍到的 1 张照片', '最近想去的 1 个地方', '一句值得留下的话']),
        );
    } else if (template.id === 'learning') {
        sections.push(
            makeSection('today-study', 'task', '今日学习', '先明确今天学什么、练什么、复习什么。', clampItems(priorities, ['复习昨天的核心知识点', '做一次主动输出', '把新内容沉淀成笔记'])),
            makeSection('review-loop', 'progress', '复习闭环', '保证输入、练习、复盘连成一个循环。', clampItems(habits, ['先复习 15 分钟', '记录 1 条关键句子', '做 1 次口头或书面输出'])),
            makeSection('learning-methods', 'list', '学习方法面板', '保留你最常用的学习动作，减少切换成本。', clampItems(compactList(answers.studyMethods), ['整理笔记', '跟读练习', '例句复盘'])),
        );
    } else if (template.id === 'work') {
        sections.push(
            makeSection('today-priority', 'focus', '今日重点', '先看到最重要的事情，再进入执行。', clampItems(priorities, ['完成一个最小可交付改动', '验证当前改动', '记录下一步任务'])),
            makeSection('must-see', 'task', '每天先看什么', '把你每天最想先看到的信息固定下来。', clampItems(compactList(answers.mustSeeInfo), ['当前阻塞', '今日重点', '最近产出', '待验证事项'])),
            makeSection('execution-style', 'progress', '执行方式', '让首页匹配你的工作节奏和推进方式。', clampItems(habits, ['先做最小切片', '每轮完成后更新状态', '把下一步写清楚'])),
        );
    } else {
        sections.push(
            makeSection('today-balance', 'focus', '今天的平衡点', '综合页面先帮你确认今天最重要的分配。', clampItems(priorities, ['先推进工作主线', '给学习留固定时间', '保留生活记录窗口'])),
            makeSection('work-zone', 'task', '工作区', '承接执行、推进和产出。', clampItems(compactList(answers.balance), ['工作区保持可执行', '学习区保持连贯', '生活区保持轻量'])),
            makeSection('life-learning', 'list', '学习与生活', '避免首页只剩工作，把长期节奏一起放回来。', clampItems(habits, ['留一段学习时间', '做一次生活记录', '回看最近进展']))
        );
    }

    const planWithoutCode = {
        templateId: template.id,
        generationMode: 'fallback' as const,
        generatedAt: new Date().toISOString(),
        pageTitle: homeName,
        pageSummary: `${template.name}，面向 ${identity || '当前阶段的你'}，风格偏向 ${style}。`,
        heroEyebrow: `${template.accentLabel} / Personalized Home`,
        heroHeadline: homeName,
        heroDescription:
            identity
                ? `这是为 ${identity} 生成的首页首版，优先承接 ${template.suggestedSections.slice(0, 3).join('、')} 这些高频内容。`
                : `这是一个围绕 ${template.suggestedSections.slice(0, 3).join('、')} 组织的个性化首页首版。`,
        palette,
        sections,
        recommendedRoutes: pickRoutes(template, answers),
        aiNotes: [
            `首页风格关键词：${style}`,
            '建议先把这份首页应用到 Workspace，再继续补保存和版本管理。',
            '后续可以把真实最近记录、任务和学习数据接入这些模块。',
        ],
    };

    return {
        ...planWithoutCode,
        code: buildHomepageCode(planWithoutCode),
    };
}

function sanitizeSection(section: any, fallbackId: string): GeneratedHomepageSection | null {
    if (!section || typeof section !== 'object') return null;
    const title = typeof section.title === 'string' ? section.title.trim() : '';
    const description = typeof section.description === 'string' ? section.description.trim() : '';
    const kind = ['focus', 'task', 'list', 'progress', 'shortcut', 'journal'].includes(section.kind)
        ? section.kind
        : 'list';
    const items = Array.isArray(section.items)
        ? section.items
              .filter((item: unknown): item is string => typeof item === 'string')
              .map((item: string) => item.trim())
              .filter(Boolean)
              .slice(0, 5)
        : [];
    if (!title || !description || !items.length) return null;
    return {
        id: typeof section.id === 'string' && section.id.trim() ? section.id.trim() : fallbackId,
        kind,
        title,
        description,
        items,
    };
}

function parseModelJson(text: string) {
    const trimmed = text.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first === -1 || last === -1 || last <= first) {
        throw new Error('Model JSON not found');
    }
    return JSON.parse(trimmed.slice(first, last + 1));
}

export async function generateHomepagePlanWithAI(template: PersonalHomeTemplate, answers: HomepageFormAnswers) {
    const apiKey = process.env.STEP_API_KEY || '';
    const apiUrl = process.env.STEP_API_URL || 'https://api.stepfun.com/v1';
    const model = process.env.HOMEPAGE_GEN_MODEL || 'step-2-16k';

    if (!apiKey || /your_|【/.test(apiKey)) {
        return buildFallbackHomepagePlan(template, answers);
    }

    const prompt = [
        '你是一个擅长设计个性化首页的 AI 产品设计师与前端信息架构师。',
        '请根据给定模板与用户填写的信息，输出严格可解析 JSON，不要输出 markdown。',
        'JSON 格式：',
        JSON.stringify({
            pageTitle: 'string',
            pageSummary: 'string',
            heroEyebrow: 'string',
            heroHeadline: 'string',
            heroDescription: 'string',
            palette: {
                background: 'string',
                surface: 'string',
                accent: 'string',
                accentSoft: 'string',
                text: 'string',
            },
            sections: [
                {
                    id: 'string',
                    kind: 'focus | task | list | progress | shortcut | journal',
                    title: 'string',
                    description: 'string',
                    items: ['string'],
                },
            ],
            recommendedRoutes: [
                {
                    title: 'string',
                    href: 'must be one of known routes',
                    reason: 'string',
                },
            ],
            aiNotes: ['string'],
        }),
        `模板：${template.name}`,
        `模板说明：${template.description}`,
        `建议区块：${template.suggestedSections.join('、')}`,
        `可用站内路由：${availableRoutes.map((route) => `${route.title}=${route.href}`).join('；')}`,
        `用户填写信息：${JSON.stringify(answers, null, 2)}`,
        '要求：',
        '1. 生成 3 到 5 个首页区块。',
        '2. 每个区块都必须具体，避免空话。',
        '3. 文案风格要贴近用户填写的语气。',
        '4. recommendedRoutes 只能从给定路由里选 3 到 4 个。',
        '5. 所有文案使用简体中文。',
    ].join('\n');

    try {
        const response = await fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                stream: false,
                messages: [
                    {
                        role: 'system',
                        content: '你只输出严格 JSON。不要解释，不要 markdown 代码块。',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.8,
            }),
        });

        if (!response.ok) {
            throw new Error(`Upstream error: ${response.status}`);
        }

        const payload = await response.json();
        const content = payload?.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content.trim()) {
            throw new Error('Empty model response');
        }

        const json = parseModelJson(content);
        const sections = Array.isArray(json.sections)
            ? json.sections
                  .map((section: any, index: number) => sanitizeSection(section, `section-${index + 1}`))
                  .filter(Boolean) as GeneratedHomepageSection[]
            : [];
        const recommendedRoutes = Array.isArray(json.recommendedRoutes)
            ? json.recommendedRoutes
                  .filter((route: any) => route && typeof route.title === 'string' && typeof route.href === 'string' && typeof route.reason === 'string')
                  .map((route: any) => ({
                      title: route.title.trim(),
                      href: route.href.trim(),
                      reason: route.reason.trim(),
                  }))
                  .filter((route: GeneratedHomepageRoute) => availableRoutes.some((candidate) => candidate.href === route.href))
                  .slice(0, 4)
            : [];

        if (!sections.length) {
            throw new Error('Invalid generated sections');
        }

        const planWithoutCode = {
            templateId: template.id,
            generationMode: 'ai' as const,
            generatedAt: new Date().toISOString(),
            pageTitle: typeof json.pageTitle === 'string' && json.pageTitle.trim() ? json.pageTitle.trim() : firstNonEmpty(answers.homeName, template.name),
            pageSummary: typeof json.pageSummary === 'string' && json.pageSummary.trim() ? json.pageSummary.trim() : template.description,
            heroEyebrow: typeof json.heroEyebrow === 'string' && json.heroEyebrow.trim() ? json.heroEyebrow.trim() : `${template.accentLabel} / Personalized Home`,
            heroHeadline: typeof json.heroHeadline === 'string' && json.heroHeadline.trim() ? json.heroHeadline.trim() : firstNonEmpty(answers.homeName, template.name),
            heroDescription: typeof json.heroDescription === 'string' && json.heroDescription.trim() ? json.heroDescription.trim() : template.description,
            palette: {
                ...paletteForTemplate(template.id),
                ...(json.palette && typeof json.palette === 'object' ? json.palette : {}),
            },
            sections,
            recommendedRoutes: recommendedRoutes.length ? recommendedRoutes : pickRoutes(template, answers),
            aiNotes: Array.isArray(json.aiNotes)
                ? json.aiNotes.filter((note: any) => typeof note === 'string').map((note: string) => note.trim()).filter(Boolean).slice(0, 4)
                : ['AI 已生成首版首页，可继续调细节。'],
        };

        return {
            ...planWithoutCode,
            code: buildHomepageCode(planWithoutCode),
        };
    } catch (error) {
        console.error('generateHomepagePlanWithAI failed, fallback used', error);
        return buildFallbackHomepagePlan(template, answers);
    }
}
