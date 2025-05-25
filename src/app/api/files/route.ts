// File: src/app/api/files/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { withUser } from '@/lib/api/auth';
import { isFileLike } from '@/lib/utils/helpers/is-file';
import { listFilesByUser, removeFile, uploadFilesWithDb } from '@/lib/services/fileService';

const DIR_MAP: Record<string, 'img' | 'video' | 'audio'> = {
    'image/': 'img',
    'video/': 'video',
    'audio/': 'audio',
};

/**
 * GET /api/files
 * 查询当前用户所有文件记录
 */
export const GET = withUser(async (req: NextRequest, uid: string) => {
    const files = await listFilesByUser(uid);
    return NextResponse.json(files);
});

/**
 * POST /api/files
 * 上传文件，返回 { path, url } 或数组
 */
export const POST = withUser(async (req: NextRequest, uid: string) => {
    const form = await req.formData();
    const moduleName = (form.get('module') as string) || 'default';
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

            const relDir = path.join('upload', uid, DIR_MAP[dirKey], ymd);
            const relPath = path.join(relDir, uuidv4() + path.extname(file.name));
            const absPath = path.join(process.cwd(), 'public', relPath);

            await fs.mkdir(path.dirname(absPath), { recursive: true });
            const buffer = Buffer.from(await file.arrayBuffer());
            await fs.writeFile(absPath, buffer);

            return {
                original_name: file.name,
                mime_type: mime,
                file_category: DIR_MAP[dirKey],
                file_path: relPath,
                file_size: buffer.byteLength,
                url: `/${relPath}`,
            };
        })
    );

    // 保存记录到数据库
    const created = await uploadFilesWithDb(uid, moduleName, records);
    return NextResponse.json(created.length === 1 ? created[0] : created);
});

/**
 * DELETE /api/files
 * 删除指定文件记录及物理文件
 * 请求 body: { file_id: string }
 */
export const DELETE = withUser(async (req: NextRequest, uid: string) => {
    const { file_id } = await req.json();
    if (!file_id) {
        return new NextResponse('file_id required', { status: 400 });
    }
    // 从数据库删除记录
    await removeFile(file_id);
    // 物理文件删除可由服务层完成或在这里手动删除
    return NextResponse.json({ success: true });
});
