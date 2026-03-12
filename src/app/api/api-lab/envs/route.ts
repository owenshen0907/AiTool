import { NextRequest, NextResponse } from 'next/server';
import { withApiLabUser } from '@/lib/api-lab/access';
import {
    createApiLabEnv,
    listApiLabEnvs,
    updateApiLabEnv,
} from '@/lib/repositories/apiLabRepository';
import type { JsonObject } from '@/lib/models/apiLab';

function parseJsonObject(value: unknown): JsonObject {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
        return {};
    }

    return value as JsonObject;
}

export const GET = withApiLabUser(async (_req: NextRequest, userId: string) => {
    const envs = await listApiLabEnvs(userId);
    return NextResponse.json(envs);
});

export const POST = withApiLabUser(async (req: NextRequest, userId: string) => {
    const body = (await req.json()) as Record<string, unknown>;
    const serviceKey = String(body.serviceKey || '').trim();
    const serviceName = String(body.serviceName || '').trim();
    const name = String(body.name || '').trim();
    const baseUrl = String(body.baseUrl || '').trim();
    const websocketUrl = body.websocketUrl === undefined ? '' : String(body.websocketUrl || '').trim();
    const apiKey = String(body.apiKey || '');

    if (!serviceKey || !serviceName || !name || !baseUrl) {
        return new NextResponse('Missing required fields', { status: 400 });
    }

    const env = await createApiLabEnv(userId, {
        serviceKey,
        serviceName,
        name,
        baseUrl,
        websocketUrl,
        apiKey,
        extraHeaders: parseJsonObject(body.extraHeaders),
        timeoutMs: Number(body.timeoutMs || 30000),
        isDefault: Boolean(body.isDefault),
    });

    return NextResponse.json(env, { status: 201 });
});

export const PATCH = withApiLabUser(async (req: NextRequest, userId: string) => {
    const body = (await req.json()) as Record<string, unknown>;
    const id = String(body.id || '').trim();
    if (!id) {
        return new NextResponse('Missing env id', { status: 400 });
    }

    const updated = await updateApiLabEnv(userId, id, {
        serviceKey: body.serviceKey === undefined ? undefined : String(body.serviceKey || '').trim(),
        serviceName: body.serviceName === undefined ? undefined : String(body.serviceName || '').trim(),
        name: body.name === undefined ? undefined : String(body.name || '').trim(),
        baseUrl: body.baseUrl === undefined ? undefined : String(body.baseUrl || '').trim(),
        websocketUrl: body.websocketUrl === undefined ? undefined : String(body.websocketUrl || '').trim(),
        apiKey: body.apiKey === undefined ? undefined : String(body.apiKey || ''),
        extraHeaders: body.extraHeaders === undefined ? undefined : parseJsonObject(body.extraHeaders),
        timeoutMs: body.timeoutMs === undefined ? undefined : Number(body.timeoutMs || 30000),
        isDefault: body.isDefault === undefined ? undefined : Boolean(body.isDefault),
    });

    if (!updated) {
        return new NextResponse('Environment not found', { status: 404 });
    }

    return NextResponse.json(updated);
});
