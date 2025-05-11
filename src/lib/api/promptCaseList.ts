// src/lib/api/promptCaseList.ts
// ----------------------------------
// 前端调用封装：Prompt CaseList & Image
// ----------------------------------
import type { PromptCaseList, PromptCaseImage } from '@/lib/models/prompt/promptCase';

const BASE = '/api/prompt/case/list';

/** 将 Response 转为 JSON 或抛错 */
async function asJson<T>(resp: Response): Promise<T> {
    if (!resp.ok) throw new Error(await resp.text());
    return (resp.status === 204
        ? (undefined as unknown as T)
        : await resp.json()) as T;
}

/** camelCase ↔ snake_case 工具（保持不动）*/
function toSnake(obj: Record<string, any>) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
        const snake = k.replace(/[A-Z]/g, s => '_' + s.toLowerCase());
        out[snake] = v;
    }
    return out;
}

function log(tag: string, payload: any) {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[promptCaseApi.${tag}]`, payload);
    }
}

export const promptCaseApi = {
    /** 1. 映射 snake_case → camelCase */
    async list(contentId: string): Promise<PromptCaseList[]> {
        const resp = await fetch(`${BASE}?content_id=${contentId}`);
        const data = (await asJson<any[]>(resp)) ?? [];
        return data.map(r => ({
            id:            r.id,
            caseContentId: r.case_content_id,
            seq:           r.seq,
            caseText:      r.case_text,
            groundTruth:   r.ground_truth,
            createdBy:     r.created_by,
            createdAt:     r.created_at,
            updatedAt:     r.updated_at,
        }));
    },

    /** 2. 新建 Case */
    create(payload: Omit<PromptCaseList, 'id' | 'createdAt' | 'updatedAt'>) {
        const body = JSON.stringify(toSnake(payload));
        log('create', JSON.parse(body));
        return fetch(BASE, {
            method:  'POST',
            headers: {'Content-Type':'application/json'},
            body,
        }).then(asJson<PromptCaseList>);
    },

    /** 3. 更新 Case */
    update(id: string, patch: Partial<PromptCaseList>) {
        const body = JSON.stringify({ id, ...toSnake(patch) });
        log('update', JSON.parse(body));
        return fetch(BASE, {
            method:  'PUT',
            headers: {'Content-Type':'application/json'},
            body,
        }).then(asJson<void>);
    },

    /** 4. 删除 */
    remove(id: string) {
        log('remove', { id });
        return fetch(`${BASE}?id=${id}`, { method: 'DELETE' }).then(asJson<void>);
    },

    /** 5. 排序 */
    reorder(contentId: string, ids: string[]) {
        const bodyObj = { content_id: contentId, ordered_ids: ids };
        log('reorder', bodyObj);
        return fetch(BASE, {
            method:  'PATCH',
            headers: {'Content-Type':'application/json'},
            body:    JSON.stringify(bodyObj),
        }).then(asJson<void>);
    },

    /* ----- prompt_case_image 同理 ----- */
    listImages(caseListId: string) {
        return fetch(`${BASE}/${caseListId}/image`).then(asJson<PromptCaseImage[]>);
    },
    addImage(caseListId: string, url: string, position: number) {
        const body = JSON.stringify({ url, position });
        log('addImage', { caseListId, url, position });
        return fetch(`${BASE}/${caseListId}/image`, {
            method:  'POST',
            headers: {'Content-Type':'application/json'},
            body,
        }).then(asJson<void>);
    },
    removeImage(imgId: string) {
        log('removeImage', { imgId });
        return fetch(`${BASE}/image/${imgId}`, { method:'DELETE' }).then(asJson<void>);
    },
};