import { PoolClient } from 'pg';

/**
 * Migration: shared dev task pool + journal content
 */
export async function devTaskMigration(client: PoolClient) {
    await client.query(`
CREATE TABLE IF NOT EXISTS dev_tasks (
  task_id               UUID          PRIMARY KEY,
  owner_id              VARCHAR(50)   NOT NULL REFERENCES user_info(user_id),
  project_slug          TEXT          NOT NULL,
  project_name          TEXT          NOT NULL,
  template_id           TEXT          NOT NULL,
  workspace_key         TEXT          NOT NULL,
  allowed_device_types  TEXT[]        NOT NULL DEFAULT ARRAY['any']::TEXT[],
  priority              TEXT          NOT NULL DEFAULT 'normal'
                                      CHECK (priority IN ('low', 'normal', 'high')),
  status                TEXT          NOT NULL DEFAULT 'queued'
                                      CHECK (status IN (
                                        'draft',
                                        'queued',
                                        'claimed',
                                        'planning',
                                        'awaiting_approval',
                                        'executing',
                                        'checking',
                                        'completed',
                                        'needs_tuning',
                                        'failed',
                                        'cancelled',
                                        'interrupted'
                                      )),
  current_revision_id   UUID          NULL,
  created_from          TEXT          NOT NULL CHECK (created_from IN ('maintask', 'aitool')),
  created_by            TEXT          NOT NULL,
  requested_by          TEXT          NOT NULL,
  last_status_note      TEXT          NULL,
  last_agent_id         TEXT          NULL,
  last_device_type      TEXT          NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_tasks_owner_status
  ON dev_tasks(owner_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_dev_tasks_owner_project
  ON dev_tasks(owner_id, project_slug, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_dev_tasks_workspace
  ON dev_tasks(owner_id, workspace_key);

CREATE TABLE IF NOT EXISTS dev_task_revision (
  revision_id           UUID          PRIMARY KEY,
  task_id               UUID          NOT NULL REFERENCES dev_tasks(task_id) ON DELETE CASCADE,
  revision_no           INT           NOT NULL,
  goal                  TEXT          NOT NULL,
  inputs                JSONB         NOT NULL DEFAULT '{}'::jsonb,
  plan_summary          TEXT          NULL,
  execution_summary     TEXT          NULL,
  check_report          JSONB         NULL,
  next_step             TEXT          NULL,
  status                TEXT          NOT NULL DEFAULT 'queued'
                                      CHECK (status IN (
                                        'draft',
                                        'queued',
                                        'claimed',
                                        'planning',
                                        'awaiting_approval',
                                        'executing',
                                        'checking',
                                        'completed',
                                        'needs_tuning',
                                        'failed',
                                        'cancelled',
                                        'interrupted'
                                      )),
  assigned_agent_id     TEXT          NULL,
  requested_by          TEXT          NOT NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, revision_no)
);

CREATE INDEX IF NOT EXISTS idx_dev_task_revision_task
  ON dev_task_revision(task_id, revision_no DESC);

CREATE INDEX IF NOT EXISTS idx_dev_task_revision_status
  ON dev_task_revision(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS dev_task_claim (
  claim_id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id               UUID          NOT NULL REFERENCES dev_tasks(task_id) ON DELETE CASCADE,
  revision_id           UUID          NOT NULL REFERENCES dev_task_revision(revision_id) ON DELETE CASCADE,
  owner_id              VARCHAR(50)   NOT NULL REFERENCES user_info(user_id),
  agent_id              TEXT          NOT NULL,
  agent_name            TEXT          NULL,
  device_type           TEXT          NOT NULL,
  claimed_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  lease_expires_at      TIMESTAMPTZ   NOT NULL,
  released_at           TIMESTAMPTZ   NULL,
  status                TEXT          NOT NULL DEFAULT 'active'
                                      CHECK (status IN ('active', 'released', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_dev_task_claim_active
  ON dev_task_claim(owner_id, agent_id, status, lease_expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_dev_task_claim_task
  ON dev_task_claim(task_id, revision_id, status);

CREATE TABLE IF NOT EXISTS dev_task_event (
  event_id              UUID          PRIMARY KEY,
  task_id               UUID          NOT NULL REFERENCES dev_tasks(task_id) ON DELETE CASCADE,
  revision_id           UUID          NOT NULL REFERENCES dev_task_revision(revision_id) ON DELETE CASCADE,
  owner_id              VARCHAR(50)   NOT NULL REFERENCES user_info(user_id),
  status                TEXT          NULL,
  event_type            TEXT          NOT NULL,
  note                  TEXT          NULL,
  payload               JSONB         NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_task_event_task
  ON dev_task_event(task_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dev_task_event_revision
  ON dev_task_event(revision_id, created_at DESC);

CREATE TABLE IF NOT EXISTS dev_task_tuning_request (
  request_id            UUID          PRIMARY KEY,
  task_id               UUID          NOT NULL REFERENCES dev_tasks(task_id) ON DELETE CASCADE,
  revision_id           UUID          NOT NULL REFERENCES dev_task_revision(revision_id) ON DELETE CASCADE,
  owner_id              VARCHAR(50)   NOT NULL REFERENCES user_info(user_id),
  requested_by          TEXT          NOT NULL,
  requested_from        TEXT          NOT NULL CHECK (requested_from IN ('maintask', 'aitool')),
  message               TEXT          NOT NULL,
  status                TEXT          NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending', 'applied', 'dismissed')),
  created_revision_id   UUID          NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_task_tuning_request_task
  ON dev_task_tuning_request(task_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dev_task_tuning_request_status
  ON dev_task_tuning_request(owner_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS dev_task_command (
  command_id            UUID          PRIMARY KEY,
  task_id               UUID          NOT NULL REFERENCES dev_tasks(task_id) ON DELETE CASCADE,
  revision_id           UUID          NOT NULL REFERENCES dev_task_revision(revision_id) ON DELETE CASCADE,
  owner_id              VARCHAR(50)   NOT NULL REFERENCES user_info(user_id),
  agent_id              TEXT          NOT NULL,
  type                  TEXT          NOT NULL CHECK (type IN ('approval', 'cancel', 'tuning_request')),
  request_id            UUID          NULL,
  message               TEXT          NULL,
  status                TEXT          NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending', 'applied', 'dismissed')),
  note                  TEXT          NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_task_command_agent
  ON dev_task_command(owner_id, agent_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dev_task_command_task
  ON dev_task_command(task_id, revision_id, status);

CREATE TABLE IF NOT EXISTS dev_journal_content (
  id                    UUID          PRIMARY KEY,
  directory_id          UUID          NOT NULL REFERENCES directories(id),
  title                 TEXT          NOT NULL,
  summary               TEXT          NULL,
  body                  TEXT          NULL,
  position              INT           NOT NULL DEFAULT 0,
  created_by            VARCHAR(50)   NOT NULL REFERENCES user_info(user_id),
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_journal_content_directory
  ON dev_journal_content(directory_id);

CREATE INDEX IF NOT EXISTS idx_dev_journal_content_directory_position
  ON dev_journal_content(directory_id, position);

ALTER TABLE dev_tasks
  DROP CONSTRAINT IF EXISTS dev_tasks_current_revision_id_fkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.table_constraints
     WHERE constraint_name = 'dev_tasks_current_revision_id_fkey'
       AND table_name = 'dev_tasks'
  ) THEN
    ALTER TABLE dev_tasks
      ADD CONSTRAINT dev_tasks_current_revision_id_fkey
      FOREIGN KEY (current_revision_id)
      REFERENCES dev_task_revision(revision_id)
      ON DELETE SET NULL;
  END IF;
END;
$$;
    `);
}
