// src/lib/repositories/promptCaseContentRepository.ts
import { pool } from '@/lib/db/client';
import type { CaseContentItem } from '@/lib/models/prompt/promptCase';

// 获取单个内容项
export async function getPromptCaseContentById(
    id: string
): Promise<CaseContentItem | null> {
    const { rows } = await pool.query<CaseContentItem>(
        'SELECT * FROM case_content WHERE id = $1',
        [id]
    );
    return rows[0] || null;
}

// 列出目录下所有内容项
export async function listPromptCaseContentByDirectory(
    directoryId: string
): Promise<CaseContentItem[]> {
    const { rows } = await pool.query<CaseContentItem>(
        'SELECT * FROM case_content WHERE directory_id = $1 ORDER BY position, created_at',
        [directoryId]
    );
    return rows;
}

// 获取下一个 position
export async function getNextPromptCaseContentPosition(
    directoryId: string
): Promise<number> {
    const { rows } = await pool.query<{ next_pos: number }>(
        `SELECT COALESCE(MAX(position), 0) + 1 AS next_pos
       FROM case_content
      WHERE directory_id = $1`,
        [directoryId]
    );
    return rows[0].next_pos;
}

// 插入新内容
export async function insertPromptCaseContent(
    data: Partial<CaseContentItem>
): Promise<CaseContentItem> {
    const {
        id,
        directoryId,
        title,
        summary,
        body,
        position,
        createdBy,
    } = data;
    const { rows } = await pool.query<CaseContentItem>(
        `INSERT INTO case_content(
       id, directory_id, title, summary, body,
       position, created_by
     ) VALUES($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
        [
            id,
            directoryId,
            title,
            summary || null,
            body || null,
            position ?? 0,
            createdBy,
        ]
    );
    return rows[0];
}

// 更新内容项
export async function updatePromptCaseContent(
    id: string,
    changes: Partial<CaseContentItem>
): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(changes)) {
        if (['id', 'createdBy', 'createdAt', 'updatedAt'].includes(key)) continue;
        const col = key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
        sets.push(`${col} = $${idx}`);
        values.push(val);
        idx++;
    }
    if (sets.length === 0) return;
    sets.push(`updated_at = NOW()`);
    values.push(id);
    await pool.query(
        `UPDATE case_content SET ${sets.join(', ')} WHERE id = $${idx}`,
        values
    );
}

// 删除内容项
export async function deletePromptCaseContent(
    id: string
): Promise<void> {
    await pool.query('DELETE FROM case_content WHERE id = $1', [id]);
}

// 重排内容项顺序
export async function reorderPromptCaseContent(
    directoryId: string,
    orderedIds: string[]
): Promise<void> {
    await pool.query(
        `UPDATE case_content SET position = x.idx
       FROM (
         SELECT id, ROW_NUMBER() OVER () - 1 AS idx
         FROM unnest($1::uuid[]) AS id
       ) AS x
     WHERE case_content.id = x.id`,
        [orderedIds]
    );
}
