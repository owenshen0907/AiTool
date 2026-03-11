import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/devTaskService';
import {
    devTaskActiveStatuses,
    type DevTaskStatus,
    type DevTaskSummaryItem,
    type DevTaskSummaryResponse,
} from '@/lib/models/devTask';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function createEmptyCountByStatus(): Record<DevTaskStatus, number> {
    return {
        draft: 0,
        queued: 0,
        claimed: 0,
        planning: 0,
        awaiting_approval: 0,
        executing: 0,
        checking: 0,
        completed: 0,
        needs_tuning: 0,
        failed: 0,
        cancelled: 0,
        interrupted: 0,
    };
}

function getStatusRank(status: DevTaskStatus) {
    switch (status) {
        case 'needs_tuning':
        case 'awaiting_approval':
        case 'failed':
        case 'interrupted':
            return 5;
        case 'executing':
        case 'checking':
        case 'planning':
        case 'claimed':
            return 4;
        case 'queued':
            return 3;
        case 'draft':
            return 2;
        case 'completed':
        case 'cancelled':
            return 1;
        default:
            return 0;
    }
}

export const GET = withUser(async (_req: NextRequest, userId: string) => {
    const feed = await service.listDevTaskFeed(userId);
    const countByStatus = createEmptyCountByStatus();

    for (const card of feed) {
        countByStatus[card.status] += 1;
    }

    const latestItems: DevTaskSummaryItem[] = feed.slice(0, 3).map((card) => ({
        taskId: card.taskId,
        projectName: card.projectName,
        status: card.status,
        priority: card.priority,
        nextStep: card.nextStep,
        updatedAt: card.updatedAt,
        href: `/dev-tasks/${card.taskId}`,
    }));

    const focusItem =
        [...feed]
            .sort((left, right) => {
                const rankDelta = getStatusRank(right.status) - getStatusRank(left.status);
                if (rankDelta !== 0) {
                    return rankDelta;
                }

                return right.updatedAt.localeCompare(left.updatedAt);
            })[0] ?? null;

    const attentionStatuses: DevTaskStatus[] = [
        'awaiting_approval',
        'needs_tuning',
        'failed',
        'interrupted',
    ];

    const payload: DevTaskSummaryResponse = {
        countByStatus,
        active: devTaskActiveStatuses.reduce((sum, status) => sum + countByStatus[status], 0),
        attention: attentionStatuses.reduce((sum, status) => sum + countByStatus[status], 0),
        queued: countByStatus.queued,
        latestItems,
        focusItem: focusItem
            ? {
                  taskId: focusItem.taskId,
                  projectName: focusItem.projectName,
                  status: focusItem.status,
                  priority: focusItem.priority,
                  nextStep: focusItem.nextStep,
                  updatedAt: focusItem.updatedAt,
                  href: `/dev-tasks/${focusItem.taskId}`,
              }
            : null,
    };

    return NextResponse.json(payload, {
        headers: {
            'Cache-Control': 'no-store',
        },
    });
});
