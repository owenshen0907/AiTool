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

// ✅ 强制 Node 运行时 & 禁掉缓存（避免 Edge 无 fs / RSC 缓存干扰）
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DIR_MAP: Record<string, 'img' | 'video' | 'audio'> = {
    'image/': 'img',
    'video/': 'video',
    'audio/': 'audio',
};

// 一点帮助函数：按 mime/后缀给默认扩展名
function extByMime(mime: string, category: 'img' | 'video' | 'audio'): string {
    const m = (mime || '').toLowerCase();
    if (category === 'img') {
        if (m.includes('png'))  return '.png';
        if (m.includes('jpeg') || m.includes('jpg')) return '.jpg';
        if (m.includes('gif'))  return '.gif';
        if (m.includes('webp')) return '.webp';
        return '.png';
    }
    if (category === 'video') {
        if (m.includes('mp4')) return '.mp4';
        if (m.includes('webm')) return '.webm';
        return '.mp4';
    }
    if (category === 'audio') {
        if (m.includes('mpeg') || m.includes('mp3')) return '.mp3';
        if (m.includes('wav'))  return '.wav';
        return '.mp3';
    }
    return '';
}

/**
 * GET /api/files?form_id=xxx
 */
export const GET = withUser(async (req: NextRequest, uid: string) => {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get('form_id');

    let files = await listFilesByUser(uid);
    if (formId) files = files.filter((f) => f.form_id === formId);

    return NextResponse.json(files);
});

/**
 * POST /api/files
 * 接收 multipart/form-data: files + module + form_id + origin
 */
export const POST = withUser(async (req: NextRequest, uid: string) => {
    try {
        const form = await req.formData();

        const moduleName = (form.get('module') as string) || 'default';
        const formId     = (form.get('form_id') as string) || null;

        const originRaw = form.get('origin');
        const origin    = originRaw === 'ai' ? 'ai' : 'manual';  // 'manual' | 'ai'

        // 取出文件字段（比 isFileLike 再宽松点：看有没有 arrayBuffer 函数）
        const files = Array.from(form.values()).filter((v: any) => v && typeof v.arrayBuffer === 'function');

        if (files.length === 0) {
            return NextResponse.json({ error: 'No file found' }, { status: 400 });
        }

        const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');

        const records = await Promise.all(
            files.map(async (file: any, idx: number) => {
                // name 兜底
                const rawName: string = typeof file.name === 'string' && file.name
                    ? file.name
                    : `upload-${Date.now()}-${idx}.png`;

                // mime 兜底：file.type -> 扩展名推断 -> octet-stream -> 如果是图片再兜底 image/png
                let mime: string = typeof file.type === 'string' && file.type ? file.type : '';
                const extFromName = path.extname(rawName).toLowerCase();

                if (!mime) {
                    if (extFromName === '.png')  mime = 'image/png';
                    else if (extFromName === '.jpg' || extFromName === '.jpeg') mime = 'image/jpeg';
                    else if (extFromName === '.gif') mime = 'image/gif';
                    else if (extFromName === '.webp') mime = 'image/webp';
                    else if (extFromName === '.mp4')  mime = 'video/mp4';
                    else if (extFromName === '.webm') mime = 'video/webm';
                    else if (extFromName === '.mp3')  mime = 'audio/mpeg';
                    else if (extFromName === '.wav')  mime = 'audio/wav';
                }
                if (!mime) mime = 'application/octet-stream';

                // 分类：匹配不上也兜底到图片 img，避免 startsWith 报错
                const key = Object.keys(DIR_MAP).find((pre) => String(mime).startsWith(pre)) || 'image/';
                const category = DIR_MAP[key as keyof typeof DIR_MAP] || 'img';

                const relDir  = path.join('upload', uid, category, ymd);

                // 目标文件名：优先保留原扩展名，没有就按 mime/分类补一个
                const finalExt = extFromName || extByMime(mime, category);
                const relPath  = path.join(relDir, uuidv4() + finalExt);
                const absPath  = path.join(process.cwd(), 'public', relPath);

                // 写文件
                const buffer = Buffer.from(await file.arrayBuffer());
                await fs.mkdir(path.dirname(absPath), { recursive: true });
                await fs.writeFile(absPath, buffer);

                return {
                    original_name: rawName,
                    mime_type:     mime,
                    file_category: category,
                    file_path:     relPath,
                    file_size:     buffer.byteLength,
                    url:           `/${relPath}`,
                    origin,
                };
            })
        );

        const created = await uploadFilesWithDb(uid, moduleName, formId, origin, records);
        return NextResponse.json(created.length === 1 ? created[0] : created);
    } catch (e: any) {
        console.error('[api/files] POST error:', e?.stack || e);
        // 把错误文本返回给前端，便于你定位（不要只给 500）
        return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
    }
});

/**
 * DELETE /api/files
 */
export const DELETE = withUser(async (req: NextRequest) => {
    const { file_id } = await req.json();
    if (!file_id) {
        return NextResponse.json({ error: 'file_id required' }, { status: 400 });
    }
    await removeFile(file_id);
    return NextResponse.json({ success: true });
});