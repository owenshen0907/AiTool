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
    }>(
        `SELECT id,
            name,
            abbreviation,
            api_key AS api_key,
            api_url AS api_url
       FROM ai_suppliers
      WHERE user_id = $1
      ORDER BY created_at DESC`,
        [userId]
    );
    // map 列名到接口字段
    return res.rows.map(r => ({
        id: r.id,
        name: r.name,
        abbreviation: r.abbreviation,
        apiKey: r.api_key,
        apiUrl: r.api_url
    }));
}

interface CreateSupplierPayload {
    name: string;
    abbreviation: string;
    apiKey: string;
    apiUrl: string;
    userId: string;
}

/** 新增 AI 供应商 */
export async function createSupplier(
    payload: CreateSupplierPayload
): Promise<Supplier> {
    const { name, abbreviation, apiKey, apiUrl, userId } = payload;
    const res = await pool.query<{
        id: string;
        name: string;
        abbreviation: string;
        api_key: string;
        api_url: string;
    }>(
        `INSERT INTO ai_suppliers (name, abbreviation, api_key, api_url, user_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, abbreviation, api_key, api_url`,
        [name, abbreviation, apiKey, apiUrl, userId]
    );
    const r = res.rows[0];
    return {
        id: r.id,
        name: r.name,
        abbreviation: r.abbreviation,
        apiKey: r.api_key,
        apiUrl: r.api_url
    };
}