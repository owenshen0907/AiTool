// lib/db/initDb.ts
import { pool } from './client.js';
import { migrateCaseContent } from './migrations/caseContentMigration.js';
import {docsJapaneseContent} from "./migrations/docsJapaneseMigration.js";
import {dubbingContent} from "./migrations/dubbingMigration.js";
import {imageGenerateContent} from "./migrations/imageGenerateMigration.js";
import {demoContent} from "./migrations/demoMigration.js";

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

-- AI 供应商表（含新增的 wssurl 字段，可为空）
CREATE TABLE IF NOT EXISTS ai_suppliers (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    abbreviation  TEXT        NOT NULL,
    api_key       TEXT        NOT NULL,
    api_url       TEXT        NOT NULL,
    wssurl        TEXT,  -- WebSocket URL，可为空
    user_id       VARCHAR(50) NOT NULL REFERENCES user_info(user_id) ON DELETE CASCADE,
    is_default    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON ai_suppliers(user_id);

-- 模型表（已调整 model_type、并新增输入/输出字段及 supports_websocket）
CREATE TABLE IF NOT EXISTS models (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id              UUID        NOT NULL REFERENCES ai_suppliers(id) ON DELETE CASCADE,
    name                     TEXT        NOT NULL,
    model_type               TEXT        NOT NULL
                                      CHECK (model_type IN ('chat','audio','image','video','other')),
    -- 输入能力
    supports_audio_input     BOOLEAN     NOT NULL DEFAULT FALSE,  -- 新增：音频输入
    supports_image_input     BOOLEAN     NOT NULL DEFAULT FALSE,
    supports_video_input     BOOLEAN     NOT NULL DEFAULT FALSE,
    -- 输出能力
    supports_audio_output    BOOLEAN     NOT NULL DEFAULT FALSE,
    supports_image_output    BOOLEAN     NOT NULL DEFAULT FALSE,  -- 新增：图片输出
    supports_video_output    BOOLEAN     NOT NULL DEFAULT FALSE,  -- 新增：视频输出
    -- 其他能力
    supports_json_mode       BOOLEAN     NOT NULL DEFAULT FALSE,
    supports_tool            BOOLEAN     NOT NULL DEFAULT FALSE,
    supports_web_search      BOOLEAN     NOT NULL DEFAULT FALSE,
    supports_deep_thinking   BOOLEAN     NOT NULL DEFAULT FALSE,
    supports_websocket       BOOLEAN     NOT NULL DEFAULT FALSE,  -- 新增：WebSocket 支持
    is_default               BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_models_supplier_id ON models(supplier_id);
CREATE INDEX IF NOT EXISTS idx_models_model_type   ON models(model_type);

-- 音色主表
CREATE TABLE IF NOT EXISTS voice_tones (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),  -- 内部主键
    supplier_id          UUID        NOT NULL
                                     REFERENCES ai_suppliers(id) ON DELETE CASCADE,  -- 所属供应商
    tone_id              TEXT        NOT NULL,       -- 供应商接口生成的音色 ID
    name                 TEXT        NOT NULL,       -- 音色名称
    description          TEXT,                        -- 音色描述
    available_model_ids  UUID[]      NOT NULL DEFAULT '{}',  -- 绑定模型列表，空数组表示全局可用
    original_audio_file_id      UUID,                          -- 原始音频文件 ID
    original_audio_file_path    TEXT,                          -- 原始音频文件路径
    preview_audio_file_id       UUID,                          -- 预览音色音频文件 ID
    sample_audio_path           TEXT,                          -- 预览音色音频文件路径
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 唯一约束：同一供应商下 tone_id 唯一
CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_tones_supplier_toneid
  ON voice_tones(supplier_id, tone_id);

-- 可选：加速按供应商查询
CREATE INDEX IF NOT EXISTS idx_voice_tones_supplier_id
  ON voice_tones(supplier_id);

-- GIN 索引：加速按模型 ID 在 available_model_ids 中搜索
CREATE INDEX IF NOT EXISTS idx_voice_tones_available_models_gin
  ON voice_tones USING GIN (available_model_ids);
  
-- Agent配置  
-- Agent 场景配置表
CREATE TABLE IF NOT EXISTS agent_scene_config (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     VARCHAR(50) NOT NULL,                    -- 对应 user_info.user_id 类型
    agent_id    TEXT        NOT NULL,
    scene_key   TEXT        NOT NULL,
    supplier_id UUID        NOT NULL REFERENCES ai_suppliers(id) ON DELETE CASCADE,
    model_id    UUID        NOT NULL REFERENCES models(id)        ON DELETE CASCADE,
    extras      JSONB       NOT NULL DEFAULT '{}'::jsonb,         -- 预留扩展（可删除）
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- 唯一约束：同一用户的同一 agent 的同一场景只有一条配置
    UNIQUE (user_id, agent_id, scene_key)
);

-- 索引：按用户加载全部
CREATE INDEX IF NOT EXISTS idx_agent_scene_user ON agent_scene_config(user_id);

-- 索引：按用户+agent 查询
CREATE INDEX IF NOT EXISTS idx_agent_scene_user_agent ON agent_scene_config(user_id, agent_id);

-- 可选：统计/分析（供应商、模型维度）
CREATE INDEX IF NOT EXISTS idx_agent_scene_supplier ON agent_scene_config(supplier_id);
CREATE INDEX IF NOT EXISTS idx_agent_scene_model    ON agent_scene_config(model_id);

-- 自动更新时间触发器（如果还没有）
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_trigger
     WHERE tgname = 'trg_agent_scene_config_updated'
       AND tgrelid = 'agent_scene_config'::regclass
  ) THEN
    CREATE TRIGGER trg_agent_scene_config_updated
      BEFORE UPDATE ON agent_scene_config
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;

-- 数据库迁移脚本示例
CREATE TABLE IF NOT EXISTS directories (
  id          UUID          PRIMARY KEY,
  feature     VARCHAR(50)   NOT NULL,           -- 功能区标识（比如 'case', 'prompt'…）
  parent_id   UUID          NULL REFERENCES directories(id),
  name        TEXT          NOT NULL,           -- 目录名称
  position    INT           NOT NULL DEFAULT 0, -- 同级排序索引
  created_by  VARCHAR(50)   NOT NULL,           -- 操作人 ID
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 索引，按功能区+层级+顺序快速查询
CREATE INDEX IF NOT EXISTS idx_directories_feature       ON directories(feature);
CREATE INDEX IF NOT EXISTS idx_directories_parent_pos     ON directories(feature, parent_id, position);


CREATE TABLE IF NOT EXISTS file_uploads (
  file_id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),  -- 文件主键
  user_id        VARCHAR(50) NOT NULL,                              -- 文件所属/上传用户
  module_name    TEXT        NOT NULL,                              -- 上传的模块或业务场景
  file_category  TEXT        NOT NULL,                              -- 文件分类，如 'img' / 'video' / 'audio'
  mime_type      TEXT        NOT NULL,                              -- 文件 MIME 类型
  original_name  TEXT        NOT NULL,                              -- 上传时的原始文件名
  file_path      TEXT        NOT NULL,                              -- 存储在服务器上的相对路径或 URL
  file_size      BIGINT      NOT NULL,                              -- 文件大小（字节）
  form_id        TEXT,                                              -- 关联业务表单的 ID

  -- 新增 origin 字段，限定为 'manual' 或 'ai'
  origin         TEXT        NOT NULL DEFAULT 'manual',
  
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),                -- 上传时间
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),                -- 最近更新时间

  -- 外键约束
  CONSTRAINT fk_file_user FOREIGN KEY (user_id) REFERENCES user_info(user_id),
  -- 检查约束：origin 只能取 manual 或 ai
  CONSTRAINT chk_origin      CHECK (origin = ANY (ARRAY['manual'::text, 'ai'::text]))
);

