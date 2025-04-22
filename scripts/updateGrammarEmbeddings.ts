import 'ts-node/register';
import { config } from 'dotenv';
config({ path: '.env.local' });
import { Client } from 'pg';
import configurations from '@/config';

/**
 * 调用 OpenAI 嵌入 API，将文本转换为向量
 * 这里使用 VECTOR_EMBEDDING 配置项
 */
async function getEmbedding(text: string): Promise<number[]> {
    console.log(`调用嵌入接口计算文本向量，文本长度: ${text.length}`);
    const configItem = configurations["VECTOR_EMBEDDING"];
    const payload = {
        input: text,
        model: configItem.model,
    };

    console.log(`请求参数: ${JSON.stringify(payload).substring(0, 200)}...`); // 截断日志以避免过长

    const response = await fetch(configItem.apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${configItem.apiKey}`,
        },
        body: JSON.stringify(payload),
    });

    console.log(`嵌入接口返回状态: ${response.status}`);

    if (!response.ok) {
        throw new Error(`Embedding API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`嵌入接口返回数据: ${JSON.stringify(data).substring(0, 200)}...`); // 截断日志
    // 根据 OpenAI Embedding API 返回格式，取第一条记录的 embedding
    if (data && data.data && data.data.length > 0) {
        console.log(`成功获取到向量数据，维度: ${data.data[0].embedding.length}`);
        return data.data[0].embedding;
    }
    throw new Error("No embedding returned from API");
}

async function updateGrammarEmbeddings() {
    console.log("启动 updateGrammarEmbeddings 脚本...");
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("已连接到数据库。");

        // 查询 embedding 为空的记录
        console.log("开始查询 grammar 表中 embedding 为空的记录...");
        const res = await client.query(`
            SELECT id, grammar_formula, explanation, grammar_category_01, grammar_category_02 
            FROM grammar 
            WHERE embedding IS NULL
        `);
        console.log(`共查询到 ${res.rowCount} 条记录需更新。`);

        if (res.rowCount === 0) {
            console.log("没有需要更新的记录，脚本结束。");
            return;
        }

        for (const row of res.rows) {
            console.log(`\n处理记录 id=${row.id} ...`);
            // 拼接文本：grammar_formula, explanation, grammar_category_01, grammar_category_02
            const text = [
                row.grammar_formula || "",
                row.explanation || "",
                row.grammar_category_01 || "",
                row.grammar_category_02 || "",
            ]
                .join(" ")
                .trim();

            console.log(`拼接后的文本: "${text}"`);

            try {
                // 调用 OpenAI 嵌入接口计算向量
                const embedding = await getEmbedding(text);
                console.log(`计算得到 embedding（前10个数值）：${embedding.slice(0, 10).join(", ")} ...`);

                // 更新该记录的 embedding 字段
                console.log(`开始更新 id=${row.id} 的 embedding 字段...`);
                await client.query(
                    `UPDATE grammar SET embedding = $1 WHERE id = $2`,
                    [embedding, row.id]
                );
                console.log(`成功更新了 id=${row.id} 的 embedding。`);
            } catch (innerError) {
                console.error(`处理 id=${row.id} 时出错：`, innerError);
            }
        }
        console.log("所有记录更新完毕。");
    } catch (error) {
        console.error("更新 embedding 时出错：", error);
    } finally {
        await client.end();
        console.log("已断开数据库连接。");
    }
}

updateGrammarEmbeddings();