import type {
    DevTaskClaimRow,
    DevTaskCommandRow,
    DevTaskEventRow,
    DevTaskFeedCard,
    DevTaskRevisionRow,
    DevTaskRow,
    DevTaskSummaryResponse,
    DevTaskTuningRequestRow,
} from '@/lib/models/devTask';

export interface DevTaskDetailResponse {
    task: DevTaskRow;
    revisions: DevTaskRevisionRow[];
    events: DevTaskEventRow[];
    tuningRequests: DevTaskTuningRequestRow[];
    claims: DevTaskClaimRow[];
    commands: DevTaskCommandRow[];
}

const JSON_HEADER = { 'Content-Type': 'application/json' } as const;

export async function fetchDevTaskFeed(): Promise<DevTaskFeedCard[]> {
    const res = await fetch('/api/dev-tasks/feed');
    if (!res.ok) throw new Error(`fetchDevTaskFeed ${res.status}`);
    return res.json();
}

export async function fetchDevTaskSummary(): Promise<DevTaskSummaryResponse> {
    const res = await fetch('/api/dev-tasks/summary', { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetchDevTaskSummary ${res.status}`);
    return res.json();
}

export async function createDevTask(data: {
    projectSlug: string;
    projectName: string;
    workspaceKey: string;
    goal: string;
    templateId?: string;
    priority?: 'low' | 'normal' | 'high';
    allowedDeviceTypes?: Array<'work' | 'personal' | 'any'>;
    createdBy?: string;
    requestedBy?: string;
    createdFrom?: 'maintask' | 'aitool';
}) {
    const res = await fetch('/api/dev-tasks', {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify({
            project_slug: data.projectSlug,
            project_name: data.projectName,
            template_id: data.templateId || 'plan-execute',
            workspace_key: data.workspaceKey,
            goal: data.goal,
            priority: data.priority || 'normal',
            allowed_device_types: data.allowedDeviceTypes || ['any'],
            created_by: data.createdBy || 'aitool-ui',
            requested_by: data.requestedBy || 'aitool-ui',
            created_from: data.createdFrom || 'aitool',
            inputs: {},
        }),
    });
    if (!res.ok) throw new Error(`createDevTask ${res.status}`);
    return res.json();
}

export async function fetchDevTaskDetail(taskId: string): Promise<DevTaskDetailResponse> {
    const res = await fetch(`/api/dev-tasks/${taskId}`);
    if (!res.ok) throw new Error(`fetchDevTaskDetail ${res.status}`);
    return res.json();
}

export async function createDevTaskTuningRequest(taskId: string, data: {
    revisionId: string;
    requestedBy: string;
    requestedFrom?: 'maintask' | 'aitool';
    message: string;
}) {
    const res = await fetch(`/api/dev-tasks/${taskId}/tuning-requests`, {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify({
            revision_id: data.revisionId,
            requested_by: data.requestedBy,
            requested_from: data.requestedFrom || 'aitool',
            message: data.message,
        }),
    });
    if (!res.ok) throw new Error(`createDevTaskTuningRequest ${res.status}`);
    return res.json();
}

export async function approveDevTask(taskId: string, requestedBy = 'aitool-ui') {
    const res = await fetch(`/api/dev-tasks/${taskId}/approve`, {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify({ requested_by: requestedBy }),
    });
    if (!res.ok) throw new Error(`approveDevTask ${res.status}`);
    return res.json();
}

export async function cancelDevTask(taskId: string, requestedBy = 'aitool-ui') {
    const res = await fetch(`/api/dev-tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify({ requested_by: requestedBy }),
    });
    if (!res.ok) throw new Error(`cancelDevTask ${res.status}`);
    return res.json();
}
