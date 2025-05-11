// ================================
// File: src/lib/services/promptTestDetailService.ts
// --------------------------------
// 专注 prompt_test_detail 表
// 功能：新增 / 查询 / 删除
// ================================
import { promptTestDetailRepo } from '../repositories/promptTestDetailRepository';
import type { PromptTestDetail } from '@/lib/models/prompt/promptCase';

export const promptTestService = {
    /** 按 caseListId 查询全部测试结果 */
    list(caseListId: string) {
        return promptTestDetailRepo.list(caseListId);
    },

    /** 新增一条测试明细 */
    create(payload: Omit<PromptTestDetail, 'id' | 'testTime'>) {
        // TODO: 在此可做输入校验，例如模型名合法性等
        return promptTestDetailRepo.create(payload);
    },

    /** 删除 */
    delete(id: string) {
        return promptTestDetailRepo.remove(id);
    },
};