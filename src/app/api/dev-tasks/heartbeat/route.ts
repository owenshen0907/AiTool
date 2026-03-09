import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/devTaskService';

const heartbeatSchema = z.object({
    task_id: z.string().uuid(),
    revision_id: z.string().uuid(),
    agent_id: z.string().min(1),
    device_type: z.string().min(1),
    lease_seconds: z.number().int().positive().default(30),
    status: z.enum(['draft', 'queued', 'claimed', 'planning', 'awaiting_approval', 'executing', 'checking', 'completed', 'needs_tuning', 'failed', 'cancelled', 'interrupted']).optional(),
    status_note: z.string().optional(),
});

export const POST = withUser(async (req: NextRequest, userId: string) => {
    const parsed = heartbeatSchema.parse(await req.json());
    const result = await service.heartbeatDevTask(userId, {
        taskId: parsed.task_id,
        revisionId: parsed.revision_id,
        agentId: parsed.agent_id,
        deviceType: parsed.device_type,
        leaseSeconds: parsed.lease_seconds,
        status: parsed.status,
        statusNote: parsed.status_note,
    });
    return NextResponse.json(result);
});
