export type RequirementStatus =
    | 'inbox'
    | 'shaping'
    | 'ready'
    | 'doing'
    | 'validating'
    | 'archived';

export type RequirementDocType = 'feature' | 'bug' | 'design' | 'infra' | 'content';
export type RequirementPriority = 'P0' | 'P1' | 'P2';

export interface RequirementDocMetadata {
    type?: RequirementDocType;
    priority?: RequirementPriority;
    relatedRoute?: string;
}

export interface RequirementDocPreview {
    scene?: string;
    expectedValue?: string;
    validationResult?: string;
    userImpact?: string;
    latestHandoff?: string;
    latestHandoffAt?: string;
    latestHandoffDirection?: string;
    latestHandoffValidateNext?: string;
    openRisks?: string;
    nextStep?: string;
}

export type RequirementPreviewField = keyof RequirementDocPreview;

export interface RequirementSeedTemplate {
    directoryName: string;
    title: string;
    summary: string;
    body: string;
}

export interface RequirementMoveHandoffInput {
    fromStatus: RequirementStatus | null;
    toStatus: RequirementStatus;
    reason?: string;
    validationFollowUp?: string;
    movedAt?: Date;
}

export const requirementTypeMeta: Record<
    RequirementDocType,
    { label: string; badgeClass: string }
