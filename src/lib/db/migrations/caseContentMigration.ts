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
  `);
}
