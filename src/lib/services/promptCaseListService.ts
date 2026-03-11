// ================================
// File: src/lib/services/promptCaseListService.ts
// --------------------------------
// 业务层 (Service)
// 1. 封装 promptCaseListRepo 与 promptCaseImageRepo
// 2. 可在此加入事务、校验、权限判断等横切逻辑
// 3. 对外暴露易用的函数供 route / controller / 前端调用
// ================================
import {
    promptCaseListRepo,
    promptCaseImageRepo,
} from '../repositories/promptCaseListRepository';
import { getPromptCaseContentById } from '../repositories/promptCaseContentRepository';
import type { PromptCaseList } from '@/lib/models/prompt/promptCase';

export const promptCaseService = {
    /** 查询指定 case_content 下的所有 CaseList */
    list(contentId: string) {
        return promptCaseListRepo.listByContent(contentId);
    },

    /** 新建 CaseList（不含图片）*/
    async create(data: Omit<PromptCaseList, 'id' | 'createdAt' | 'updatedAt'>, userId?: string) {
        if (userId) {
            const caseContent = await getPromptCaseContentById(data.caseContentId);
            if (!caseContent || (caseContent as any).created_by !== userId) {
                throw new Error('Forbidden: case content does not belong to this user');
            }
        }

        const existing = await promptCaseListRepo.listByContent(data.caseContentId);
        const seqExists = existing.some((item) => (item as any).seq === data.seq);
        if (seqExists) {
            throw new Error(`Duplicate seq: ${data.seq} already exists in this case content`);
        }

        return promptCaseListRepo.create(data);
    },

    /** 部分更新（title / groundTruth / seq …）*/
    update(id: string, patch: Partial<PromptCaseList>) {
        return promptCaseListRepo.update(id, patch);
    },

    /** 删除 */
    delete(id: string) {
        return promptCaseListRepo.remove(id);
    },

    /** 重排 seq */
    reorder(contentId: string, orderedIds: string[]) {
        return promptCaseListRepo.reorder(contentId, orderedIds);
    },

    /* -------- 图片 -------- */
    addImage(caseListId: string, url: string, pos: number) {
        return promptCaseImageRepo.add(caseListId, url, pos);
    },
    deleteImage(id: string) {
        return promptCaseImageRepo.remove(id);
    },
};