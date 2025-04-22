// src/app/api/notes/operateCommonNotes/route.ts
import { NextResponse } from 'next/server';
import { Client } from 'pg';

interface RequestBody {
    operation: 'insert' | 'update' | 'delete';
    userId: string;
    update_type?: 'content' | 'tags' | 'comments';
    note?: {
        id?: string;            // 更新操作需要
        title?: string;
        parent_id?: string;     // 父级目录 id，必填（根目录新增时传 null 或空）
        summary?: string;
        content?: string;       // Markdown 文本
        tags?: string;
        comments?: any;         // JSONB 对象数组
        update_log?: string;
        is_public?: boolean;
    };
    noteId?: string;          // 用于 delete 操作
}

export async function POST(request: Request) {
    try {
        const { operation, userId, note, noteId, update_type } = (await request.json()) as RequestBody;
        if (!userId) {
            return NextResponse.json({ error: '缺少 userId' }, { status: 400 });
        }
        // 插入操作要求 note 存在且 parent_id 已提供（可为 null表示根目录）
        if (operation === 'insert' && (!note || note.parent_id === undefined)) {
            return NextResponse.json({ error: '插入操作需要 parent_id' }, { status: 400 });
        }
        // 更新操作要求 note 存在、包含 note.id 和 parent_id（注意：parent_id 可以为 null，但需明确传入）
        if (operation === 'update' && (!note || !note.id || note.parent_id === undefined)) {
            return NextResponse.json({ error: '更新操作需要 note.id 和 parent_id' }, { status: 400 });
        }

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
        });
        await client.connect();
        const safeUserId = userId.replace(/[^a-zA-Z0-9_]/g, '');

        if (operation === 'insert') {
            const query = `
                INSERT INTO notes
                (title, parent_id, summary, content, tags, comments, created_at, updated_at, update_log, user_id, is_public)
                VALUES
                    ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7, $8, $9)
                    RETURNING *;
            `;
            const values = [
                note?.title || null,
                note!.parent_id, // 必填（可为 null）
                note?.summary || null,
                note?.content || null,
                note?.tags || null,
                note?.comments ? JSON.stringify(note.comments) : '[]',
                note?.update_log || null,
                safeUserId,
                note?.is_public !== undefined ? note.is_public : false,
            ];
            const res = await client.query(query, values);
            await client.end();
            return NextResponse.json({ note: res.rows[0] });
        } else if (operation === 'update') {
            const type = update_type || 'content';
            let query = '';
            let values: any[] = [];
            if (type === 'content') {
                query = `
                    UPDATE notes
                    SET title = $1,
                        summary = $2,
                        content = $3,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $4 AND user_id = $5
                        RETURNING *;
                `;
                values = [note?.title || null, note?.summary || null, note?.content || null, note!.id, safeUserId];
            } else if (type === 'tags') {
                query = `
                    UPDATE notes
                    SET tags = $1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2 AND user_id = $3
                        RETURNING *;
                `;
                values = [note?.tags || null, note!.id, safeUserId];
            } else if (type === 'comments') {
                query = `
                    UPDATE notes
                    SET comments = $1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2 AND user_id = $3
                        RETURNING *;
                `;
                values = [note?.comments ? JSON.stringify(note.comments) : '[]', note!.id, safeUserId];
            } else {
                query = `
                    UPDATE notes
                    SET title = $1,
                        summary = $2,
                        content = $3,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $4 AND user_id = $5
                        RETURNING *;
                `;
                values = [note?.title || null, note?.summary || null, note?.content || null, note!.id, safeUserId];
            }
            const res = await client.query(query, values);
            await client.end();
            return NextResponse.json({ note: res.rows[0] });
        } else if (operation === 'delete') {
            if (!noteId) {
                await client.end();
                return NextResponse.json({ error: '删除操作需要 noteId' }, { status: 400 });
            }
            const query = `DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *;`;
            const values = [noteId, safeUserId];
            const res = await client.query(query, values);
            await client.end();
            return NextResponse.json({ deleted: (res.rowCount ?? 0) > 0 });
        } else {
            await client.end();
            return NextResponse.json({ error: '无效的操作' }, { status: 400 });
        }
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}