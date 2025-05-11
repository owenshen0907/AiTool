// ================================
// File: src/lib/repositories/promptCaseListRepository.ts
// 仅负责 prompt_case_list / prompt_case_image
// ================================
import type { PromptCaseList, PromptCaseImage } from '@/lib/models/prompt/promptCase';
import { pool } from '@/lib/db/client';



export const promptCaseListRepo = {
    async listByContent(contentId: string): Promise<PromptCaseList[]> {
        const { rows } = await pool.query(
            'SELECT * FROM prompt_case_list WHERE case_content_id = $1 ORDER BY seq',
            [contentId],
        );
        return rows;
    },
    async create(data: Omit<PromptCaseList, 'id' | 'createdAt' | 'updatedAt'>) {
        const { caseContentId, seq, caseText, groundTruth } = data;
        const { rows } = await pool.query(
            `INSERT INTO prompt_case_list(id, case_content_id, seq, case_text, ground_truth)
             VALUES(gen_random_uuid(), $1, $2, $3, $4) RETURNING *`,
            [caseContentId, seq, caseText, groundTruth],
        );
        return rows[0] as PromptCaseList;
    },
    async update(id: string, patch: Partial<PromptCaseList>) {
        const keys = Object.keys(patch);
        if (!keys.length) return;
        const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const values = keys.map(k => (patch as any)[k]);
        values.push(id);
        await pool.query(`UPDATE prompt_case_list SET ${sets}, updated_at = NOW() WHERE id = $${keys.length + 1}`, values);
    },
    async remove(id: string) {
        await pool.query('DELETE FROM prompt_case_list WHERE id = $1', [id]);
    },
    async reorder(contentId: string, ids: string[]) {
        await pool.query('BEGIN');
        for (let i = 0; i < ids.length; i++) {
            await pool.query('UPDATE prompt_case_list SET seq=$1 WHERE id=$2 AND case_content_id=$3', [i + 1, ids[i], contentId]);
        }
        await pool.query('COMMIT');
    },
};

export const promptCaseImageRepo = {
    async list(caseListId: string): Promise<PromptCaseImage[]> {
        const { rows } = await pool.query(
            'SELECT * FROM prompt_case_image WHERE case_list_id=$1 ORDER BY position',
            [caseListId],
        );
        return rows;
    },
    async add(caseListId: string, url: string, position: number) {
        await pool.query(
            'INSERT INTO prompt_case_image(id, case_list_id, image_url, position) VALUES(gen_random_uuid(), $1,$2,$3)',
            [caseListId, url, position],
        );
    },
    async remove(id: string) {
        await pool.query('DELETE FROM prompt_case_image WHERE id=$1', [id]);
    },
};