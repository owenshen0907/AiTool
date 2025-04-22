// indexdb.ts
export function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("chatDB", 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains("cache")) {
                db.createObjectStore("cache");
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getChatMessages(): Promise<any | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("cache", "readonly");
        const store = tx.objectStore("cache");
        const req = store.get("chatMessages");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function setChatMessages(messages: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("cache", "readwrite");
        const store = tx.objectStore("cache");
        const req = store.put(messages, "chatMessages");
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}