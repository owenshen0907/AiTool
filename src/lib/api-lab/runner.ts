import { Buffer } from 'node:buffer';
import {
    createApiLabRunLog,
    getApiLabEndpointById,
    getApiLabEnvById,
} from '@/lib/repositories/apiLabRepository';
import type {
    ApiLabEndpoint,
    ApiLabEnv,
    ApiLabRunResult,
    JsonObject,
    JsonValue,
} from '@/lib/models/apiLab';

const MAX_LOG_TEXT_LENGTH = 200_000;
const MAX_LOG_BINARY_LENGTH = 350_000;

export interface ExecuteApiLabRequest {
    userId: string;
    endpointId: string;
    envId: string;
    bodyOverrides?: JsonObject;
    queryOverrides?: JsonObject;
    headerOverrides?: JsonObject;
    uploadedFile?: File | null;
}

function ensureJsonObject(value: JsonObject | undefined): JsonObject {
    return value ?? {};
}

function toStringValue(value: JsonValue): string {
    if (value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
}

function toHeaderRecord(...sources: JsonObject[]): Record<string, string> {
    const headers: Record<string, string> = {};

    for (const source of sources) {
        for (const [key, value] of Object.entries(source)) {
            if (value === undefined || value === null) {
                continue;
            }
            headers[key] = toStringValue(value);
        }
    }

    return headers;
}

function mergeJsonObjects(...sources: JsonObject[]): JsonObject {
    const merged: JsonObject = {};

    for (const source of sources) {
        for (const [key, value] of Object.entries(source)) {
            merged[key] = value;
        }
    }

    return merged;
}

function trimTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '');
}

function toWebsocketBaseUrl(value: string): string {
    if (value.startsWith('ws://') || value.startsWith('wss://')) {
        return value;
    }

    if (value.startsWith('https://')) {
        return value.replace(/^https:\/\//, 'wss://');
    }

    if (value.startsWith('http://')) {
        return value.replace(/^http:\/\//, 'ws://');
    }

    return value;
}

function normalizePath(path: string): string {
    return path.startsWith('/') ? path : `/${path}`;
}

function buildUrl(baseUrl: string, path: string, query: JsonObject): string {
    const url = new URL(`${trimTrailingSlash(baseUrl)}${normalizePath(path)}`);

    Object.entries(query).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
            return;
        }

        if (Array.isArray(value)) {
            value.forEach((item) => url.searchParams.append(key, toStringValue(item)));
            return;
        }

        url.searchParams.set(key, toStringValue(value));
    });

    return url.toString();
}

function applyAuth(headers: Record<string, string>, endpoint: ApiLabEndpoint, env: ApiLabEnv) {
    if (!env.apiKey) {
        return;
    }

    if (endpoint.authType === 'bearer') {
        headers[endpoint.authHeaderName || 'Authorization'] = `Bearer ${env.apiKey}`;
        return;
    }

    if (endpoint.authType === 'x-api-key') {
        headers[endpoint.authHeaderName || 'x-api-key'] = env.apiKey;
        return;
    }

    if (endpoint.authType === 'custom' && endpoint.authHeaderName) {
        headers[endpoint.authHeaderName] = env.apiKey;
    }
}

