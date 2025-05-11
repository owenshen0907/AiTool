// ================================
// File: src/lib/repositories/promptTestDetailRepository.ts
// 数据访问层（Repository）
// 专门维护 prompt_test_detail 表的 新增 / 查询 / 删除
// ================================
import type { PromptTestDetail } from '@/lib/models/prompt/promptCase';
import { pool } from '@/lib/db/client';

/**
 * prompt_test_detail 相关数据库操作
 */
export const promptTestDetailRepo = {
    /**
     * 查询指定 CaseList 下的全部测试明细（按 test_time 倒序）
     */
    async list(caseListId: string): Promise<PromptTestDetail[]> {
        const { rows } = await pool.query(
            'SELECT * FROM prompt_test_detail WHERE case_list_id = $1 ORDER BY test_time DESC',
            [caseListId],
        );
        return rows;
    },

    /**
     * 新增一条测试明细
     * @param data  不包含 id / testTime（由数据库默认）
     * @returns  插入后的完整行
     */
    async create(
        data: Omit<PromptTestDetail, 'id' | 'testTime'>,
    ): Promise<PromptTestDetail> {
        const { caseListId, modelName, testResult, passed, reason, traceId } = data;
        const { rows } = await pool.query(
            `INSERT INTO prompt_test_detail (
         id, case_list_id, model_name, test_result, passed, reason, trace_id
       ) VALUES (
         gen_random_uuid(), $1, $2, $3, $4, $5, $6
       ) RETURNING *`,
            [caseListId, modelName, testResult, passed, reason ?? null, traceId],
        );
        return rows[0] as PromptTestDetail;
    },

    /**
     * 删除测试明细（按主键）
     */
    async remove(id: string): Promise<void> {
        await pool.query('DELETE FROM prompt_test_detail WHERE id = $1', [id]);
    },
};
