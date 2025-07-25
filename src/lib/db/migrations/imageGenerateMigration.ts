// src/lib/db/migrations/imageGenerateMigration.ts
import { PoolClient } from 'pg';

/**
 * Migration: create docs_japanese table and its indexes
 */
export async function imageGenerateContent(client: PoolClient) {
    await client.query(`
-- imageGenerate_content 表
CREATE TABLE IF NOT EXISTS imageGenerate_content (
  id            UUID          PRIMARY KEY,
  directory_id  UUID          NOT NULL
                            REFERENCES directories(id),
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
CREATE INDEX IF NOT EXISTS idx_imageGenerate_content_directory
  ON imageGenerate_content(directory_id);

CREATE INDEX IF NOT EXISTS idx_imageGenerate_content_directory_position
  ON imageGenerate_content(directory_id, position);
    `);
}
