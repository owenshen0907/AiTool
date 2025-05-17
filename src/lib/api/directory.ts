// src/lib/api/directory.ts
//------------------------------------------------------------
// 前端调用 “/api/directory” 的统一封装
//------------------------------------------------------------
import type { DirectoryItem } from '@/lib/models/directory';

interface RawDir {
    id: string;
    parent_id: string | null;
    name: string;
    position: number;
}

const JSON_HEADER = { 'Content-Type': 'application/json' } as const;

/** snake_case → camelCase */
const mapDir = (raw: RawDir): DirectoryItem => ({
    id: raw.id,
    parentId: raw.parent_id,
    name: raw.name,
    position: raw.position,
});

/*───────────────────────────────────────────────────────────*/
/* 查询                                                         */
/*───────────────────────────────────────────────────────────*/

/** 列出指定 feature 的目录；若传 parentId ⇒ 仅列出子级 */
export async function fetchDirectories(
    feature: string,
    parentId?: string | null
): Promise<DirectoryItem[]> {
    const qs = new URLSearchParams({ feature });
    if (parentId !== undefined) qs.set('parent_id', parentId ?? '');
    const res   = await fetch(`/api/directory?${qs.toString()}`);
    if (!res.ok) throw new Error(`fetchDirectories ${res.status}`);
    const raws: RawDir[] = await res.json();
    return raws.map(mapDir);
}

/*───────────────────────────────────────────────────────────*/
/* 新建 / 更新 / 删除 / 排序                                    */
/*───────────────────────────────────────────────────────────*/

/** 新建目录（parentId 可为空 = 根目录） */
export async function createDirectoryApi(
    feature: string,
    parentId: string | undefined,
    name: string
): Promise<DirectoryItem> {
    const res = await fetch('/api/directory', {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify({ feature, parent_id: parentId, name }),
    });
    if (!res.ok) throw new Error(`createDirectory ${res.status}`);
    return mapDir(await res.json());
}

/** 重命名 / 修改 parentId（只用到 name 时就传 name） */
export async function updateDirectoryApi(
    id: string,
    name?: string,
    parentId?: string | null
): Promise<DirectoryItem> {
    const body: Record<string, any> = { id };
    if (name !== undefined)     body.name       = name;
    if (parentId !== undefined) body.parent_id  = parentId;
    const res = await fetch('/api/directory', {
        method: 'PUT',
        headers: JSON_HEADER,
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`updateDirectory ${res.status}`);
    return mapDir(await res.json());
}

/** 删除目录（级联由后端决定） */
// export async function deleteDirectoryApi(id: string): Promise<void> {
//     const res = await fetch(`/api/directory?id=${id}`, { method: 'DELETE' });
//     if (!res.ok) throw new Error(`deleteDirectory ${res.status}`);
// }
export async function deleteDirectoryApi(id: string): Promise<void> {
    const res = await fetch(`/api/directory?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
        return;
    }

    // 默认的 fallback message
    let errorMsg = `删除失败（${res.status}）`;

    // 尝试从 JSON 里拿到后端的 error 字段
    try {
        const data = await res.json();
        if (data?.error) {
            errorMsg = data.error;
        }
    } catch {
        // 解析失败就用默认
    }

    throw new Error(errorMsg);
}
/** 同级目录排序 */
export async function reorderDirectoriesApi(
    feature: string,
    parentId: string | null,
    orderedIds: string[]
): Promise<void> {
    const res = await fetch('/api/directory', {
        method: 'PATCH',
        headers: JSON_HEADER,
        body: JSON.stringify({
            feature,
            parent_id: parentId,
            ordered_ids: orderedIds,
        }),
    });
    if (!res.ok) throw new Error(`reorderDirectories ${res.status}`);
}