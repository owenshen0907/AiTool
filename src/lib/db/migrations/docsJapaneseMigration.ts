// src/lib/db/migrations/docsJapaneseMigration.ts
import { PoolClient } from 'pg';

/**
 * Migration: create docs_japanese table and its indexes
 */
export async function docsJapaneseContent(client: PoolClient) {
    await client.query(`
-- docs_japanese 表
CREATE TABLE IF NOT EXISTS japanese_content (
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
CREATE INDEX IF NOT EXISTS idx_japanese_content_directory
  ON japanese_content(directory_id);

CREATE INDEX IF NOT EXISTS idx_japanese_content_directory_position
  ON japanese_content(directory_id, position);
    `);
}
