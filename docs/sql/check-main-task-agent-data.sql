-- Pre-flight checks for the retired MainTask Agent / dev-task module.
-- Run this before executing remove-main-task-agent.sql.

BEGIN;

CREATE TEMP TABLE _main_task_agent_counts (
    table_name TEXT PRIMARY KEY,
    row_count BIGINT,
    exists_in_db BOOLEAN NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE _main_task_agent_directory_features (
    feature TEXT,
    content_count BIGINT
) ON COMMIT DROP;

DO $$
DECLARE
    table_name TEXT;
    row_count BIGINT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'dev_tasks',
        'dev_task_revision',
        'dev_task_claim',
        'dev_task_event',
        'dev_task_tuning_request',
        'dev_task_command',
        'dev_journal_content'
    ]
    LOOP
        IF to_regclass(format('public.%I', table_name)) IS NULL THEN
            INSERT INTO _main_task_agent_counts (table_name, row_count, exists_in_db)
            VALUES (table_name, 0, FALSE);
        ELSE
            EXECUTE format('SELECT COUNT(*) FROM public.%I', table_name) INTO row_count;
            INSERT INTO _main_task_agent_counts (table_name, row_count, exists_in_db)
            VALUES (table_name, row_count, TRUE);
        END IF;
    END LOOP;
END;
$$;

SELECT table_name, row_count, exists_in_db
FROM _main_task_agent_counts
ORDER BY table_name;

DO $$
BEGIN
    IF to_regclass('public.dev_journal_content') IS NOT NULL
       AND to_regclass('public.directories') IS NOT NULL THEN
        RAISE NOTICE 'Directory feature summary follows.';
        EXECUTE $sql$
            INSERT INTO _main_task_agent_directory_features (feature, content_count)
            SELECT d.feature, COUNT(*) AS content_count
            FROM public.dev_journal_content c
            JOIN public.directories d
                ON d.id = c.directory_id
            GROUP BY d.feature
            ORDER BY content_count DESC, d.feature ASC
        $sql$;
    ELSE
        RAISE NOTICE 'Skip directory feature summary because dev_journal_content or directories is missing.';
    END IF;
END;
$$;

SELECT feature, content_count
FROM _main_task_agent_directory_features
ORDER BY content_count DESC, feature ASC;

SELECT feature, COUNT(*) AS directory_count
FROM public.directories
WHERE feature = 'dev_journal'
GROUP BY feature
ORDER BY feature ASC;

SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
   AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
      'dev_tasks',
      'dev_task_revision',
      'dev_task_claim',
      'dev_task_event',
      'dev_task_tuning_request',
      'dev_task_command',
      'dev_journal_content'
  )
ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;

COMMIT;
