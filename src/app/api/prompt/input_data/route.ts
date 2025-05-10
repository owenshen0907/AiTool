// File: src/app/api/prompt/input_data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
    getInputDataByPrompt,
    insertInputData,
    updateInputData,
    deleteInputDataByPrompt,
    deleteInputData,
} from '@/lib/repositories/promptGenerationInputDataRepository';
import type { PromptGenerationInputData } from '@/lib/models/prompt/prompt';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const promptId = searchParams.get('prompt_id');
    if (!promptId) {
        return NextResponse.json({ error: 'Missing prompt_id' }, { status: 400 });
    }
    try {
        const rows = await getInputDataByPrompt(promptId);
        return NextResponse.json(rows);
    } catch (err: any) {
        console.error('GET /prompt/input_data error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt_id, items } = body as {
            prompt_id: string;
            items: Array<Omit<PromptGenerationInputData, 'id' | 'created_at'>>;
        };
        if (!prompt_id || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }
        const created: PromptGenerationInputData[] = [];
        for (const item of items) {
            const row = await insertInputData(item);
            created.push(row);
        }
        return NextResponse.json(created, { status: 201 });
    } catch (err: any) {
        console.error('POST /prompt/input_data error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { items } = body as { items: Array<Partial<Omit<PromptGenerationInputData, 'created_at'>>> };
        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }
        for (const item of items) {
            if (!item.id) continue;
            await updateInputData(item.id, item);
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('PUT /prompt/input_data error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const promptId = searchParams.get('prompt_id');
    if (promptId) {
        try {
            await deleteInputDataByPrompt(promptId);
            return NextResponse.json({ success: true });
        } catch (err: any) {
            console.error('DELETE /prompt/input_data?prompt_id error:', err);
            return NextResponse.json({ error: 'Internal error' }, { status: 500 });
        }
    }
    try {
        const body = await req.json();
        const { ids } = body as { ids: string[] };
        if (!Array.isArray(ids)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }
        for (const id of ids) {
            await deleteInputData(id);
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('DELETE /prompt/input_data body error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
