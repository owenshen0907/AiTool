import { Client } from 'pg';

/** 定义单词笔记接口（仅用于本模块内部） */
export interface WordNote {
    word: string;
    meaning: string;
    alternatives: string;
    extension?: any;  // 可选扩展字段，存 JSON 数据
}

/** 生成安全的用户名（只保留字母、数字和下划线） */
function getSafeUserName(userName: string): string {
    return userName.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * 确保用户专属的报告表存在
 * 表名格式：word_${safeUserName}_report
 */
export async function ensureUserReportWordsTable(client: Client, userName: string): Promise<string> {
    const safeUserName = getSafeUserName(userName);
    const tableName = `word_${safeUserName}_report`;
    await client.query(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id VARCHAR(50) PRIMARY KEY,
            kana TEXT NOT NULL,
            kanji TEXT,
            romaji TEXT,
            pos TEXT,
            level INTEGER CHECK (level BETWEEN 1 AND 5),
            translation TEXT,
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

/**
 * 根据 note 中的 word 字段处理单词记录：
 * 1. 先在用户报告表中查找匹配（通过 kanji 字段）。
 *    - 当 note.word 包含「・」时，拆分后匹配（任一部分匹配均算匹配）。
 * 2. 如果找到直接返回该记录。
 * 3. 如果未找到，则查询全局 words 表（同样规则）。
 *    - 如果在全局表中找到，则插入到用户报告表中（听、说、写、阅均初始化为 0），带上 extension 字段。
 * 4. 如果全局表也未找到，则生成新记录（ID 以 EXP 开头，其他字段采用默认值），带上 extension。
 * 5. 返回从用户报告表查询到的完整记录。
 */
export async function processWordNote(client: Client, userName: string, note: WordNote): Promise<any> {
    const tableName = await ensureUserReportWordsTable(client, userName);
    let query = '';
    let params: any[] = [];

    // 匹配逻辑：如果 note.word 中包含「・」则拆分成数组，否则直接匹配
    if (note.word.includes('・')) {
        const parts = note.word.split('・').map(s => s.trim()).filter(s => s !== '');
        query = `SELECT * FROM ${tableName} WHERE kanji = ANY($1)`;
        params = [parts];
    } else {
        query = `SELECT * FROM ${tableName} WHERE kanji = $1`;
        params = [note.word];
    }

    let res = await client.query(query, params);
    if (res.rows.length > 0) {
        return res.rows[0];  // 返回已存在记录（包含所有字段）
    }

    // 未在用户报告表中找到，则查询全局 words 表
    if (note.word.includes('・')) {
        const parts = note.word.split('・').map(s => s.trim()).filter(s => s !== '');
        query = `SELECT * FROM words WHERE kanji = ANY($1)`;
        params = [parts];
    } else {
        query = `SELECT * FROM words WHERE kanji = $1`;
        params = [note.word];
    }
    res = await client.query(query, params);
    if (res.rows.length > 0) {
        const wordRow = res.rows[0];
        // 插入到用户报告表中，同时带上 extension（若全局记录有 extension 则转换为 JSON 字符串，否则 '{}')
        await client.query(
            `
      INSERT INTO ${tableName} 
      (id, kana, kanji, romaji, pos, level, translation, listening, speaking, writing, reading, created_at, updated_at, update_explanation, extension)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '', $8)
    `,
            [
                wordRow.id,
                wordRow.kana,
                wordRow.kanji,
                wordRow.romaji,
                wordRow.pos,
                wordRow.level,
                wordRow.translation,
                wordRow.extension ? JSON.stringify(wordRow.extension) : '{}',
            ]
        );
        const newRes = await client.query(`SELECT * FROM ${tableName} WHERE id = $1`, [wordRow.id]);
        return newRes.rows[0];
    }

    // 如果全局表也没有匹配记录，则生成新记录
    const newId =
        'EXP' +
        (typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID().replace(/-/g, '')
            : Math.random().toString(36).substring(2, 15));
    await client.query(
        `
      INSERT INTO ${tableName} 
      (id, kana, kanji, romaji, pos, level, translation, listening, speaking, writing, reading, created_at, updated_at, update_explanation, extension)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '', $8)
    `,
        [newId, note.word, note.word, '', '', 1, note.meaning, note.extension ? JSON.stringify(note.extension) : '{}']
    );
    const newRes = await client.query(`SELECT * FROM ${tableName} WHERE id = $1`, [newId]);
    return newRes.rows[0];
}

/**
 * 针对一组 wordNotes 进行处理，返回处理后的结果数组
 */
export async function processWordNotes(
    client: Client,
    userName: string,
    notes: WordNote[]
): Promise<any[]> {
    const results = [];
    for (const note of notes) {
        const processed = await processWordNote(client, userName, note);
        results.push(processed);
    }
    return results;
}