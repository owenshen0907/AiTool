// db/grammarReportRepository.ts
import { Client } from 'pg';
import configurations from '@/config';

export interface GrammarNote {
    grammar: string;
    explanation: string;
    grammarCategory1?: string;
    grammarCategory2?: string;
}

// 设置余弦距离匹配阈值，默认值为 3
const SIMILARITY_THRESHOLD = 0.35;

function getSafeUserName(userName: string): string {
    return userName.replace(/[^a-zA-Z0-9_]/g, '');
}

export async function ensureUserReportGrammarTable(client: Client, userName: string): Promise<string> {
    const safeUserName = getSafeUserName(userName);
    const tableName = `grammar_${safeUserName}_report`;
    await client.query(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
                                                    id VARCHAR(50) PRIMARY KEY,
            grammar_formula TEXT NOT NULL,
            grammar_category_01 TEXT,
            grammar_category_02 TEXT,
            explanation TEXT,
            lesson INT NOT NULL,
            level INTEGER CHECK (level BETWEEN 1 AND 5),
            embedding vector(1536),
            listening INTEGER,
            speaking INTEGER,
            writing INTEGER,
            reading INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            update_explanation TEXT,
            extension JSONB DEFAULT '{}'::jsonb
            );
    `);
    return tableName;
}

function vectorToString(vector: number[]): string {
    return `[${vector.join(",")}]`;
}

/**
 * 清洗字符串：移除所有标点符号和符号，只保留字母、数字等字符。
 * 这里使用 Unicode 属性匹配，需要 Node.js 版本支持 ES2018+
 */
function cleanString(str: string): string {
    return str.replace(/[\p{P}\p{S}]/gu, "");
}

/**
 * 计算两个字符串的相似度分数：
 * 先清洗字符串（去除标点符号），
 * 将字符串拆分为去重的字符集合，
 * 分数 = 2×|intersection| - |union|
 */
function computeSimilarityScore(str1: string, str2: string): number {
    const cleanedStr1 = cleanString(str1);
    const cleanedStr2 = cleanString(str2);
    const set1 = new Set(cleanedStr1.split(''));
    const set2 = new Set(cleanedStr2.split(''));
    let common = 0;
    for (const ch of set1) {
        if (set2.has(ch)) {
            common++;
        }
    }
    const union = new Set([...set1, ...set2]);
    return 2 * common - union.size;
}
async function getEmbedding(text: string): Promise<number[]> {
    console.log(`【DEBUG】调用嵌入接口计算文本向量，文本长度: ${text.length}`);
    const configItem = configurations["VECTOR_EMBEDDING"];
    const payload = {
        input: text,
        model: configItem.model,
    };

    const headersToLog = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${configItem.apiKey.slice(0, 4)}****${configItem.apiKey.slice(-4)}`
    };
    console.log(`【DEBUG】请求头: ${JSON.stringify(headersToLog)}`);

    const response = await fetch(configItem.apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${configItem.apiKey}`
        },
        body: JSON.stringify(payload)
    });

    console.log(`【DEBUG】Embedding接口返回状态: ${response.status}`);
    if (!response.ok) {
        throw new Error(`Embedding API request failed with status ${response.status}`);
    }
    const data = await response.json();
    console.log(`【DEBUG】嵌入接口返回数据: ${JSON.stringify(data).substring(0, 200)}...`);
    if (data && data.data && data.data.length > 0) {
        const embedding = data.data[0].embedding;
        console.log(`【DEBUG】成功获取向量数据，维度: ${embedding.length}`);
        console.log(`【DEBUG】向量前5项: ${embedding.slice(0, 5).join(", ")}`);
        return embedding;
    }
    throw new Error("No embedding returned from API");
}

export async function processGrammarNote(client: Client, userName: string, note: GrammarNote): Promise<any> {
    // 确保用户专属语法报告表存在
    const userTable = await ensureUserReportGrammarTable(client, userName);

    // 拼接输入文本
    const inputText = [
        note.grammar || "",
        note.explanation || "",
        note.grammarCategory1 || "",
        note.grammarCategory2 || ""
    ].join(" ").trim();
    console.log(`【DEBUG】拼接后的输入文本: "${inputText}"`);

    // 调用嵌入接口计算向量
    const embeddingArray = await getEmbedding(inputText);
    console.log(`【DEBUG】计算得到的向量数组，维度: ${embeddingArray.length}`);

    // 转换为字符串，确保格式符合 pgvector 要求
    const inputEmbeddingStr = vectorToString(embeddingArray).trim();
    console.log(`【DEBUG】转换后的向量字符串: ${inputEmbeddingStr.substring(0, 60)}... (总长度: ${inputEmbeddingStr.length})`);

    // 在全局 grammar 表中使用余弦距离 (<=>) 进行匹配
    console.log(`【DEBUG】开始在全局 grammar 表中进行向量匹配（使用余弦距离）...`);
    const res = await client.query(
        `SELECT *, embedding <=> CAST($1 AS vector) AS distance
         FROM grammar
         ORDER BY embedding <=> CAST($1 AS vector)
         LIMIT 10`,
        [inputEmbeddingStr]
    );
    console.log(`【DEBUG】全局 grammar 表返回记录数: ${res.rowCount}`);

    // 过滤出余弦距离小于阈值的候选记录
    const candidates = res.rows.filter(row => row.distance < SIMILARITY_THRESHOLD);

    // 记录候选信息，方便排查问题
    console.log(`【DEBUG】全局 grammar 表中符合距离阈值的候选记录如下:`);
    candidates.forEach((row, idx) => {
        console.log(`  候选 ${idx + 1}: id=${row.id}, grammar_formula=${row.grammar_formula}, 余弦距离=${row.distance}`);
    });

    let chosenCandidate = null;

    if (candidates.length === 1) {
        chosenCandidate = candidates[0];
        console.log(`【DEBUG】只有一条候选记录，直接选取: id=${chosenCandidate.id}, distance=${chosenCandidate.distance}`);
    } else if (candidates.length > 1) {
        let bestScore = -Infinity;
        for (const candidate of candidates) {
            const score = computeSimilarityScore(note.grammar, candidate.grammar_formula);
            console.log(`【DEBUG】 记录 id=${candidate.id} 的相似度分数: ${score}`);
            if (score > bestScore) {
                bestScore = score;
                chosenCandidate = candidate;
            } else if (score === bestScore && candidate.distance < chosenCandidate.distance) {
                chosenCandidate = candidate;
            }
        }
        console.log(`【DEBUG】选定候选记录: id=${chosenCandidate.id}, bestScore=${bestScore}, distance=${chosenCandidate.distance}`);
    } else {
        console.log(`【DEBUG】全局 grammar 表中未找到余弦距离小于 ${SIMILARITY_THRESHOLD} 的候选记录。`);
    }

    if (chosenCandidate === null) {
        // 没有候选记录时，直接使用接口传入的 note 数据生成新记录
        const newId =
            'EXP' +
            (typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID().replace(/-/g, '')
                : Math.random().toString(36).substring(2, 15));
        // 在插入前检查是否存在相同 embedding 的记录（ID 新生成，不用检查）
        const checkRes = await client.query(
            `SELECT * FROM ${userTable} WHERE embedding = $1`,
            [inputEmbeddingStr]
        );
        if (checkRes.rowCount === 0) {
            await client.query(
                `
                INSERT INTO ${userTable}
                (id, grammar_formula, grammar_category_01, grammar_category_02, explanation, lesson, level, listening, speaking, writing, reading, embedding, created_at, updated_at, update_explanation)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, 0, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '')
                `,
                [newId, note.grammar, note.grammarCategory1 || '', note.grammarCategory2 || '', note.explanation, 1, 1, inputEmbeddingStr]
            );
            const newRes = await client.query(`SELECT * FROM ${userTable} WHERE id = $1`, [newId]);
            return newRes.rows[0];
        } else {
            console.log(`【DEBUG】已有相同 embedding 的记录存在，直接返回。`);
            return checkRes.rows[0];
        }
    } else {
        // 有候选记录的情况：检查用户专属表中是否已有该记录（检查相同 ID 或相同 embedding）
        const checkRes = await client.query(
            `SELECT * FROM ${userTable} WHERE id = $1 OR embedding = $2`,
            [chosenCandidate.id, inputEmbeddingStr]
        );
        if (checkRes.rowCount === 0) {
            console.log(`【DEBUG】候选记录 id=${chosenCandidate.id} 或相同向量未在用户专属表中，准备插入。`);
            await client.query(
                `
                INSERT INTO ${userTable}
                (id, grammar_formula, grammar_category_01, grammar_category_02, explanation, lesson, level, listening, speaking, writing, reading, embedding, created_at, updated_at, update_explanation)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, 0, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '')
                `,
                [
                    chosenCandidate.id,
                    chosenCandidate.grammar_formula,
                    chosenCandidate.grammar_category_01,
                    chosenCandidate.grammar_category_02,
                    chosenCandidate.explanation,
                    chosenCandidate.lesson,
                    chosenCandidate.level,
                    inputEmbeddingStr
                ]
            );
            const insertedRes = await client.query(`SELECT * FROM ${userTable} WHERE id = $1`, [chosenCandidate.id]);
            return insertedRes.rows[0];
        } else {
            console.log(`【DEBUG】候选记录 id=${chosenCandidate.id} 或具有相同向量已存在于用户专属表中，直接返回。`);
            return checkRes.rows[0];
        }
    }
}


export async function processGrammarNotes(
    client: Client,
    userName: string,
    notes: GrammarNote[]
): Promise<any[]> {
    const results = [];
    for (const note of notes) {
        console.log(`\n【DEBUG】开始处理语法记录: ${JSON.stringify(note)}`);
        const processed = await processGrammarNote(client, userName, note);
        results.push(processed);
    }
    return results;
}