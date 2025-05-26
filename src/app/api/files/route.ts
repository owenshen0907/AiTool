// File: src/app/api/files/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { withUser } from '@/lib/api/auth';
import { isFileLike } from '@/lib/utils/helpers/is-file';
import {
    listFilesByUser,
    removeFile,
    uploadFilesWithDb,
} from '@/lib/services/fileService';

const DIR_MAP: Record<string, 'img' | 'video' | 'audio'> = {
    'image/': 'img',
    'video/': 'video',
    'audio/': 'audio',
};

/**
 * GET /api/files
 * 可传 ?form_id=xxx 来过滤，只返回当前用户该表单下的文件
 */
export const GET = withUser(async (req: NextRequest, uid: string) => {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get('form_id');

    // 先拿到该用户所有文件
    let files = await listFilesByUser(uid);

    // 如果指定了 form_id，则做过滤
    if (formId) {
        files = files.filter((f) => f.form_id === formId);
    }

    return NextResponse.json(files);
});

/**
 * POST /api/files
 * 上传文件，接受 module 和 form_id
 */
export const POST = withUser(async (req: NextRequest, uid: string) => {
    const form = await req.formData();

    const moduleName = (form.get('module') as string) || 'default';
    const formId     = (form.get('form_id') as string) || null;

    const files = Array.from(form.values()).filter(isFileLike);
    if (files.length === 0) {
        return new NextResponse('No file found', { status: 400 });
    }

    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const records = await Promise.all(
        files.map(async (file) => {
            const mime = file.type || 'application/octet-stream';
            const dirKey = Object.keys(DIR_MAP).find((pre) => mime.startsWith(pre));
            if (!dirKey) throw new Error(`Unsupported mime: ${mime}`);

            const relDir  = path.join('upload', uid, DIR_MAP[dirKey], ymd);
            const relPath = path.join(relDir, uuidv4() + path.extname(file.name));
            const absPath = path.join(process.cwd(), 'public', relPath);

            await fs.mkdir(path.dirname(absPath), { recursive: true });
            const buffer = Buffer.from(await file.arrayBuffer());
            await fs.writeFile(absPath, buffer);

            return {
                original_name: file.name,
                mime_type:     mime,
                file_category: DIR_MAP[dirKey],
                file_path:     relPath,
                file_size:     buffer.byteLength,
                url:           `/${relPath}`,
            };
        })
    );

    // 持久化到 DB，并关联 formId
    const created = await uploadFilesWithDb(uid, moduleName, formId, records);
    return NextResponse.json(created.length === 1 ? created[0] : created);
});

/**
 * DELETE /api/files
 * 删除指定 file_id 的文件（数据库 + 磁盘）
 */
export const DELETE = withUser(async (req: NextRequest, uid: string) => {
    const { file_id } = await req.json();
    if (!file_id) {
        return new NextResponse('file_id required', { status: 400 });
    }
    await removeFile(file_id);
    return NextResponse.json({ success: true });
});