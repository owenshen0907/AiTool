import { PoolClient } from 'pg';

/**
 * Migration: create requirements_content table and its indexes
 */
export async function requirementsContent(client: PoolClient) {
    await client.query(`
CREATE TABLE IF NOT EXISTS requirements_content (
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

CREATE INDEX IF NOT EXISTS idx_requirements_content_directory
  ON requirements_content(directory_id);

CREATE INDEX IF NOT EXISTS idx_requirements_content_directory_position
  ON requirements_content(directory_id, position);
    `);
}
