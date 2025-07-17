// src/lib/db/migrations/demoMigration.ts
import { PoolClient } from 'pg';

/**
 * Migration: create docs_japanese table and its indexes
 */
export async function demoContent(client: PoolClient) {
    await client.query(`
-- demo_content 表
CREATE TABLE IF NOT EXISTS demo_content (
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
CREATE INDEX IF NOT EXISTS idx_demo_content_directory
  ON demo_content(directory_id);

CREATE INDEX IF NOT EXISTS idx_demo_content_directory_position
  ON demo_content(directory_id, position);
    `);
}
