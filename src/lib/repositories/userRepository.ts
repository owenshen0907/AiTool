// src/lib/repositories/userRepository.ts
import { pool } from '@/lib/db/client';

export interface UserUpsert {
    id: string;
    nickname: string;
    email?: string;
    phone?: string;
    wechat?: string;
    accountLevel?: number;
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