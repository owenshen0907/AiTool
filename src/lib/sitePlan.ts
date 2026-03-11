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
    updatedAt: '2026-03-11',
    title: 'AiTool 系统规划',
    summary:
        '让 AiTool 从“功能堆叠的 AI 工具箱”收敛成一个面向创作、学习与个人资产沉淀的 AI 工作台。',
    currentFocus: '工作台现在已经开始根据需求脉搏、系统规划和已应用的个性首页主轴生成启发式 AI 每日简报，并把来源卡片挂到摘要下方，让建议下一步、今日学习流和个性首页主轴收进同一个可解释的 daily context。下一步再继续把这套规则做成更稳定的个性化 daily brief。',
    principles: [
        '先做稳定入口，再扩展能力，不继续横向铺新模块。',
        '公开首页负责解释产品，登录后工作台负责承接日常使用。',
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
                    title: '新增系统规划页面',
                    note: '把阶段目标、任务状态与当前 focus 独立沉淀出来。',
                    status: 'done' as const,
                },
                {
                    title: '导航收敛到工作台结构',
                    note: '已加入工作台与系统规划入口，后续继续压缩旧菜单层级。',
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
                    title: '工作台首版',
                    note: '已落地今日、快速记录、最近常用、固定入口，并补了今日日语预留位。',
                    status: 'done' as const,
                },
                {
                    title: '登录成功默认跳转到工作台',
                    note: '已将认证默认落点改为 /workspace，同时保留显式 next 路由覆盖。',
                    status: 'done' as const,
                },
                {
                    title: '个性化首页模板与生成器',
                    note: '已支持生活、学习、工作、综合模板，填写关键信息后可生成首页预览并应用到工作台。',
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
            status: 'in_progress' as const,
            tasks: [
                {
                    title: '需求页面',
                    note: '已落地首版页面骨架，包含状态列、seed 条目，以及从导航和工作台进入的入口。',
                    status: 'done' as const,
                },
                {
                    title: '需求生命周期',
                    note: '继续固化待处理、需求梳理、待开始、开发中、验证中、已归档的字段与迁移规则；当前内容页和看板卡片迁移都已开始写入交接上下文，开发中 / 验证中也已显示新鲜度提示，并把实时状态同步到工作台的需求脉搏。',
                    status: 'in_progress' as const,
                },
                {
                    title: '页面与需求互链',
                    note: '已让 /requirements 看板直接读取 requirements 文档空间、回链到真实需求文档，并按生命周期状态展示不同的轻量元数据、场景、验证与执行向预览字段；内容页和看板卡片里也可直接迁移状态。',
                    status: 'done' as const,
                },
            ],
        },
        {
            name: 'Phase 4 / AI Native 增强',
            goal: '在稳定骨架上叠加 AI 推荐与自动推进能力。',
            status: 'in_progress' as const,
            tasks: [
                {
                    title: 'AI 每日摘要',
                    note: '工作台已开始根据需求脉搏、建议下一步和已应用首页主轴生成启发式 AI 每日简报，并把来源卡片显式挂到摘要下方，后续再接更稳定的个性化每日简报。',
                    status: 'in_progress' as const,
                },
                {
                    title: '建议下一步',
                    note: '工作台已开始根据需求脉搏和系统规划生成启发式下一步建议，后续再继续接 AI 推荐与自动推进。',
                    status: 'in_progress' as const,
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