function shellQuote(value: string): string {
    return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function stringifyJson(value: JsonObject): string {
    return JSON.stringify(value, null, 2);
}

function truncateForLog(value: string | null, maxLength: number): string | null {
    if (!value || value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength)}\n...<truncated>`;
}

function guessOutputFileName(endpoint: ApiLabEndpoint, bodyPayload: JsonObject): string {
    if (endpoint.responseType === 'audio') {
        const format = typeof bodyPayload.response_format === 'string' ? bodyPayload.response_format : 'mp3';
        return `response.${format}`;
    }

    if (endpoint.responseType === 'binary') {
        return 'response.bin';
    }

    return 'response.out';
}

function buildCurlCommand(params: {
    endpoint: ApiLabEndpoint;
    url: string;
    headers: Record<string, string>;
    bodyPayload: JsonObject;
    fileName: string | null;
}): string {
    const { endpoint, url, headers, bodyPayload, fileName } = params;
    const parts: string[] = ['curl', '--location', shellQuote(url), '--request', endpoint.method];

    Object.entries(headers).forEach(([key, value]) => {
        if (endpoint.contentType === 'multipart/form-data' && key.toLowerCase() === 'content-type') {
            return;
        }
        parts.push('--header', shellQuote(`${key}: ${value}`));
    });

    if (endpoint.contentType === 'application/json' && endpoint.method !== 'GET') {
        parts.push('--data-raw', shellQuote(JSON.stringify(bodyPayload)));
    }

    if (endpoint.contentType === 'application/x-www-form-urlencoded' && endpoint.method !== 'GET') {
        const search = new URLSearchParams();
        Object.entries(bodyPayload).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                return;
            }
            search.set(key, toStringValue(value));
        });
        parts.push('--data-urlencode', shellQuote(search.toString()));
    }

    if (endpoint.contentType === 'multipart/form-data') {
        Object.entries(bodyPayload).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                return;
            }
            parts.push('--form', shellQuote(`${key}=${toStringValue(value)}`));
        });
        if (fileName) {
            const fieldName = endpoint.fileFieldName || 'file';
            parts.push('--form', shellQuote(`${fieldName}=@${fileName}`));
        }
    }

    if (endpoint.responseType === 'audio' || endpoint.responseType === 'binary') {
        parts.push('--output', shellQuote(guessOutputFileName(endpoint, bodyPayload)));
    }

    return parts.join(' ');
}

function normalizeResponseText(value: string): string {
    try {
        const parsed = JSON.parse(value) as unknown;
        return JSON.stringify(parsed, null, 2);
    } catch {
        return value;
    }
}

async function readResponseBody(
    response: Response,
    endpoint: ApiLabEndpoint,
): Promise<{ body: string | null; bodyFormat: ApiLabRunResult['responseBodyFormat'] }> {
    const contentType = response.headers.get('content-type') || '';

    if (response.status === 204) {
        return { body: null, bodyFormat: 'empty' };
    }

    if (
        endpoint.responseType === 'audio' ||
        endpoint.responseType === 'binary' ||
        contentType.startsWith('audio/') ||
        contentType.includes('application/octet-stream')
    ) {
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
            return { body: null, bodyFormat: 'empty' };
        }
        return {
            body: Buffer.from(arrayBuffer).toString('base64'),
            bodyFormat: 'base64',
        };
    }

    const text = await response.text();
    if (!text) {
        return { body: null, bodyFormat: 'empty' };
    }

    if (endpoint.responseType === 'sse' || contentType.includes('text/event-stream')) {
        return { body: text, bodyFormat: 'sse' };
    }

    if (contentType.includes('application/json') || endpoint.responseType === 'json') {
        return { body: normalizeResponseText(text), bodyFormat: 'json' };
    }

    return { body: text, bodyFormat: 'text' };
}

function responseHeadersToObject(headers: Headers): JsonObject {
    const result: JsonObject = {};
    headers.forEach((value, key) => {
        result[key] = value;
    });
    return result;
}

export async function executeApiLabRequest(
    params: ExecuteApiLabRequest,
): Promise<ApiLabRunResult> {
    const { userId, endpointId, envId, uploadedFile } = params;
    const endpoint = await getApiLabEndpointById(userId, endpointId);
    const env = await getApiLabEnvById(userId, envId);

    if (!endpoint) {
        throw new Error('接口不存在或无权限。');
    }
    if (!env) {
        throw new Error('环境不存在或无权限。');
    }
    if (!env.baseUrl) {
        throw new Error('当前环境缺少 Base URL。');
    }
    if (endpoint.method === 'WS') {
        const wsBaseUrl = env.websocketUrl || toWebsocketBaseUrl(env.baseUrl);
        if (!wsBaseUrl) {
            throw new Error('当前环境缺少 WebSocket URL。');
        }
        throw new Error('当前版本暂不支持在页面内直接执行 WebSocket 接口，请复制预览命令后用 wscat 或业务客户端连接。');
    }
    if (endpoint.authType !== 'none' && !env.apiKey) {
        throw new Error('当前环境缺少 API Key，请先补充。');
    }

    const bodyPayload = mergeJsonObjects(endpoint.requestTemplate, ensureJsonObject(params.bodyOverrides));
    const queryPayload = mergeJsonObjects(endpoint.queryTemplate, ensureJsonObject(params.queryOverrides));
    const headers = toHeaderRecord(env.extraHeaders, endpoint.headerTemplate, ensureJsonObject(params.headerOverrides));
    applyAuth(headers, endpoint, env);

    const requestUrl = buildUrl(env.baseUrl, endpoint.path, queryPayload);
    const requestFiles: JsonObject = {};
    let requestBodyLog: string | null = null;
    let fetchBody: BodyInit | undefined;

    if (endpoint.contentType === 'application/json') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        const compact = JSON.stringify(bodyPayload);
        fetchBody = compact;
        requestBodyLog = stringifyJson(bodyPayload);
    }

    if (endpoint.contentType === 'application/x-www-form-urlencoded') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/x-www-form-urlencoded';
        const searchParams = new URLSearchParams();
        Object.entries(bodyPayload).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return;
            }
            searchParams.set(key, toStringValue(value));
        });
        fetchBody = searchParams;
        requestBodyLog = searchParams.toString();
    }

    if (endpoint.contentType === 'multipart/form-data') {
        const formData = new FormData();
        Object.entries(bodyPayload).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
                return;
            }
            formData.append(key, toStringValue(value));
        });
        if (uploadedFile) {
            const fieldName = endpoint.fileFieldName || 'file';
            formData.append(fieldName, uploadedFile, uploadedFile.name);
            requestFiles[fieldName] = uploadedFile.name;
        }
        delete headers['Content-Type'];
        delete headers['content-type'];
        fetchBody = formData;
        requestBodyLog = stringifyJson(bodyPayload);
    }

    const curlCommand = buildCurlCommand({
        endpoint,
        url: requestUrl,
        headers,
        bodyPayload,
        fileName: uploadedFile?.name ?? null,
    });

    const startedAt = Date.now();
    let responseStatus: number | null = null;
    let responseHeaders: JsonObject = {};
    let responseBody: string | null = null;
    let responseBodyFormat: ApiLabRunResult['responseBodyFormat'] = 'empty';
    let errorMessage: string | null = null;
    let ok = false;

    try {
        const response = await fetch(requestUrl, {
            method: endpoint.method,
            headers,
            body: endpoint.method === 'GET' ? undefined : fetchBody,
            signal: AbortSignal.timeout(env.timeoutMs || 30000),
        });
        responseStatus = response.status;
        responseHeaders = responseHeadersToObject(response.headers);
        const body = await readResponseBody(response, endpoint);
        responseBody = body.body;
        responseBodyFormat = body.bodyFormat;
        ok = response.ok;
        if (!response.ok) {
            errorMessage = `Upstream returned ${response.status}`;
        }
    } catch (error) {
        errorMessage = error instanceof Error ? error.message : String(error);
    }

    const durationMs = Date.now() - startedAt;
    const log = await createApiLabRunLog(userId, {
        endpointId,
        envId,
        requestUrl,
        requestMethod: endpoint.method,
        requestHeaders: headers,
        requestQuery: queryPayload,
        requestBody: truncateForLog(requestBodyLog, MAX_LOG_TEXT_LENGTH),
        requestFiles,
        curlCommand,
        responseStatus,
        responseHeaders,
        responseBody:
            responseBodyFormat === 'base64'
                ? truncateForLog(responseBody, MAX_LOG_BINARY_LENGTH)
                : truncateForLog(responseBody, MAX_LOG_TEXT_LENGTH),
        responseBodyFormat,
        durationMs,
        isSuccess: ok,
        errorMessage,
    });

    return {
        ok,
        status: responseStatus,
        durationMs,
        requestUrl,
        requestMethod: endpoint.method,
        requestHeaders: headers,
        requestQuery: queryPayload,
        requestBody: requestBodyLog,
        requestFiles,
        curlCommand,
        responseHeaders,
        responseBody,
        responseBodyFormat,
        errorMessage,
        runLogId: log.id,
    };
}
