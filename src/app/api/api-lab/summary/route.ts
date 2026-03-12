import { NextRequest, NextResponse } from 'next/server';
import { withApiLabUser } from '@/lib/api-lab/access';
import { listApiLabEndpoints, listApiLabEnvs } from '@/lib/repositories/apiLabRepository';

export const GET = withApiLabUser(async (_req: NextRequest, userId: string) => {
    const [envs, endpoints] = await Promise.all([
        listApiLabEnvs(userId),
        listApiLabEndpoints(userId),
    ]);

    return NextResponse.json({ envs, endpoints });
});
