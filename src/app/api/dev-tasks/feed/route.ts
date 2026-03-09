import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/devTaskService';

export const GET = withUser(async (_req: NextRequest, userId: string) => {
    const feed = await service.listDevTaskFeed(userId);
    return NextResponse.json(feed);
});
