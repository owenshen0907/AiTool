// ./src/db/noteOperations.ts
import { Client } from 'pg';
import { ensureUserReportGrammarTable } from '@/db/grammarReportRepository';

// 生成安全的用户名（只保留字母、数字和下划线），用于构造表名
function getSafeUserName(userName: string): string {
    return userName.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * 插入单词学习日志记录
 */
export async function insertWordStudyLog(
    client: Client,
    userId: string,
    wordId: string,
    dimension: string,
    study_status: number
): Promise<void> {
    const query = `
        INSERT INTO word_study_log (user_id, word_id, dimension, study_status)
        VALUES ($1, $2, $3, $4)
    `;
    await client.query(query, [userId, wordId, dimension, study_status]);
}

/**
 * 更新用户单词报告表，根据 dimension 决定更新哪一列，并加上 study_status 的值
 */
export async function updateUserWordReport(
    client: Client,
    userId: string,
    wordId: string,
    dimension: string,
    study_status: number
): Promise<void> {
    const safeUserName = getSafeUserName(userId);
    const tableName = `word_${safeUserName}_report`;
    let column = 'reading'; // 默认
    if (dimension === '写') {
        column = 'writing';
    } else if (dimension === '说') {
        column = 'speaking';
    } else if (dimension === '听') {
        column = 'listening';
    }
    const updateExplanation = `${dimension}-${study_status}`;
    const query = `UPDATE ${tableName} SET ${column} = ${column} + $1, updated_at = CURRENT_TIMESTAMP, update_explanation = $2 WHERE id = $3`;
    await client.query(query, [study_status, updateExplanation, wordId]);
}

/**
 * 插入语法学习日志记录
 */
export async function insertGrammarStudyLog(
    client: Client,
    userId: string,
    grammarId: string,
    dimension: string,
    study_status: number
): Promise<void> {
    const query = `
        INSERT INTO grammar_study_log (user_id, grammar_id, dimension, study_status)
        VALUES ($1, $2, $3, $4)
    `;
    await client.query(query, [userId, grammarId, dimension, study_status]);
}

/**
 * 更新用户语法报告表，根据 dimension 更新对应列，加上 study_status 的值
 */
export async function updateUserGrammarReport(
    client: Client,
    userId: string,
    grammarId: string,
    dimension: string,
    study_status: number
): Promise<void> {
    const safeUserName = getSafeUserName(userId);
    const tableName = await ensureUserReportGrammarTable(client, userId);
    let column = 'reading';
    if (dimension === '写') {
        column = 'writing';
    } else if (dimension === '说') {
        column = 'speaking';
    } else if (dimension === '听') {
        column = 'listening';
    }
    const updateExplanation = `${dimension}-${study_status}`;
    const query = `UPDATE ${tableName} SET ${column} = ${column} + $1, updated_at = CURRENT_TIMESTAMP, update_explanation = $2 WHERE id = $3`;
    await client.query(query, [study_status, updateExplanation, grammarId]);
}


/**
 * 更新扩展字段
 * @param client PostgreSQL 客户端
 * @param userId 用户名
 * @param noteType "word" 或 "grammar"
 * @param id 记录的 ID
 * @param extension 扩展内容，JSON 字符串
 */
export async function updateExtension(
    client: Client,
    userId: string,
    noteType: 'word' | 'grammar',
    id: string,
    extension: string
): Promise<void> {
    const safeUserName = getSafeUserName(userId);
    if (noteType === 'word') {
        // 如果 id 不以 "EXP" 开头，则更新全局 words 表
        if (!id.startsWith('EXP')) {
            await client.query(
                `UPDATE words SET extension = $1 WHERE id = $2`,
                [extension, id]
            );
        }
        // 更新用户报告表
        const reportTable = `word_${safeUserName}_report`;
        await client.query(
            `UPDATE ${reportTable} SET extension = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [extension, id]
        );
    } else if (noteType === 'grammar') {
        // 如果 id 不以 "EXP" 开头，则更新全局 grammar 表
        if (!id.startsWith('EXP')) {
            await client.query(
                `UPDATE grammar SET extension = $1 WHERE id = $2`,
                [extension, id]
            );
        }
        // 更新用户语法报告表
        const reportTable = await ensureUserReportGrammarTable(client, userId);
        await client.query(
            `UPDATE ${reportTable} SET extension = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [extension, id]
        );
    }
}