// File: src/lib/repositories/directoryRepository.ts
import { pool } from '@/lib/db/client';
import type { DirectoryItem } from '@/lib/models/directory';


export async function getDirectoryById(id: string): Promise<DirectoryItem | null> {
    const { rows } = await pool.query<DirectoryItem>(
        'SELECT * FROM directories WHERE id = $1',
        [id]
    );
    return rows[0] || null;
}

// 列出同级目录
export async function listDirectories(
    feature: string,
    parentId?: string | null
): Promise<DirectoryItem[]> {
    if (typeof parentId === 'undefined') {
        // 要整棵树
        const { rows } = await pool.query<DirectoryItem>(
            `
      SELECT *
      FROM directories
      WHERE feature = $1
      ORDER BY parent_id NULLS FIRST, position
      `,
            [feature]
        );
        return rows;
    }

    // 只查同级
    const { rows } = await pool.query<DirectoryItem>(
        `
    SELECT *
    FROM directories
    WHERE feature = $1
      AND parent_id IS NOT DISTINCT FROM $2   -- null 也能比较
    ORDER BY position
    `,
        [feature, parentId]
    );
    return rows;
}

// 获取下一个 position
export async function getNextDirectoryPosition(
    feature: string,
    parentId?: string
): Promise<number> {
    const { rows } = await pool.query<{ next_pos: number }>(
        `SELECT COALESCE(MAX(position), 0) + 1 AS next_pos
       FROM directories
      WHERE feature = $1 AND parent_id ${parentId ? '= $2' : 'IS NULL'}`,
        parentId ? [feature, parentId] : [feature]
    );
    return rows[0].next_pos;
}

// 插入新目录
export async function insertDirectory(
    data: Partial<DirectoryItem>
): Promise<DirectoryItem> {
    const { id, feature, parentId, name, createdBy, position } = data;
    const { rows } = await pool.query<DirectoryItem>(
        `INSERT INTO directories(
       id, feature, parent_id, name,
       position, created_by
     ) VALUES($1,$2,$3,$4,$5,$6)
     RETURNING *`,
        [
            id,
            feature,
            parentId || null,
            name,
            position ?? 0,
            createdBy,
        ]
    );
    return rows[0];
}

// 更新目录
export async function updateDirectory(
    id: string,
    changes: Partial<DirectoryItem>
): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(changes)) {
        if (key === 'updatedAt') continue;
        const col = key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
        sets.push(`${col} = $${idx}`);
        values.push(val as any);
        idx++;
    }
    if (!sets.length) return;
    sets.push(`updated_at = NOW()`);
    values.push(id);
    await pool.query(
        `UPDATE directories SET ${sets.join(', ')} WHERE id = $${idx}`,
        values
    );
}

// 删除目录
export async function deleteDirectory(id: string): Promise<void> {
    await pool.query(
        'DELETE FROM directories WHERE id = $1',
        [id]
    );
}

// 重排目录顺序
export async function reorderDirectories(
    feature: string,
    parentId: string | null,
    orderedIds: string[]
): Promise<void> {
    await pool.query(
        `UPDATE directories SET position = x.idx
       FROM (
         SELECT id, ROW_NUMBER() OVER () - 1 AS idx
         FROM unnest($1::uuid[]) AS id
       ) x
       WHERE directories.id = x.id`,
        [orderedIds]
    );
}