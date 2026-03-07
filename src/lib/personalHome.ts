export type PersonalHomeTemplateId = 'life' | 'learning' | 'work' | 'hybrid';

export interface PersonalHomeField {
    id: string;
    label: string;
    placeholder: string;
    helper: string;
    type: 'text' | 'textarea';
}

export interface PersonalHomeTemplate {
    id: PersonalHomeTemplateId;
    name: string;
    shortDescription: string;
    description: string;
    themeClass: string;
    accentLabel: string;
    suggestedSections: string[];
    fields: PersonalHomeField[];
}

export interface HomepageFormAnswers {
    [key: string]: string;
}

export interface GeneratedHomepageSection {
    id: string;
    kind: 'focus' | 'task' | 'list' | 'progress' | 'shortcut' | 'journal';
    title: string;
    description: string;
    items: string[];
}

export interface GeneratedHomepageRoute {
    title: string;
    href: string;
    reason: string;
}

export interface GeneratedHomepagePlan {
    templateId: PersonalHomeTemplateId;
    generationMode: 'ai' | 'fallback';
    generatedAt: string;
    pageTitle: string;
    pageSummary: string;
    heroEyebrow: string;
    heroHeadline: string;
    heroDescription: string;
    palette: {
        background: string;
        surface: string;
        accent: string;
        accentSoft: string;
        text: string;
    };
    sections: GeneratedHomepageSection[];
    recommendedRoutes: GeneratedHomepageRoute[];
    aiNotes: string[];
    code: string;
}

export interface HomeBuilderDraft {
    templateId: PersonalHomeTemplateId;
    answers: HomepageFormAnswers;
    generatedPlan?: GeneratedHomepagePlan | null;
}

