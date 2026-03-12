import { NextRequest, NextResponse } from 'next/server';
import { withApiLabUser } from '@/lib/api-lab/access';
import { listApiLabRunLogs } from '@/lib/repositories/apiLabRepository';

export const GET = withApiLabUser(async (req: NextRequest, userId: string) => {
    const endpointId = req.nextUrl.searchParams.get('endpoint_id');
    const limit = Number(req.nextUrl.searchParams.get('limit') || 10);

    if (!endpointId) {
        return new NextResponse('Missing endpoint_id', { status: 400 });
    }

    const logs = await listApiLabRunLogs(userId, endpointId, Number.isNaN(limit) ? 10 : limit);
    return NextResponse.json(logs);
});
