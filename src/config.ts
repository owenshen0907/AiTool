// src/config.ts

function readEnv(...keys: string[]) {
    for (const key of keys) {
        const value = process.env[key]?.trim();
        if (value) {
            return value;
        }
    }

    return '';
}

function readOptionalEnv(keys: string[], placeholders: string[] = []) {
    const value = readEnv(...keys);
    if (!value) return '';
    if (/^\*+$/.test(value)) return '';
    if (placeholders.includes(value)) return '';
    return value;
}

export const UNIFIED_BACKEND_CONFIG = {
    baseUrl:
        readOptionalEnv(['UNIFIED_APP_BACKEND_URL', 'NEXT_PUBLIC_UNIFIED_APP_BACKEND_URL'], [
            'https://your-unified-backend-domain',
        ]) || 'http://localhost:8787',
    googleBaseUrl:
        readOptionalEnv(['UNIFIED_APP_GOOGLE_BACKEND_URL', 'NEXT_PUBLIC_UNIFIED_APP_GOOGLE_BACKEND_URL'], [
            'https://your-google-oauth-backend-domain',
        ]) ||
        readOptionalEnv(['UNIFIED_APP_BACKEND_URL', 'NEXT_PUBLIC_UNIFIED_APP_BACKEND_URL'], [
            'https://your-unified-backend-domain',
        ]) ||
        'http://localhost:8787',
    appCode:
        readOptionalEnv(['UNIFIED_APP_CODE', 'NEXT_PUBLIC_UNIFIED_APP_CODE'], [
            'your_app_code',
        ]) || 'aitool',
    appName:
        readOptionalEnv(['UNIFIED_APP_NAME', 'NEXT_PUBLIC_UNIFIED_APP_NAME'], [
            'your_app_name',
        ]) || 'AiTool 2.0',
    bundleId:
        readOptionalEnv(['UNIFIED_APP_BUNDLE_ID', 'NEXT_PUBLIC_UNIFIED_APP_BUNDLE_ID'], [
            'your_bundle_id',
        ]) || 'top.owenshen.aitool',
};
