import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import { pool } from '@/lib/db/client';
import {
    getRequirementStatusFromDirectoryName,
    requirementStatusMeta,
    requirementStatuses,
    requirementsSeedTemplates,
    type RequirementStatus,
} from '@/lib/requirements';

const REQUIREMENTS_FEATURE = 'requirements';

interface DirectoryRow {
    id: string;
    name: string;
    position: number;
}

interface ContentRow {
    id: string;
}

function getSeedTemplateByStatus(status: RequirementStatus) {
    return requirementsSeedTemplates.find(
        (seed) => seed.directoryName === requirementStatusMeta[status].directoryName
    );
}

export const POST = withUser(async (_req: NextRequest, userId: string) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows: existingDirectories } = await client.query<DirectoryRow>(
            `
                SELECT id, name, position
                FROM directories
                WHERE feature = $1
                  AND created_by = $2
                ORDER BY position ASC, created_at ASC
            `,
            [REQUIREMENTS_FEATURE, userId]
        );

        const matchedDirectoryByStatus = new Map<RequirementStatus, DirectoryRow>();
        for (const directory of existingDirectories) {
            const status = getRequirementStatusFromDirectoryName(directory.name);
            if (status && !matchedDirectoryByStatus.has(status)) {
                matchedDirectoryByStatus.set(status, directory);
            }
        }

        let seeded = false;
        let normalized = false;
        let firstDirId: string | null = null;
        let firstDocId: string | null = null;

        for (const [index, status] of requirementStatuses.entries()) {
            const expectedName = requirementStatusMeta[status].directoryName;
            const seed = getSeedTemplateByStatus(status);
            const existingDirectory = matchedDirectoryByStatus.get(status);

            let directoryId: string;
            if (existingDirectory) {
                directoryId = existingDirectory.id;
                if (existingDirectory.name !== expectedName || existingDirectory.position !== index) {
                    await client.query(
                        `
                            UPDATE directories
                            SET name = $2,
                                position = $3,
                                updated_at = NOW()
                            WHERE id = $1
                        `,
                        [directoryId, expectedName, index]
                    );
                    normalized = true;
                }
            } else {
                directoryId = uuidv4();
                await client.query(
                    `
                        INSERT INTO directories (
                            id,
                            feature,
                            parent_id,
                            name,
                            position,
                            created_by
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                    `,
                    [directoryId, REQUIREMENTS_FEATURE, null, expectedName, index, userId]
                );
                matchedDirectoryByStatus.set(status, {
                    id: directoryId,
                    name: expectedName,
                    position: index,
                });
                seeded = true;
            }

            if (!firstDirId) {
                firstDirId = directoryId;
            }

            const { rows: existingDocs } = await client.query<ContentRow>(
                `
                    SELECT id
                    FROM requirements_content
                    WHERE directory_id = $1
                    ORDER BY position ASC, created_at ASC
                    LIMIT 1
                `,
                [directoryId]
            );

            if (existingDocs[0]?.id) {
                if (!firstDocId && firstDirId === directoryId) {
                    firstDocId = existingDocs[0].id;
                }
                continue;
            }

            if (!seed) {
                continue;
            }

            const contentId = uuidv4();
            await client.query(
                `
                    INSERT INTO requirements_content (
                        id,
                        directory_id,
                        title,
                        summary,
                        body,
                        position,
                        created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `,
                [contentId, directoryId, seed.title, seed.summary, seed.body, 0, userId]
            );
            if (!firstDocId && firstDirId === directoryId) {
                firstDocId = contentId;
            }
            seeded = true;
        }

        await client.query('COMMIT');

        return NextResponse.json({
            seeded,
            normalized,
            dirId: firstDirId,
            docId: firstDocId,
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('requirements bootstrap failed', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Bootstrap failed',
            },
            { status: 500 }
        );
    } finally {
        client.release();
    }
});
