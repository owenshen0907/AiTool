// src/lib/api/models.ts
import type { Model } from '@/lib/models/model';
import type {
    CreateModelPayload as RepoCreatePayload,
    UpdateModelPayload as RepoUpdatePayload
} from '@/lib/repositories/modelRepository';

/**
 * 获取某供应商下的模型列表
 * @param supplierId 供应商 ID
 */
export async function fetchModels(supplierId: string): Promise<Model[]> {
    const res = await fetch(`/api/models?supplier_id=${supplierId}`);
    if (!res.ok) {
        throw new Error(await res.text());
    }
    return res.json();
}

/**
 * 新增模型
 * @param supplierId 供应商 ID
 * @param payload 创建参数（不含 supplierId）
 */
export async function createModel(
    supplierId: string,
    payload: Omit<RepoCreatePayload, 'supplierId'>
): Promise<Model> {
    const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, ...payload }),
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    return res.json();
}

/**
 * 更新模型
 * @param supplierId 供应商 ID
 * @param id 模型 ID
 * @param updates 更新字段
 */
export async function updateModel(
    supplierId: string,
    id: string,
    updates: RepoUpdatePayload
): Promise<Model> {
    const res = await fetch(`/api/models/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, ...updates }),
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    return res.json();
}

/**
 * 删除模型
 * @param supplierId 供应商 ID
 * @param id 模型 ID
 */
export async function deleteModel(
    supplierId: string,
    id: string
): Promise<void> {
    const res = await fetch(`/api/models/${id}?supplier_id=${supplierId}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
}
