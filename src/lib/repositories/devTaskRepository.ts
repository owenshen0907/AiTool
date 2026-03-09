import { v4 as uuidv4 } from 'uuid';
import { pool } from '@/lib/db/client';
import type {
    DevTaskClaimRow,
    DevTaskCommandRow,
    DevTaskEventRow,
    DevTaskFeedCard,
    DevTaskRevisionRow,
    DevTaskRow,
    DevTaskStatus,
    DevTaskTuningRequestRow,
} from '@/lib/models/devTask';
import { devTaskActiveStatuses, devTaskTerminalStatuses } from '@/lib/models/devTask';

type JsonMap = Record<string, unknown>;

interface RawTaskRow {
    task_id: string;
    owner_id: string;
    project_slug: string;
    project_name: string;
    template_id: string;
    workspace_key: string;
    allowed_device_types: string[];
    priority: string;
    status: DevTaskStatus;
    current_revision_id: string | null;
    created_from: 'maintask' | 'aitool';
    created_by: string;
    requested_by: string;
    last_status_note: string | null;
    last_agent_id: string | null;
    last_device_type: string | null;
    created_at: string;
    updated_at: string;
}

interface RawRevisionRow {
    revision_id: string;
    task_id: string;
    revision_no: number;
    goal: string;
    inputs: JsonMap;
    plan_summary: string | null;
    execution_summary: string | null;
    check_report: JsonMap | null;
    next_step: string | null;
    status: DevTaskStatus;
    assigned_agent_id: string | null;
    requested_by: string;
    created_at: string;
    updated_at: string;
}

interface RawEventRow {
    event_id: string;
    task_id: string;
    revision_id: string;
    owner_id: string;
    status: DevTaskStatus | null;
    event_type: string;
    note: string | null;
    payload: JsonMap;
    created_at: string;
}

interface RawTuningRequestRow {
    request_id: string;
    task_id: string;
    revision_id: string;
    owner_id: string;
    requested_by: string;
    requested_from: 'maintask' | 'aitool';
    message: string;
    status: 'pending' | 'applied' | 'dismissed';
    created_revision_id: string | null;
    created_at: string;
    updated_at: string;
}

interface RawClaimRow {
    claim_id: string;
    task_id: string;
    revision_id: string;
    owner_id: string;
    agent_id: string;
    agent_name: string | null;
    device_type: string;
    claimed_at: string;
    lease_expires_at: string;
    released_at: string | null;
    status: 'active' | 'released' | 'expired';
}

interface RawCommandRow {
    command_id: string;
    task_id: string;
    revision_id: string;
    owner_id: string;
    agent_id: string;
    type: 'approval' | 'cancel' | 'tuning_request';
    request_id: string | null;
    message: string | null;
    status: 'pending' | 'applied' | 'dismissed';
    note: string | null;
    created_at: string;
    updated_at: string;
}

interface RawClaimCandidate extends RawTaskRow {
    revision_id: string;
    revision_no: number;
    goal: string;
    inputs: JsonMap;
    plan_summary: string | null;
    execution_summary: string | null;
    check_report: JsonMap | null;
    next_step: string | null;
    revision_status: DevTaskStatus;
    assigned_agent_id: string | null;
    revision_requested_by: string;
    revision_created_at: string;
    revision_updated_at: string;
}

