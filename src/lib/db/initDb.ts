// lib/db/initDb.ts
import { pool } from './client.js';

export async function initDb() {
    if (process.env.DB_INIT !== 'true') {
        console.log('DB_INIT not enabled, skipping initialization.');
        return;
    }

    const client = await pool.connect();
    try {
        console.log('Initializing database...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_info (
                                                     user_id        VARCHAR(50) PRIMARY KEY,
                nickname       TEXT NOT NULL,
                phone          TEXT,
                email          TEXT,
                wechat         TEXT,
                account_level  INTEGER,
                -- 移除 JSONB model_list，改由独立表存储
                model_list     JSONB NOT NULL DEFAULT '[]'
                );

            CREATE TABLE IF NOT EXISTS models (
                                                  id            UUID PRIMARY KEY,
                                                  name          TEXT NOT NULL,
                                                  url           TEXT NOT NULL,
                                                  api_key       TEXT NOT NULL,
                                                  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
                                                  supplier      TEXT NOT NULL CHECK (supplier IN ('StepFun','OpenAI')),
                model_type    TEXT NOT NULL CHECK (model_type IN (
                                                   'text','vision','asr','tts','streaming_asr','streaming_tts','real-time'
                                                                 )),
                user_id       VARCHAR(50) NOT NULL REFERENCES user_info(user_id) ON DELETE CASCADE,
                notes         TEXT,
                passed_test   BOOLEAN NOT NULL DEFAULT FALSE,
                created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

            -- prompts 表保留不变
            CREATE TABLE IF NOT EXISTS prompts (
                                                   id UUID PRIMARY KEY,
                                                   parent_id UUID NULL,
                                                   type VARCHAR(10) NOT NULL,
                title TEXT NOT NULL,
                content TEXT NULL,
                description TEXT NULL,
                tags JSONB NOT NULL DEFAULT '[]',
                attributes JSONB NOT NULL DEFAULT '[]',
                comments JSONB NULL,
                is_public BOOLEAN NOT NULL DEFAULT FALSE,
                created_by VARCHAR(50) NOT NULL REFERENCES user_info(user_id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                update_log JSONB NULL
                );

            CREATE INDEX IF NOT EXISTS idx_prompts_parent_id ON prompts(parent_id);
            CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON prompts(created_by);
            CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);
            CREATE INDEX IF NOT EXISTS idx_models_supplier     ON models(supplier);
            CREATE INDEX IF NOT EXISTS idx_models_model_type   ON models(model_type);
        `);
        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Error initializing DB:', err);
    } finally {
        client.release();
    }
}

// auto-run
if (process.argv[1] === new URL(import.meta.url).pathname) {
    initDb();
}