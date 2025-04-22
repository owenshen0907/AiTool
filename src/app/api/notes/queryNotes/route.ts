import { NextResponse } from 'next/server';
import { Client } from 'pg';

interface RequestBody {
    userId: string;
    noteType: 'common' | 'recommend';
}

export async function POST(request: Request) {
    try {
        const { userId, noteType } = (await request.json()) as RequestBody;
        if (!userId) {
            return NextResponse.json({ error: '缺少 userId' }, { status: 400 });
        }
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
        });
        await client.connect();
        const safeUserId = userId.replace(/[^a-zA-Z0-9_]/g, '');
        if (noteType === 'common') {
            // 查询通用笔记表 notes
            const res = await client.query(
                `SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC`,
                [safeUserId]
            );
            await client.end();
            return NextResponse.json({ notes: res.rows });
        } else {
            // 推荐笔记：查询用户专属报告表
            const wordTable = `word_${safeUserId}_report`;
            const grammarTable = `grammar_${safeUserId}_report`;
            let wordNotes = [];
            try {
                const res1 = await client.query(`SELECT * FROM ${wordTable}`);
                wordNotes = res1.rows;
            } catch (e) {
                wordNotes = [];
            }
            let grammarNotes = [];
            try {
                const res2 = await client.query(`SELECT * FROM ${grammarTable}`);
                grammarNotes = res2.rows;
            } catch (e) {
                grammarNotes = [];
            }
            await client.end();
            return NextResponse.json({ wordNotes, grammarNotes });
        }
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}