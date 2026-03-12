import { NextRequest, NextResponse } from 'next/server';
import { withApiLabUser } from '@/lib/api-lab/access';
import { ensureApiLabSeedData } from '@/lib/repositories/apiLabRepository';

export const POST = withApiLabUser(async (_req: NextRequest, userId: string) => {
    const result = await ensureApiLabSeedData(userId);
    return NextResponse.json(result);
});
