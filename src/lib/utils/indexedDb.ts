import { openDB, IDBPDatabase } from 'idb';
import type { PromptNode, PromptItem } from '@/lib/models/prompt';

const DB_NAME = 'AiTool';
const STORE   = 'prompts';

let _db: IDBPDatabase | null = null;
async function getDb() {
    if (_db) return _db;
    _db = await openDB(DB_NAME, 1, {
        upgrade(db) {
            // 主表：keyPath=id，存 PromptNode & PromptItem
            const store = db.createObjectStore(STORE, { keyPath: 'id' });
            // 给 parentId 建索引，方便按目录拉子项
            store.createIndex('by-parent', 'parentId');
        }
    });
    return _db;
}

/** 读取整个目录（parentId = null）的所有子项，或者指定 parentId 下的子项 */
export async function getAllByParent(parentId: string | null): Promise<PromptNode[]> {
    const db = await getDb();
    // parentId 存为 null or string
    return db.getAllFromIndex(STORE, 'by-parent', parentId);
}

/** 读取单条 Prompt（目录 or 真 Prompt） */
export async function getById(id: string): Promise<PromptItem|PromptNode|null> {
    const db = await getDb();
    return db.get(STORE, id);
}

/** 插入或更新一条 PromptNode / PromptItem */
export async function putOne(item: PromptNode | PromptItem) {
    const db = await getDb();
    await db.put(STORE, item);
    console.log('[IDB] ✅ putOne →', item.id, item);
}

/** 批量写入多条（通常用于首次拉回来的整个列表） */
export async function putMany(items: (PromptNode|PromptItem)[]) {
    const db = await getDb();
    const tx = db.transaction(STORE, 'readwrite');
    for (const item of items) {
        tx.store.put(item);
    }
    await tx.done;
    console.log('[IDB] ✅ putMany →', items.map(i => i.id));
}

/** 删除一条 */
export async function deleteById(id: string) {
    const db = await getDb();
    await db.delete(STORE, id);
    console.log('[IDB] 🗑 deleteById →', id);
}