// helpers/is-file.ts
export function isFileLike(v: FormDataEntryValue): v is File {
    /* 1️⃣ 若运行时已提供 File 构造器（浏览器 / Node 实验） */
    if (typeof (globalThis as any).File === 'function') {
        return v instanceof (globalThis as any).File;
    }
    /* 2️⃣ Edge-Runtime fallback —— 判断是否满足 Blob 特征且带 name、type 字段 */
    return (
        typeof v === 'object' &&
        v !== null &&
        // @ts-ignore  —— FormDataEntryValue 其实可能是 Blob
        typeof (v as any).arrayBuffer === 'function' &&
        typeof (v as any).name === 'string'
    );
}