// File: src/app/api/content/move/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/contentService';

export const PATCH = withUser(async (req: NextRequest, userId: string) => {
    try {
        const body = await req.json();
        console.log('[content/move] 请求体 →', body);
        const { feature, id, new_directory_id, before_id } = body;
        if (!feature || !id) {
            return NextResponse.json(
                { error: 'feature and id are required' },
                { status: 400 }
            );
        }

        // Case A: 拖拽到某条记录上 ⇒ 更新该条为目标目录（若跨目录）并 position = beforeItem.position + 1
        if (before_id) {
            console.log('[content/move] 模式 → before_id');
            const beforeItem = await service.getContentById(userId, feature, before_id);
            if (!beforeItem) {
                return NextResponse.json({ error: 'before_id not found' }, { status: 404 });
            }
            // 兼容 snake_case/camelCase
            const dstDir = (beforeItem as any).directoryId ?? (beforeItem as any).directory_id;
            const newPos = beforeItem.position + 1;
            console.log('[content/move] beforeItem.position →', beforeItem.position, '→ newPos:', newPos);

            // 更新目录（若需要）和 position
            await service.updateContent(userId, feature, {
                id,
                directoryId: dstDir,
                position: newPos,
            });
            console.log('[content/move] 更新完成', { id, directoryId: dstDir, position: newPos });
            return NextResponse.json({ success: true });
        }

        // Case B: 只是简单移动到一个目录末尾
        if (new_directory_id) {
            console.log('[content/move] 模式 → new_directory_id');
            // 先算出目标目录当前的最大 position
            const siblings = await service.listContentByDirectory(userId, feature, new_directory_id);
            const maxPos = siblings.reduce((max, i) => Math.max(max, i.position), -1) + 1;
            console.log('[content/move] 移动到末尾 newPos →', maxPos);

            await service.updateContent(userId, feature, {
                id,
                directoryId: new_directory_id,
                position: maxPos,
            });
            console.log('[content/move] 简单移动完成', { id, new_directory_id, position: maxPos });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: 'new_directory_id or before_id is required' },
            { status: 400 }
        );
    } catch (err: any) {
        console.error('[content/move] 捕获到异常 →', err);
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
});

export const dynamic = 'force-dynamic';