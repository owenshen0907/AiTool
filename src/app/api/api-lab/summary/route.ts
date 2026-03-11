import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import { listApiLabEndpoints, listApiLabEnvs } from '@/lib/repositories/apiLabRepository';

export const GET = withUser(async (_req: NextRequest, userId: string) => {
    const [envs, endpoints] = await Promise.all([
        listApiLabEnvs(userId),
        listApiLabEndpoints(userId),
    ]);

    return NextResponse.json({ envs, endpoints });
});
