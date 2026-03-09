import { v4 as uuidv4 } from 'uuid';
import * as repo from '@/lib/repositories/devTaskRepository';
import { sendCommandToAgent } from '@/lib/devTasks/wsHub';
import { devTaskActiveStatuses, devTaskTerminalStatuses } from '@/lib/models/devTask';

export async function createDevTask(
    ownerId: string,
    input: Parameters<typeof repo.createTask>[1]
) {
    return repo.createTask(ownerId, input);
}

export async function createDevTaskRevision(
    ownerId: string,
    taskId: string,
    input: Parameters<typeof repo.createRevision>[2]
) {
    return repo.createRevision(ownerId, taskId, input);
}

export async function claimDevTask(
    ownerId: string,
    input: Parameters<typeof repo.claimNextTask>[1]
) {
    const expired = await repo.expireStaleClaims(ownerId);
    for (const claim of expired) {
        await repo.appendEvent(ownerId, claim.taskId, {
            revisionId: claim.revisionId,
            status: 'interrupted',
            statusNote: 'Agent lease expired before the next heartbeat.',
        });
    }
    return repo.claimNextTask(ownerId, input);
}

export async function heartbeatDevTask(
    ownerId: string,
    input: Parameters<typeof repo.heartbeat>[1]
) {
    return repo.heartbeat(ownerId, input);
}

export async function appendDevTaskEvent(
    ownerId: string,
    taskId: string,
    input: Parameters<typeof repo.appendEvent>[2] & {
        finalDigest?: {
            title: string;
            summary?: string;
            body?: string;
        };
    }
) {
    const event = await repo.appendEvent(ownerId, taskId, input);
    if (input.status === 'completed' && input.finalDigest) {
        const task = await repo.getTask(ownerId, taskId);
        if (task) {
            await repo.ensureJournalEntry(ownerId, {
                projectSlug: task.projectSlug,
                projectName: task.projectName,
                title: input.finalDigest.title,
                summary: input.finalDigest.summary,
                body: input.finalDigest.body,
            });
        }
    }
    return event;
}

export async function createDevTaskTuningRequest(
    ownerId: string,
    taskId: string,
    input: Parameters<typeof repo.createTuningRequest>[2]
) {
    const created = await repo.createTuningRequest(ownerId, taskId, input);
    const task = await repo.getTask(ownerId, taskId);
    const currentRevision = task?.currentRevisionId ? await repo.getRevision(task.currentRevisionId) : null;

    let createdRevision = null;
    if (task && currentRevision && devTaskTerminalStatuses.includes(task.status)) {
        const nextRevisionId = uuidv4();
        const next = await repo.createRevision(ownerId, taskId, {
            revisionId: nextRevisionId,
            goal: currentRevision.goal,
            inputs: {
                ...currentRevision.inputs,
                tuning_message: input.message,
                previous_revision_no: currentRevision.revisionNo,
            },
            requestedBy: input.requestedBy,
            tuningRequestId: created.request.requestId,
        });
        createdRevision = next.revision;
    }

    if (task && task.lastAgentId && !devTaskTerminalStatuses.includes(task.status)) {
        const command = await repo.createCommand(ownerId, {
            taskId,
            revisionId: input.revisionId,
            agentId: task.lastAgentId,
            type: 'tuning_request',
            requestId: created.request.requestId,
            message: input.message,
        });
        pushCommandToAgent(command);
    }

    return {
        request: created.request,
        task,
        createdRevision,
    };
}

export async function listDevTaskFeed(ownerId: string) {
    await repo.expireStaleClaims(ownerId);
    return repo.listFeed(ownerId);
}

export async function getDevTaskDetail(ownerId: string, taskId: string) {
    await repo.expireStaleClaims(ownerId);
    return repo.getTaskDetail(ownerId, taskId);
}

export async function listPendingDevTaskCommands(ownerId: string, agentId: string) {
    await repo.expireStaleClaims(ownerId);
    return repo.listPendingCommands(ownerId, agentId);
}

export async function ackDevTaskCommand(
    ownerId: string,
    commandId: string,
    input: Parameters<typeof repo.ackCommand>[2]
) {
    return repo.ackCommand(ownerId, commandId, input);
}

export async function approveDevTask(ownerId: string, taskId: string, requestedBy: string) {
    const detail = await repo.getTaskDetail(ownerId, taskId);
    if (!detail) {
        throw new Error('Task not found');
    }

    const revision = detail.revisions[0];
    if (!revision || detail.task.status !== 'awaiting_approval') {
        throw new Error('Task is not awaiting approval');
    }

    if (!detail.task.lastAgentId) {
        throw new Error('No active agent found for this task');
    }

    const command = await repo.createCommand(ownerId, {
        taskId,
        revisionId: revision.revisionId,
        agentId: detail.task.lastAgentId,
        type: 'approval',
        message: `Approved by ${requestedBy}.`,
    });
    pushCommandToAgent(command);
    return { task: detail.task, command };
}

export async function cancelDevTask(ownerId: string, taskId: string, requestedBy: string) {
    const detail = await repo.getTaskDetail(ownerId, taskId);
    if (!detail) {
        throw new Error('Task not found');
    }

    const revision = detail.revisions[0];
    if (!revision) {
        throw new Error('Revision not found');
    }

    if (detail.task.lastAgentId && devTaskActiveStatuses.includes(detail.task.status)) {
        const command = await repo.createCommand(ownerId, {
            taskId,
            revisionId: revision.revisionId,
            agentId: detail.task.lastAgentId,
            type: 'cancel',
            message: `Cancelled by ${requestedBy}.`,
        });
        pushCommandToAgent(command);
        return { task: detail.task, command, cancelledLocally: false };
    }

    const cancelledTask = await repo.cancelTaskLocally(
        ownerId,
        taskId,
        revision.revisionId,
        `Cancelled by ${requestedBy}.`
    );
    await repo.appendEvent(ownerId, taskId, {
        revisionId: revision.revisionId,
        status: 'cancelled',
        statusNote: `Cancelled by ${requestedBy}.`,
    });
    return { task: cancelledTask, cancelledLocally: true };
}

function pushCommandToAgent(command: Awaited<ReturnType<typeof repo.createCommand>>) {
    sendCommandToAgent(command.ownerId, command.agentId, {
        type: command.type,
        command_id: command.commandId,
        request_id: command.requestId,
        task_id: command.taskId,
        revision_id: command.revisionId,
        message: command.message,
        created_at: command.createdAt,
    });
}
