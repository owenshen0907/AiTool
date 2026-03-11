-- Destructive cleanup for the retired MainTask Agent / dev-task module.
-- Run this manually against an existing database after taking a backup.

BEGIN;

ALTER TABLE IF EXISTS public.dev_tasks
    DROP CONSTRAINT IF EXISTS dev_tasks_current_revision_id_fkey;

DROP TABLE IF EXISTS public.dev_task_command;
DROP TABLE IF EXISTS public.dev_task_tuning_request;
DROP TABLE IF EXISTS public.dev_task_event;
DROP TABLE IF EXISTS public.dev_task_claim;
DROP TABLE IF EXISTS public.dev_task_revision;
DROP TABLE IF EXISTS public.dev_tasks;
DROP TABLE IF EXISTS public.dev_journal_content;
DELETE FROM public.directories WHERE feature = 'dev_journal';

COMMIT;

-- Optional follow-up:
-- Restore backups from docs/sql/backups/ if you need to roll back the cleanup.
