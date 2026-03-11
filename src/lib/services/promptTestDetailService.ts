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
        const modelName = payload.modelName?.trim();
        if (!modelName || modelName.length > 200 || !/^[\w./:@-]+$/.test(modelName)) {
            throw new Error('Invalid model name: must be 1-200 chars of alphanumeric, dots, slashes, colons, hyphens, or underscores');
        }
        return promptTestDetailRepo.create({ ...payload, modelName });
    },

    /** 删除 */
    delete(id: string) {
        return promptTestDetailRepo.remove(id);
    },
};