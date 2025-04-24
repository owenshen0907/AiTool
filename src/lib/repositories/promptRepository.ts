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
            'SELECT * FROM prompts WHERE parent_id = $1 ORDER BY title',
            [parentId]
        );
        return rows;
    } else {
        const { rows } = await pool.query<Prompt>(
            'SELECT * FROM prompts WHERE parent_id IS NULL ORDER BY title'
        );
        return rows;
    }
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
    } = data;
    const { rows } = await pool.query<Prompt>(
        `INSERT INTO prompts(
       id, parent_id, type, title, content,
       description, tags, attributes, comments,
       is_public, created_by
     ) VALUES(
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
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

    for (const [key, val] of Object.entries(changes)) {
        sets.push(`${key} = $${idx}`);
        if (['tags', 'attributes', 'comments', 'update_log'].includes(key)) {
            values.push(JSON.stringify(val));
        } else {
            values.push(val as any);
        }
        idx++;
    }
    if (sets.length === 0) return;

    // always update the timestamp
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