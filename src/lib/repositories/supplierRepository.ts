// src/lib/repositories/supplierRepository.ts
import { pool } from '@/lib/db/client';
import type { Supplier } from '@/lib/models/model';

/** 获取某用户下的 AI 供应商列表 */
export async function getSuppliersByUser(userId: string): Promise<Supplier[]> {
    const res = await pool.query<{
        id: string;
        name: string;
        abbreviation: string;
        api_key: string;
        api_url: string;
        wssurl: string | null;
        is_default: boolean;
    }>(
        `SELECT id, name, abbreviation, api_key, api_url, wssurl, is_default
         FROM ai_suppliers
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    );
    return res.rows.map(r => ({
        id: r.id,
        name: r.name,
        abbreviation: r.abbreviation,
        apiKey: r.api_key,
        apiUrl: r.api_url,
        wssUrl: r.wssurl,          // 新增
        isDefault: r.is_default,
    }));
}

/** 新增 AI 供应商 */
export async function createSupplier(
    payload: {
        name: string;
        abbreviation: string;
        apiKey: string;
        apiUrl: string;
        wssUrl?: string;         // 可选
        userId: string;
        isDefault?: boolean;
    }
): Promise<Supplier> {
    const {
        name,
        abbreviation,
        apiKey,
        apiUrl,
        wssUrl = null,           // 默认 null
        userId,
        isDefault = false
    } = payload;

    // 如果新建时要设默认，则先清空其他默认
    if (isDefault) {
        await pool.query(
            `UPDATE ai_suppliers SET is_default = FALSE WHERE user_id = $1`,
            [userId]
        );
    }

    const res = await pool.query<{
        id: string;
        name: string;
        abbreviation: string;
        api_key: string;
        api_url: string;
        wssurl: string | null;
        is_default: boolean;
    }>(
        `INSERT INTO ai_suppliers
             (name, abbreviation, api_key, api_url, wssurl, user_id, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, abbreviation, api_key, api_url, wssurl, is_default`,
        [name, abbreviation, apiKey, apiUrl, wssUrl, userId, isDefault]
    );

    const r = res.rows[0];
    return {
        id: r.id,
        name: r.name,
        abbreviation: r.abbreviation,
        apiKey: r.api_key,
        apiUrl: r.api_url,
        wssUrl: r.wssurl,         // 新增
        isDefault: r.is_default,
    };
}

/** 根据 ID 获取单个供应商信息（含 user_id） */
export async function getSupplierById(
    id: string
): Promise<(Supplier & { userId: string })> {
    const res = await pool.query<{
        id: string;
        name: string;
        abbreviation: string;
        api_key: string;
        api_url: string;
        wssurl: string | null;
        user_id: string;
        is_default: boolean;
    }>(
        `SELECT id, name, abbreviation, api_key, api_url, wssurl, user_id, is_default
         FROM ai_suppliers
         WHERE id = $1`,
        [id]
    );
    if (res.rowCount === 0) throw new Error('Supplier not found');
    const r = res.rows[0];
    return {
        id: r.id,
        name: r.name,
        abbreviation: r.abbreviation,
        apiKey: r.api_key,
        apiUrl: r.api_url,
        wssUrl: r.wssurl,         // 新增
        userId: r.user_id,
        isDefault: r.is_default,
    };
}

/** 更新 AI 供应商 */
export async function updateSupplier(
    id: string,
    payload: {
        name?: string;
        abbreviation?: string;
        apiKey?: string;
        apiUrl?: string;
        wssUrl?: string | null;  // 可选
        isDefault?: boolean;
    },
    userId: string
): Promise<Supplier | null> {
    // 验证所有权
    const existing = await getSupplierById(id);
    if (existing.userId !== userId) return null;

    // 如果要设置为默认，则先清空其他默认
    if (payload.isDefault) {
        await pool.query(
            `UPDATE ai_suppliers SET is_default = FALSE WHERE user_id = $1`,
            [userId]
        );
    }

    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (payload.name !== undefined) {
        sets.push(`name = $${idx++}`);
        values.push(payload.name);
    }
    if (payload.abbreviation !== undefined) {
        sets.push(`abbreviation = $${idx++}`);
        values.push(payload.abbreviation);
    }
    if (payload.apiKey !== undefined) {
        sets.push(`api_key = $${idx++}`);
        values.push(payload.apiKey);
    }
    if (payload.apiUrl !== undefined) {
        sets.push(`api_url = $${idx++}`);
        values.push(payload.apiUrl);
    }
    if (payload.wssUrl !== undefined) {
        sets.push(`wssurl = $${idx++}`);   // 新增
        values.push(payload.wssUrl);
    }
    if (payload.isDefault !== undefined) {
        sets.push(`is_default = $${idx++}`);
        values.push(payload.isDefault);
    }
    if (sets.length === 0) return existing;

    // 更新时间戳
    sets.push(`updated_at = NOW()`);
    values.push(id); // for WHERE

    const sql = `
        UPDATE ai_suppliers
        SET ${sets.join(', ')}
        WHERE id = $${idx}
            RETURNING id, name, abbreviation, api_key, api_url, wssurl, is_default
    `;
    const res = await pool.query<{
        id: string;
        name: string;
        abbreviation: string;
        api_key: string;
        api_url: string;
        wssurl: string | null;
        is_default: boolean;
    }>(sql, values);

    const r = res.rows[0];
    return {
        id: r.id,
        name: r.name,
        abbreviation: r.abbreviation,
        apiKey: r.api_key,
        apiUrl: r.api_url,
        wssUrl: r.wssurl,         // 新增
        isDefault: r.is_default,
    };
}