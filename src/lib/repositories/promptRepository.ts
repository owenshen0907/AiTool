// src/lib/repositories/promptRepository.ts
import { pool } from '@/lib/db/client';
import { Prompt } from '@/lib/models/prompt';

export async function getPromptById(id: string): Promise<Prompt | null> {
    const { rows } = await pool.query<Prompt>(
        'SELECT * FROM prompts WHERE id = $1',
        [id]
    );
    return rows[0] || null;
}

export async function listPromptsByParent(parentId?: string): Promise<Prompt[]> {
    if (parentId) {
        const { rows } = await pool.query<Prompt>(
            'SELECT * FROM prompts WHERE parent_id = $1 ORDER BY position, created_at',
            [parentId]
        );
        return rows;
    } else {
        const { rows } = await pool.query<Prompt>(
            'SELECT * FROM prompts WHERE parent_id IS NULL ORDER BY position, created_at'
        );
        return rows;
    }
}
// 新增：获取下一个 position
export async function getNextPosition(parentId?: string): Promise<number> {
    const { rows } = await pool.query<{ next_pos: number }>(
        `SELECT COALESCE(MAX(position), 0) + 1 AS next_pos
       FROM prompts
      WHERE parent_id ${parentId ? '= $1' : 'IS NULL'}`,
        parentId ? [parentId] : []
    );
    return rows[0].next_pos;
}

export async function insertPrompt(data: Partial<Prompt>): Promise<Prompt> {
    const {
        id,
        parent_id,
        type,
        title,
        content,
        description,
        tags,
        attributes,
        comments,
        is_public,
        created_by,
        position,
    } = data;
    const { rows } = await pool.query<Prompt>(
        `INSERT INTO prompts(
            id, parent_id, type, title, content,
            description, tags, attributes, comments,
            is_public, created_by, position
        ) VALUES(
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
                ) RETURNING *`,
        [
            id,
            parent_id || null,
            type,
            title,
            content || null,
            description || null,
            JSON.stringify(tags || []),
            JSON.stringify(attributes || []),
            comments ? JSON.stringify(comments) : null,
            is_public || false,
            created_by,
            position ?? 0,
        ]
    );
    return rows[0];
}

export async function updatePrompt(
    id: string,
    changes: Partial<Prompt>
): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    // 排除 updated_at，避免后续重复赋值
    for (const [key, val] of Object.entries(changes)) {
        if (key === 'updated_at') continue;
        sets.push(`${key} = $${idx}`);
        if (['tags', 'attributes', 'comments', 'update_log'].includes(key)) {
            values.push(JSON.stringify(val));
        } else {
            values.push(val as any);
        }
        idx++;
    }

    if (sets.length === 0) return;

    // 始终更新时间戳
    sets.push(`updated_at = NOW()`);

    values.push(id);
    await pool.query(
        `UPDATE prompts SET ${sets.join(', ')} WHERE id = $${idx}`,
        values
    );
}

export async function deletePrompt(id: string): Promise<void> {
    await pool.query('DELETE FROM prompts WHERE id = $1', [id]);
}
/**
 * 搜索 title 模糊匹配的 prompt，并递归拉取所有父级目录
 */
export async function searchPromptsWithAncestors(term: string): Promise<Prompt[]> {
    const like = `%${term}%`;
    const { rows } = await pool.query<Prompt>(
        /* sql */`
                WITH RECURSIVE matched AS (
                    -- 1) 先选出所有 title 匹配的行
                    SELECT * FROM prompts WHERE title ILIKE $1
                UNION ALL
                -- 2) 递归往上，取出它们的 parent
                SELECT p.* FROM prompts p
                                    JOIN matched m ON p.id = m.parent_id
                    )
                -- 去重并按 parent_id, position, created_at 排序
                SELECT DISTINCT *
                FROM matched
                ORDER BY parent_id NULLS FIRST, position, created_at;
        `, [like]
    );
    return rows;
}