export const personalHomeTemplates: PersonalHomeTemplate[] = [
    {
        id: 'life',
        name: '生活向首页',
        shortDescription: '更像一个温和、会陪你过日子的生活面板。',
        description:
            '适合记录日常安排、旅行计划、照片主题、灵感与生活目标，让首页首先服务于生活节奏。',
        themeClass: 'from-rose-100 via-orange-50 to-amber-100',
        accentLabel: '生活节奏 / 温暖记录',
        suggestedSections: ['今日安排', '生活清单', '最近照片', '旅行计划', '灵感速记'],
        fields: [
            {
                id: 'homeName',
                label: '你希望首页怎么称呼这个空间？',
                placeholder: '例如：Shen 的生活板',
                helper: '这个名字会出现在首页主标题里。',
                type: 'text',
            },
            {
                id: 'identity',
                label: '你当前最重要的生活身份是什么？',
                placeholder: '例如：在东京生活的自由职业者 / 喜欢旅行和摄影的人',
                helper: '帮助 AI 决定首页的语气和重点。',
                type: 'text',
            },
            {
                id: 'topPriorities',
                label: '你最近最重要的 3 件生活事情是什么？',
                placeholder: '例如：规律作息、筹备大阪旅行、记录每日照片',
                helper: '建议写成逗号分隔的 3 件事。',
                type: 'textarea',
            },
            {
                id: 'routines',
                label: '你希望首页每天提醒你的习惯或节奏有哪些？',
                placeholder: '例如：早起散步、晚间复盘、每周整理照片',
                helper: '这些会进入 Today 和清单模块。',
                type: 'textarea',
            },
            {
                id: 'stylePreference',
                label: '你想要的首页风格是什么？',
                placeholder: '例如：温柔、清爽、像一本生活杂志',
                helper: 'AI 会据此调整文案和布局气质。',
                type: 'text',
            },
        ],
    },
    {
        id: 'learning',
        name: '学习向首页',
        shortDescription: '把学习任务、复习节奏和最近积累收进一个入口。',
        description:
            '适合日语学习、读书、课程学习和技能提升，把输入、练习和复盘连成持续流。',
        themeClass: 'from-sky-100 via-cyan-50 to-blue-100',
        accentLabel: '学习节奏 / 复习闭环',
        suggestedSections: ['今日学习', '复习队列', '最近笔记', '重点词汇', '练习入口'],
        fields: [
            {
                id: 'homeName',
                label: '这个学习首页叫什么？',
                placeholder: '例如：Shen 的日语实验室',
                helper: '会成为学习首页主标题。',
                type: 'text',
            },
            {
                id: 'learningFocus',
                label: '你当前主要在学什么？',
                placeholder: '例如：日语 N2、系统设计、产品写作',
                helper: '决定首页的主要学习主题。',
                type: 'text',
            },
            {
                id: 'goals',
                label: '你最近的学习目标是什么？',
                placeholder: '例如：通过 N2、每天读 20 分钟日文、建立复习队列',
                helper: '建议写 2 到 4 个具体目标。',
                type: 'textarea',
            },
            {
                id: 'studyMethods',
                label: '你常用哪些学习方式？',
                placeholder: '例如：做笔记、shadowing、TTS 跟读、整理例句',
                helper: '会映射为首页的学习模块。',
                type: 'textarea',
            },
            {
                id: 'dailyCadence',
                label: '你希望学习首页每天如何提醒你？',
                placeholder: '例如：先复习 15 分钟，再记 1 条句子，最后做一次 TTS 练习',
                helper: '用于生成 Today 模块。',
                type: 'textarea',
            },
        ],
    },
    {
        id: 'work',
        name: '工作向首页',
        shortDescription: '围绕项目、待办、产出和进度，像一个日常操作台。',
        description:
            '适合开发、产品、运营、内容制作等工作场景，把项目推进、输出和复盘集中起来。',
        themeClass: 'from-slate-100 via-stone-50 to-zinc-100',
        accentLabel: '执行推进 / 明确优先级',
        suggestedSections: ['今日重点', '任务推进', '项目状态', '最近产出', '快捷入口'],
        fields: [
            {
                id: 'homeName',
                label: '你的工作台首页叫什么？',
                placeholder: '例如：Shen 的执行台',
                helper: '会作为首页主视觉标题的一部分。',
                type: 'text',
            },
            {
                id: 'role',
                label: '你当前的主要工作角色是什么？',
                placeholder: '例如：全栈开发 / 产品设计 / 内容运营',
                helper: '帮助 AI 识别你的工作语言。',
                type: 'text',
            },
            {
                id: 'currentProjects',
                label: '你现在最重要的项目有哪些？',
                placeholder: '例如：AiTool 重构、登录流程优化、个性化首页生成',
                helper: '建议写 2 到 5 个项目或任务域。',
                type: 'textarea',
            },
            {
                id: 'mustSeeInfo',
                label: '你每天一打开最想先看到什么信息？',
                placeholder: '例如：今日重点、最近提交、待验证事项、下一步开发',
                helper: '会直接影响首页模块排序。',
                type: 'textarea',
            },
            {
                id: 'workStyle',
                label: '你想要的工作台风格是什么？',
                placeholder: '例如：冷静、清晰、工程感强、优先级明确',
                helper: '会影响页面语气和氛围。',
                type: 'text',
            },
        ],
    },
    {
        id: 'hybrid',
        name: '综合向首页',
        shortDescription: '把生活、学习、工作放在同一个可切换的首页里。',
        description:
            '适合想把工作、学习和生活统一收进一个入口的人，用分区方式避免信息散掉。',
        themeClass: 'from-lime-100 via-emerald-50 to-sky-100',
        accentLabel: '综合平衡 / 统一入口',
        suggestedSections: ['今天', '工作区', '学习区', '生活区', '最近更新', 'AI 建议'],
        fields: [
            {
                id: 'homeName',
                label: '这个综合首页叫什么？',
                placeholder: '例如：Shen 的一体化工作台',
                helper: '会作为首页的主标题。',
                type: 'text',
            },
            {
                id: 'identity',
                label: '你希望 AI 怎么理解你当前的状态？',
                placeholder: '例如：一边做产品一边学日语，也想把生活记录下来',
                helper: '帮助首页平衡生活、学习和工作。',
                type: 'textarea',
            },
            {
                id: 'balance',
                label: '工作、学习、生活这三类分别占多大比重？',
                placeholder: '例如：工作 50%，学习 30%，生活 20%',
                helper: '会影响首页分区比重。',
                type: 'text',
            },
            {
                id: 'topPriorities',
                label: '你最近最重要的跨场景目标是什么？',
                placeholder: '例如：完成 AiTool 重构、保持日语输入、恢复规律作息',
                helper: '建议写 3 到 5 条。',
                type: 'textarea',
            },
            {
                id: 'stylePreference',
                label: '你想让这个首页给你什么感觉？',
                placeholder: '例如：像个人驾驶舱、清爽但不冷、能马上进入状态',
                helper: '会影响文案与布局风格。',
                type: 'text',
            },
        ],
    },
];

export function getPersonalHomeTemplate(templateId: PersonalHomeTemplateId) {
    return personalHomeTemplates.find((template) => template.id === templateId);
}

export function getHomeBuilderDraftKey(userKey: string) {
    return `aitool-home-builder-draft:${userKey}`;
}

export function getAppliedHomeConfigKey(userKey: string) {
    return `aitool-applied-home-config:${userKey}`;
}
