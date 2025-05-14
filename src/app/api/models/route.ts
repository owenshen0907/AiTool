// File: app/api/models/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
    getModelsBySupplier,
    createModel,
    updateModel,
    clearDefaultModelForSupplierAndType,
    clearDefaultModelForSupplierByModel,
} from '@/lib/repositories/modelRepository';
import { withUser } from '@/lib/api/auth';

interface ModelRequestBody {
    supplier_id?: string;
    id?: string;
    name?: string;
    model_type?: 'chat' | 'audio' | 'image' | 'video' | 'other';
    supports_audio_input?: boolean;
    supports_image_input?: boolean;
    supports_video_input?: boolean;
    supports_audio_output?: boolean;
    supports_image_output?: boolean;
    supports_video_output?: boolean;
    supports_json_mode?: boolean;
    supports_tool?: boolean;
    supports_web_search?: boolean;
    supports_deep_thinking?: boolean;
    supports_websocket?: boolean;
    is_default?: boolean;
}

/**
 * GET /api/models?supplier_id=...  返回指定供应商下的模型列表
 */
export const GET = withUser(async (req: NextRequest) => {
    const supplierId = req.nextUrl.searchParams.get('supplier_id');
    if (!supplierId) {
        return new NextResponse('Missing supplier_id', { status: 400 });
    }
    try {
        const models = await getModelsBySupplier(supplierId);
        return NextResponse.json(models);
    } catch (err) {
        console.error('getModelsBySupplier error', err);
        return new NextResponse('Failed to fetch models', { status: 500 });
    }
});

/**
 * POST /api/models  新增模型
 */
export const POST = withUser(async (req: NextRequest) => {
    const body = (await req.json()) as ModelRequestBody;
    const {
        supplier_id,
        name,
        model_type,
        supports_audio_input,
        supports_image_input,
        supports_video_input,
        supports_audio_output,
        supports_image_output,
        supports_video_output,
        supports_json_mode,
        supports_tool,
        supports_web_search,
        supports_deep_thinking,
        supports_websocket,
        is_default,
    } = body;

    if (!supplier_id || !name || !model_type) {
        return new NextResponse('Missing required fields', { status: 400 });
    }

    try {
        if (is_default) {
            await clearDefaultModelForSupplierByModel,(supplier_id);
        }
        const model = await createModel({
            supplierId: supplier_id,
            name,
            modelType: model_type,
            supportsAudioInput: !!supports_audio_input,
            supportsImageInput: !!supports_image_input,
            supportsVideoInput: !!supports_video_input,
            supportsAudioOutput: !!supports_audio_output,
            supportsImageOutput: !!supports_image_output,
            supportsVideoOutput: !!supports_video_output,
            supportsJsonMode: !!supports_json_mode,
            supportsTool: !!supports_tool,
            supportsWebSearch: !!supports_web_search,
            supportsDeepThinking: !!supports_deep_thinking,
            supportsWebsocket: !!supports_websocket,
            isDefault: !!is_default,
        });
        return NextResponse.json(model, { status: 201 });
    } catch (err) {
        console.error('createModel error', err);
        return new NextResponse('Failed to create model', { status: 500 });
    }
});

/**
 * PATCH /api/models  修改模型
 */
export const PATCH = withUser(async (req: NextRequest) => {
    const body = (await req.json()) as ModelRequestBody;
    const {
        id,
        name,
        model_type,
        supports_audio_input,
        supports_image_input,
        supports_video_input,
        supports_audio_output,
        supports_image_output,
        supports_video_output,
        supports_json_mode,
        supports_tool,
        supports_web_search,
        supports_deep_thinking,
        supports_websocket,
        is_default,
    } = body;

    if (!id) {
        return new NextResponse('Missing model id', { status: 400 });
    }

    try {
        if (is_default) {
            await clearDefaultModelForSupplierByModel(id);
        }

        const updates: Record<string, any> = {};
        if (name !== undefined) updates.name = name;
        if (model_type !== undefined) updates.modelType = model_type;
        if (supports_audio_input !== undefined) updates.supportsAudioInput = !!supports_audio_input;
        if (supports_image_input !== undefined) updates.supportsImageInput = !!supports_image_input;
        if (supports_video_input !== undefined) updates.supportsVideoInput = !!supports_video_input;
        if (supports_audio_output !== undefined) updates.supportsAudioOutput = !!supports_audio_output;
        if (supports_image_output !== undefined) updates.supportsImageOutput = !!supports_image_output;
        if (supports_video_output !== undefined) updates.supportsVideoOutput = !!supports_video_output;
        if (supports_json_mode !== undefined) updates.supportsJsonMode = !!supports_json_mode;
        if (supports_tool !== undefined) updates.supportsTool = !!supports_tool;
        if (supports_web_search !== undefined) updates.supportsWebSearch = !!supports_web_search;
        if (supports_deep_thinking !== undefined) updates.supportsDeepThinking = !!supports_deep_thinking;
        if (supports_websocket !== undefined) updates.supportsWebsocket = !!supports_websocket;
        if (is_default !== undefined) updates.isDefault = !!is_default;

        const model = await updateModel(id, updates);
        return NextResponse.json(model);
    } catch (err) {
        console.error('updateModel error', err);
        return new NextResponse('Failed to update model', { status: 500 });
    }
});