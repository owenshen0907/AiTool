// File: src/lib/repositories/contentyRepository.ts

import { pool } from '@/lib/db/client';


import type { ContentItem } from '@/lib/models/content';

/** 上层生成好 UUID，再传进来 */
export interface NewContent {
    id: string;
    directoryId: string;
    title: string;
    summary?: string;
    body?: string;
    createdBy: string;
    position: number;
}

function tableName(feature: string): string {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(feature)) {
        throw new Error(`Invalid feature name: ${feature}`);
    }
    return `${feature}_content`;
}

/** 插入新内容，必须传入整个 NewContent */
export async function insert(
    feature: string,
    data: NewContent
): Promise<ContentItem> {
    const tbl = tableName(feature);
    const { id, directoryId, title, summary, body, createdBy, position } = data;
    const { rows } = await pool.query<ContentItem>(
        `
    INSERT INTO ${tbl}(
      id, directory_id, title, summary, body,
      position, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
    `,
        [id, directoryId, title, summary, body, position, createdBy]
    );
    return rows[0];
}

/** 按目录拉列表 */
export async function listByDirectory(
    feature: string,
    directoryId: string
): Promise<ContentItem[]> {
    const tbl = tableName(feature);
    const { rows } = await pool.query<ContentItem>(
        `SELECT * FROM ${tbl} WHERE directory_id = $1 ORDER BY position`,
        [directoryId]
    );
    return rows;
}

/** 按 ID 查单条 */
export async function getById(
    feature: string,
    id: string
): Promise<ContentItem | null> {
    const tbl = tableName(feature);
    const { rows } = await pool.query<ContentItem>(
        `SELECT * FROM ${tbl} WHERE id = $1`,
        [id]
    );
    return rows[0] ?? null;
}

/** 更新部分字段 */
export async function update(
    feature: string,
    id: string,
    changes: Partial<Pick<ContentItem, 'directoryId' | 'title' | 'summary' | 'body'>>
): Promise<void> {
    const tbl = tableName(feature);
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(changes)) {
        // 把 camelCase 转成 snake_case 列名
        const col = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
        sets.push(`${col} = $${idx}`);
        vals.push(val);
        idx++;
    }
    if (sets.length === 0) return;

    // 始终更新 updated_at
    sets.push(`updated_at = NOW()`);
    vals.push(id);

    await pool.query(
        `UPDATE ${tbl} SET ${sets.join(', ')} WHERE id = $${idx}`,
        vals
    );
}

/** 删除一条 */
export async function remove(
    feature: string,
    id: string
): Promise<void> {
    const tbl = tableName(feature);
    await pool.query(`DELETE FROM ${tbl} WHERE id = $1`, [id]);
}

/** 排序：传入新的 orderedIds 列表 */
export async function reorder(
    feature: string,
    directoryId: string,
    orderedIds: string[]
): Promise<void> {
    const tbl = tableName(feature);
    await pool.query(
        `
            UPDATE ${tbl} SET position = x.idx
                FROM (
      SELECT id, ROW_NUMBER() OVER () - 1 AS idx
      FROM unnest($1::uuid[]) AS id
                ) x
            WHERE ${tbl}.id = x.id
        `,
        [orderedIds]
    );
}