-- 常用查询索引
CREATE INDEX IF NOT EXISTS idx_file_uploads_user     ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_module   ON file_uploads(module_name);
CREATE INDEX IF NOT EXISTS idx_file_uploads_category ON file_uploads(file_category);
-- prompts 表
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
    update_log   JSONB NULL,
    position     INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_prompts_parent_id  ON prompts(parent_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON prompts(created_by);
CREATE INDEX IF NOT EXISTS idx_prompts_parent_pos ON prompts(parent_id, position);


-- 存储某个 Prompt 在生成时，所用到的原始输入数据
CREATE TABLE IF NOT EXISTS prompt_generation_input_data (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id    UUID         NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    part_index   INT          NOT NULL,               -- 输入片段的顺序
    part_type    VARCHAR(20)  NOT NULL,               -- 'text' | 'image_url' | 'video_url' | 'input_audio'
    content      JSONB        NOT NULL,               -- 根据 part_type 存放对应 JSON
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 按 prompt 快速查询
CREATE INDEX IF NOT EXISTS idx_gen_input_data_prompt 
  ON prompt_generation_input_data(prompt_id);

-- 保证同一 prompt 下 part_index 唯一
CREATE UNIQUE INDEX IF NOT EXISTS idx_gen_input_data_order 
  ON prompt_generation_input_data(prompt_id, part_index);
  
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

        // 执行 case_content 的迁移
        await migrateCaseContent(client);
        await docsJapaneseContent(client);
        await dubbingContent(client);
        await imageGenerateContent(client);
        await demoContent(client);

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