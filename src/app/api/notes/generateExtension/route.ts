import { config } from 'dotenv';
config({ path: '.env.local' });
import { NextResponse } from 'next/server';
import { Client } from 'pg';
import configurations from '@/config';
import { updateExtension } from '@/db/noteOperations';

interface RequestBody {
    content: string;
    configKey?: string;
    userName?: string;
    noteType: 'word' | 'grammar';
    id: string;
}

export async function POST(request: Request) {
    let client;
    try {
        const { content, configKey, userName, noteType, id } = await request.json() as RequestBody;
        console.log('生成扩展请求，用户：', userName, ' noteType:', noteType, ' id:', id);

        if (!userName) {
            console.error('缺少 userName');
            return NextResponse.json({ error: '缺少 userName' }, { status: 400 });
        }

        client = new Client({
            connectionString: process.env.DATABASE_URL,
        });
        await client.connect();
        console.log('数据库连接成功');

        // 1. 选取对应的配置项（如果没有传 configKey，就根据 noteType 来选）
        const configItem = configurations[configKey || (noteType === 'word' ? 'GENERATE_WORD_EXTENSION' : 'GENERATE_GRAMMAR_EXTENSION')];

        // 2. 构造请求体
        const payload = {
            model: configItem.model,
            stream: false,
            messages: [
                { role: 'system', content: configItem.systemMessage },
                { role: 'user', content },
            ],
        };
        console.log("调用第三方 API 的请求体:", JSON.stringify(payload, null, 2));

        // 3. 调用第三方接口
        const response = await fetch(configItem.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${configItem.apiKey}`,
            },
            body: JSON.stringify(payload),
        });
        console.log("第三方 API 返回状态码:", response.status);

        // 4. 读取原始响应并解析
        const rawText = await response.text();
        console.log("第三方 API 原始响应文本:", rawText);
        const data = JSON.parse(rawText);
        console.log("解析后 data:", data);

        // 5. 提取第三方接口返回的 JSON 字符串
        //    （假设 data.choices[0].message.content 是我们需要的 JSON）
        const generatedContent = data.choices[0].message.content;
        let extension = JSON.parse(generatedContent);
        console.log("初步 extension:", extension);

        // 6. 为 extension.meta.created_at / updated_at 填入当前时间戳
        if (!extension.meta) {
            extension.meta = {};
        }
        const nowStr = new Date().toISOString();
        if (!extension.meta.created_at) {
            extension.meta.created_at = nowStr;
        }
        if (!extension.meta.updated_at) {
            extension.meta.updated_at = nowStr;
        }
        console.log("更新时间戳后的 extension:", extension);

        // 7. 调用 updateExtension，将 extension 写入数据库
        await updateExtension(client, userName, noteType, id, JSON.stringify(extension));

        // 8. 返回给前端
        return NextResponse.json(extension);
    } catch (error) {
        console.error('生成扩展 API 错误:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (client) {
            await client.end();
            console.log('数据库连接关闭');
        }
    }
}