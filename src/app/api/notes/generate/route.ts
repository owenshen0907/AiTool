import { config } from 'dotenv';
config({ path: '.env.local' });
import { NextResponse } from 'next/server';
import { Client } from 'pg';
import configurations from '@/config';
import { processWordNotes } from '@/db/wordReportRepository';
import {
    processGrammarNotes,
    // 如果 getEmbedding 也需要使用，可以从 grammarReportRepository 导入，也可以单独定义
} from '@/db/grammarReportRepository';

interface RequestBody {
    content: string;
    configKey?: string;
    userName?: string;
}

export async function POST(req: Request) {
    let client;
    try {
        const { content, configKey, userName } = (await req.json()) as RequestBody;
        console.log('Received note generation request from user:', userName);

        if (!userName) {
            console.error('User name is missing');
            return new Response('请登录后重试', { status: 400 });
        }

        // 连接 PostgreSQL 数据库
        client = new Client({
            connectionString: process.env.DATABASE_URL,
        });
        await client.connect();
        console.log('已连接到 PostgreSQL 数据库。');

        // 调用外部 API 生成笔记（包含 wordNotes 和 grammarNotes）
        // GENERATE_WORD_EXTENSION
        // GENERATE_GRAMMAR_EXTENSION
        const configItem = configurations[configKey || 'GENERATE_NOTE'];
        const payload = {
            model: configItem.model,
            stream: false,
            messages: [
                { role: 'system', content: configItem.systemMessage },
                { role: 'user', content: content },
            ],
        };

        const response = await fetch(configItem.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${configItem.apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            return new Response('Error', { status: response.status });
        }

        const data = await response.json();
        // data.choices[0].message.content 是生成笔记后的 JSON 字符串
        const generatedContent = data.choices[0].message.content;
        const noteData = JSON.parse(generatedContent);

        // 针对 wordNotes 数组进行处理
        if (noteData.wordNotes && Array.isArray(noteData.wordNotes)) {
            const processedNotes = await processWordNotes(client, userName, noteData.wordNotes);
            for (let i = 0; i < noteData.wordNotes.length; i++) {
                noteData.wordNotes[i] = processedNotes[i];
            }
        }

        // 针对 grammarNotes 数组进行处理
        if (noteData.grammarNotes && Array.isArray(noteData.grammarNotes)) {
            const processedGrammarNotes = await processGrammarNotes(client, userName, noteData.grammarNotes);
            // 将处理结果覆盖原有 grammarNotes
            noteData.grammarNotes = processedGrammarNotes;
        }

        return NextResponse.json(noteData);
    } catch (error) {
        console.error('API error:', error);
        return new Response('Internal Server Error', { status: 500 });
    } finally {
        if (client) {
            await client.end();
            console.log('已断开 PostgreSQL 连接。');
        }
    }
}