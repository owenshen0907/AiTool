import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/devTaskService';

const schema = z.object({
    requested_by: z.string().min(1).default('aitool-ui'),
});

export const POST = withUser(async (req: NextRequest, userId: string, context?: any) => {
    const taskId = context?.params?.taskId;
    if (!taskId) {
        return NextResponse.json({ error: 'Missing task id' }, { status: 400 });
    }

    const parsed = schema.parse(await req.json().catch(() => ({})));
    const result = await service.cancelDevTask(userId, taskId, parsed.requested_by);
    return NextResponse.json(result);
});
