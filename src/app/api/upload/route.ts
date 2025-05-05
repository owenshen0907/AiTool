import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { withUser } from '@/lib/api/auth';
import { isFileLike } from '@/lib/utils/helpers/is-file';

const DIR_MAP: Record<string, 'img' | 'video' | 'audio'> = {
    'image/': 'img',
    'video/': 'video',
    'audio/': 'audio',
};

export const POST = withUser(async (req: NextRequest, uid: string) => {
    const form = await req.formData();

    // ✔ TS 会自动收窄为 File，因为 isFileLike 是类型守卫
    const files = Array.from(form.values()).filter(isFileLike);
    if (files.length === 0) {
        return new NextResponse('No file found', { status: 400 });
    }

    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const saved = await Promise.all(
        files.map(async file => {
            const mime = file.type || 'application/octet-stream';
            const dirKey = Object.keys(DIR_MAP).find(pre => mime.startsWith(pre));
            if (!dirKey) throw new Error(`Unsupported mime: ${mime}`);

            const relDir  = path.join('upload', uid, DIR_MAP[dirKey], ymd);
            const relPath = path.join(relDir, uuidv4() + path.extname(file.name));
            const absPath = path.join(process.cwd(), 'public', relPath);

            await fs.mkdir(path.dirname(absPath), { recursive: true });
            await fs.writeFile(absPath, Buffer.from(await file.arrayBuffer()));

            return {
                path: relPath,          // → 数据库存储
                url : `/${relPath}`,    // → Local 访问
            };
        })
    );

    return NextResponse.json(saved.length === 1 ? saved[0] : saved);
});