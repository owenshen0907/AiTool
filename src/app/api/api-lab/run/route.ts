import { NextRequest, NextResponse } from 'next/server';
import { withApiLabUser } from '@/lib/api-lab/access';
import { executeApiLabRequest } from '@/lib/api-lab/runner';
import type { JsonObject } from '@/lib/models/apiLab';
import { isFileLike } from '@/lib/utils/helpers/is-file';

function parseJsonObject(value: FormDataEntryValue | null): JsonObject {
    if (!value || typeof value !== 'string') {
        return {};
    }

    try {
        const parsed = JSON.parse(value) as unknown;
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
            return {};
        }
        return parsed as JsonObject;
    } catch {
        throw new Error('JSON 编辑区存在无效内容，请先修正。');
    }
}

export const POST = withApiLabUser(async (req: NextRequest, userId: string) => {
    const formData = await req.formData();
    const endpointId = String(formData.get('endpointId') || '').trim();
    const envId = String(formData.get('envId') || '').trim();

    if (!endpointId || !envId) {
        return new NextResponse('Missing endpointId or envId', { status: 400 });
    }

    const uploadedValue = formData.get('upload');
    const uploadedFile = uploadedValue && isFileLike(uploadedValue) ? uploadedValue : null;

    try {
        const result = await executeApiLabRequest({
            userId,
            endpointId,
            envId,
            bodyOverrides: parseJsonObject(formData.get('bodyText')),
            queryOverrides: parseJsonObject(formData.get('queryText')),
            headerOverrides: parseJsonObject(formData.get('headerText')),
            uploadedFile,
        });

        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 400 });
    }
});
