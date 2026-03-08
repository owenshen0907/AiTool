import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import { pool } from '@/lib/db/client';
import { requirementsSeedTemplates } from '@/lib/requirements';

const REQUIREMENTS_FEATURE = 'requirements';

interface DirectoryRow {
    id: string;
    name: string;
    position: number;
}

interface ContentRow {
    id: string;
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

        if (existingDirectories.length > 0) {
            const targetDirId = existingDirectories[0].id;
            const { rows: existingDocs } = await client.query<ContentRow>(
                `
                    SELECT id
                    FROM requirements_content
                    WHERE directory_id = $1
                    ORDER BY position ASC, created_at ASC
                    LIMIT 1
                `,
                [targetDirId]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                seeded: false,
                dirId: targetDirId,
                docId: existingDocs[0]?.id ?? null,
            });
        }

        const createdDirectories = new Map<string, string>();

        for (const [index, seed] of requirementsSeedTemplates.entries()) {
            const directoryId = uuidv4();
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
                [directoryId, REQUIREMENTS_FEATURE, null, seed.directoryName, index, userId]
            );
            createdDirectories.set(seed.directoryName, directoryId);
        }

        let firstDirId: string | null = null;
        let firstDocId: string | null = null;

        for (const [index, seed] of requirementsSeedTemplates.entries()) {
            const directoryId = createdDirectories.get(seed.directoryName);
            if (!directoryId) {
                throw new Error(`Missing seeded directory: ${seed.directoryName}`);
            }

            if (!firstDirId) {
                firstDirId = directoryId;
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
                [contentId, directoryId, seed.title, seed.summary, seed.body, index, userId]
            );

            if (!firstDocId) {
                firstDocId = contentId;
            }
        }

        await client.query('COMMIT');

        return NextResponse.json({
            seeded: true,
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
