// src/lib/utils/mask.ts
export function maskApiKey(key: string, left = 6, right = 4): string {
    if (!key) return '';
    if (key.length <= left + right + 2) return key; // 短的不脱敏，可按需修改
    return key.slice(0, left) + '*'.repeat(Math.max(4, key.length - left - right)) + key.slice(-right);
}