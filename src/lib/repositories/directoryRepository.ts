// File: src/lib/repositories/directoryRepository.ts
import { pool } from '@/lib/db/client';
import type { DirectoryItem } from '@/lib/models/directory';


export async function getDirectoryById(id: string,
                                       userId: string): Promise<DirectoryItem | null> {
    const { rows } = await pool.query<DirectoryItem>(
        'SELECT * FROM directories WHERE id = $1 AND created_by = $2',
        [id, userId]
    );
    return rows[0] || null;
}

// 列出同级目录
export async function listDirectories(
    userId: string,
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
        AND created_by = $2
      ORDER BY parent_id NULLS FIRST, position
      `,
            [feature, userId]
        );
        return rows;
    }

    // 只查同级
    const { rows } = await pool.query<DirectoryItem>(
        `
    SELECT *
    FROM directories
    WHERE feature = $1
      AND created_by = $2
      AND parent_id IS NOT DISTINCT FROM $3   -- null 也能比较
    ORDER BY position
    `,
        [feature, userId, parentId]
    );
    return rows;
}

// 获取下一个 position

export async function getNextDirectoryPosition(
    userId: string,
    feature: string,
    parentId?: string | null
): Promise<number> {
    // parentId 为 undefined 或者 null 时，这里会绑定为 null
    const pid = parentId ?? null;

    const { rows } = await pool.query<{ next_pos: number }>(
        `
            SELECT COALESCE(MAX(position), 0) + 1 AS next_pos
            FROM directories
            WHERE feature     = $1
              AND created_by  = $2
              AND parent_id   IS NOT DISTINCT FROM $3::uuid
        `,
        [feature, userId, pid]
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
): Promise<DirectoryItem | null> {
    // 构造 SET 子句
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(changes)) {
        if (key === 'updatedAt') continue;
        const col = key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
        sets.push(`${col} = $${idx}`);
        values.push(val);
        idx++;
    }

    if (!sets.length) {
        // 没有可更新的字段
        return null;
    }

    // 始终更新 updated_at
    sets.push(`updated_at = NOW()`);

    // 最后把 id 放到 values，绑定到 WHERE id = $idx
    values.push(id);

    const sql = `
    UPDATE directories
       SET ${sets.join(', ')}
     WHERE id = $${idx}
     RETURNING *
  `;
    const { rows } = await pool.query<DirectoryItem>(sql, values);
    return rows[0] || null;
}

// 删除目录
export async function deleteDirectory(id: string): Promise<void> {
    try {
        await pool.query(
            'DELETE FROM directories WHERE id = $1',
            [id]
        );
    } catch (err: any) {
        // 如果是因为还有子行引用它而被拒绝（Foreign Key violation）
        if (err.code === '23503') {
            switch (err.constraint) {
                case 'directories_parent_id_fkey':
                    // 目录下还有子目录
                    throw new Error('DirectoryNotEmpty');
                case 'case_content_directory_id_fkey':
                case 'japanese_content_directory_id_fkey':
                    // 目录下还有内容项
                    throw new Error('DirectoryHasContent');
            }
        }
        // 其他错误依然往上抛
        throw err;
    }
}

// 重排目录顺序
// export async function reorderDirectories(
//     feature: string,
//     parentId: string | null,
//     orderedIds: string[]
// ): Promise<void> {
//     await pool.query(
//         `UPDATE directories SET position = x.idx
//        FROM (
//          SELECT id, ROW_NUMBER() OVER () - 1 AS idx
//          FROM unnest($1::uuid[]) AS id
//        ) x
//        WHERE directories.id = x.id`,
//         [orderedIds]
//     );
// }
export async function reorderDirectories(
    userId: string,
    feature: string,
    parentId: string | null,
    orderedIds: string[]
): Promise<void> {
    // 加上 created_by 和 feature 的过滤
    await pool.query(
        `UPDATE directories d
        SET position = x.idx
       FROM (
         SELECT id, ROW_NUMBER() OVER () - 1 AS idx
           FROM unnest($1::uuid[]) AS id
       ) x
      WHERE d.id = x.id
        AND d.feature = $2
        AND d.created_by = $3
        AND d.parent_id IS NOT DISTINCT FROM $4`,
        [orderedIds, feature, userId, parentId]
    );
}