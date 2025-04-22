// ./src/app/api/notes/addNote/route.ts
import { NextResponse } from 'next/server';
import { Client } from 'pg';
import {
    insertWordStudyLog,
    updateUserWordReport,
    insertGrammarStudyLog,
    updateUserGrammarReport,
} from '@/db/noteOperations';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, type, note, dimension, study_status } = body;

        // 检查必填字段，note 现在期望为数组
        if (!userId || !type || !note || !dimension || study_status === undefined) {
            return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
        }
        if (!Array.isArray(note)) {
            return NextResponse.json({ error: 'note 字段必须是数组' }, { status: 400 });
        }

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
        });
        await client.connect();

        if (type === 'word') {
            // 遍历 note 数组，针对每个 noteId 插入单词日志并更新报告
            for (const noteId of note) {
                await insertWordStudyLog(client, userId, noteId, dimension, study_status);
                await updateUserWordReport(client, userId, noteId, dimension, study_status);
            }
            await client.end();
            return NextResponse.json({ message: '单词笔记处理成功' });
        } else if (type === 'grammar') {
            // 遍历 note 数组，针对每个 noteId 插入语法日志并更新报告
            for (const noteId of note) {
                await insertGrammarStudyLog(client, userId, noteId, dimension, study_status);
                await updateUserGrammarReport(client, userId, noteId, dimension, study_status);
            }
            await client.end();
            return NextResponse.json({ message: '语法笔记处理成功' });
        } else {
            await client.end();
            return NextResponse.json({ error: '无效的笔记类型' }, { status: 400 });
        }
    } catch (error) {
        console.error('处理笔记时出错:', error);
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
    }
}