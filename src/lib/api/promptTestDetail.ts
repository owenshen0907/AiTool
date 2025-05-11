// ================================
// File: src/lib/api/promptTestDetail.ts
// ------------------------------------
// 前端调用封装：prompt_test_detail
// ================================
import type { PromptTestDetail } from '@/lib/models/prompt/promptCase';

const BASE_T = '/api/prompt/case/test';

/**
 * 通用 JSON helper
 */
async function json<T>(resp: Response): Promise<T> {
    if (!resp.ok) throw new Error(await resp.text());
    return (resp.status === 204 ? (null as unknown as T) : await resp.json()) as T;
}

export const promptTestApi = {
    /** 查询测试明细 */
    list(caseListId: string) {
        return fetch(`${BASE_T}?case_list_id=${caseListId}`).then(json<PromptTestDetail[]>);
    },
    /** 新增测试明细 */
    create(payload: Omit<PromptTestDetail, 'id' | 'testTime'>) {
        return fetch(BASE_T, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).then(json<PromptTestDetail>);
    },
    /** 删除 */
    remove(id: string) {
        return fetch(`${BASE_T}?id=${id}`, { method: 'DELETE' }).then(json<void>);
    },
};
