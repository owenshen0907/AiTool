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
-- 必要的扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- user_info
CREATE TABLE IF NOT EXISTS user_info (
    user_id       VARCHAR(50) PRIMARY KEY,
    nickname      TEXT NOT NULL,
    phone         TEXT,
    email         TEXT,
    wechat        TEXT,
    account_level INTEGER
);

-- AI 供应商表
CREATE TABLE IF NOT EXISTS ai_suppliers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    abbreviation  TEXT NOT NULL,
    api_key       TEXT NOT NULL,
    api_url       TEXT NOT NULL,
    user_id       VARCHAR(50) NOT NULL REFERENCES user_info(user_id) ON DELETE CASCADE,
    is_default    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON ai_suppliers(user_id);

-- 模型表
CREATE TABLE IF NOT EXISTS models (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id             UUID NOT NULL REFERENCES ai_suppliers(id) ON DELETE CASCADE,
    name                    TEXT NOT NULL,
    model_type              TEXT NOT NULL CHECK (model_type IN ('chat','non-chat')),
    supports_image_input    BOOLEAN NOT NULL DEFAULT FALSE,
    supports_video_input    BOOLEAN NOT NULL DEFAULT FALSE,
    supports_audio_output   BOOLEAN NOT NULL DEFAULT FALSE,
    supports_json_mode      BOOLEAN NOT NULL DEFAULT FALSE,
    supports_tool           BOOLEAN NOT NULL DEFAULT FALSE,
    supports_web_search     BOOLEAN NOT NULL DEFAULT FALSE,
    supports_deep_thinking  BOOLEAN NOT NULL DEFAULT FALSE,
    is_default              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_models_supplier_id ON models(supplier_id);
CREATE INDEX IF NOT EXISTS idx_models_model_type   ON models(model_type);

-- prompts 表（保持不变）
CREATE TABLE IF NOT EXISTS prompts (
    id           UUID PRIMARY KEY,
    parent_id    UUID NULL,
    type         VARCHAR(10) NOT NULL,
    title        TEXT NOT NULL,
    content      TEXT NULL,
    description  TEXT NULL,
    tags         JSONB NOT NULL DEFAULT '[]',
    attributes   JSONB NOT NULL DEFAULT '[]',
    comments     JSONB NULL,
    is_public    BOOLEAN NOT NULL DEFAULT FALSE,
    created_by   VARCHAR(50) NOT NULL REFERENCES user_info(user_id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_log   JSONB NULL
);
CREATE INDEX IF NOT EXISTS idx_prompts_parent_id  ON prompts(parent_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON prompts(created_by);

-- Table: prompt_good_cases
CREATE TABLE IF NOT EXISTS prompt_good_cases (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id    UUID              NOT NULL REFERENCES prompts(id),
  user_input   TEXT              NOT NULL,
  expected     TEXT              NOT NULL,
  images       TEXT[]            DEFAULT '{}' ,
  audios       TEXT[]            DEFAULT '{}',
  videos       TEXT[]            DEFAULT '{}',
  position     INT               NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- Table: prompt_bad_cases
CREATE TABLE IF NOT EXISTS prompt_bad_cases (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id    UUID              NOT NULL REFERENCES prompts(id),
  user_input   TEXT              NOT NULL,
  bad_output   TEXT              NOT NULL,
  expected     TEXT              NOT NULL,
  images       TEXT[]            DEFAULT '{}',
  audios       TEXT[]            DEFAULT '{}',
  videos       TEXT[]            DEFAULT '{}',
  position     INT               NOT NULL DEFAULT 0,
  error_type   VARCHAR(50),
  notes        TEXT,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- Indexes for prompt_good_cases
CREATE INDEX IF NOT EXISTS idx_good_cases_prompt_id
  ON prompt_good_cases(prompt_id);
CREATE INDEX IF NOT EXISTS idx_good_cases_created_at
  ON prompt_good_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_good_cases_position
  ON prompt_good_cases(position);
-- GIN index for array searches
CREATE INDEX IF NOT EXISTS idx_good_cases_images_gin
  ON prompt_good_cases USING GIN (images);
CREATE INDEX IF NOT EXISTS idx_good_cases_audios_gin
  ON prompt_good_cases USING GIN (audios);
CREATE INDEX IF NOT EXISTS idx_good_cases_videos_gin
  ON prompt_good_cases USING GIN (videos);

-- Indexes for prompt_bad_cases
CREATE INDEX IF NOT EXISTS idx_bad_cases_prompt_id
  ON prompt_bad_cases(prompt_id);
CREATE INDEX IF NOT EXISTS idx_bad_cases_created_at
  ON prompt_bad_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_bad_cases_position
  ON prompt_bad_cases(position);
-- GIN index for array searches
CREATE INDEX IF NOT EXISTS idx_bad_cases_images_gin
  ON prompt_bad_cases USING GIN (images);
CREATE INDEX IF NOT EXISTS idx_bad_cases_audios_gin
  ON prompt_bad_cases USING GIN (audios);
CREATE INDEX IF NOT EXISTS idx_bad_cases_videos_gin
  ON prompt_bad_cases USING GIN (videos);
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