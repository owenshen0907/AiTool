import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import { createApiLabExample, listApiLabExamples } from '@/lib/repositories/apiLabRepository';
import type { JsonObject } from '@/lib/models/apiLab';

function parseJsonObject(value: unknown): JsonObject {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
        return {};
    }

    return value as JsonObject;
}

export const GET = withUser(async (req: NextRequest, userId: string) => {
    const endpointId = req.nextUrl.searchParams.get('endpoint_id');
    if (!endpointId) {
        return new NextResponse('Missing endpoint_id', { status: 400 });
    }

    const examples = await listApiLabExamples(userId, endpointId);
    return NextResponse.json(examples);
});

export const POST = withUser(async (req: NextRequest, userId: string) => {
    const body = (await req.json()) as Record<string, unknown>;
    const endpointId = String(body.endpointId || '').trim();
    const name = String(body.name || '').trim();

    if (!endpointId || !name) {
        return new NextResponse('Missing endpointId or name', { status: 400 });
    }

    const example = await createApiLabExample(userId, {
        endpointId,
        name,
        requestBody: parseJsonObject(body.requestBody),
        requestQuery: parseJsonObject(body.requestQuery),
        requestHeaders: parseJsonObject(body.requestHeaders),
        responseStatus: body.responseStatus === undefined ? null : Number(body.responseStatus),
        responseHeaders: parseJsonObject(body.responseHeaders),
        responseBody: body.responseBody === undefined ? null : String(body.responseBody || ''),
        responseBodyFormat:
            body.responseBodyFormat === undefined
                ? 'json'
                : (body.responseBodyFormat as 'json' | 'text' | 'sse' | 'base64' | 'empty'),
        isRecommended: Boolean(body.isRecommended),
    });

    return NextResponse.json(example, { status: 201 });
});
