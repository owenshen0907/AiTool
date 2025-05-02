// src/app/api/prompt/bad_cases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import * as repo from '@/lib/repositories/promptCasesRepository';

export const GET = async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const promptId = searchParams.get('prompt_id');
    if (!promptId) {
        return NextResponse.json({ error: 'Missing prompt_id' }, { status: 400 });
    }
    const items = await repo.listBadCases(promptId);
    return NextResponse.json(items);
};

export const POST = withUser(async (req: NextRequest, userId: string) => {
    const body = await req.json();
    const { prompt_id, items } = body;
    if (!prompt_id || !Array.isArray(items)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const created = await repo.insertBadCases(prompt_id, items, userId);
    return NextResponse.json(created, { status: 201 });
});

export const PUT = withUser(async (req: NextRequest, userId: string) => {
    const body = await req.json();
    const { items } = body;
    if (!Array.isArray(items)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const updated = await repo.updateBadCases(items, userId);
    return NextResponse.json(updated);
});

export const DELETE = withUser(async (req: NextRequest, userId: string) => {
    const body = await req.json();
    const { ids } = body;
    if (!Array.isArray(ids)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    await repo.deleteBadCases(ids, userId);
    return NextResponse.json({ success: true });
});