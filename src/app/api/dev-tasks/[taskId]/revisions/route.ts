import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/devTaskService';

const revisionSchema = z.object({
    revision_id: z.string().uuid().optional(),
    goal: z.string().min(1),
    inputs: z.record(z.unknown()).default({}),
    requested_by: z.string().min(1),
    tuning_request_id: z.string().uuid().optional(),
});

export const POST = withUser(async (req: NextRequest, userId: string, context?: any) => {
    const taskId = context?.params?.taskId;
    if (!taskId) {
        return NextResponse.json({ error: 'Missing task id' }, { status: 400 });
    }

    const parsed = revisionSchema.parse(await req.json());
    const created = await service.createDevTaskRevision(userId, taskId, {
        revisionId: parsed.revision_id || uuidv4(),
        goal: parsed.goal,
        inputs: parsed.inputs,
        requestedBy: parsed.requested_by,
        tuningRequestId: parsed.tuning_request_id,
    });
    return NextResponse.json(created, { status: 201 });
});
