import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/devTaskService';

const tuningSchema = z.object({
    revision_id: z.string().uuid(),
    requested_by: z.string().min(1),
    requested_from: z.enum(['maintask', 'aitool']).default('aitool'),
    message: z.string().min(1),
});

export const POST = withUser(async (req: NextRequest, userId: string, context?: any) => {
    const taskId = context?.params?.taskId;
    if (!taskId) {
        return NextResponse.json({ error: 'Missing task id' }, { status: 400 });
    }

    const parsed = tuningSchema.parse(await req.json());
    const created = await service.createDevTaskTuningRequest(userId, taskId, {
        revisionId: parsed.revision_id,
        requestedBy: parsed.requested_by,
        requestedFrom: parsed.requested_from,
        message: parsed.message,
    });
    return NextResponse.json(created, { status: 201 });
});
