import { pool } from '@/lib/db/client';
import type { GoodCaseItem, BadCaseItem } from '@/lib/models/prompt/prompt';

// -------- Good Cases --------

export async function listGoodCases(promptId: string): Promise<GoodCaseItem[]> {
    const res = await pool.query<GoodCaseItem>(
        'SELECT * FROM prompt_good_cases WHERE prompt_id = $1 ORDER BY position',
        [promptId]
    );
    return res.rows;
}

export async function insertGoodCases(
    promptId: string,
    items: Partial<GoodCaseItem>[],
    // userId: string
): Promise<GoodCaseItem[]> {
    const created: GoodCaseItem[] = [];
    for (const it of items) {
        const {
            user_input = '',
            expected = '',
            images = [],
            audios = [],
            videos = [],
            position = 0,
            notes = null,
        } = it;
        const res = await pool.query<GoodCaseItem>(
            `
                INSERT INTO prompt_good_cases
                (prompt_id, user_input, expected, images, audios, videos, position, notes, created_at, updated_at)
                VALUES
                    ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                    RETURNING *
            `,
            [
                promptId,
                user_input,
                expected,
                images,
                audios,
                videos,
                position,
                notes,
            ]
        );
        created.push(res.rows[0]);
    }
    return created;
}

export async function updateGoodCases(
    items: Partial<GoodCaseItem>[],
    // userId: string
): Promise<GoodCaseItem[]> {
    const updated: GoodCaseItem[] = [];
    for (const it of items) {
        const { id, ...rest } = it;
        if (!id) continue;
        const sets: string[] = [];
        const vals: any[] = [];
        let idx = 1;
        for (const [key, val] of Object.entries(rest)) {
            // skip metadata fields
            if (['created_at', 'updated_at', 'created_by'].includes(key)) {
                continue;
            }
            if (val !== undefined) {
                sets.push(`${key} = $${idx}`);
                vals.push(val);
                idx++;
            }
        }
        // always update updated_at
        sets.push('updated_at = NOW()');
        vals.push(id);
        const sql = `UPDATE prompt_good_cases SET ${sets.join(', ')} WHERE id = $${idx}`;
        await pool.query(sql, vals);

        const res = await pool.query<GoodCaseItem>(
            'SELECT * FROM prompt_good_cases WHERE id = $1',
            [id]
        );
        updated.push(res.rows[0]);
    }
    return updated;
}

export async function deleteGoodCases(ids: string[]): Promise<void> {
    await pool.query(
        'DELETE FROM prompt_good_cases WHERE id = ANY($1)',
        [ids]
    );
}

// -------- Bad Cases --------

export async function listBadCases(promptId: string): Promise<BadCaseItem[]> {
    const res = await pool.query<BadCaseItem>(
        'SELECT * FROM prompt_bad_cases WHERE prompt_id = $1 ORDER BY position',
        [promptId]
    );
    return res.rows;
}

export async function insertBadCases(
    promptId: string,
    items: Partial<BadCaseItem>[],
    // userId: string
): Promise<BadCaseItem[]> {
    const created: BadCaseItem[] = [];
    for (const it of items) {
        const {
            user_input = '',
            bad_output = '',
            expected = '',
            images = [],
            audios = [],
            videos = [],
            position = 0,
            error_type = null,
            notes = null,
        } = it;
        const res = await pool.query<BadCaseItem>(
            `
                INSERT INTO prompt_bad_cases
                (prompt_id, user_input, bad_output, expected,
                 images, audios, videos, position, error_type, notes,
                 created_at, updated_at)
                VALUES
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                    RETURNING *
            `,
            [
                promptId,
                user_input,
                bad_output,
                expected,
                images,
                audios,
                videos,
                position,
                error_type,
                notes,
            ]
        );
        created.push(res.rows[0]);
    }
    return created;
}

export async function updateBadCases(
    items: Partial<BadCaseItem>[],
    // userId: string
): Promise<BadCaseItem[]> {
    const updated: BadCaseItem[] = [];
    for (const it of items) {
        const { id, ...rest } = it;
        if (!id) continue;
        const sets: string[] = [];
        const vals: any[] = [];
        let idx = 1;
        for (const [key, val] of Object.entries(rest)) {
            if (['created_at', 'updated_at', 'created_by'].includes(key)) {
                continue;
            }
            if (val !== undefined) {
                sets.push(`${key} = $${idx}`);
                vals.push(val);
                idx++;
            }
        }
        sets.push('updated_at = NOW()');
        vals.push(id);
        const sql = `UPDATE prompt_bad_cases SET ${sets.join(', ')} WHERE id = $${idx}`;
        await pool.query(sql, vals);

        const res = await pool.query<BadCaseItem>(
            'SELECT * FROM prompt_bad_cases WHERE id = $1',
            [id]
        );
        updated.push(res.rows[0]);
    }
    return updated;
}

export async function deleteBadCases(ids: string[]): Promise<void> {
    await pool.query(
        'DELETE FROM prompt_bad_cases WHERE id = ANY($1)',
        [ids]
    );
}
