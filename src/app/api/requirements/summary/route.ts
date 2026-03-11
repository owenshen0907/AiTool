import { NextResponse } from 'next/server';
import * as contentRepo from '@/lib/repositories/contentRepository';
import { pool } from '@/lib/db/client';
import {
    buildRequirementsDocHref,
    computeRequirementFreshness,
    getRequirementPulseSignal,
    getRequirementStatusFromDirectoryName,
    parseRequirementDocPreview,
    requirementStatuses,
    type RequirementFreshness,
    type RequirementsSummaryResponse,
    type RequirementStatus,
} from '@/lib/requirements';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function createEmptyCountByStatus(): Record<RequirementStatus, number> {
    return {
        inbox: 0,
        shaping: 0,
        ready: 0,
        doing: 0,
        validating: 0,
        archived: 0,
    };
}

function createEmptyFreshnessByActiveStatus(): Record<RequirementFreshness, number> {
    return {
        fresh: 0,
        aging: 0,
        stale: 0,
    };
}

function getUpdatedAt(item: Record<string, any>) {
    return item.updatedAt ?? item.updated_at ?? item.createdAt ?? item.created_at ?? '';
}

function getFreshnessRank(freshness: RequirementFreshness | null) {
    if (freshness === 'stale') return 3;
    if (freshness === 'aging') return 2;
    if (freshness === 'fresh') return 1;
    return 0;
}

export async function GET() {
    try {
        const { rows: directories } = await pool.query(
            `SELECT * FROM directories WHERE feature = $1 ORDER BY position`,
            ['requirements'],
        );

        const countByStatus = createEmptyCountByStatus();
        const freshnessByActiveStatus = createEmptyFreshnessByActiveStatus();

        const directoryResults = await Promise.all(
            directories.map(async (directory) => {
                const rawDirectory = directory as Record<string, any>;
                const status = getRequirementStatusFromDirectoryName(rawDirectory.name ?? '');
                if (!status) return null;

                return {
                    directory: rawDirectory,
                    status,
                    items: await contentRepo.listByDirectory('requirements', rawDirectory.id),
                };
            }),
        );

        const allItems = directoryResults.flatMap((result) => {
            if (!result) return [];

            countByStatus[result.status] = result.items.length;

            return result.items.map((item) => {
                const rawItem = item as Record<string, any>;
                const updatedAt = getUpdatedAt(rawItem);
                const preview = parseRequirementDocPreview(rawItem.body);
                const freshness =
                    result.status === 'doing' || result.status === 'validating'
                        ? computeRequirementFreshness(preview.latestHandoffAt, updatedAt)
                        : null;

                if (freshness) {
                    freshnessByActiveStatus[freshness] += 1;
                }

                return {
                    id: rawItem.id,
                    title: rawItem.title,
                    status: result.status,
                    updatedAt,
                    href: buildRequirementsDocHref(result.directory.id, rawItem.id),
                    freshness,
                    signal: getRequirementPulseSignal(
                        result.status,
                        preview,
                        rawItem.summary,
                    ),
                };
            });
        });

        const recentItems = [...allItems]
            .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
            .slice(0, 5);

        const attentionItems = allItems
            .filter((item) => item.status === 'doing' || item.status === 'validating')
            .sort((left, right) => {
                const freshnessDelta =
                    getFreshnessRank(right.freshness) - getFreshnessRank(left.freshness);
                if (freshnessDelta !== 0) {
                    return freshnessDelta;
                }

                return left.updatedAt.localeCompare(right.updatedAt);
            })
            .slice(0, 3);

        const total = requirementStatuses.reduce((sum, s) => sum + countByStatus[s], 0);
        const active = countByStatus.doing + countByStatus.validating;

        const payload: RequirementsSummaryResponse = {
            countByStatus,
            freshnessByActiveStatus,
            total,
            active,
            recentItems,
            attentionItems,
        };

        return NextResponse.json(payload, {
            headers: {
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('requirements summary error', error);
        return NextResponse.json({ error: 'Failed to load summary' }, { status: 500 });
    }
}
