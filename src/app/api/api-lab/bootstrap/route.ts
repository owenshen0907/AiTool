import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import { ensureApiLabSeedData } from '@/lib/repositories/apiLabRepository';

export const POST = withUser(async (_req: NextRequest, userId: string) => {
    const result = await ensureApiLabSeedData(userId);
    return NextResponse.json(result);
});
