export type DevTaskStatus =
    | 'draft'
    | 'queued'
    | 'claimed'
    | 'planning'
    | 'awaiting_approval'
    | 'executing'
    | 'checking'
    | 'completed'
    | 'needs_tuning'
    | 'failed'
    | 'cancelled'
    | 'interrupted';

export type DevTaskPriority = 'low' | 'normal' | 'high';
export type DevTaskDeviceType = 'work' | 'personal' | 'any';

export const devTaskStatuses = [
    'draft',
    'queued',
    'claimed',
    'planning',
    'awaiting_approval',
    'executing',
    'checking',
    'completed',
    'needs_tuning',
    'failed',
    'cancelled',
    'interrupted',
] as const satisfies readonly DevTaskStatus[];

export interface DevTaskRow {
    taskId: string;
    ownerId: string;
    projectSlug: string;
    projectName: string;
    templateId: string;
    workspaceKey: string;
    allowedDeviceTypes: DevTaskDeviceType[];
    priority: DevTaskPriority;
    status: DevTaskStatus;
    currentRevisionId: string | null;
    createdFrom: 'maintask' | 'aitool';
    createdBy: string;
    requestedBy: string;
    lastStatusNote: string | null;
    lastAgentId: string | null;
    lastDeviceType: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface DevTaskRevisionRow {
    revisionId: string;
    taskId: string;
    revisionNo: number;
    goal: string;
    inputs: Record<string, unknown>;
    planSummary: string | null;
    executionSummary: string | null;
    checkReport: Record<string, unknown> | null;
    nextStep: string | null;
    status: DevTaskStatus;
    assignedAgentId: string | null;
    requestedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface DevTaskEventRow {
    eventId: string;
    taskId: string;
    revisionId: string;
    ownerId: string;
    status: DevTaskStatus | null;
    eventType: string;
    note: string | null;
    payload: Record<string, unknown>;
    createdAt: string;
}

export interface DevTaskTuningRequestRow {
    requestId: string;
    taskId: string;
    revisionId: string;
    ownerId: string;
    requestedBy: string;
    requestedFrom: 'maintask' | 'aitool';
    message: string;
    status: 'pending' | 'applied' | 'dismissed';
    createdRevisionId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface DevTaskClaimRow {
    claimId: string;
    taskId: string;
    revisionId: string;
    ownerId: string;
    agentId: string;
    agentName: string | null;
    deviceType: string;
    claimedAt: string;
    leaseExpiresAt: string;
    releasedAt: string | null;
    status: 'active' | 'released' | 'expired';
}

export interface DevTaskCommandRow {
    commandId: string;
    taskId: string;
    revisionId: string;
    ownerId: string;
    agentId: string;
    type: 'approval' | 'cancel' | 'tuning_request';
    requestId: string | null;
    message: string | null;
    status: 'pending' | 'applied' | 'dismissed';
    note: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface DevTaskFeedCard {
    projectSlug: string;
    projectName: string;
    taskId: string;
    revisionId: string;
    revisionNo: number;
    status: DevTaskStatus;
    priority: DevTaskPriority;
    lastStatusNote: string | null;
    planSummary: string | null;
    executionSummary: string | null;
    nextStep: string | null;
    checkReport: Record<string, unknown> | null;
    assignedAgentId: string | null;
    deviceType: string | null;
    updatedAt: string;
}

export interface DevTaskSummaryItem {
    taskId: string;
    projectName: string;
    status: DevTaskStatus;
    priority: DevTaskPriority;
    nextStep: string | null;
    updatedAt: string;
    href: string;
}

export interface DevTaskSummaryResponse {
    countByStatus: Record<DevTaskStatus, number>;
    active: number;
    attention: number;
    queued: number;
    latestItems: DevTaskSummaryItem[];
    focusItem: DevTaskSummaryItem | null;
}

export const devTaskActiveStatuses: DevTaskStatus[] = [
    'claimed',
    'planning',
    'awaiting_approval',
    'executing',
    'checking',
];

export const devTaskTerminalStatuses: DevTaskStatus[] = [
    'completed',
    'needs_tuning',
    'failed',
    'cancelled',
    'interrupted',
];
