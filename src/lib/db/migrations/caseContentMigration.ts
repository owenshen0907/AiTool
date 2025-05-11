// src/lib/db/migrations/caseContentMigration.ts
import { PoolClient } from 'pg';

/**
 * Migration: create case_content table and its indexes
 */
export async function migrateCaseContent(client: PoolClient) {
    await client.query(`
-- case_content 表
CREATE TABLE IF NOT EXISTS case_content (
  id            UUID          PRIMARY KEY,
  directory_id  UUID          NOT NULL
                            REFERENCES directories(id)
                            ON DELETE CASCADE,
  title         TEXT          NOT NULL,
  summary       TEXT          NULL,
  body          TEXT          NULL,
  position      INT           NOT NULL DEFAULT 0,
  created_by    VARCHAR(50)   NOT NULL
                            REFERENCES user_info(user_id),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 索引：按目录与排序快速访问
CREATE INDEX IF NOT EXISTS idx_case_content_directory
  ON case_content(directory_id);

CREATE INDEX IF NOT EXISTS idx_case_content_directory_position
  ON case_content(directory_id, position);
  -- Migration: create prompt_case_list, prompt_case_image and prompt_test_detail tables

-- prompt_case_list 表: 存储单个测试用例（Case），关联到 case_content
CREATE TABLE IF NOT EXISTS prompt_case_list (
  id                UUID        PRIMARY KEY,
  case_content_id   UUID        NOT NULL
                              REFERENCES case_content(id)
                              ON DELETE CASCADE,
  seq               INT         NOT NULL,           -- 序号
  case_text         TEXT        NULL,               -- 文本形式的 Case
  ground_truth      TEXT        NOT NULL,           -- Ground Truth 文本
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- prompt_case_image 表: 扩展表，存储 prompt_case_list 的图片，每个 Case 最多50张
CREATE TABLE IF NOT EXISTS prompt_case_image (
  id                UUID        PRIMARY KEY,
  case_list_id      UUID        NOT NULL
                              REFERENCES prompt_case_list(id)
                              ON DELETE CASCADE,
  image_url         TEXT        NOT NULL,           -- 图片 URL 或存储路径
  position          INT         NOT NULL,           -- 排序位置
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- prompt_test_detail 表: 存储每个 Case 的测试结果明细
CREATE TABLE IF NOT EXISTS prompt_test_detail (
  id                UUID        PRIMARY KEY,
  case_list_id      UUID        NOT NULL
                              REFERENCES prompt_case_list(id)
                              ON DELETE CASCADE,
  model_name        TEXT        NOT NULL,           -- 测试所用模型
  test_result       TEXT        NOT NULL,           -- 测试输出结果
  passed            BOOLEAN     NOT NULL,           -- 是否通过
  reason            TEXT        NULL,               -- 若不通过的原因说明
  test_time         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trace_id          TEXT        NOT NULL            -- 调用链追踪 ID
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_prompt_case_list_content
  ON prompt_case_list(case_content_id);
CREATE INDEX IF NOT EXISTS idx_prompt_case_list_seq
  ON prompt_case_list(case_content_id, seq);

CREATE INDEX IF NOT EXISTS idx_prompt_case_image_list
  ON prompt_case_image(case_list_id);
CREATE INDEX IF NOT EXISTS idx_prompt_case_image_position
  ON prompt_case_image(case_list_id, position);

CREATE INDEX IF NOT EXISTS idx_prompt_test_detail_list
  ON prompt_test_detail(case_list_id);
CREATE INDEX IF NOT EXISTS idx_prompt_test_detail_model
  ON prompt_test_detail(model_name);
CREATE INDEX IF NOT EXISTS idx_prompt_test_detail_time
  ON prompt_test_detail(test_time);

  `);
}
