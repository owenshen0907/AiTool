import type { DevTaskPriority, DevTaskStatus } from '@/lib/models/devTask';

export const devTaskStatusMeta: Record<
    DevTaskStatus,
    { label: string; badgeClass: string; description: string }
> = {
    draft: {
        label: 'Draft',
        badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
        description: '本地已创建，还没进入共享任务池。',
    },
    queued: {
        label: 'Queued',
        badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
        description: '已进入共享任务池，等待某台 Agent 认领。',
    },
    claimed: {
        label: 'Claimed',
        badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
        description: '已有 Agent 认领，马上进入本地处理。',
    },
    planning: {
        label: 'Planning',
        badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
        description: '本地 Codex 正在先产出规划。',
    },
    awaiting_approval: {
        label: 'Awaiting Approval',
        badgeClass: 'border-indigo-200 bg-indigo-50 text-indigo-700',
        description: '规划完成，等待批准进入执行。',
    },
    executing: {
        label: 'Executing',
        badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
        description: '本地 Codex 正在执行。',
    },
    checking: {
        label: 'Checking',
        badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
        description: '执行完成，正在做本地结果检查。',
    },
    completed: {
        label: 'Completed',
        badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        description: '已通过检查，并同步了摘要。',
    },
    needs_tuning: {
        label: 'Needs Tuning',
        badgeClass: 'border-orange-200 bg-orange-50 text-orange-700',
        description: '检查认为还需要下一轮微调。',
    },
    failed: {
        label: 'Failed',
        badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
        description: '本轮失败，需要重新处理。',
    },
    cancelled: {
        label: 'Cancelled',
        badgeClass: 'border-slate-300 bg-slate-100 text-slate-700',
        description: '该任务已被取消。',
    },
    interrupted: {
        label: 'Interrupted',
        badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
        description: 'Agent 长时间掉线，当前 revision 被中断。',
    },
};

export const devTaskPriorityMeta: Record<DevTaskPriority, { label: string; badgeClass: string }> = {
    low: {
        label: 'Low',
        badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
    },
    normal: {
        label: 'Normal',
        badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    high: {
        label: 'High',
        badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    },
};
