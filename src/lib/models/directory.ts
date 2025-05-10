// File: src/lib/models/directory.ts
// export interface DirectoryItem {
//     id: string;
//     feature: string;
//     parentId: string | null;
//     name: string;
//     position: number;
//     createdBy: string;
//     createdAt: string;
//     updatedAt: string;
// }
export interface DirectoryItem {
    /** 目录自身 ID */
    id: string;

    /** 父目录 ID，根目录为 null */
    parentId: string | null;

    /** 显示名称 */
    name: string;

    /** 同级排序索引 */
    position: number;

    /* ---------- 以下字段目前前端未用到，设为可选 ---------- */
    feature?: string;
    createdBy?: string;
    createdAt?: string;   // ISO-string / Date，视后端返回而定
    updatedAt?: string;
}