> = {
    feature: {
        label: '功能',
        badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    bug: {
        label: '缺陷',
        badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    },
    design: {
        label: '设计',
        badgeClass: 'border-violet-200 bg-violet-50 text-violet-700',
    },
    infra: {
        label: '基建',
        badgeClass: 'border-slate-300 bg-slate-100 text-slate-700',
    },
    content: {
        label: '内容',
        badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
};

export const requirementPriorityMeta: Record<
    RequirementPriority,
    { label: string; badgeClass: string }
> = {
    P0: {
        label: 'P0',
        badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    },
    P1: {
        label: 'P1',
        badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    P2: {
        label: 'P2',
        badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
    },
};

export const requirementStatuses = [
    'inbox',
    'shaping',
    'ready',
    'doing',
    'validating',
    'archived',
] as const satisfies readonly RequirementStatus[];

export const requirementStatusMeta: Record<
    RequirementStatus,
    {
        label: string;
        description: string;
        badgeClass: string;
        panelClass: string;
        directoryName: string;
    }
> = {
    inbox: {
        label: '待处理',
        description: '先收纳待判断的问题，不急着立刻实现。',
        badgeClass: 'border-slate-200 bg-white text-slate-600',
        panelClass: 'border-slate-200 bg-slate-50/80',
        directoryName: '待处理',
    },
    shaping: {
        label: '需求梳理',
        description: '开始定义信息结构、承接方式和约束范围。',
        badgeClass: 'border-indigo-200 bg-indigo-50 text-indigo-700',
        panelClass: 'border-indigo-100 bg-indigo-50/70',
        directoryName: '需求梳理',
    },
    ready: {
        label: '待开始',
        description: '目标与边界明确，可以切成下一轮可交付小步。',
        badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
        panelClass: 'border-amber-100 bg-amber-50/70',
        directoryName: '待开始',
    },
    doing: {
        label: '开发中',
        description: '正在推进中的小任务，优先保持范围可控。',
        badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
        panelClass: 'border-sky-100 bg-sky-50/70',
        directoryName: '开发中',
    },
    validating: {
        label: '验证中',
        description: '已经交付，需要继续观察结果和下一步接法。',
        badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        panelClass: 'border-emerald-100 bg-emerald-50/70',
        directoryName: '验证中',
    },
    archived: {
        label: '已归档',
        description: '已完成并沉淀，可作为后续设计的参考上下文。',
        badgeClass: 'border-slate-300 bg-slate-100 text-slate-700',
        panelClass: 'border-slate-200 bg-slate-100/80',
        directoryName: '已归档',
    },
};

export const requirementPreviewFieldMeta: Record<
    RequirementPreviewField,
    { label: string }
> = {
    scene: {
        label: '场景',
    },
    expectedValue: {
        label: '预期价值',
    },
    validationResult: {
        label: '验证结果',
    },
    userImpact: {
        label: '用户影响',
    },
    latestHandoff: {
        label: '最新交接',
    },
    latestHandoffAt: {
        label: '交接时间',
    },
    latestHandoffDirection: {
        label: '交接方向',
    },
    latestHandoffValidateNext: {
        label: '下一步验证',
    },
    openRisks: {
        label: '未决风险',
    },
    nextStep: {
        label: '下一步',
    },
};

export const requirementStatusFocusFields: Record<
    RequirementStatus,
    RequirementPreviewField[]
> = {
    inbox: ['scene', 'expectedValue', 'nextStep'],
    shaping: ['scene', 'openRisks', 'expectedValue'],
    ready: ['expectedValue', 'nextStep', 'openRisks'],
    doing: ['latestHandoffDirection', 'latestHandoffValidateNext', 'openRisks'],
    validating: ['latestHandoffAt', 'latestHandoffDirection', 'latestHandoffValidateNext'],
    archived: ['expectedValue', 'userImpact', 'validationResult'],
};

export const requirementHandoffSignalFields = [
    'latestHandoffAt',
    'latestHandoffDirection',
    'latestHandoffValidateNext',
] as const satisfies readonly RequirementPreviewField[];

export function getNextRequirementStatus(status: RequirementStatus): RequirementStatus | null {
    const currentIndex = requirementStatuses.indexOf(status);
    if (currentIndex < 0 || currentIndex >= requirementStatuses.length - 1) {
        return null;
    }

    return requirementStatuses[currentIndex + 1];
}

export function getRequirementMoveTargetStatuses(status: RequirementStatus): RequirementStatus[] {
    const nextStatus = getNextRequirementStatus(status);
    const remainingStatuses = requirementStatuses.filter(
        (candidate) => candidate !== status && candidate !== nextStatus
    );

    return nextStatus ? [nextStatus, ...remainingStatuses] : remainingStatuses;
}

const requirementDefaultValidationFollowUpByStatus: Record<RequirementStatus, string> = {
    inbox: '确认这条需求是否值得继续进入需求梳理，并补齐触发场景。',
    shaping: '补齐范围、相关路由和主要风险，判断是否进入待开始。',
    ready: '把范围切成下一轮可交付的小步，并明确实现边界。',
    doing: '完成实现并跑 build 与关键路径检查，确认可以进入验证。',
    validating: '跑 build / tsc / 人工验证，并记录剩余风险和结论。',
    archived: '确认最终结果、取舍和可复用经验后再归档。',
};

function formatRequirementHandoffTimestamp(date: Date = new Date()) {
    const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    return `${formatter.format(date).replace(',', '')} JST`;
}

export function getRequirementDefaultMoveReason(
    fromStatus: RequirementStatus | null,
    toStatus: RequirementStatus
) {
    if (fromStatus) {
        return `当前内容已经更接近 ${requirementStatusMeta[toStatus].label} 阶段，不再停留在 ${requirementStatusMeta[fromStatus].label}。`;
    }

    return `当前内容已经更接近 ${requirementStatusMeta[toStatus].label} 阶段。`;
}

export function getRequirementDefaultValidationFollowUp(status: RequirementStatus) {
    return requirementDefaultValidationFollowUpByStatus[status];
}

const handoffSectionNames = new Set(['handofflog', 'handoff', '交接记录']);

const requirementStatusAliases: Record<RequirementStatus, string[]> = {
    inbox: ['Inbox', '收件箱', '待处理'],
    shaping: ['Shaping', '需求梳理'],
    ready: ['Ready', '待开始'],
    doing: ['Doing', '开发中'],
    validating: ['Validating', '验证中'],
    archived: ['Archived', '已归档'],
};

function isHandoffSectionName(value: string) {
    return handoffSectionNames.has(value);
}

function buildRequirementMoveHandoffEntry(input: RequirementMoveHandoffInput) {
    const fromLabel = input.fromStatus
        ? requirementStatusMeta[input.fromStatus].label
        : '起始状态';
    const routeLabel = `${fromLabel} -> ${requirementStatusMeta[input.toStatus].label}`;
    const reason = input.reason?.trim() || getRequirementDefaultMoveReason(input.fromStatus, input.toStatus);
    const validationFollowUp = input.validationFollowUp?.trim()
        || getRequirementDefaultValidationFollowUp(input.toStatus);

    return `- ${formatRequirementHandoffTimestamp(input.movedAt)} | ${routeLabel} | 原因: ${reason} | 下一步验证: ${validationFollowUp}`;
}

export function appendRequirementMoveHandoff(
    body: string | null | undefined,
    input: RequirementMoveHandoffInput
) {
    const entry = buildRequirementMoveHandoffEntry(input);
    const normalizedBody = body?.trimEnd() ?? '';

    if (!normalizedBody) {
        return `# 交接记录\n${entry}`;
    }

    const lines = normalizedBody.split('\n');
    const sectionIndex = lines.findIndex((line) => {
        const headingMatch = line.match(/^#{1,6}\s*(.+)$/);
        if (!headingMatch) {
            return false;
        }

        const normalizedHeading = normalizeSectionName(headingMatch[1]);
        return isHandoffSectionName(normalizedHeading);
    });

    if (sectionIndex >= 0) {
        const nextLines = [...lines];
        nextLines.splice(sectionIndex + 1, 0, entry);
        return nextLines.join('\n');
    }

    return `${normalizedBody}\n\n# 交接记录\n${entry}`;
}

export function parseRequirementHandoffPreview(body: string | null | undefined) {
    return extractRequirementSectionPreview(body, ['交接记录', 'Handoff Log', 'Handoff']);
}

function parseRequirementLatestHandoffEntry(body: string | null | undefined) {
    if (!body?.trim()) {
        return undefined;
    }

    const lines = body.split('\n');
    let collecting = false;

    for (const line of lines) {
        const headingMatch = line.match(/^#{1,6}\s*(.+)$/);
        if (headingMatch) {
            const normalizedHeading = normalizeSectionName(headingMatch[1]);
            if (collecting) {
                break;
            }
            collecting = isHandoffSectionName(normalizedHeading);
            continue;
        }

        if (!collecting) continue;

        const cleaned = cleanSectionLine(line);
        if (!cleaned || isPlaceholderLine(cleaned)) continue;
        return cleaned;
    }

    return undefined;
}

function parseRequirementLatestHandoff(body: string | null | undefined) {
    const raw = parseRequirementLatestHandoffEntry(body) || parseRequirementHandoffPreview(body);
    if (!raw) {
        return {};
    }

    const parts = raw.split('|').map((part) => part.trim()).filter(Boolean);
    const validateNext = parts
        .find((part) => /^(validate\s*next|下一步验证|验证下一步)\s*[:：]/i.test(part))
        ?.replace(/^(validate\s*next|下一步验证|验证下一步)\s*[:：]/i, '')
        .trim();

    return {
        latestHandoff: raw,
        latestHandoffAt: parts[0],
        latestHandoffDirection: parts[1],
        latestHandoffValidateNext: validateNext,
    };
}

export const requirementsSeedTemplates: RequirementSeedTemplate[] = [
    {
        directoryName: '待处理',
        title: '新需求采集模板',
        summary: '记录触发场景、背景和预期价值，先判断值不值得做。',
        body: `${buildRequirementMetadataBlock({
            type: 'content',
            priority: 'P2',
            relatedRoute: '/requirements/content',
        })}

# 背景
- 这个需求为什么出现？
- 当前具体卡点是什么？

# 触发来源
- 谁提出的？
- 在什么场景下暴露出来？

# 场景
- [填写这个需求对应的页面、用户流或工作场景]

# 预期价值
- [填写这轮完成后减少的摩擦或新增的价值]

# 下一步
- 先判断是否进入需求梳理。`,
    },
    {
        directoryName: '需求梳理',
        title: '需求梳理模板',
        summary: '明确问题边界、相关页面和可接受的实现范围。',
        body: `${buildRequirementMetadataBlock({
            type: 'content',
            priority: 'P2',
            relatedRoute: '/requirements/content',
        })}

# 问题
- 现在的问题边界是什么？

# 场景
- [填写当前需求对应的核心场景]

# 相关路由
- 相关页面 / 入口 / API 是什么？

# 范围
- 这轮明确做什么？
- 这轮明确不做什么？

# 风险
- 有哪些现有流程可能被影响？`,
    },
    {
        directoryName: '待开始',
        title: '可执行需求模板',
        summary: '把需求收敛成下一轮可以直接交付的小步。',
        body: `${buildRequirementMetadataBlock({
            type: 'content',
            priority: 'P2',
            relatedRoute: '/requirements/content',
        })}

# 目标
- 这一轮的最小可交付结果是什么？

# 场景
- [填写这轮要承接的核心场景]

# 预期价值
- [填写这轮完成后最直接的价值]

# 实现方式
- 准备改哪些文件？
- 依赖哪些已有组件或数据结构？

# 验证方式
- 用什么方式验证这轮已经完成？`,
    },
    {
        directoryName: '开发中',
        title: '执行中记录模板',
        summary: '记录当前实现进展、已完成项和剩余风险。',
        body: `${buildRequirementMetadataBlock({
            type: 'content',
            priority: 'P2',
            relatedRoute: '/requirements/content',
        })}

# 当前进展
- 这轮正在实现什么？

# 场景
- [填写当前实现聚焦的页面或工作流]

# 预期价值
- [填写完成后最直接的用户/执行价值]

# 用户影响
- [填写当前变更最直接影响到的用户行为或日常流程]

# 已完成
- 已完成哪些关键改动？

# 验证结果
- [填写已经跑过的验证和当前结果]

# 未决风险
- 还有哪些边界条件没有验证？

# 下一步
- 完成本轮后紧接着推进什么？`,
    },
    {
        directoryName: '验证中',
        title: '验证记录模板',
        summary: '记录构建、类型检查、人工验证和是否达到交付标准。',
        body: `${buildRequirementMetadataBlock({
            type: 'content',
            priority: 'P2',
            relatedRoute: '/requirements/content',
        })}

# 验证结果
- 跑了哪些检查？
- 哪些结果通过，哪些仍有风险？

# 预期价值
- [填写本轮验证通过后确认下来的价值]

# 用户影响
- 这次变化对日常使用带来了什么？

# 未决风险
- [填写验证通过后仍需继续观察的风险]

# 下一步
- 是否需要下一轮补充？`,
    },
    {
        directoryName: '已归档',
        title: '归档复盘模板',
        summary: '归档需求时记录结果、取舍和后续参考价值。',
        body: `${buildRequirementMetadataBlock({
            type: 'content',
            priority: 'P2',
            relatedRoute: '/requirements/content',
        })}

# 最终结果
- 需求最终以什么结果收尾？

# 场景
- [填写这个需求最终影响到的核心场景]

# 预期价值
- [填写最终确认兑现的价值]

# 用户影响
- [填写这次变化最终影响了什么用户行为或使用频率]

# 验证结果
- [填写归档前最后一次验证结论]

# 取舍
- 做了哪些取舍？

# 可复用点
- 这次沉淀下来的结构或经验后续还能复用到哪里？`,
    },
];

function normalizeDirectoryName(name: string) {
    return name.trim().toLowerCase();
}

function normalizeMetadataKey(key: string) {
    return key.replace(/\s+/g, '').trim().toLowerCase();
}

function normalizeRequirementDocType(value: string): RequirementDocType | undefined {
    const normalized = value.trim().toLowerCase();
    const typeMap: Record<string, RequirementDocType> = {
        feature: 'feature',
        bug: 'bug',
        design: 'design',
        infra: 'infra',
        infrastructure: 'infra',
        content: 'content',
        功能: 'feature',
        缺陷: 'bug',
        设计: 'design',
        基建: 'infra',
        内容: 'content',
    };
    return typeMap[normalized];
}

function normalizeRequirementPriority(value: string): RequirementPriority | undefined {
    const normalized = value.trim().toUpperCase();
    if (normalized === 'P0' || normalized === 'P1' || normalized === 'P2') {
        return normalized;
    }
    return undefined;
}

function normalizeRequirementRoute(value: string): string | undefined {
    const normalized = value.trim();
    if (!normalized.startsWith('/') || normalized.startsWith('//')) {
        return undefined;
    }
    return normalized;
}

export function buildRequirementMetadataBlock(
    defaults: RequirementDocMetadata = {
        type: 'feature',
        priority: 'P1',
        relatedRoute: '/workspace',
    }
) {
    const type = defaults.type ?? 'feature';
    const priority = defaults.priority ?? 'P1';

    return `# 元信息
- 类型: ${requirementTypeMeta[type].label}
- 优先级: ${priority}
- 相关路由: ${defaults.relatedRoute ?? '/workspace'}`;
}

function normalizeSectionName(value: string) {
    return value.replace(/\s+/g, '').trim().toLowerCase();
}

function cleanSectionLine(value: string) {
    return value.replace(/^[-*]\s*/, '').trim();
}

function isPlaceholderLine(value: string) {
    const trimmed = value.trim();
    return trimmed.startsWith('[') && trimmed.endsWith(']');
}

export function getRequirementStatusFromDirectoryName(name: string): RequirementStatus | null {
    const normalized = normalizeDirectoryName(name);

    for (const status of requirementStatuses) {
        const aliases = [
            requirementStatusMeta[status].directoryName,
            ...requirementStatusAliases[status],
        ];

        if (aliases.some((alias) => normalizeDirectoryName(alias) === normalized)) {
            return status;
        }
    }

    return null;
}

export function parseRequirementDocMetadata(
    body: string | null | undefined
): RequirementDocMetadata {
    if (!body?.trim()) {
        return {};
    }

    const metadata: RequirementDocMetadata = {};
    const lines = body.split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const normalizedLine = trimmedLine.replace(/^[-*]\s*/, '');
        const parts = normalizedLine.split(/[:：]/);
        if (parts.length < 2) continue;

        const rawKey = parts.shift();
        const rawValue = parts.join(':');
        if (!rawKey || !rawValue) continue;

        const key = normalizeMetadataKey(rawKey);
        const value = rawValue.trim();

        if (key === 'type' || key === '类型') {
            metadata.type = normalizeRequirementDocType(value);
        }

        if (key === 'priority' || key === '优先级') {
            metadata.priority = normalizeRequirementPriority(value);
        }

        if (
            key === 'relatedroute' ||
            key === 'route' ||
            key === '关联路由' ||
            key === '相关路由'
        ) {
            metadata.relatedRoute = normalizeRequirementRoute(value);
        }
    }

    return metadata;
}

export function hasRequirementDocMetadata(body: string | null | undefined) {
    const metadata = parseRequirementDocMetadata(body);
    return Boolean(metadata.type || metadata.priority || metadata.relatedRoute);
}

export function extractRequirementSectionPreview(
    body: string | null | undefined,
    sectionNames: string[]
) {
    if (!body?.trim()) {
        return undefined;
    }

    const normalizedSectionNames = new Set(sectionNames.map(normalizeSectionName));
    const lines = body.split('\n');
    const collected: string[] = [];
    let collecting = false;

    for (const line of lines) {
        const headingMatch = line.match(/^#{1,6}\s*(.+)$/);
        if (headingMatch) {
            if (collecting) break;
            collecting = normalizedSectionNames.has(normalizeSectionName(headingMatch[1]));
            continue;
        }

        if (!collecting) continue;

        const cleaned = cleanSectionLine(line);
        if (!cleaned) continue;
        if (isPlaceholderLine(cleaned)) continue;

        collected.push(cleaned);
        if (collected.join(' ').length >= 160) {
            break;
        }
    }

    if (collected.length > 0) {
        return collected.join(' ').slice(0, 180).trim();
    }

    for (const line of lines) {
        const cleaned = cleanSectionLine(line);
        const parts = cleaned.split(/[:：]/);
        if (parts.length < 2) continue;

        const key = normalizeSectionName(parts.shift() || '');
        if (!normalizedSectionNames.has(key)) continue;

        const value = parts.join(':').trim();
        if (!value || isPlaceholderLine(value)) continue;
        return value;
    }

    return undefined;
}

export type RequirementFreshness = 'fresh' | 'aging' | 'stale';

export interface RequirementSummaryItem {
    id: string;
    title: string;
    status: RequirementStatus;
    updatedAt: string;
    href: string;
    freshness: RequirementFreshness | null;
    signal?: string;
}

export interface RequirementsSummaryResponse {
    countByStatus: Record<RequirementStatus, number>;
    freshnessByActiveStatus: Record<RequirementFreshness, number>;
    total: number;
    active: number;
    recentItems: RequirementSummaryItem[];
    attentionItems: RequirementSummaryItem[];
}

export const requirementFreshnessMeta: Record<
    RequirementFreshness,
    { label: string; badgeClass: string }
> = {
    fresh: {
        label: '< 2天',
        badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    aging: {
        label: '2-7天',
        badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    stale: {
        label: '> 7天',
        badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    },
};

export function computeRequirementFreshness(
    handoffAt: string | undefined,
    updatedAt: string | undefined,
): RequirementFreshness | null {
    const raw = handoffAt || updatedAt;
    if (!raw) return null;

    const timestamp = Date.parse(raw.replace(/\s*JST$/, '+09:00'));
    if (Number.isNaN(timestamp)) return null;

    const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
    if (daysSince < 2) return 'fresh';
    if (daysSince < 7) return 'aging';
    return 'stale';
}

export function buildRequirementsDocHref(directoryId: string, documentId: string) {
    const params = new URLSearchParams({
        dir: directoryId,
        doc: documentId,
    });
    return `/requirements/content?${params.toString()}`;
}

export function getRequirementPulseSignal(
    status: RequirementStatus,
    preview: RequirementDocPreview,
    fallbackSummary?: string | null,
) {
    const candidates =
        status === 'doing' || status === 'validating'
            ? [
                  preview.latestHandoffValidateNext,
                  preview.latestHandoffDirection,
                  preview.openRisks,
                  preview.nextStep,
                  preview.expectedValue,
                  fallbackSummary,
              ]
            : [
                  preview.nextStep,
                  preview.expectedValue,
                  preview.openRisks,
                  preview.scene,
                  preview.validationResult,
                  fallbackSummary,
              ];

    return candidates
        .map((value) => value?.trim())
        .find((value): value is string => Boolean(value));
}

export function parseRequirementDocPreview(
    body: string | null | undefined
): RequirementDocPreview {
    const handoff = parseRequirementLatestHandoff(body);

    return {
        scene: extractRequirementSectionPreview(body, ['Scene', '场景']),
        expectedValue: extractRequirementSectionPreview(body, ['Expected Value', 'Value', '预期价值', '价值']),
        validationResult: extractRequirementSectionPreview(body, [
            'Validation Result',
            'Validation',
            '验证结果',
            '验证',
        ]),
        userImpact: extractRequirementSectionPreview(body, [
            'User Impact',
            'Impact',
            '用户影响',
        ]),
        latestHandoff: handoff.latestHandoff,
        latestHandoffAt: handoff.latestHandoffAt,
        latestHandoffDirection: handoff.latestHandoffDirection,
        latestHandoffValidateNext: handoff.latestHandoffValidateNext,
        openRisks: extractRequirementSectionPreview(body, [
            'Open Risks',
            'Risks',
            'Risk',
            'Remaining Risks',
            '风险',
            '风险点',
        ]),
        nextStep: extractRequirementSectionPreview(body, [
            'Next Step',
            'Next',
            'Follow-up',
            'Follow Up',
            '后续',
            '下一步',
        ]),
    };
}
