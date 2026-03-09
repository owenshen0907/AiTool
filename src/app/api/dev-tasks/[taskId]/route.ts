import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/devTaskService';

export const GET = withUser(async (_req: NextRequest, userId: string, context?: any) => {
    const taskId = context?.params?.taskId;
    if (!taskId) {
        return NextResponse.json({ error: 'Missing task id' }, { status: 400 });
    }

    const detail = await service.getDevTaskDetail(userId, taskId);
    if (!detail) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(detail);
});
