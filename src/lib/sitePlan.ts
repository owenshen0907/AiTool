export type PlanStatus = 'done' | 'in_progress' | 'next' | 'planned';

export interface PlanTask {
    title: string;
    note: string;
    status: PlanStatus;
}

export interface PlanPhase {
    name: string;
    goal: string;
    status: PlanStatus;
    tasks: PlanTask[];
}

export interface SystemPlan {
    updatedAt: string;
    title: string;
    summary: string;
    currentFocus: string;
    principles: string[];
    phases: PlanPhase[];
}

export const planStatusMeta: Record<PlanStatus, { label: string; badgeClass: string; dotClass: string }> = {
    done: {
        label: '已完成',
        badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        dotClass: 'bg-emerald-500',
    },
    in_progress: {
        label: '进行中',
        badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
        dotClass: 'bg-sky-500',
    },
    next: {
        label: '下一步',
        badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
        dotClass: 'bg-amber-500',
    },
    planned: {
        label: '规划中',
        badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
        dotClass: 'bg-slate-400',
    },
};

export const systemPlan: SystemPlan = {
    updatedAt: '2026-03-08',
    title: 'AiTool 系统规划',
    summary:
        '让 AiTool 从“功能堆叠的 AI 工具箱”收敛成一个面向创作、学习与开发执行的 AI 工作台。',
    currentFocus: '继续把 Workspace 做成可个性化的默认入口，并在下一轮接上登录跳转与 Requirements 内部需求流。',
    principles: [
        '先做稳定入口，再扩展能力，不继续横向铺新模块。',
        '公开首页负责解释产品，登录后 Workspace 负责承接日常使用。',
        '每轮只推进一小步，并同步更新完成状态与下一步。',
    ],
    phases: [
        {
            name: 'Phase 1 / 产品骨架',
            goal: '统一定位与入口，解决“看起来很多、实际难落脚”的问题。',
            status: 'done' as const,
            tasks: [
                {
                    title: '站内登录注册',
                    note: '已完成弹层式登录注册与 Casdoor 回调收口。',
                    status: 'done' as const,
                },
                {
                    title: '首页加入系统规划',
                    note: '让首页直接解释当前方向、阶段和下一步。',
                    status: 'done' as const,
                },
                {
                    title: '新增 Roadmap 页面',
                    note: '把阶段目标、任务状态与当前 focus 独立沉淀出来。',
                    status: 'done' as const,
                },
                {
                    title: '导航收敛到 Workspace 结构',
                    note: '已加入 Workspace 与系统规划入口，后续继续压缩旧菜单层级。',
                    status: 'done' as const,
                },
            ],
        },
        {
            name: 'Phase 2 / 日常工作台',
            goal: '让 AiTool 成为每天可打开的默认入口。',
            status: 'in_progress' as const,
            tasks: [
                {
                    title: 'Workspace 首版',
                    note: '已落地 Today、Quick Capture、Recents、Pinned Shortcuts，并补了 Japanese Today 预留位。',
                    status: 'done' as const,
                },
                {
                    title: '登录成功默认跳转到 Workspace',
                    note: '把认证流真正接入新的日常入口。',
                    status: 'next' as const,
                },
                {
                    title: '个性化首页模板与生成器',
                    note: '已支持生活、学习、工作、综合模板，填写关键信息后可生成首页预览并应用到 Workspace。',
                    status: 'done' as const,
                },
                {
                    title: '日语学习模块卡片',
                    note: '继续把 Japanese notes / TTS practice 做成可持续复习入口。',
                    status: 'in_progress' as const,
                },
            ],
        },
        {
            name: 'Phase 3 / 内部需求系统',
            goal: '让 AiTool 直接管理自己的产品迭代与验证。',
            status: 'planned' as const,
            tasks: [
                {
                    title: 'Requirements 页面',
                    note: '承接 feature、bug、design、infra、content 等类型。',
                    status: 'planned' as const,
                },
                {
                    title: '需求生命周期',
                    note: '支持 Inbox、Ready、Doing、Validating、Archived。',
                    status: 'planned' as const,
                },
                {
                    title: '页面与需求互链',
                    note: '让需求能回链到模块、路由和验证结果。',
                    status: 'planned' as const,
                },
            ],
        },
        {
            name: 'Phase 4 / AI Native 增强',
            goal: '在稳定骨架上叠加 AI 推荐与自动推进能力。',
            status: 'planned' as const,
            tasks: [
                {
                    title: 'AI daily summary',
                    note: '总结最近完成项、阻塞项和建议下一步。',
                    status: 'planned' as const,
                },
                {
                    title: 'Suggested next action',
                    note: '结合近期编辑和需求状态推荐下一步动作。',
                    status: 'planned' as const,
                },
                {
                    title: '快捷入口个性化',
                    note: '按使用频率展示常用模块与最近成果。',
                    status: 'planned' as const,
                },
            ],
        },
    ],
};
