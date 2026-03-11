import { PoolClient } from 'pg';

export const apiLabMigrationSql = `
-- API Lab 环境表
CREATE TABLE IF NOT EXISTS api_lab_envs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       VARCHAR(50) NOT NULL REFERENCES user_info(user_id) ON DELETE CASCADE,
  service_key   TEXT        NOT NULL,
  service_name  TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  base_url      TEXT        NOT NULL,
  websocket_url TEXT,
  api_key       TEXT        NOT NULL DEFAULT '',
  extra_headers JSONB       NOT NULL DEFAULT '{}'::jsonb,
  timeout_ms    INTEGER     NOT NULL DEFAULT 30000,
  is_default    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, service_key, name)
);
ALTER TABLE api_lab_envs
  ADD COLUMN IF NOT EXISTS websocket_url TEXT;
CREATE INDEX IF NOT EXISTS idx_api_lab_envs_user_service
  ON api_lab_envs(user_id, service_key);

-- API Lab 接口定义表
CREATE TABLE IF NOT EXISTS api_lab_endpoints (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          VARCHAR(50) NOT NULL REFERENCES user_info(user_id) ON DELETE CASCADE,
  slug             TEXT        NOT NULL,
  service_key      TEXT        NOT NULL,
  service_name     TEXT        NOT NULL,
  category         TEXT        NOT NULL,
  name             TEXT        NOT NULL,
  description      TEXT,
  method           TEXT        NOT NULL,
  path             TEXT        NOT NULL,
  auth_type        TEXT        NOT NULL DEFAULT 'bearer'
                               CHECK (auth_type IN ('bearer', 'x-api-key', 'none', 'custom')),
  auth_header_name TEXT        NOT NULL DEFAULT 'Authorization',
  content_type     TEXT        NOT NULL DEFAULT 'application/json'
                               CHECK (content_type IN ('application/json', 'multipart/form-data', 'application/x-www-form-urlencoded', 'none')),
  response_type    TEXT        NOT NULL DEFAULT 'json'
                               CHECK (response_type IN ('json', 'text', 'sse', 'binary', 'audio')),
  request_template JSONB       NOT NULL DEFAULT '{}'::jsonb,
  query_template   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  header_template  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  file_field_name  TEXT,
  file_accept      TEXT,
  doc_url          TEXT,
  notes            TEXT,
  sort_order       INTEGER     NOT NULL DEFAULT 100,
  is_system        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);
DO $$
BEGIN
  ALTER TABLE api_lab_endpoints DROP CONSTRAINT IF EXISTS api_lab_endpoints_method_check;
  ALTER TABLE api_lab_endpoints
    ADD CONSTRAINT api_lab_endpoints_method_check
    CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'WS'));
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END;
$$;
CREATE INDEX IF NOT EXISTS idx_api_lab_endpoints_user_service
  ON api_lab_endpoints(user_id, service_key, category);

-- API Lab 样例表
CREATE TABLE IF NOT EXISTS api_lab_examples (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id          UUID        NOT NULL REFERENCES api_lab_endpoints(id) ON DELETE CASCADE,
  name                 TEXT        NOT NULL,
  request_body         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  request_query        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  request_headers      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  response_status      INTEGER,
  response_headers     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  response_body        TEXT,
  response_body_format TEXT        NOT NULL DEFAULT 'json'
                                   CHECK (response_body_format IN ('json', 'text', 'sse', 'base64', 'empty')),
  is_recommended       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (endpoint_id, name)
);
CREATE INDEX IF NOT EXISTS idx_api_lab_examples_endpoint
  ON api_lab_examples(endpoint_id, is_recommended, updated_at DESC);

-- API Lab 执行日志
CREATE TABLE IF NOT EXISTS api_lab_run_logs (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              VARCHAR(50) NOT NULL REFERENCES user_info(user_id) ON DELETE CASCADE,
  endpoint_id          UUID        NOT NULL REFERENCES api_lab_endpoints(id) ON DELETE CASCADE,
  env_id               UUID        NOT NULL REFERENCES api_lab_envs(id) ON DELETE CASCADE,
  request_url          TEXT        NOT NULL,
  request_method       TEXT        NOT NULL,
  request_headers      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  request_query        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  request_body         TEXT,
  request_files        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  curl_command         TEXT        NOT NULL,
  response_status      INTEGER,
  response_headers     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  response_body        TEXT,
  response_body_format TEXT        NOT NULL DEFAULT 'json'
                                   CHECK (response_body_format IN ('json', 'text', 'sse', 'base64', 'empty')),
  duration_ms          INTEGER     NOT NULL DEFAULT 0,
  is_success           BOOLEAN     NOT NULL DEFAULT FALSE,
  error_message        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_lab_run_logs_endpoint_created
  ON api_lab_run_logs(endpoint_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_lab_run_logs_user_created
  ON api_lab_run_logs(user_id, created_at DESC);

-- API Lab 巡检配置
CREATE TABLE IF NOT EXISTS api_lab_monitors (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          VARCHAR(50) NOT NULL REFERENCES user_info(user_id) ON DELETE CASCADE,
  endpoint_id      UUID        NOT NULL REFERENCES api_lab_endpoints(id) ON DELETE CASCADE,
  env_id           UUID        NOT NULL REFERENCES api_lab_envs(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  expected_status  INTEGER     NOT NULL DEFAULT 200,
  max_duration_ms  INTEGER     NOT NULL DEFAULT 5000,
  body_includes    TEXT,
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_lab_monitors_user_active
  ON api_lab_monitors(user_id, is_active, updated_at DESC);

-- API Lab 巡检结果
CREATE TABLE IF NOT EXISTS api_lab_monitor_runs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id      UUID        NOT NULL REFERENCES api_lab_monitors(id) ON DELETE CASCADE,
  run_log_id      UUID        NOT NULL REFERENCES api_lab_run_logs(id) ON DELETE CASCADE,
  status_code     INTEGER,
  duration_ms     INTEGER     NOT NULL DEFAULT 0,
  is_passing      BOOLEAN     NOT NULL DEFAULT FALSE,
  failure_reason  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_lab_monitor_runs_monitor_created
  ON api_lab_monitor_runs(monitor_id, created_at DESC);
`;

export async function migrateApiLab(client: PoolClient) {
    await client.query(apiLabMigrationSql);
}
