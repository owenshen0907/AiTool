// app/api/models/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
    getModelsBySupplier,
    createModel,
    updateModel,
} from '@/lib/repositories/modelRepository';

/**
 * GET /api/models?supplier_id=...
 * 返回指定供应商下的模型
 */
export async function GET(req: NextRequest) {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
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
}

/**
 * POST /api/models
 * 新增模型（使用 snake_case）
 */
export async function POST(req: NextRequest) {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const {
        supplier_id,
        name,
        model_type,
        supports_image_input,
        supports_video_input,
        supports_audio_output,
        supports_json_mode,
        supports_tool,
        supports_web_search,
        supports_deep_thinking,
    } = await req.json();

    if (!supplier_id || !name || !model_type) {
        return new NextResponse('Missing required fields', { status: 400 });
    }

    try {
        const model = await createModel({
            supplierId:          supplier_id,
            name,
            modelType:           model_type,
            supportsImageInput:  Boolean(supports_image_input),
            supportsVideoInput:  Boolean(supports_video_input),
            supportsAudioOutput: Boolean(supports_audio_output),
            supportsJsonMode:    Boolean(supports_json_mode),
            supportsTool:        Boolean(supports_tool),
            supportsWebSearch:   Boolean(supports_web_search),
            supportsDeepThinking:Boolean(supports_deep_thinking),
        });
        return NextResponse.json(model);
    } catch (err) {
        console.error('createModel error', err);
        return new NextResponse('Failed to create model', { status: 500 });
    }
}

/**
 * PATCH /api/models
 * 修改模型（使用 snake_case）
 */
export async function PATCH(req: NextRequest) {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const {
        id,
        name,
        model_type,
        supports_image_input,
        supports_video_input,
        supports_audio_output,
        supports_json_mode,
        supports_tool,
        supports_web_search,
        supports_deep_thinking,
    } = await req.json();

    if (!id) {
        return new NextResponse('Missing model id', { status: 400 });
    }

    const updates = {
        ...(name !== undefined && { name }),
        ...(model_type !== undefined && { modelType: model_type }),
        ...(supports_image_input !== undefined && { supportsImageInput: Boolean(supports_image_input) }),
        ...(supports_video_input !== undefined && { supportsVideoInput: Boolean(supports_video_input) }),
        ...(supports_audio_output !== undefined && { supportsAudioOutput: Boolean(supports_audio_output) }),
        ...(supports_json_mode !== undefined && { supportsJsonMode: Boolean(supports_json_mode) }),
        ...(supports_tool !== undefined && { supportsTool: Boolean(supports_tool) }),
        ...(supports_web_search !== undefined && { supportsWebSearch: Boolean(supports_web_search) }),
        ...(supports_deep_thinking !== undefined && { supportsDeepThinking: Boolean(supports_deep_thinking) }),
    };

    try {
        const model = await updateModel(id, updates);
        return NextResponse.json(model);
    } catch (err) {
        console.error('updateModel error', err);
        return new NextResponse('Failed to update model', { status: 500 });
    }
}