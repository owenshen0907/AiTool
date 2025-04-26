// lib/api/models.ts
export async function fetchModels(userId: string) {
    return fetch(`/api/models?userId=${userId}`).then(r => r.json());
}

export async function createModel(userId: string, m: any) {
    await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...m }),
    });
}

export async function updateModel(userId: string, id: string, upd: any) {
    await fetch(`/api/models/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...upd }),
    });
}

export async function deleteModel(userId: string, id: string) {
    await fetch(`/api/models/${id}?userId=${userId}`, { method: 'DELETE' });
}