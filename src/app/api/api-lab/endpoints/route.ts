import { NextRequest, NextResponse } from 'next/server';
import { withApiLabUser } from '@/lib/api-lab/access';
import {
    createApiLabEndpoint,
    listApiLabEndpoints,
    updateApiLabEndpoint,
} from '@/lib/repositories/apiLabRepository';
import type { JsonObject } from '@/lib/models/apiLab';

function parseJsonObject(value: unknown): JsonObject {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
        return {};
    }

    return value as JsonObject;
}

export const GET = withApiLabUser(async (_req: NextRequest, userId: string) => {
    const endpoints = await listApiLabEndpoints(userId);
    return NextResponse.json(endpoints);
});

export const POST = withApiLabUser(async (req: NextRequest, userId: string) => {
    const body = (await req.json()) as Record<string, unknown>;
    const slug = String(body.slug || '').trim();
    const serviceKey = String(body.serviceKey || '').trim();
    const serviceName = String(body.serviceName || '').trim();
    const category = String(body.category || '').trim();
    const name = String(body.name || '').trim();
    const method = String(body.method || '').toUpperCase();
    const path = String(body.path || '').trim();

    if (!slug || !serviceKey || !serviceName || !category || !name || !method || !path) {
        return new NextResponse('Missing required fields', { status: 400 });
    }

    const endpoint = await createApiLabEndpoint(userId, {
        slug,
        serviceKey,
        serviceName,
        category,
        name,
        description: body.description === undefined ? null : String(body.description || ''),
        method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'WS',
        path,
        authType: body.authType as 'bearer' | 'x-api-key' | 'none' | 'custom' | undefined,
        authHeaderName: body.authHeaderName === undefined ? undefined : String(body.authHeaderName || '').trim(),
        contentType: body.contentType as
            | 'application/json'
            | 'multipart/form-data'
            | 'application/x-www-form-urlencoded'
            | 'none'
            | undefined,
        responseType: body.responseType as 'json' | 'text' | 'sse' | 'binary' | 'audio' | undefined,
        requestTemplate: parseJsonObject(body.requestTemplate),
        queryTemplate: parseJsonObject(body.queryTemplate),
        headerTemplate: parseJsonObject(body.headerTemplate),
        fileFieldName: body.fileFieldName === undefined ? undefined : String(body.fileFieldName || '').trim(),
        fileAccept: body.fileAccept === undefined ? undefined : String(body.fileAccept || '').trim(),
        docUrl: body.docUrl === undefined ? undefined : String(body.docUrl || '').trim(),
        notes: body.notes === undefined ? undefined : String(body.notes || ''),
        sortOrder: Number(body.sortOrder || 100),
        isSystem: Boolean(body.isSystem),
    });

    return NextResponse.json(endpoint, { status: 201 });
});

export const PATCH = withApiLabUser(async (req: NextRequest, userId: string) => {
    const body = (await req.json()) as Record<string, unknown>;
    const id = String(body.id || '').trim();
    if (!id) {
        return new NextResponse('Missing endpoint id', { status: 400 });
    }

    const updated = await updateApiLabEndpoint(userId, id, {
        slug: body.slug === undefined ? undefined : String(body.slug || '').trim(),
        serviceKey: body.serviceKey === undefined ? undefined : String(body.serviceKey || '').trim(),
        serviceName: body.serviceName === undefined ? undefined : String(body.serviceName || '').trim(),
        category: body.category === undefined ? undefined : String(body.category || '').trim(),
        name: body.name === undefined ? undefined : String(body.name || '').trim(),
        description: body.description === undefined ? undefined : String(body.description || ''),
        method:
            body.method === undefined
                ? undefined
                : (String(body.method || '').toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'WS'),
        path: body.path === undefined ? undefined : String(body.path || '').trim(),
        authType:
            body.authType === undefined
                ? undefined
                : (body.authType as 'bearer' | 'x-api-key' | 'none' | 'custom'),
        authHeaderName:
            body.authHeaderName === undefined ? undefined : String(body.authHeaderName || '').trim(),
        contentType:
            body.contentType === undefined
                ? undefined
                : (body.contentType as
                      | 'application/json'
                      | 'multipart/form-data'
                      | 'application/x-www-form-urlencoded'
                      | 'none'),
        responseType:
            body.responseType === undefined
                ? undefined
                : (body.responseType as 'json' | 'text' | 'sse' | 'binary' | 'audio'),
        requestTemplate: body.requestTemplate === undefined ? undefined : parseJsonObject(body.requestTemplate),
        queryTemplate: body.queryTemplate === undefined ? undefined : parseJsonObject(body.queryTemplate),
        headerTemplate: body.headerTemplate === undefined ? undefined : parseJsonObject(body.headerTemplate),
        fileFieldName: body.fileFieldName === undefined ? undefined : String(body.fileFieldName || '').trim(),
        fileAccept: body.fileAccept === undefined ? undefined : String(body.fileAccept || '').trim(),
        docUrl: body.docUrl === undefined ? undefined : String(body.docUrl || '').trim(),
        notes: body.notes === undefined ? undefined : String(body.notes || ''),
        sortOrder: body.sortOrder === undefined ? undefined : Number(body.sortOrder || 100),
    });

    if (!updated) {
        return new NextResponse('Endpoint not found', { status: 404 });
    }

    return NextResponse.json(updated);
});