function mapTaskRow(row: RawTaskRow): DevTaskRow {
    return {
        taskId: row.task_id,
        ownerId: row.owner_id,
        projectSlug: row.project_slug,
        projectName: row.project_name,
        templateId: row.template_id,
        workspaceKey: row.workspace_key,
        allowedDeviceTypes: row.allowed_device_types as DevTaskRow['allowedDeviceTypes'],
        priority: row.priority as DevTaskRow['priority'],
        status: row.status,
        currentRevisionId: row.current_revision_id,
        createdFrom: row.created_from,
        createdBy: row.created_by,
        requestedBy: row.requested_by,
        lastStatusNote: row.last_status_note,
        lastAgentId: row.last_agent_id,
        lastDeviceType: row.last_device_type,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapRevisionRow(row: RawRevisionRow): DevTaskRevisionRow {
    return {
        revisionId: row.revision_id,
        taskId: row.task_id,
        revisionNo: row.revision_no,
        goal: row.goal,
        inputs: row.inputs || {},
        planSummary: row.plan_summary,
        executionSummary: row.execution_summary,
        checkReport: row.check_report,
        nextStep: row.next_step,
        status: row.status,
        assignedAgentId: row.assigned_agent_id,
        requestedBy: row.requested_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapEventRow(row: RawEventRow): DevTaskEventRow {
    return {
        eventId: row.event_id,
        taskId: row.task_id,
        revisionId: row.revision_id,
        ownerId: row.owner_id,
        status: row.status,
        eventType: row.event_type,
        note: row.note,
        payload: row.payload || {},
        createdAt: row.created_at,
    };
}

function mapTuningRequestRow(row: RawTuningRequestRow): DevTaskTuningRequestRow {
    return {
        requestId: row.request_id,
        taskId: row.task_id,
        revisionId: row.revision_id,
        ownerId: row.owner_id,
        requestedBy: row.requested_by,
        requestedFrom: row.requested_from,
        message: row.message,
        status: row.status,
        createdRevisionId: row.created_revision_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapClaimRow(row: RawClaimRow): DevTaskClaimRow {
    return {
        claimId: row.claim_id,
        taskId: row.task_id,
        revisionId: row.revision_id,
        ownerId: row.owner_id,
        agentId: row.agent_id,
        agentName: row.agent_name,
        deviceType: row.device_type,
        claimedAt: row.claimed_at,
        leaseExpiresAt: row.lease_expires_at,
        releasedAt: row.released_at,
        status: row.status,
    };
}

function mapCommandRow(row: RawCommandRow): DevTaskCommandRow {
    return {
        commandId: row.command_id,
        taskId: row.task_id,
        revisionId: row.revision_id,
        ownerId: row.owner_id,
        agentId: row.agent_id,
        type: row.type,
        requestId: row.request_id,
        message: row.message,
        status: row.status,
        note: row.note,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function expireStaleClaims(ownerId: string) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows: staleClaims } = await client.query<RawClaimRow>(
            `
                UPDATE dev_task_claim
                SET status = 'expired', released_at = NOW()
                WHERE owner_id = $1
                  AND status = 'active'
                  AND lease_expires_at < NOW()
                RETURNING *
            `,
            [ownerId]
        );

        const expired = staleClaims.map(mapClaimRow);
        if (expired.length > 0) {
            const revisionIds = expired.map((claim) => claim.revisionId);
            await client.query(
                `
                    UPDATE dev_task_revision
                    SET status = 'interrupted', updated_at = NOW()
                    WHERE revision_id = ANY($1::uuid[])
                      AND status = ANY($2::text[])
                `,
                [revisionIds, devTaskActiveStatuses]
            );

            const taskIds = [...new Set(expired.map((claim) => claim.taskId))];
            await client.query(
                `
                    UPDATE dev_tasks
                    SET status = 'interrupted',
                        last_status_note = 'Claim lease expired before the agent reported back.',
                        updated_at = NOW()
                    WHERE task_id = ANY($1::uuid[])
                      AND status = ANY($2::text[])
                `,
                [taskIds, devTaskActiveStatuses]
            );
        }

        await client.query('COMMIT');
        return expired;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function createTask(
    ownerId: string,
    input: {
        taskId: string;
        revisionId: string;
        projectSlug: string;
        projectName: string;
        templateId: string;
        workspaceKey: string;
        allowedDeviceTypes: string[];
        priority: string;
        createdFrom: 'maintask' | 'aitool';
        createdBy: string;
        requestedBy: string;
        goal: string;
        inputs: JsonMap;
    }
) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows: taskRows } = await client.query<RawTaskRow>(
            `
                INSERT INTO dev_tasks (
                    task_id,
                    owner_id,
                    project_slug,
                    project_name,
                    template_id,
                    workspace_key,
                    allowed_device_types,
                    priority,
                    status,
                    current_revision_id,
                    created_from,
                    created_by,
                    requested_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7::text[], $8, 'queued', NULL, $9, $10, $11)
                RETURNING *
            `,
            [
                input.taskId,
                ownerId,
                input.projectSlug,
                input.projectName,
                input.templateId,
                input.workspaceKey,
                input.allowedDeviceTypes,
                input.priority,
                input.createdFrom,
                input.createdBy,
                input.requestedBy,
            ]
        );

        const { rows: revisionRows } = await client.query<RawRevisionRow>(
            `
                INSERT INTO dev_task_revision (
                    revision_id,
                    task_id,
                    revision_no,
                    goal,
                    inputs,
                    status,
                    requested_by
                ) VALUES ($1, $2, 1, $3, $4::jsonb, 'queued', $5)
                RETURNING *
            `,
            [input.revisionId, input.taskId, input.goal, JSON.stringify(input.inputs || {}), input.requestedBy]
        );

        const { rows: linkedTaskRows } = await client.query<RawTaskRow>(
            `
                UPDATE dev_tasks
                SET current_revision_id = $2,
                    updated_at = NOW()
                WHERE task_id = $1
                RETURNING *
            `,
            [input.taskId, input.revisionId]
        );

        await client.query('COMMIT');
        return {
            task: mapTaskRow(linkedTaskRows[0] || taskRows[0]),
            revision: mapRevisionRow(revisionRows[0]),
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function getTask(ownerId: string, taskId: string) {
    const { rows } = await pool.query<RawTaskRow>(
        `SELECT * FROM dev_tasks WHERE owner_id = $1 AND task_id = $2`,
        [ownerId, taskId]
    );
    return rows[0] ? mapTaskRow(rows[0]) : null;
}

export async function getRevision(revisionId: string) {
    const { rows } = await pool.query<RawRevisionRow>(
        `SELECT * FROM dev_task_revision WHERE revision_id = $1`,
        [revisionId]
    );
    return rows[0] ? mapRevisionRow(rows[0]) : null;
}

export async function createRevision(
    ownerId: string,
    taskId: string,
    input: {
        revisionId: string;
        goal: string;
        inputs: JsonMap;
        requestedBy: string;
        tuningRequestId?: string | null;
    }
) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows: taskRows } = await client.query<RawTaskRow>(
            `SELECT * FROM dev_tasks WHERE owner_id = $1 AND task_id = $2 FOR UPDATE`,
            [ownerId, taskId]
        );
        const task = taskRows[0];
        if (!task) {
            throw new Error('Task not found');
        }

        const { rows: maxRows } = await client.query<{ max_revision_no: number | null }>(
            `SELECT MAX(revision_no) AS max_revision_no FROM dev_task_revision WHERE task_id = $1`,
            [taskId]
        );
        const revisionNo = (maxRows[0]?.max_revision_no || 0) + 1;

        const { rows: revisionRows } = await client.query<RawRevisionRow>(
            `
                INSERT INTO dev_task_revision (
                    revision_id,
                    task_id,
                    revision_no,
                    goal,
                    inputs,
                    status,
                    requested_by
                ) VALUES ($1, $2, $3, $4, $5::jsonb, 'queued', $6)
                RETURNING *
            `,
            [input.revisionId, taskId, revisionNo, input.goal, JSON.stringify(input.inputs || {}), input.requestedBy]
        );

        const { rows: updatedTaskRows } = await client.query<RawTaskRow>(
            `
                UPDATE dev_tasks
                SET current_revision_id = $2,
                    status = 'queued',
                    last_status_note = 'A new revision was queued.',
                    updated_at = NOW()
                WHERE owner_id = $1 AND task_id = $3
                RETURNING *
            `,
            [ownerId, input.revisionId, taskId]
        );

        if (input.tuningRequestId) {
            await client.query(
                `
                    UPDATE dev_task_tuning_request
                    SET status = 'applied', created_revision_id = $2, updated_at = NOW()
                    WHERE request_id = $1
                `,
                [input.tuningRequestId, input.revisionId]
            );
        }

        await client.query('COMMIT');
        return {
            task: mapTaskRow(updatedTaskRows[0]),
            revision: mapRevisionRow(revisionRows[0]),
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function claimNextTask(
    ownerId: string,
    input: {
        agentId: string;
        agentName?: string;
        deviceType: string;
        workspaceKeys: string[];
        projectSlugs?: string[];
        maxParallelProjects: number;
        leaseSeconds: number;
    }
) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows: activeProjectRows } = await client.query<{ project_slug: string }>(
            `
                SELECT DISTINCT project_slug
                FROM dev_tasks
                WHERE owner_id = $1
                  AND last_agent_id = $2
                  AND status = ANY($3::text[])
            `,
            [ownerId, input.agentId, devTaskActiveStatuses]
        );

        if (activeProjectRows.length >= input.maxParallelProjects) {
            await client.query('ROLLBACK');
            return null;
        }

        const params: any[] = [ownerId, input.workspaceKeys, input.deviceType, devTaskActiveStatuses];
        let projectFilterSql = '';
        if (input.projectSlugs && input.projectSlugs.length > 0) {
            params.push(input.projectSlugs);
            projectFilterSql = `AND t.project_slug = ANY($${params.length}::text[])`;
        }

        const { rows: candidateRows } = await client.query<RawClaimCandidate>(
            `
                SELECT
                    t.*,
                    r.revision_id,
                    r.revision_no,
                    r.goal,
                    r.inputs,
                    r.plan_summary,
                    r.execution_summary,
                    r.check_report,
                    r.next_step,
                    r.status AS revision_status,
                    r.assigned_agent_id,
                    r.requested_by AS revision_requested_by,
                    r.created_at AS revision_created_at,
                    r.updated_at AS revision_updated_at
                FROM dev_tasks t
                JOIN dev_task_revision r ON r.revision_id = t.current_revision_id
                WHERE t.owner_id = $1
                  AND t.status = 'queued'
                  AND t.workspace_key = ANY($2::text[])
                  AND ('any' = ANY(t.allowed_device_types) OR $3 = ANY(t.allowed_device_types))
                  ${projectFilterSql}
                  AND NOT EXISTS (
                    SELECT 1
                    FROM dev_tasks busy
                    WHERE busy.owner_id = t.owner_id
                      AND busy.project_slug = t.project_slug
                      AND busy.status = ANY($4::text[])
                  )
                ORDER BY
                  CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
                  t.updated_at ASC
                LIMIT 1
                FOR UPDATE OF t SKIP LOCKED
            `,
            params
        );

        const candidate = candidateRows[0];
        if (!candidate) {
            await client.query('ROLLBACK');
            return null;
        }

        const leaseSeconds = Math.max(10, input.leaseSeconds);
        await client.query<RawClaimRow>(
            `
                INSERT INTO dev_task_claim (
                    task_id,
                    revision_id,
                    owner_id,
                    agent_id,
                    agent_name,
                    device_type,
                    lease_expires_at,
                    status
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW() + ($7 || ' seconds')::interval, 'active')
            `,
            [candidate.task_id, candidate.revision_id, ownerId, input.agentId, input.agentName || null, input.deviceType, leaseSeconds]
        );

        await client.query(
            `
                UPDATE dev_task_revision
                SET status = 'claimed', assigned_agent_id = $2, updated_at = NOW()
                WHERE revision_id = $1
            `,
            [candidate.revision_id, input.agentId]
        );

        const { rows: updatedTaskRows } = await client.query<RawTaskRow>(
            `
                UPDATE dev_tasks
                SET status = 'claimed',
                    last_status_note = $2,
                    last_agent_id = $3,
                    last_device_type = $4,
                    updated_at = NOW()
                WHERE task_id = $1
                RETURNING *
            `,
            [candidate.task_id, `Claimed by ${input.agentName || input.agentId}.`, input.agentId, input.deviceType]
        );

        await client.query('COMMIT');

        const updatedTask = mapTaskRow(updatedTaskRows[0]);
        const revision = mapRevisionRow({
            revision_id: candidate.revision_id,
            task_id: candidate.task_id,
            revision_no: candidate.revision_no,
            goal: candidate.goal,
            inputs: candidate.inputs,
            plan_summary: candidate.plan_summary,
            execution_summary: candidate.execution_summary,
            check_report: candidate.check_report,
            next_step: candidate.next_step,
            status: 'claimed',
            assigned_agent_id: input.agentId,
            requested_by: candidate.revision_requested_by,
            created_at: candidate.revision_created_at,
            updated_at: candidate.revision_updated_at,
        });

        return {
            task: updatedTask,
            revision,
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function heartbeat(
    ownerId: string,
    input: {
        taskId: string;
        revisionId: string;
        agentId: string;
        deviceType: string;
        leaseSeconds: number;
        status?: DevTaskStatus;
        statusNote?: string;
    }
) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rowCount } = await client.query(
            `
                UPDATE dev_task_claim
                SET lease_expires_at = NOW() + ($5 || ' seconds')::interval
                WHERE owner_id = $1
                  AND task_id = $2
                  AND revision_id = $3
                  AND agent_id = $4
                  AND status = 'active'
            `,
            [ownerId, input.taskId, input.revisionId, input.agentId, Math.max(10, input.leaseSeconds)]
        );

        if (rowCount === 0) {
            throw new Error('Active claim not found');
        }

        if (input.status) {
            await client.query(
                `
                    UPDATE dev_task_revision
                    SET status = $2,
                        assigned_agent_id = $3,
                        updated_at = NOW()
                    WHERE revision_id = $1
                `,
                [input.revisionId, input.status, input.agentId]
            );

            await client.query(
                `
                    UPDATE dev_tasks
                    SET status = $2,
                        last_status_note = COALESCE($3, last_status_note),
                        last_agent_id = $4,
                        last_device_type = $5,
                        updated_at = NOW()
                    WHERE task_id = $1
                `,
                [input.taskId, input.status, input.statusNote || null, input.agentId, input.deviceType]
            );
        }

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function appendEvent(
    ownerId: string,
    taskId: string,
    input: {
        revisionId: string;
        status?: DevTaskStatus;
        statusNote?: string;
        planSummary?: string;
        executionSummary?: string;
        checkReport?: JsonMap;
        nextStep?: string;
        followUps?: string[];
        blockers?: string[];
    }
) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const eventPayload: JsonMap = {
            followUps: input.followUps || [],
            blockers: input.blockers || [],
        };

        const { rows: eventRows } = await client.query<RawEventRow>(
            `
                INSERT INTO dev_task_event (
                    event_id,
                    task_id,
                    revision_id,
                    owner_id,
                    status,
                    event_type,
                    note,
                    payload
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
                RETURNING *
            `,
            [
                uuidv4(),
                taskId,
                input.revisionId,
                ownerId,
                input.status || null,
                input.status || 'note',
                input.statusNote || null,
                JSON.stringify(eventPayload),
            ]
        );

        if (input.status || input.planSummary || input.executionSummary || input.checkReport || input.nextStep) {
            await client.query(
                `
                    UPDATE dev_task_revision
                    SET status = COALESCE($2, status),
                        plan_summary = COALESCE($3, plan_summary),
                        execution_summary = COALESCE($4, execution_summary),
                        check_report = COALESCE($5::jsonb, check_report),
                        next_step = COALESCE($6, next_step),
                        updated_at = NOW()
                    WHERE revision_id = $1
                `,
                [
                    input.revisionId,
                    input.status || null,
                    input.planSummary || null,
                    input.executionSummary || null,
                    input.checkReport ? JSON.stringify(input.checkReport) : null,
                    input.nextStep || null,
                ]
            );

            await client.query(
                `
                    UPDATE dev_tasks
                    SET status = COALESCE($2, status),
                        last_status_note = COALESCE($3, last_status_note),
                        updated_at = NOW()
                    WHERE task_id = $1
                `,
                [taskId, input.status || null, input.statusNote || null]
            );
        }

        if (input.status && devTaskTerminalStatuses.includes(input.status)) {
            await client.query(
                `
                    UPDATE dev_task_claim
                    SET status = 'released', released_at = NOW()
                    WHERE task_id = $1
                      AND revision_id = $2
                      AND status = 'active'
                `,
                [taskId, input.revisionId]
            );
        }

        await client.query('COMMIT');
        return mapEventRow(eventRows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function createTuningRequest(
    ownerId: string,
    taskId: string,
    input: {
        revisionId: string;
        requestedBy: string;
        requestedFrom: 'maintask' | 'aitool';
        message: string;
    }
) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows: taskRows } = await client.query<RawTaskRow>(
            `SELECT * FROM dev_tasks WHERE owner_id = $1 AND task_id = $2 FOR UPDATE`,
            [ownerId, taskId]
        );
        const task = taskRows[0];
        if (!task) {
            throw new Error('Task not found');
        }

        const requestId = uuidv4();
        const { rows: requestRows } = await client.query<RawTuningRequestRow>(
            `
                INSERT INTO dev_task_tuning_request (
                    request_id,
                    task_id,
                    revision_id,
                    owner_id,
                    requested_by,
                    requested_from,
                    message,
                    status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
                RETURNING *
            `,
            [requestId, taskId, input.revisionId, ownerId, input.requestedBy, input.requestedFrom, input.message]
        );

        await client.query('COMMIT');
        return {
            request: mapTuningRequestRow(requestRows[0]),
            task: mapTaskRow(task),
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function createCommand(
    ownerId: string,
    input: {
        taskId: string;
        revisionId: string;
        agentId: string;
        type: 'approval' | 'cancel' | 'tuning_request';
        requestId?: string | null;
        message?: string | null;
    }
) {
    const { rows } = await pool.query<RawCommandRow>(
        `
            INSERT INTO dev_task_command (
                command_id,
                task_id,
                revision_id,
                owner_id,
                agent_id,
                type,
                request_id,
                message,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
            RETURNING *
        `,
        [
            uuidv4(),
            input.taskId,
            input.revisionId,
            ownerId,
            input.agentId,
            input.type,
            input.requestId || null,
            input.message || null,
        ]
    );

    return mapCommandRow(rows[0]);
}

export async function listPendingCommands(ownerId: string, agentId: string) {
    const { rows } = await pool.query<RawCommandRow>(
        `
            SELECT c.*
            FROM dev_task_command c
            JOIN dev_tasks t ON t.task_id = c.task_id
            WHERE c.owner_id = $1
              AND c.agent_id = $2
              AND c.status = 'pending'
              AND t.current_revision_id = c.revision_id
              AND (
                (c.type = 'approval' AND t.status = 'awaiting_approval')
                OR (c.type = 'cancel' AND t.status = ANY($3::text[]))
                OR (c.type = 'tuning_request' AND t.status = ANY($3::text[]))
              )
            ORDER BY c.created_at ASC
        `,
        [ownerId, agentId, devTaskActiveStatuses]
    );

    return rows.map(mapCommandRow);
}

export async function ackCommand(
    ownerId: string,
    commandId: string,
    input: {
        status: 'applied' | 'dismissed';
        note?: string | null;
    }
) {
    const { rows } = await pool.query<RawCommandRow>(
        `
            UPDATE dev_task_command
            SET status = $3,
                note = $4,
                updated_at = NOW()
            WHERE owner_id = $1
              AND command_id = $2
            RETURNING *
        `,
        [ownerId, commandId, input.status, input.note || null]
    );

    return rows[0] ? mapCommandRow(rows[0]) : null;
}

export async function cancelTaskLocally(ownerId: string, taskId: string, revisionId: string, note: string) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `
                UPDATE dev_task_revision
                SET status = 'cancelled',
                    updated_at = NOW()
                WHERE revision_id = $1
            `,
            [revisionId]
        );

        const { rows } = await client.query<RawTaskRow>(
            `
                UPDATE dev_tasks
                SET status = 'cancelled',
                    last_status_note = $3,
                    updated_at = NOW()
                WHERE owner_id = $1
                  AND task_id = $2
                RETURNING *
            `,
            [ownerId, taskId, note]
        );

        await client.query(
            `
                UPDATE dev_task_claim
                SET status = 'released',
                    released_at = NOW()
                WHERE task_id = $1
                  AND revision_id = $2
                  AND status = 'active'
            `,
            [taskId, revisionId]
        );

        await client.query('COMMIT');
        return rows[0] ? mapTaskRow(rows[0]) : null;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function listFeed(ownerId: string): Promise<DevTaskFeedCard[]> {
    const { rows } = await pool.query<
        RawTaskRow &
        RawRevisionRow
    >(
        `
            SELECT
                t.*,
                r.revision_id,
                r.revision_no,
                r.plan_summary,
                r.execution_summary,
                r.check_report,
                r.next_step,
                r.assigned_agent_id,
                r.updated_at AS revision_updated_at
            FROM dev_tasks t
            JOIN dev_task_revision r ON r.revision_id = t.current_revision_id
            WHERE t.owner_id = $1
            ORDER BY t.updated_at DESC
            LIMIT 50
        `,
        [ownerId]
    );

    const cards = rows.map((row) => ({
        projectSlug: row.project_slug,
        projectName: row.project_name,
        taskId: row.task_id,
        revisionId: row.revision_id,
        revisionNo: row.revision_no,
        status: row.status,
        priority: row.priority as DevTaskFeedCard['priority'],
        lastStatusNote: row.last_status_note,
        planSummary: row.plan_summary,
        executionSummary: row.execution_summary,
        nextStep: row.next_step,
        checkReport: row.check_report,
        assignedAgentId: row.assigned_agent_id,
        deviceType: row.last_device_type,
        updatedAt: row.updated_at,
    }));

    const seenProjects = new Set<string>();
    return cards.filter((card) => {
        if (seenProjects.has(card.projectSlug)) return false;
        seenProjects.add(card.projectSlug);
        return true;
    });
}

export async function getTaskDetail(ownerId: string, taskId: string) {
    const task = await getTask(ownerId, taskId);
    if (!task) return null;

    const [{ rows: revisionRows }, { rows: eventRows }, { rows: tuningRows }, { rows: claimRows }, { rows: commandRows }] = await Promise.all([
        pool.query<RawRevisionRow>(
            `SELECT * FROM dev_task_revision WHERE task_id = $1 ORDER BY revision_no DESC`,
            [taskId]
        ),
        pool.query<RawEventRow>(
            `SELECT * FROM dev_task_event WHERE task_id = $1 ORDER BY created_at DESC LIMIT 60`,
            [taskId]
        ),
        pool.query<RawTuningRequestRow>(
            `SELECT * FROM dev_task_tuning_request WHERE task_id = $1 ORDER BY created_at DESC LIMIT 30`,
            [taskId]
        ),
        pool.query<RawClaimRow>(
            `SELECT * FROM dev_task_claim WHERE task_id = $1 ORDER BY claimed_at DESC LIMIT 10`,
            [taskId]
        ),
        pool.query<RawCommandRow>(
            `SELECT * FROM dev_task_command WHERE task_id = $1 ORDER BY created_at DESC LIMIT 30`,
            [taskId]
        ),
    ]);

    return {
        task,
        revisions: revisionRows.map(mapRevisionRow),
        events: eventRows.map(mapEventRow),
        tuningRequests: tuningRows.map(mapTuningRequestRow),
        claims: claimRows.map(mapClaimRow),
        commands: commandRows.map(mapCommandRow),
    };
}

export async function ensureJournalEntry(
    ownerId: string,
    input: {
        projectSlug: string;
        projectName: string;
        title: string;
        summary?: string;
        body?: string;
    }
) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const directoryName = input.projectName || input.projectSlug;
        const { rows: directoryRows } = await client.query<{ id: string }>(
            `
                SELECT id
                FROM directories
                WHERE feature = 'dev_journal'
                  AND created_by = $1
                  AND parent_id IS NULL
                  AND name = $2
                LIMIT 1
            `,
            [ownerId, directoryName]
        );

        let directoryId = directoryRows[0]?.id;
        if (!directoryId) {
            directoryId = uuidv4();
            const { rows: positionRows } = await client.query<{ next_pos: number }>(
                `
                    SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
                    FROM directories
                    WHERE feature = 'dev_journal'
                      AND created_by = $1
                      AND parent_id IS NULL
                `,
                [ownerId]
            );
            await client.query(
                `
                    INSERT INTO directories (
                        id,
                        feature,
                        parent_id,
                        name,
                        position,
                        created_by
                    ) VALUES ($1, 'dev_journal', NULL, $2, $3, $4)
                `,
                [directoryId, directoryName, positionRows[0]?.next_pos || 0, ownerId]
            );
        }

        const { rows: positionRows } = await client.query<{ next_pos: number }>(
            `
                SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
                FROM dev_journal_content
                WHERE directory_id = $1
            `,
            [directoryId]
        );

        const entryId = uuidv4();
        await client.query(
            `
                INSERT INTO dev_journal_content (
                    id,
                    directory_id,
                    title,
                    summary,
                    body,
                    position,
                    created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
                entryId,
                directoryId,
                input.title,
                input.summary || null,
                input.body || null,
                positionRows[0]?.next_pos || 0,
                ownerId,
            ]
        );

        await client.query('COMMIT');
        return { entryId, directoryId };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}
