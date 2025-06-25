import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import {
    getVoiceTonesByUser,
    createVoiceTone,
    updateVoiceTone,
    deleteVoiceTone,
} from '@/lib/repositories/suppliers/voiceRepository';

/** GET /api/suppliers/voice */
export const GET = withUser(async (_req: NextRequest, userId: string) => {
    const list = await getVoiceTonesByUser(userId);
    return NextResponse.json(list);
});

/** POST /api/suppliers/voice */
export const POST = withUser(async (req: NextRequest, userId: string) => {
    const {
        supplier_id,
        tone_id,
        name,
        description,
        available_model_ids,
        original_audio_file_id,
        original_audio_file_path,
        preview_audio_file_id,
        sample_audio_path,
    } = await req.json();

    if (!supplier_id || !tone_id || !name) {
        return new NextResponse('Missing required fields', { status: 400 });
    }

    const voice = await createVoiceTone(
        {
            supplierId: supplier_id,
            toneId: tone_id,
            name,
            description,
            availableModelIds: Array.isArray(available_model_ids) ? available_model_ids : [],
            originalAudioFileId: original_audio_file_id ?? null,
            originalAudioFilePath: original_audio_file_path ?? null,
            previewAudioFileId: preview_audio_file_id ?? null,
            sampleAudioPath: sample_audio_path ?? null,
        },
        userId
    );

    return NextResponse.json(voice, { status: 201 });
});

/** PATCH /api/suppliers/voice */
export const PATCH = withUser(async (req: NextRequest, userId: string) => {
    const {
        id,
        tone_id,
        name,
        description,
        available_model_ids,
        original_audio_file_id,
        original_audio_file_path,
        preview_audio_file_id,
        sample_audio_path,
    } = await req.json();

    if (!id) {
        return new NextResponse('Missing tone id', { status: 400 });
    }

    const updated = await updateVoiceTone(
        id,
        {
            tone_id,
            name,
            description,
            availableModelIds: Array.isArray(available_model_ids) ? available_model_ids : undefined,
            originalAudioFileId: original_audio_file_id ?? null,
            originalAudioFilePath: original_audio_file_path ?? null,
            previewAudioFileId: preview_audio_file_id ?? null,
            sampleAudioPath: sample_audio_path ?? null,
        },
        userId
    );

    if (!updated) {
        return new NextResponse('Not found or forbidden', { status: 404 });
    }

    return NextResponse.json(updated);
});

/** DELETE /api/suppliers/voice */
export const DELETE = withUser(async (req: NextRequest, userId: string) => {
    const { id } = await req.json();
    if (!id) {
        return new NextResponse('Missing tone id', { status: 400 });
    }

    const ok = await deleteVoiceTone(id, userId);
    if (!ok) {
        return new NextResponse('Not found or forbidden', { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
});