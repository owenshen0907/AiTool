import { NextRequest, NextResponse } from 'next/server';
import { withApiLabUser } from '@/lib/api-lab/access';
import {
    createApiLabMonitor,
    listApiLabMonitorRuns,
    listApiLabMonitors,
    updateApiLabMonitor,
} from '@/lib/repositories/apiLabRepository';

export const GET = withApiLabUser(async (_req: NextRequest, userId: string) => {
    const [monitors, runs] = await Promise.all([
        listApiLabMonitors(userId),
        listApiLabMonitorRuns(userId, 20),
    ]);

    return NextResponse.json({ monitors, runs });
});

export const POST = withApiLabUser(async (req: NextRequest, userId: string) => {
    const body = (await req.json()) as Record<string, unknown>;
    const endpointId = String(body.endpointId || '').trim();
    const envId = String(body.envId || '').trim();
    const name = String(body.name || '').trim();

    if (!endpointId || !envId || !name) {
        return new NextResponse('Missing endpointId, envId or name', { status: 400 });
    }

    const monitor = await createApiLabMonitor(userId, {
        endpointId,
        envId,
        name,
        expectedStatus: Number(body.expectedStatus || 200),
        maxDurationMs: Number(body.maxDurationMs || 5000),
        bodyIncludes: body.bodyIncludes ? String(body.bodyIncludes) : null,
        isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    });

    return NextResponse.json(monitor, { status: 201 });
});

export const PATCH = withApiLabUser(async (req: NextRequest, userId: string) => {
    const body = (await req.json()) as Record<string, unknown>;
    const id = String(body.id || '').trim();
    if (!id) {
        return new NextResponse('Missing monitor id', { status: 400 });
    }

    const monitor = await updateApiLabMonitor(userId, id, {
        name: body.name === undefined ? undefined : String(body.name || '').trim(),
        expectedStatus: body.expectedStatus === undefined ? undefined : Number(body.expectedStatus || 200),
        maxDurationMs: body.maxDurationMs === undefined ? undefined : Number(body.maxDurationMs || 5000),
        bodyIncludes: body.bodyIncludes === undefined ? undefined : String(body.bodyIncludes || ''),
        isActive: body.isActive === undefined ? undefined : Boolean(body.isActive),
    });

    if (!monitor) {
        return new NextResponse('Monitor not found', { status: 404 });
    }

    return NextResponse.json(monitor);
});
