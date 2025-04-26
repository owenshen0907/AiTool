// src/lib/repositories/userRepository.ts
import { pool } from '@/lib/db/client';
import { v4 as uuidv4 } from 'uuid';

export interface UserUpsert {
    id: string;
    nickname: string;
    email?: string;
    phone?: string;
    wechat?: string;
    accountLevel?: number;
    modelList?: Record<string, any>[];
}

export interface Model {
    id: string;
    name: string;
    url: string;
    apiKey: string;
    isDefault: boolean;
    supplier: 'StepFun' | 'OpenAI';
    modelType:
        | 'text'
        | 'vision'
        | 'asr'
        | 'tts'
        | 'streaming_asr'
        | 'streaming_tts'
        | 'real-time';
    notes?: string;
    passedTest: boolean;
    userId: string;
}

/**
 * 插入或更新用户信息：
 * - 如果 user_id 不存在，则插入完整一条
 * - 如果已存在，则更新昵称、联系方式和账号级别
 */
export async function upsertUser({
                                     id,
                                     nickname,
                                     email = '',
                                     phone = '',
                                     wechat = '',
                                     accountLevel = 1,
                                 }: UserUpsert): Promise<void> {
    await pool.query(
        `
    INSERT INTO user_info (user_id, nickname, phone, email, wechat, account_level)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id) DO UPDATE SET
      nickname       = EXCLUDED.nickname,
      phone          = EXCLUDED.phone,
      email          = EXCLUDED.email,
      wechat         = EXCLUDED.wechat,
      account_level  = EXCLUDED.account_level;
    `,
        [id, nickname, phone, email, wechat, accountLevel],
    );
}



/** 查询某用户的所有模型 */
export async function getUserModels(userId: string): Promise<Model[]> {
    const res = await pool.query(
        `SELECT * FROM models WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    return res.rows;
}

/** 新增一个模型 */
export async function createUserModel(m: Omit<Model, 'id'|'created_at'|'updated_at'>): Promise<Model> {
    const id = uuidv4();
    const res = await pool.query(
        `INSERT INTO models (
       id, name, url, api_key, is_default, supplier, model_type, notes, passed_test, user_id
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
     ) RETURNING *`,
        [
            id, m.name, m.url, m.apiKey, m.isDefault,
            m.supplier, m.modelType, m.notes ?? null,
            m.passedTest, m.userId
        ]
    );
    return res.rows[0];
}

/** 更新模型（含设为默认、更新备注、通过测试等场景） */
export async function updateUserModel(id: string, updates: Partial<Model>): Promise<Model> {
    // 拼接 SET 语句
    const keys = Object.keys(updates);
    const sets = keys.map((k,i) => `"${k}" = $${i+2}`).join(',');
    const values = keys.map(k => (updates as any)[k]);
    const res = await pool.query(
        `UPDATE models SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, ...values]
    );
    return res.rows[0];
}

/** 删除一个模型 */
export async function deleteUserModel(id: string): Promise<void> {
    await pool.query(`DELETE FROM models WHERE id = $1`, [id]);
}