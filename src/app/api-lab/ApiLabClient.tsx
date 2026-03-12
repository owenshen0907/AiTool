'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
    Activity,
    ChevronDown,
    ChevronRight,
    Copy,
    Eye,
    FileCode2,
    Globe,
    Link2,
    Play,
    Plus,
    RefreshCw,
    Save,
    Settings2,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
    ApiLabEndpoint,
    ApiLabEnv,
    ApiLabExample,
    ApiLabMonitor,
    ApiLabMonitorRun,
    ApiLabRunLog,
    ApiLabRunResult,
    JsonObject,
    JsonValue,
} from '@/lib/models/apiLab';

interface ApiLabSummaryResponse {
    envs: ApiLabEnv[];
    endpoints: ApiLabEndpoint[];
}

interface ApiLabMonitorResponse {
    monitors: ApiLabMonitor[];
    runs: ApiLabMonitorRun[];
}

interface EnvModalProps {
    env: ApiLabEnv | null;
    defaultServiceKey?: string;
    defaultServiceName?: string;
    onClose: () => void;
    onSaved: (env: ApiLabEnv) => void;
}

interface EndpointModalProps {
    endpoint: ApiLabEndpoint | null;
    defaultServiceKey?: string;
    defaultServiceName?: string;
    onClose: () => void;
    onSaved: (endpoint: ApiLabEndpoint) => void;
}

interface ApiResponsePayload<T> {
    data: T | null;
    text: string;
}

interface RequestPreviewSnapshot {
    requestUrl: string;
    requestMethod: ApiLabEndpoint['method'];
    requestHeaders: JsonObject;
    requestQuery: JsonObject;
    requestBody: string | null;
    requestFiles: JsonObject;
}

interface FloatingToastProps {
    message: string;
    tone: 'success' | 'error';
    onClose: () => void;
}

function formatJson(value: JsonObject): string {
    return JSON.stringify(value, null, 2);
}

function parseJsonText(text: string): { value: JsonObject; error: string | null } {
    const trimmed = text.trim();
    if (!trimmed) {
        return { value: {}, error: null };
    }

    try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
            return { value: {}, error: 'JSON 顶层必须是对象。' };
        }
        return { value: parsed as JsonObject, error: null };
    } catch (error) {
        return {
            value: {},
            error: error instanceof Error ? error.message : 'JSON 解析失败。',
        };
    }
}

function stringifyValue(value: JsonValue): string {
    if (value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
}

function mergeObjects(...sources: JsonObject[]): JsonObject {
    const result: JsonObject = {};
    sources.forEach((source) => {
        Object.entries(source).forEach(([key, value]) => {
            result[key] = value;
        });
    });
    return result;
}

function shellQuote(value: string): string {
    return `'${value.replace(/'/g, `'"'"'`)}'`;
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

function FloatingToast({ message, tone, onClose }: FloatingToastProps) {
    const toneClassName =
        tone === 'success'
            ? 'border-emerald-200/80 bg-white/92 text-emerald-700 shadow-[0_20px_45px_rgba(16,185,129,0.18)]'
            : 'border-rose-200/80 bg-white/94 text-rose-700 shadow-[0_20px_45px_rgba(244,63,94,0.18)]';

    const label = tone === 'success' ? '已完成' : '需要处理';

    return (
        <div
            className={`pointer-events-auto w-full max-w-[380px] rounded-[22px] border px-4 py-3 backdrop-blur-xl ${toneClassName}`}
            role={tone === 'error' ? 'alert' : 'status'}
        >
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-current/65">
                        {label}
                    </div>
                    <div className="mt-1 text-sm font-medium leading-6 text-current">{message}</div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/10 bg-white/60 text-current/70 transition hover:bg-white hover:text-current"
                    aria-label="关闭提示"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

async function readApiResponse<T>(response: Response): Promise<ApiResponsePayload<T>> {
    const text = await response.text();
    if (!text) {
        return { data: null, text: '' };
    }

    try {
        return {
            data: JSON.parse(text) as T,
            text,
        };
    } catch {
        return {
            data: null,
            text,
        };
    }
}

function buildCurlPreview(args: {
    endpoint: ApiLabEndpoint | null;
    env: ApiLabEnv | null;
    bodyText: string;
    queryText: string;
    headerText: string;
    uploadedFileName: string | null;
}): string {
    const { endpoint, env, bodyText, queryText, headerText, uploadedFileName } = args;
    if (!endpoint || !env) {
        return '请选择接口和环境后生成 curl。';
    }

    const parsedBody = parseJsonText(bodyText);
    const parsedQuery = parseJsonText(queryText);
    const parsedHeader = parseJsonText(headerText);
    if (parsedBody.error || parsedQuery.error || parsedHeader.error) {
        return '当前 JSON 存在格式错误，修正后可生成 curl。';
    }

    const bodyPayload = mergeObjects(endpoint.requestTemplate, parsedBody.value);
    const queryPayload = mergeObjects(endpoint.queryTemplate, parsedQuery.value);
    const headers = mergeObjects(env.extraHeaders, endpoint.headerTemplate, parsedHeader.value);

    if (endpoint.authType === 'bearer' && env.apiKey) {
        headers[endpoint.authHeaderName || 'Authorization'] = `Bearer ${env.apiKey}`;
    }
    if (endpoint.authType === 'x-api-key' && env.apiKey) {
        headers[endpoint.authHeaderName || 'x-api-key'] = env.apiKey;
    }
    if (endpoint.authType === 'custom' && env.apiKey && endpoint.authHeaderName) {
        headers[endpoint.authHeaderName] = env.apiKey;
    }
    if (endpoint.contentType === 'application/json') {
        headers['Content-Type'] = 'application/json';
    }

    if (endpoint.method === 'WS') {
        const wsBaseUrl = trimTrailingSlash(env.websocketUrl || toWebsocketBaseUrl(env.baseUrl));
        const wsUrl = new URL(`${wsBaseUrl}${normalizePath(endpoint.path)}`);
        Object.entries(queryPayload).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') return;
            if (Array.isArray(value)) {
                value.forEach((item) => wsUrl.searchParams.append(key, stringifyValue(item)));
                return;
            }
            wsUrl.searchParams.set(key, stringifyValue(value));
        });

        const headerArgs = Object.entries(headers)
            .map(([key, value]) => `-H ${shellQuote(`${key}: ${stringifyValue(value)}`)}`)
            .join(' ');
        const command = `wscat -c ${shellQuote(wsUrl.toString())}${headerArgs ? ` ${headerArgs}` : ''}`;
        const payloadPreview = JSON.stringify(bodyPayload, null, 2);
        return `${command}\n\n# 连接成功后可发送以下 JSON：\n${payloadPreview}`;
    }

    const url = new URL(`${trimTrailingSlash(env.baseUrl)}${normalizePath(endpoint.path)}`);
    Object.entries(queryPayload).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        if (Array.isArray(value)) {
            value.forEach((item) => url.searchParams.append(key, stringifyValue(item)));
            return;
        }
        url.searchParams.set(key, stringifyValue(value));
    });

    const parts = ['curl', '--location', shellQuote(url.toString()), '--request', endpoint.method];
    Object.entries(headers).forEach(([key, value]) => {
        if (endpoint.contentType === 'multipart/form-data' && key.toLowerCase() === 'content-type') {
            return;
        }
        parts.push('--header', shellQuote(`${key}: ${stringifyValue(value)}`));
    });

    if (endpoint.contentType === 'application/json' && endpoint.method !== 'GET') {
        parts.push('--data-raw', shellQuote(JSON.stringify(bodyPayload)));
    }

    if (endpoint.contentType === 'application/x-www-form-urlencoded' && endpoint.method !== 'GET') {
        const searchParams = new URLSearchParams();
        Object.entries(bodyPayload).forEach(([key, value]) => {
            if (value === null || value === undefined) return;
            searchParams.set(key, stringifyValue(value));
        });
        parts.push('--data-urlencode', shellQuote(searchParams.toString()));
    }

    if (endpoint.contentType === 'multipart/form-data') {
        Object.entries(bodyPayload).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') return;
            parts.push('--form', shellQuote(`${key}=${stringifyValue(value)}`));
        });
        const fileFieldName = endpoint.fileFieldName || 'file';
        parts.push('--form', shellQuote(`${fileFieldName}=@${uploadedFileName || 'YOUR_FILE_PATH'}`));
    }

    if (endpoint.responseType === 'audio') {
        const format = typeof bodyPayload.response_format === 'string' ? bodyPayload.response_format : 'mp3';
        parts.push('--output', shellQuote(`response.${format}`));
    }

    if (endpoint.responseType === 'binary') {
        parts.push('--output', shellQuote('response.bin'));
    }

    return parts.join(' ');
}

function slugify(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function copyToClipboard(value: string) {
    await navigator.clipboard.writeText(value);
}

function isAudioResult(endpoint: ApiLabEndpoint | null, result: ApiLabRunResult | null): boolean {
    if (!endpoint || !result) {
        return false;
    }

    if (endpoint.responseType === 'audio') {
        return result.responseBodyFormat === 'base64';
    }

    const contentType = result.responseHeaders['content-type'];
    return typeof contentType === 'string' && contentType.startsWith('audio/');
}

function extractLogResult(log: ApiLabRunLog): ApiLabRunResult {
    return {
        ok: log.isSuccess,
        status: log.responseStatus,
        durationMs: log.durationMs,
        requestUrl: log.requestUrl,
        requestMethod: log.requestMethod,
        requestHeaders: log.requestHeaders,
        requestQuery: log.requestQuery,
        requestBody: log.requestBody,
        requestFiles: log.requestFiles,
        curlCommand: log.curlCommand,
        responseHeaders: log.responseHeaders,
        responseBody: log.responseBody,
        responseBodyFormat: log.responseBodyFormat,
        errorMessage: log.errorMessage,
        runLogId: log.id,
    };
}

function isExampleRunResult(result: ApiLabRunResult | null): boolean {
    return Boolean(result?.runLogId?.startsWith('example:'));
}

function buildRequestUrlPreview(
    endpoint: ApiLabEndpoint,
    env: ApiLabEnv | null,
    queryPayload: JsonObject,
): string {
    if (endpoint.method === 'WS') {
        const wsBaseUrl = env?.websocketUrl || (env ? toWebsocketBaseUrl(env.baseUrl) : '');
        if (!wsBaseUrl) {
            return normalizePath(endpoint.path);
        }

        const wsUrl = new URL(`${trimTrailingSlash(wsBaseUrl)}${normalizePath(endpoint.path)}`);
        Object.entries(queryPayload).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') return;
            if (Array.isArray(value)) {
                value.forEach((item) => wsUrl.searchParams.append(key, stringifyValue(item)));
                return;
            }
            wsUrl.searchParams.set(key, stringifyValue(value));
        });
        return wsUrl.toString();
    }

    if (!env?.baseUrl) {
        return normalizePath(endpoint.path);
    }

    const url = new URL(`${trimTrailingSlash(env.baseUrl)}${normalizePath(endpoint.path)}`);
    Object.entries(queryPayload).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        if (Array.isArray(value)) {
            value.forEach((item) => url.searchParams.append(key, stringifyValue(item)));
            return;
        }
        url.searchParams.set(key, stringifyValue(value));
    });
    return url.toString();
}

function buildExampleRunResult(args: {
    endpoint: ApiLabEndpoint;
    env: ApiLabEnv | null;
    example: ApiLabExample;
}): ApiLabRunResult {
    const { endpoint, env, example } = args;
    const bodyPayload = mergeObjects(endpoint.requestTemplate, example.requestBody);
    const queryPayload = mergeObjects(endpoint.queryTemplate, example.requestQuery);
    const headers = mergeObjects(env?.extraHeaders || {}, endpoint.headerTemplate, example.requestHeaders);

    if (endpoint.authType === 'bearer' && env?.apiKey) {
        headers[endpoint.authHeaderName || 'Authorization'] = `Bearer ${env.apiKey}`;
    }
    if (endpoint.authType === 'x-api-key' && env?.apiKey) {
        headers[endpoint.authHeaderName || 'x-api-key'] = env.apiKey;
    }
    if (endpoint.authType === 'custom' && env?.apiKey && endpoint.authHeaderName) {
        headers[endpoint.authHeaderName] = env.apiKey;
    }
    if (endpoint.contentType === 'application/json') {
        headers['Content-Type'] = 'application/json';
    }

    const requestBody =
        endpoint.method === 'GET' || endpoint.contentType === 'none'
            ? null
            : JSON.stringify(bodyPayload, null, 2);

    return {
        ok: (example.responseStatus ?? 200) < 400,
        status: example.responseStatus,
        durationMs: 0,
        requestUrl: buildRequestUrlPreview(endpoint, env, queryPayload),
        requestMethod: endpoint.method,
        requestHeaders: headers,
        requestQuery: queryPayload,
        requestBody,
        requestFiles: {},
        curlCommand: buildCurlPreview({
            endpoint,
            env,
            bodyText: JSON.stringify(example.requestBody, null, 2),
            queryText: JSON.stringify(example.requestQuery, null, 2),
            headerText: JSON.stringify(example.requestHeaders, null, 2),
            uploadedFileName: null,
        }),
        responseHeaders: example.responseHeaders,
        responseBody: example.responseBody,
        responseBodyFormat: example.responseBodyFormat,
        errorMessage:
            example.responseStatus && example.responseStatus >= 400
                ? `当前展示的是样例返回，状态码 ${example.responseStatus}。`
                : null,
        runLogId: `example:${example.id}`,
    };
}

function buildDraftRequestPreview(args: {
    endpoint: ApiLabEndpoint | null;
    env: ApiLabEnv | null;
    bodyText: string;
    queryText: string;
    headerText: string;
    selectedFile: File | null;
}): RequestPreviewSnapshot | null {
    const { endpoint, env, bodyText, queryText, headerText, selectedFile } = args;
    if (!endpoint || !env) {
        return null;
    }

    const parsedBody = parseJsonText(bodyText);
    const parsedQuery = parseJsonText(queryText);
    const parsedHeader = parseJsonText(headerText);
    if (parsedBody.error || parsedQuery.error || parsedHeader.error) {
        return null;
    }

    const bodyPayload = mergeObjects(endpoint.requestTemplate, parsedBody.value);
    const queryPayload = mergeObjects(endpoint.queryTemplate, parsedQuery.value);
    const headers = mergeObjects(env.extraHeaders, endpoint.headerTemplate, parsedHeader.value);

    if (endpoint.authType === 'bearer' && env.apiKey) {
        headers[endpoint.authHeaderName || 'Authorization'] = `Bearer ${env.apiKey}`;
    }
    if (endpoint.authType === 'x-api-key' && env.apiKey) {
        headers[endpoint.authHeaderName || 'x-api-key'] = env.apiKey;
    }
    if (endpoint.authType === 'custom' && env.apiKey && endpoint.authHeaderName) {
        headers[endpoint.authHeaderName] = env.apiKey;
    }
    if (endpoint.contentType === 'application/json') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    if (endpoint.contentType === 'application/x-www-form-urlencoded') {
        headers['Content-Type'] =
            headers['Content-Type'] || 'application/x-www-form-urlencoded';
    }

    const requestFiles: JsonObject = {};
    if (endpoint.contentType === 'multipart/form-data' && selectedFile) {
        requestFiles[endpoint.fileFieldName || 'file'] = selectedFile.name;
    }

    let requestBody: string | null = null;
    if (endpoint.method !== 'GET' && endpoint.contentType !== 'none') {
        if (endpoint.contentType === 'application/x-www-form-urlencoded') {
            const searchParams = new URLSearchParams();
            Object.entries(bodyPayload).forEach(([key, value]) => {
                if (value === undefined || value === null) {
                    return;
                }
                searchParams.set(key, stringifyValue(value));
            });
            requestBody = searchParams.toString();
        } else {
            requestBody = formatJson(bodyPayload);
        }
    }

    return {
        requestUrl: buildRequestUrlPreview(endpoint, env, queryPayload),
        requestMethod: endpoint.method,
        requestHeaders: headers,
        requestQuery: queryPayload,
        requestBody,
        requestFiles,
    };
}

function getRequestTabLabel(tab: 'body' | 'query' | 'headers' | 'file') {
    switch (tab) {
        case 'body':
            return '请求体';
        case 'query':
            return 'Query';
        case 'headers':
            return 'Headers';
        case 'file':
            return '文件';
        default:
            return '请求';
    }
}

function summarizeJsonDraft(text: string): {
    title: string;
    detail: string;
    isError: boolean;
} {
    const parsed = parseJsonText(text);
    if (parsed.error) {
        return {
            title: 'JSON 有误',
            detail: parsed.error,
            isError: true,
        };
    }

    const keys = Object.keys(parsed.value);
    if (!keys.length) {
        return {
            title: '空对象',
            detail: '点击弹窗补充内容',
            isError: false,
        };
    }

    return {
        title: `${keys.length} 个字段`,
        detail: keys.slice(0, 4).join(' / '),
        isError: false,
    };
}

function SectionTitle({ icon: Icon, title, action }: { icon: LucideIcon; title: string; action?: ReactNode }) {
    return (
        <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                    <Icon size={18} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                </div>
            </div>
            {action}
        </div>
    );
}

function QuickViewModal({
    title,
    subtitle,
    onClose,
    action,
    children,
    maxWidthClass = 'max-w-4xl',
}: {
    title: string;
    subtitle?: string;
    onClose: () => void;
    action?: ReactNode;
    children: ReactNode;
    maxWidthClass?: string;
}) {
    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className={`w-full ${maxWidthClass} max-h-[86vh] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]`}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                    <div className="min-w-0">
                        <div className="text-lg font-semibold text-slate-900">{title}</div>
                        {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
                    </div>
                    <div className="flex items-center gap-2">
                        {action}
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
                <div className="max-h-[calc(86vh-78px)] overflow-auto px-5 py-5">{children}</div>
            </div>
        </div>
    );
}

function DetailBlock({
    label,
    value,
    mono = false,
    onCopy,
    tone = 'light',
}: {
    label: string;
    value: string;
    mono?: boolean;
    onCopy?: () => void;
    tone?: 'light' | 'dark';
}) {
    return (
        <div
            className={`rounded-[24px] px-4 py-3 ${
                tone === 'dark'
                    ? 'border border-white/10 bg-white/5'
                    : 'border border-slate-200 bg-slate-50/80'
            }`}
        >
            <div className="mb-2 flex items-center justify-between gap-3">
                <div
                    className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                        tone === 'dark' ? 'text-slate-400' : 'text-slate-400'
                    }`}
                >
                    {label}
                </div>
                {onCopy ? (
                    <button
                        type="button"
                        onClick={onCopy}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs transition ${
                            tone === 'dark'
                                ? 'border border-white/10 bg-white/8 text-slate-200 hover:bg-white/14 hover:text-white'
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        <Copy size={12} />
                        复制
                    </button>
                ) : null}
            </div>
            <pre
                className={`whitespace-pre-wrap break-all text-sm leading-6 ${
                    tone === 'dark' ? 'text-slate-100' : 'text-slate-700'
                } ${mono ? 'font-mono text-xs' : ''}`}
            >
                {value || '<empty>'}
            </pre>
        </div>
    );
}

function EnvModal({ env, defaultServiceKey, defaultServiceName, onClose, onSaved }: EnvModalProps) {
    const [serviceKey, setServiceKey] = useState(env?.serviceKey || defaultServiceKey || '');
    const [serviceName, setServiceName] = useState(env?.serviceName || defaultServiceName || '');
    const [name, setName] = useState(env?.name || '');
    const [baseUrl, setBaseUrl] = useState(env?.baseUrl || '');
    const [websocketUrl, setWebsocketUrl] = useState(env?.websocketUrl || '');
    const [apiKey, setApiKey] = useState(env?.apiKey || '');
    const [timeoutMs, setTimeoutMs] = useState(String(env?.timeoutMs || 30000));
    const [extraHeadersText, setExtraHeadersText] = useState(formatJson(env?.extraHeaders || {}));
    const [isDefault, setIsDefault] = useState(Boolean(env?.isDefault));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async () => {
        const parsedHeaders = parseJsonText(extraHeadersText);
        if (parsedHeaders.error) {
            setError(`额外 Headers JSON 有误：${parsedHeaders.error}`);
            return;
        }
        if (!serviceKey.trim() || !serviceName.trim() || !name.trim() || !baseUrl.trim()) {
            setError('请补全 service、环境名和 Base URL。');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/api-lab/envs', {
                method: env ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: env?.id,
                    serviceKey: serviceKey.trim(),
                    serviceName: serviceName.trim(),
                    name: name.trim(),
                    baseUrl: baseUrl.trim(),
                    websocketUrl: websocketUrl.trim(),
                    apiKey,
                    timeoutMs: Number(timeoutMs || 30000),
                    extraHeaders: parsedHeaders.value,
                    isDefault,
                }),
            });
            if (!res.ok) {
                throw new Error(await res.text());
            }
            const saved = (await res.json()) as ApiLabEnv;
            onSaved(saved);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : '保存环境失败。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.24)]" onClick={(event) => event.stopPropagation()}>
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-900">{env ? '编辑环境' : '新增环境'}</h3>
                        <p className="mt-1 text-sm text-slate-500">按服务维度维护多个 Base URL 和 Key。</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                        关闭
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <input value={serviceKey} onChange={(event) => setServiceKey(event.target.value)} placeholder="service key" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <input value={serviceName} onChange={(event) => setServiceName(event.target.value)} placeholder="service name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <input value={name} onChange={(event) => setName(event.target.value)} placeholder="环境名，例如 test / prod" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://api.example.com/v1" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <input value={websocketUrl} onChange={(event) => setWebsocketUrl(event.target.value)} placeholder="wss://api.example.com/v1 (可选)" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="API Key" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900 md:col-span-2" />
                    <input value={timeoutMs} onChange={(event) => setTimeoutMs(event.target.value)} placeholder="30000" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                        <input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />
                        设为该 service 的默认环境
                    </label>
                </div>

                <div className="mt-4">
                    <div className="mb-2 text-sm font-medium text-slate-700">额外 Headers (JSON)</div>
                    <textarea value={extraHeadersText} onChange={(event) => setExtraHeadersText(event.target.value)} rows={6} className="w-full rounded-3xl border border-slate-200 px-4 py-3 font-mono text-xs leading-6 text-slate-700 outline-none transition focus:border-slate-900" />
                </div>

                {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50" disabled={loading}>
                        取消
                    </button>
                    <button type="button" onClick={submit} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
                        {loading ? '保存中...' : '保存环境'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EndpointModal({ endpoint, defaultServiceKey, defaultServiceName, onClose, onSaved }: EndpointModalProps) {
    const [serviceKey, setServiceKey] = useState(endpoint?.serviceKey || defaultServiceKey || 'stepfun');
    const [serviceName, setServiceName] = useState(endpoint?.serviceName || defaultServiceName || 'Stepfun');
    const [category, setCategory] = useState(endpoint?.category || 'chat');
    const [name, setName] = useState(endpoint?.name || '');
    const [slug, setSlug] = useState(endpoint?.slug || '');
    const [method, setMethod] = useState<ApiLabEndpoint['method']>(endpoint?.method || 'POST');
    const [path, setPath] = useState(endpoint?.path || '');
    const [description, setDescription] = useState(endpoint?.description || '');
    const [authType, setAuthType] = useState<ApiLabEndpoint['authType']>(endpoint?.authType || 'bearer');
    const [authHeaderName, setAuthHeaderName] = useState(endpoint?.authHeaderName || 'Authorization');
    const [contentType, setContentType] = useState<ApiLabEndpoint['contentType']>(endpoint?.contentType || 'application/json');
    const [responseType, setResponseType] = useState<ApiLabEndpoint['responseType']>(endpoint?.responseType || 'json');
    const [fileFieldName, setFileFieldName] = useState(endpoint?.fileFieldName || 'file');
    const [fileAccept, setFileAccept] = useState(endpoint?.fileAccept || '');
    const [docUrl, setDocUrl] = useState(endpoint?.docUrl || '');
    const [notes, setNotes] = useState(endpoint?.notes || '');
    const [sortOrder, setSortOrder] = useState(String(endpoint?.sortOrder || 100));
    const [requestTemplateText, setRequestTemplateText] = useState(formatJson(endpoint?.requestTemplate || {}));
    const [queryTemplateText, setQueryTemplateText] = useState(formatJson(endpoint?.queryTemplate || {}));
    const [headerTemplateText, setHeaderTemplateText] = useState(formatJson(endpoint?.headerTemplate || {}));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!endpoint && !slug && name) {
            setSlug(slugify(`${serviceKey}-${name}`));
        }
    }, [endpoint, name, serviceKey, slug]);

    const submit = async () => {
        const parsedRequestTemplate = parseJsonText(requestTemplateText);
        const parsedQueryTemplate = parseJsonText(queryTemplateText);
        const parsedHeaderTemplate = parseJsonText(headerTemplateText);

        if (parsedRequestTemplate.error || parsedQueryTemplate.error || parsedHeaderTemplate.error) {
            setError(
                parsedRequestTemplate.error ||
                    parsedQueryTemplate.error ||
                    parsedHeaderTemplate.error ||
                    '模板 JSON 有误。',
            );
            return;
        }

        if (!serviceKey.trim() || !serviceName.trim() || !category.trim() || !name.trim() || !slug.trim() || !path.trim()) {
            setError('请补全 service、分类、名称、slug 和路径。');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/api-lab/endpoints', {
                method: endpoint ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: endpoint?.id,
                    slug: slug.trim(),
                    serviceKey: serviceKey.trim(),
                    serviceName: serviceName.trim(),
                    category: category.trim(),
                    name: name.trim(),
                    description,
                    method,
                    path: path.trim(),
                    authType,
                    authHeaderName,
                    contentType,
                    responseType,
                    fileFieldName: contentType === 'multipart/form-data' ? fileFieldName.trim() : '',
                    fileAccept: contentType === 'multipart/form-data' ? fileAccept.trim() : '',
                    docUrl: docUrl.trim(),
                    notes,
                    sortOrder: Number(sortOrder || 100),
                    requestTemplate: parsedRequestTemplate.value,
                    queryTemplate: parsedQueryTemplate.value,
                    headerTemplate: parsedHeaderTemplate.value,
                }),
            });
            if (!res.ok) {
                throw new Error(await res.text());
            }
            const saved = (await res.json()) as ApiLabEndpoint;
            onSaved(saved);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : '保存接口失败。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm" onClick={onClose}>
            <div className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.24)]" onClick={(event) => event.stopPropagation()}>
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-900">{endpoint ? '编辑接口' : '新增接口'}</h3>
                        <p className="mt-1 text-sm text-slate-500">把接口文档沉成可运行模板，HTTP 接口复制 curl，实时接口复制连接命令。</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                        关闭
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <input value={serviceKey} onChange={(event) => setServiceKey(event.target.value)} placeholder="service key" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <input value={serviceName} onChange={(event) => setServiceName(event.target.value)} placeholder="service name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="分类" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <input value={name} onChange={(event) => setName(event.target.value)} placeholder="接口名称" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="唯一 slug" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <input value={path} onChange={(event) => setPath(event.target.value)} placeholder="/chat/completions" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <select value={method} onChange={(event) => setMethod(event.target.value as ApiLabEndpoint['method'])} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900">
                        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'WS'].map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                    <select value={authType} onChange={(event) => setAuthType(event.target.value as ApiLabEndpoint['authType'])} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900">
                        <option value="bearer">Bearer</option>
                        <option value="x-api-key">x-api-key</option>
                        <option value="custom">Custom Header</option>
                        <option value="none">No Auth</option>
                    </select>
                    <input value={authHeaderName} onChange={(event) => setAuthHeaderName(event.target.value)} placeholder="Authorization" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <select value={contentType} onChange={(event) => setContentType(event.target.value as ApiLabEndpoint['contentType'])} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900">
                        <option value="application/json">application/json</option>
                        <option value="multipart/form-data">multipart/form-data</option>
                        <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                        <option value="none">none</option>
                    </select>
                    <select value={responseType} onChange={(event) => setResponseType(event.target.value as ApiLabEndpoint['responseType'])} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900">
                        <option value="json">json</option>
                        <option value="text">text</option>
                        <option value="sse">sse</option>
                        <option value="binary">binary</option>
                        <option value="audio">audio</option>
                    </select>
                    <input value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} placeholder="排序" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="一句话描述" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900 md:col-span-2" />
                    <input value={docUrl} onChange={(event) => setDocUrl(event.target.value)} placeholder="文档链接" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900 md:col-span-3" />
                </div>

                {contentType === 'multipart/form-data' ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <input value={fileFieldName} onChange={(event) => setFileFieldName(event.target.value)} placeholder="文件字段名，默认 file" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                        <input value={fileAccept} onChange={(event) => setFileAccept(event.target.value)} placeholder="accept，例如 audio/*,.wav" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                    </div>
                ) : null}

                <div className="mt-4">
                    <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="接口备注" className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-900" />
                </div>

                {method === 'WS' ? (
                    <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        WebSocket 接口当前会以文档模板形式保存，页面内先支持生成连接命令与示例消息，不直接执行。
                    </div>
                ) : null}

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <div>
                        <div className="mb-2 text-sm font-medium text-slate-700">请求模板</div>
                        <textarea value={requestTemplateText} onChange={(event) => setRequestTemplateText(event.target.value)} rows={12} className="w-full rounded-3xl border border-slate-200 px-4 py-3 font-mono text-xs leading-6 text-slate-700 outline-none transition focus:border-slate-900" />
                    </div>
                    <div>
                        <div className="mb-2 text-sm font-medium text-slate-700">Query 模板</div>
                        <textarea value={queryTemplateText} onChange={(event) => setQueryTemplateText(event.target.value)} rows={12} className="w-full rounded-3xl border border-slate-200 px-4 py-3 font-mono text-xs leading-6 text-slate-700 outline-none transition focus:border-slate-900" />
                    </div>
                    <div>
                        <div className="mb-2 text-sm font-medium text-slate-700">Header 模板</div>
                        <textarea value={headerTemplateText} onChange={(event) => setHeaderTemplateText(event.target.value)} rows={12} className="w-full rounded-3xl border border-slate-200 px-4 py-3 font-mono text-xs leading-6 text-slate-700 outline-none transition focus:border-slate-900" />
                    </div>
                </div>

                {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50" disabled={loading}>
                        取消
                    </button>
                    <button type="button" onClick={submit} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
                        {loading ? '保存中...' : '保存接口'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ApiLabClient() {
    const [envs, setEnvs] = useState<ApiLabEnv[]>([]);
    const [endpoints, setEndpoints] = useState<ApiLabEndpoint[]>([]);
    const [monitors, setMonitors] = useState<ApiLabMonitor[]>([]);
    const [monitorRuns, setMonitorRuns] = useState<ApiLabMonitorRun[]>([]);
    const [selectedEndpointId, setSelectedEndpointId] = useState<string>('');
    const [selectedEnvId, setSelectedEnvId] = useState<string>('');
    const [examples, setExamples] = useState<ApiLabExample[]>([]);
    const [logs, setLogs] = useState<ApiLabRunLog[]>([]);
    const [runResult, setRunResult] = useState<ApiLabRunResult | null>(null);
    const [bodyText, setBodyText] = useState('{}');
    const [queryText, setQueryText] = useState('{}');
    const [headerText, setHeaderText] = useState('{}');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [running, setRunning] = useState(false);
    const [runningMonitors, setRunningMonitors] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showEnvModal, setShowEnvModal] = useState(false);
    const [editingEnv, setEditingEnv] = useState<ApiLabEnv | null>(null);
    const [showEndpointModal, setShowEndpointModal] = useState(false);
    const [editingEndpoint, setEditingEndpoint] = useState<ApiLabEndpoint | null>(null);
    const [showEnvDetailModal, setShowEnvDetailModal] = useState(false);
    const [showEndpointDetailModal, setShowEndpointDetailModal] = useState(false);
    const [showCurlModal, setShowCurlModal] = useState(false);
    const [showPacketModal, setShowPacketModal] = useState(false);
    const [showRequestEditorModal, setShowRequestEditorModal] = useState(false);
    const [showResponseBodyModal, setShowResponseBodyModal] = useState(false);
    const [requestTab, setRequestTab] = useState<'body' | 'query' | 'headers' | 'file'>('body');
    const [activityTab, setActivityTab] = useState<'examples' | 'logs' | 'monitors'>('examples');
    const [responseTab, setResponseTab] = useState<'body' | 'request' | 'headers'>('body');
    const [openEndpointGroups, setOpenEndpointGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!notice) {
            return undefined;
        }
        const timer = window.setTimeout(() => setNotice(null), 2600);
        return () => window.clearTimeout(timer);
    }, [notice]);

    useEffect(() => {
        if (!error) {
            return undefined;
        }
        const timer = window.setTimeout(() => setError(null), 4200);
        return () => window.clearTimeout(timer);
    }, [error]);

    const selectedEndpoint = useMemo(
        () => endpoints.find((item) => item.id === selectedEndpointId) || null,
        [endpoints, selectedEndpointId],
    );
    const serviceEnvs = useMemo(() => {
        if (!selectedEndpoint) {
            return envs;
        }
        return envs.filter((env) => env.serviceKey === selectedEndpoint.serviceKey);
    }, [envs, selectedEndpoint]);
    const selectedEnv = useMemo(
        () => serviceEnvs.find((item) => item.id === selectedEnvId) || null,
        [serviceEnvs, selectedEnvId],
    );
    const latestMonitorRunById = useMemo(() => {
        const map = new Map<string, ApiLabMonitorRun>();
        monitorRuns.forEach((run) => {
            if (!map.has(run.monitorId)) {
                map.set(run.monitorId, run);
            }
        });
        return map;
    }, [monitorRuns]);
    const visibleMonitors = useMemo(() => {
        if (!selectedEndpoint) {
            return monitors;
        }
        const current = monitors.filter((monitor) => monitor.endpointId === selectedEndpoint.id);
        return current.length ? current : monitors;
    }, [monitors, selectedEndpoint]);

    const groupedEndpoints = useMemo(() => {
        const serviceMap = new Map<string, Map<string, ApiLabEndpoint[]>>();
        endpoints.forEach((endpoint) => {
            if (!serviceMap.has(endpoint.serviceName)) {
                serviceMap.set(endpoint.serviceName, new Map());
            }
            const categoryMap = serviceMap.get(endpoint.serviceName)!;
            if (!categoryMap.has(endpoint.category)) {
                categoryMap.set(endpoint.category, []);
            }
            categoryMap.get(endpoint.category)!.push(endpoint);
        });

        return Array.from(serviceMap.entries()).map(([serviceName, categoryMap]) => ({
            serviceName,
            categories: Array.from(categoryMap.entries()).map(([category, items]) => ({
                key: `${serviceName}::${category}`,
                category,
                items,
            })),
        }));
    }, [endpoints]);

    const curlPreview = useMemo(
        () =>
            buildCurlPreview({
                endpoint: selectedEndpoint,
                env: selectedEnv,
                bodyText,
                queryText,
                headerText,
                uploadedFileName: selectedFile?.name || null,
            }),
        [selectedEndpoint, selectedEnv, bodyText, queryText, headerText, selectedFile],
    );

    const parsedBodyDraft = useMemo(() => parseJsonText(bodyText), [bodyText]);
    const parsedQueryDraft = useMemo(() => parseJsonText(queryText), [queryText]);
    const parsedHeaderDraft = useMemo(() => parseJsonText(headerText), [headerText]);

    const currentJsonError = useMemo(() => {
        const parts = [parsedBodyDraft, parsedQueryDraft, parsedHeaderDraft];
        return parts.find((item) => item.error)?.error || null;
    }, [parsedBodyDraft, parsedQueryDraft, parsedHeaderDraft]);

    const currentRequestPreview = useMemo(
        () =>
            buildDraftRequestPreview({
                endpoint: selectedEndpoint,
                env: selectedEnv,
                bodyText,
                queryText,
                headerText,
                selectedFile,
            }),
        [selectedEndpoint, selectedEnv, bodyText, queryText, headerText, selectedFile],
    );

    const bodyDraftSummary = useMemo(() => {
        if (!selectedEndpoint) {
            return {
                title: '未选择接口',
                detail: '先选择接口后再编辑请求体',
                isError: false,
            };
        }

        if (selectedEndpoint.method === 'GET' || selectedEndpoint.contentType === 'none') {
            return {
                title: '无需请求体',
                detail: '当前接口不会发送 body',
                isError: false,
            };
        }

        return summarizeJsonDraft(bodyText);
    }, [selectedEndpoint, bodyText]);

    const queryDraftSummary = useMemo(() => summarizeJsonDraft(queryText), [queryText]);
    const headerDraftSummary = useMemo(() => summarizeJsonDraft(headerText), [headerText]);

    const packetModalCopyText = useMemo(() => {
        if (currentRequestPreview) {
            return JSON.stringify(
                {
                    draftRequest: {
                        url: currentRequestPreview.requestUrl,
                        method: currentRequestPreview.requestMethod,
                        headers: currentRequestPreview.requestHeaders,
                        query: currentRequestPreview.requestQuery,
                        body: currentRequestPreview.requestBody,
                        files: currentRequestPreview.requestFiles,
                    },
                    lastRun: runResult
                        ? {
                              status: runResult.status,
                              durationMs: runResult.durationMs,
                              requestUrl: runResult.requestUrl,
                              requestMethod: runResult.requestMethod,
                              requestHeaders: runResult.requestHeaders,
                              requestQuery: runResult.requestQuery,
                              requestBody: runResult.requestBody,
                              requestFiles: runResult.requestFiles,
                              responseHeaders: runResult.responseHeaders,
                              responseBody: runResult.responseBody,
                          }
                        : null,
                },
                null,
                2,
            );
        }

        if (!runResult) {
            return '';
        }

        return JSON.stringify(
            {
                lastRun: {
                    status: runResult.status,
                    durationMs: runResult.durationMs,
                    requestUrl: runResult.requestUrl,
                    requestMethod: runResult.requestMethod,
                    requestHeaders: runResult.requestHeaders,
                    requestQuery: runResult.requestQuery,
                    requestBody: runResult.requestBody,
                    requestFiles: runResult.requestFiles,
                    responseHeaders: runResult.responseHeaders,
                    responseBody: runResult.responseBody,
                },
            },
            null,
            2,
        );
    }, [currentRequestPreview, runResult]);

    useEffect(() => {
        if (!groupedEndpoints.length) {
            return;
        }

        setOpenEndpointGroups((current) => {
            const next = { ...current };
            let changed = false;

            groupedEndpoints.forEach((serviceGroup) => {
                serviceGroup.categories.forEach((categoryGroup) => {
                    if (next[categoryGroup.key] === undefined) {
                        next[categoryGroup.key] = categoryGroup.items.some(
                            (item) => item.id === selectedEndpointId,
                        );
                        changed = true;
                    }
                });
            });

            const activeGroup = groupedEndpoints
                .flatMap((serviceGroup) => serviceGroup.categories)
                .find((categoryGroup) =>
                    categoryGroup.items.some((item) => item.id === selectedEndpointId),
                );

            if (activeGroup && !next[activeGroup.key]) {
                next[activeGroup.key] = true;
                changed = true;
            }

            return changed ? next : current;
        });
    }, [groupedEndpoints, selectedEndpointId]);

    const loadSummary = async (keepSelection = true) => {
        setRefreshing(true);
        try {
            const res = await fetch('/api/api-lab/summary');
            if (!res.ok) {
                throw new Error(await res.text());
            }
            const data = (await res.json()) as ApiLabSummaryResponse;
            setEnvs(data.envs);
            setEndpoints(data.endpoints);

            if (!keepSelection || !selectedEndpointId || !data.endpoints.some((item) => item.id === selectedEndpointId)) {
                setSelectedEndpointId(data.endpoints[0]?.id || '');
            }
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : '加载 API Lab 数据失败。');
        } finally {
            setLoadingSummary(false);
            setRefreshing(false);
        }
    };

    const loadExamples = async (endpointId: string) => {
        const res = await fetch(`/api/api-lab/examples?endpoint_id=${endpointId}`);
        if (!res.ok) {
            throw new Error(await res.text());
        }
        const data = (await res.json()) as ApiLabExample[];
        setExamples(data);
        return data;
    };

    const loadLogs = async (endpointId: string) => {
        const res = await fetch(`/api/api-lab/logs?endpoint_id=${endpointId}&limit=8`);
        if (!res.ok) {
            throw new Error(await res.text());
        }
        setLogs((await res.json()) as ApiLabRunLog[]);
    };

    const loadMonitors = async () => {
        const res = await fetch('/api/api-lab/monitors');
        if (!res.ok) {
            throw new Error(await res.text());
        }
        const data = (await res.json()) as ApiLabMonitorResponse;
        setMonitors(data.monitors);
        setMonitorRuns(data.runs);
    };

    useEffect(() => {
        const boot = async () => {
            setLoadingSummary(true);
            setError(null);
            try {
                const bootstrapRes = await fetch('/api/api-lab/bootstrap', { method: 'POST' });
                if (!bootstrapRes.ok) {
                    throw new Error(await bootstrapRes.text());
                }
                await Promise.all([loadSummary(false), loadMonitors()]);
            } catch (bootError) {
                setError(bootError instanceof Error ? bootError.message : '初始化 API Lab 失败。');
                setLoadingSummary(false);
            }
        };
        void boot();
    }, []);

    useEffect(() => {
        if (!selectedEndpoint) {
            setExamples([]);
            setLogs([]);
            setRunResult(null);
            return;
        }

        setBodyText(formatJson(selectedEndpoint.requestTemplate));
        setQueryText(formatJson(selectedEndpoint.queryTemplate));
        setHeaderText(formatJson(selectedEndpoint.headerTemplate));
        setSelectedFile(null);
        setNotice(null);
        setError(null);
        setRunResult(null);

        const defaultEnv = serviceEnvs.find((env) => env.isDefault) || serviceEnvs[0] || null;
        if (!selectedEnvId || !serviceEnvs.some((env) => env.id === selectedEnvId)) {
            setSelectedEnvId(defaultEnv?.id || '');
        }
        const resolvedEnv =
            (selectedEnvId ? serviceEnvs.find((env) => env.id === selectedEnvId) : null) || defaultEnv;

        void Promise.all([loadExamples(selectedEndpoint.id), loadLogs(selectedEndpoint.id)])
            .then(([loadedExamples]) => {
                const recommendedExample =
                    loadedExamples.find((example) => example.isRecommended) || loadedExamples[0];
                if (recommendedExample) {
                    applyExample(recommendedExample, { silent: true, envOverride: resolvedEnv });
                }
            })
            .catch((loadError) => {
                setError(loadError instanceof Error ? loadError.message : '加载样例或日志失败。');
            });
    }, [selectedEndpointId, selectedEndpoint, serviceEnvs]);

    useEffect(() => {
        if (requestTab === 'file' && selectedEndpoint?.contentType !== 'multipart/form-data') {
            setRequestTab('body');
        }
    }, [requestTab, selectedEndpoint]);

    useEffect(() => {
        setResponseTab('body');
    }, [selectedEndpointId, runResult?.runLogId]);

    const applyExample = (
        example: ApiLabExample,
        options?: { silent?: boolean; envOverride?: ApiLabEnv | null },
    ) => {
        setBodyText(formatJson(example.requestBody));
        setQueryText(formatJson(example.requestQuery));
        setHeaderText(formatJson(example.requestHeaders));
        if (selectedEndpoint) {
            setRunResult(
                buildExampleRunResult({
                    endpoint: selectedEndpoint,
                    env: options?.envOverride === undefined ? selectedEnv : options.envOverride,
                    example,
                }),
            );
        }
        setNotice(options?.silent ? null : `已加载样例：${example.name}，可以直接复制当前 curl 和样例返回。`);
    };

    const formatCurrentRequestTab = () => {
        if (requestTab === 'file') {
            setNotice('文件标签无需格式化。');
            return;
        }

        const currentText =
            requestTab === 'body'
                ? bodyText
                : requestTab === 'query'
                  ? queryText
                  : headerText;
        const parsed = parseJsonText(currentText);
        if (parsed.error) {
            setError(`${getRequestTabLabel(requestTab)} JSON 有误：${parsed.error}`);
            return;
        }

        const formatted = formatJson(parsed.value);
        if (requestTab === 'body') {
            setBodyText(formatted);
        }
        if (requestTab === 'query') {
            setQueryText(formatted);
        }
        if (requestTab === 'headers') {
            setHeaderText(formatted);
        }
        setError(null);
        setNotice(`已格式化${getRequestTabLabel(requestTab)}。`);
    };

    const openRequestEditor = (tab: 'body' | 'query' | 'headers' | 'file') => {
        setRequestTab(tab);
        setShowRequestEditorModal(true);
    };

    const runRequest = async () => {
        if (!selectedEndpoint || !selectedEnv) {
            setError('请先选择接口和环境。');
            return;
        }
        if (selectedEndpoint.method === 'WS') {
            setError('WebSocket 接口暂不支持在页面内直接执行，请复制预览命令后用 wscat 或业务客户端连接。');
            return;
        }
        if (currentJsonError) {
            setError(`JSON 配置有误：${currentJsonError}`);
            return;
        }

        setRunning(true);
        setError(null);
        setNotice(null);
        try {
            const formData = new FormData();
            formData.append('endpointId', selectedEndpoint.id);
            formData.append('envId', selectedEnv.id);
            formData.append('bodyText', bodyText);
            formData.append('queryText', queryText);
            formData.append('headerText', headerText);
            if (selectedFile) {
                formData.append('upload', selectedFile);
            }

            const res = await fetch('/api/api-lab/run', {
                method: 'POST',
                body: formData,
            });
            const payload = await readApiResponse<ApiLabRunResult | { error: string }>(res);
            const data = payload.data;
            if (!res.ok) {
                throw new Error(
                    data && 'error' in data ? data.error : payload.text || '执行失败',
                );
            }
            if (!data) {
                throw new Error(payload.text || '接口返回不是合法 JSON。');
            }
            setRunResult(data as ApiLabRunResult);
            await loadLogs(selectedEndpoint.id);
            setNotice((data as ApiLabRunResult).ok ? '接口执行完成。' : '接口返回失败状态，已记录日志。');
        } catch (runError) {
            setError(runError instanceof Error ? runError.message : '执行接口失败。');
        } finally {
            setRunning(false);
        }
    };

    const saveCurrentAsExample = async () => {
        if (!selectedEndpoint || !runResult) {
            setError('请先执行一次接口，再保存样例。');
            return;
        }
        const name = window.prompt('给这个请求/响应样例起个名字', `${selectedEndpoint.name} - ${new Date().toLocaleString()}`);
        if (!name) {
            return;
        }

        const requestBody = parseJsonText(bodyText);
        const requestQuery = parseJsonText(queryText);
        const requestHeaders = parseJsonText(headerText);
        if (requestBody.error || requestQuery.error || requestHeaders.error) {
            setError('保存样例前，请先修正 JSON。');
            return;
        }

        try {
            const res = await fetch('/api/api-lab/examples', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpointId: selectedEndpoint.id,
                    name,
                    requestBody: requestBody.value,
                    requestQuery: requestQuery.value,
                    requestHeaders: requestHeaders.value,
                    responseStatus: runResult.status,
                    responseHeaders: runResult.responseHeaders,
                    responseBody: runResult.responseBody,
                    responseBodyFormat: runResult.responseBodyFormat,
                    isRecommended: false,
                }),
            });
            if (!res.ok) {
                throw new Error(await res.text());
            }
            await loadExamples(selectedEndpoint.id);
            setNotice(`已保存样例：${name}`);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : '保存样例失败。');
        }
    };

    const createMonitor = async () => {
        if (!selectedEndpoint || !selectedEnv) {
            setError('请先选定接口和环境，再加入巡检。');
            return;
        }
        if (selectedEndpoint.method === 'WS') {
            setError('WebSocket 接口暂不加入当前巡检器，建议先用命令行或业务客户端验证。');
            return;
        }
        const name = window.prompt('巡检名称', `${selectedEndpoint.name} @ ${selectedEnv.name}`);
        if (!name) {
            return;
        }

        try {
            const res = await fetch('/api/api-lab/monitors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpointId: selectedEndpoint.id,
                    envId: selectedEnv.id,
                    name,
                    expectedStatus: 200,
                    maxDurationMs: 5000,
                    bodyIncludes: '',
                    isActive: true,
                }),
            });
            if (!res.ok) {
                throw new Error(await res.text());
            }
            await loadMonitors();
            setNotice(`已加入巡检：${name}`);
        } catch (monitorError) {
            setError(monitorError instanceof Error ? monitorError.message : '创建巡检失败。');
        }
    };

    const toggleMonitor = async (monitor: ApiLabMonitor) => {
        try {
            const res = await fetch('/api/api-lab/monitors', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: monitor.id,
                    isActive: !monitor.isActive,
                }),
            });
            if (!res.ok) {
                throw new Error(await res.text());
            }
            await loadMonitors();
            setNotice(`${monitor.name} 已${monitor.isActive ? '暂停' : '启用'}。`);
        } catch (toggleError) {
            setError(toggleError instanceof Error ? toggleError.message : '更新巡检失败。');
        }
    };

    const runMonitors = async (monitorId?: string) => {
        setRunningMonitors(true);
        setError(null);
        try {
            const res = await fetch('/api/api-lab/monitors/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(monitorId ? { monitorId } : {}),
            });
            if (!res.ok) {
                const data = (await res.json().catch(() => null)) as { error?: string } | null;
                throw new Error(data?.error || '执行巡检失败。');
            }
            await Promise.all([
                loadMonitors(),
                selectedEndpoint ? loadLogs(selectedEndpoint.id) : Promise.resolve(),
            ]);
            setNotice(monitorId ? '已运行当前巡检。' : '已完成一次全量巡检。');
        } catch (runError) {
            setError(runError instanceof Error ? runError.message : '执行巡检失败。');
        } finally {
            setRunningMonitors(false);
        }
    };

    const onEnvSaved = async (savedEnv: ApiLabEnv) => {
        setShowEnvModal(false);
        setEditingEnv(null);
        await Promise.all([loadSummary(), loadMonitors()]);
        setSelectedEnvId(savedEnv.id);
        setNotice(`环境已保存：${savedEnv.name}`);
    };

    const onEndpointSaved = async (savedEndpoint: ApiLabEndpoint) => {
        setShowEndpointModal(false);
        setEditingEndpoint(null);
        await Promise.all([loadSummary(false), loadMonitors()]);
        setSelectedEndpointId(savedEndpoint.id);
        setNotice(`接口已保存：${savedEndpoint.name}`);
    };

    if (loadingSummary) {
        return (
            <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.65),transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-8 md:px-6 lg:px-10">
                <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center rounded-[36px] border border-white/70 bg-white/80 p-10 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-900 text-white">
                            <RefreshCw className="animate-spin" size={22} />
                        </div>
                        <div className="text-lg font-semibold text-slate-900">正在初始化 API Lab</div>
                        <div className="mt-2 text-sm text-slate-500">首次打开会自动导入常用接口模板。</div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.72),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.16),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-3 md:px-6 lg:h-screen lg:overflow-y-auto lg:px-8">
            <div className="pointer-events-none fixed inset-x-4 top-4 z-[110] flex flex-col items-end gap-3 sm:left-auto sm:right-5 sm:top-5 sm:w-[380px]">
                {error ? <FloatingToast message={error} tone="error" onClose={() => setError(null)} /> : null}
                {notice ? <FloatingToast message={notice} tone="success" onClose={() => setNotice(null)} /> : null}
            </div>
            <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4">
                <div className="rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(30,41,59,0.88)_62%,rgba(14,116,144,0.82)_100%)] px-5 py-5 text-white shadow-[0_26px_80px_rgba(15,23,42,0.20)] md:px-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-200">
                                <Activity size={14} />
                                Private API Lab
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">只给 owenshen 用的接口执行台</h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
                                这里优先保留 4 件事：切环境、执行接口、复制 curl、查看样例返回。页面默认收紧，不再把常用信息全部摊开。
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => void Promise.all([loadSummary(), loadMonitors()])} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/16">
                                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                                刷新
                            </button>
                            <button type="button" onClick={() => { setEditingEnv(null); setShowEnvModal(true); }} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100">
                                <Plus size={16} />
                                新增环境
                            </button>
                            <button type="button" onClick={() => { setEditingEndpoint(null); setShowEndpointModal(true); }} className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-400/90 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300">
                                <Plus size={16} />
                                新增接口
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_420px]">
                    <aside className="min-h-0 overflow-hidden rounded-[30px] border border-white/70 bg-white/82 p-4 shadow-[0_22px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                        <div className="flex h-full flex-col">
                            <SectionTitle
                                icon={FileCode2}
                                title="接口目录"
                                action={
                                    selectedEndpoint ? (
                                        <button type="button" onClick={() => { setEditingEndpoint(selectedEndpoint); setShowEndpointModal(true); }} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                                            编辑
                                        </button>
                                    ) : null
                                }
                            />
                            <div className="min-h-0 flex-1 space-y-4 overflow-auto pr-1">
                                {groupedEndpoints.map((serviceGroup) => (
                                    <div key={serviceGroup.serviceName}>
                                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{serviceGroup.serviceName}</div>
                                        <div className="space-y-2">
                                            {serviceGroup.categories.map((categoryGroup) => {
                                                const open = openEndpointGroups[categoryGroup.key] ?? false;
                                                return (
                                                    <div key={categoryGroup.key} className="rounded-[22px] border border-slate-200 bg-slate-50/90 px-3 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setOpenEndpointGroups((current) => ({ ...current, [categoryGroup.key]: !open }))}
                                                            className="flex w-full items-center justify-between gap-3 text-left"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {open ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                                                                <span className="text-sm font-medium capitalize text-slate-800">{categoryGroup.category}</span>
                                                            </div>
                                                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500">
                                                                {categoryGroup.items.length}
                                                            </span>
                                                        </button>
                                                        {open ? (
                                                            <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                                                                {categoryGroup.items.map((item) => {
                                                                    const active = item.id === selectedEndpointId;
                                                                    return (
                                                                        <button
                                                                            key={item.id}
                                                                            type="button"
                                                                            onClick={() => setSelectedEndpointId(item.id)}
                                                                            className={`w-full rounded-[20px] border px-3 py-3 text-left transition ${
                                                                                active
                                                                                    ? 'border-slate-900 bg-slate-900 text-white shadow-[0_14px_32px_rgba(15,23,42,0.16)]'
                                                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-start justify-between gap-3">
                                                                                <div className="min-w-0">
                                                                                    <div className="truncate font-medium">{item.name}</div>
                                                                                    <div className={`mt-1 truncate text-xs ${active ? 'text-slate-300' : 'text-slate-500'}`}>{item.path}</div>
                                                                                </div>
                                                                                {item.isSystem ? <span className={`rounded-full px-2 py-1 text-[10px] ${active ? 'bg-white/14 text-white' : 'bg-slate-100 text-slate-500'}`}>内置</span> : null}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <section className="min-h-0 overflow-y-auto rounded-[30px] border border-white/70 bg-white/84 p-4 shadow-[0_22px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                        {selectedEndpoint ? (
                            <div className="flex min-h-full flex-col">
                                <div className="rounded-[26px] border border-slate-200 bg-slate-50/90 p-4">
                                    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.18fr)_minmax(380px,0.92fr)]">
                                        <div className="rounded-[24px] border border-white/80 bg-white px-5 py-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                                                            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-white">
                                                                {selectedEndpoint.method}
                                                            </span>
                                                            <span>{selectedEndpoint.serviceName}</span>
                                                            <span>/</span>
                                                            <span>{selectedEndpoint.category}</span>
                                                        </div>
                                                        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                                                            {selectedEndpoint.name}
                                                        </h2>
                                                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                                                            {selectedEndpoint.description || '暂无描述'}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2 xl:justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowEndpointDetailModal(true)}
                                                            title="接口详情"
                                                            aria-label="接口详情"
                                                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingEndpoint(selectedEndpoint);
                                                                setShowEndpointModal(true);
                                                            }}
                                                            title="编辑接口"
                                                            aria-label="编辑接口"
                                                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                                                        >
                                                            <Settings2 size={15} />
                                                        </button>
                                                        {selectedEndpoint.docUrl ? (
                                                            <a
                                                                href={selectedEndpoint.docUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                title="打开文档"
                                                                aria-label="打开文档"
                                                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                                                            >
                                                                <Link2 size={15} />
                                                            </a>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(30,41,59,0.96)_58%,rgba(8,47,73,0.94)_100%)] px-4 py-4 text-white shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
                                                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                                实时请求 URL
                                                            </div>
                                                            <div className="mt-1 text-xs text-slate-400">
                                                                随环境、Query 和请求体联动刷新
                                                            </div>
                                                        </div>
                                                        {currentRequestPreview ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    void copyToClipboard(
                                                                        currentRequestPreview.requestUrl,
                                                                    ).then(() =>
                                                                        setNotice('已复制实时请求 URL。'),
                                                                    )
                                                                }
                                                                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/14 hover:text-white"
                                                            >
                                                                <Copy size={12} />
                                                                复制 URL
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                    <div className="break-all font-mono text-xs leading-6 text-slate-100">
                                                        {currentRequestPreview?.requestUrl || selectedEndpoint.path}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-4">
                                            <div className="rounded-[24px] border border-white/80 bg-white px-4 py-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                            当前环境
                                                        </div>
                                                        <div className="mt-2 text-lg font-semibold text-slate-900">
                                                            {selectedEnv ? selectedEnv.name : '未选择环境'}
                                                        </div>
                                                    </div>
                                                    {serviceEnvs.length ? (
                                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                                                            {serviceEnvs.length} 个环境
                                                        </span>
                                                    ) : null}
                                                </div>

                                                {serviceEnvs.length ? (
                                                    <>
                                                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                                            <select
                                                                value={selectedEnvId}
                                                                onChange={(event) =>
                                                                    setSelectedEnvId(event.target.value)
                                                                }
                                                                className="h-11 min-w-0 flex-1 rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-900"
                                                            >
                                                                {serviceEnvs.map((env) => (
                                                                    <option key={env.id} value={env.id}>
                                                                        {env.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowEnvDetailModal(true)}
                                                                    disabled={!selectedEnv}
                                                                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                                                                    title="环境详情"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (selectedEnv) {
                                                                            setEditingEnv(selectedEnv);
                                                                            setShowEnvModal(true);
                                                                        }
                                                                    }}
                                                                    disabled={!selectedEnv}
                                                                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                                                                    title="编辑环境"
                                                                >
                                                                    <Settings2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                                                            {selectedEnv?.baseUrl ? (
                                                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                                                                    Base URL 已配置
                                                                </span>
                                                            ) : null}
                                                            {selectedEnv?.apiKey ? (
                                                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                                                                    Key 已配置
                                                                </span>
                                                            ) : (
                                                                <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">
                                                                    Key 未配置
                                                                </span>
                                                            )}
                                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                                                                Timeout · {selectedEnv?.timeoutMs || '--'}ms
                                                            </span>
                                                            <span
                                                                className={`rounded-full px-2.5 py-1 font-medium ${
                                                                    currentJsonError
                                                                        ? 'bg-amber-100 text-amber-700'
                                                                        : 'bg-emerald-100 text-emerald-700'
                                                                }`}
                                                            >
                                                                {currentJsonError
                                                                    ? 'JSON 待修正'
                                                                    : 'JSON 正常'}
                                                            </span>
                                                        </div>
                                                        <div className="mt-3 text-xs leading-5 text-slate-500">
                                                            环境相关操作固定放在这里，不再和执行按钮挤在同一排。
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="mt-4 rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                                                        <div>当前还没有可用环境，请先新增你自己的环境配置。</div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingEnv(null);
                                                                setShowEnvModal(true);
                                                            }}
                                                            className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                                                        >
                                                            <Plus size={14} />
                                                            新增环境
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="rounded-[24px] border border-slate-900/5 bg-[linear-gradient(145deg,rgba(15,23,42,0.98)_0%,rgba(30,41,59,0.96)_60%,rgba(15,118,110,0.92)_100%)] px-4 py-4 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                                                <div className="mb-4 flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                                                            快捷动作
                                                        </div>
                                                        <div className="mt-2 text-lg font-semibold text-white">
                                                            执行、查看、沉淀样例
                                                        </div>
                                                    </div>
                                                    {selectedEndpoint.method === 'WS' ? (
                                                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200">
                                                            WS 仅支持命令预览
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-300">
                                                    <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1">
                                                        {selectedEndpoint.serviceName}
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1">
                                                        {selectedEndpoint.category}
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1">
                                                        {selectedEndpoint.contentType}
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1">
                                                        返回 · {selectedEndpoint.responseType}
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1">
                                                        {selectedEndpoint.authType === 'none'
                                                            ? '免鉴权'
                                                            : `Auth · ${selectedEndpoint.authType}`}
                                                    </span>
                                                    {runResult ? (
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 font-medium ${
                                                                runResult.ok
                                                                    ? 'bg-emerald-400/18 text-emerald-100'
                                                                    : 'bg-rose-400/18 text-rose-100'
                                                            }`}
                                                        >
                                                            {runResult.status || 'ERR'} ·{' '}
                                                            {isExampleRunResult(runResult)
                                                                ? '样例'
                                                                : `${runResult.durationMs}ms`}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPacketModal(true)}
                                                        className="inline-flex min-h-[54px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] border border-white/12 bg-white/8 px-4 text-sm font-medium text-white transition hover:bg-white/14"
                                                    >
                                                        <FileCode2 size={16} />
                                                        查看报文
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCurlModal(true)}
                                                        className="inline-flex min-h-[54px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] border border-white/12 bg-white/8 px-4 text-sm font-medium text-white transition hover:bg-white/14"
                                                    >
                                                        <Eye size={16} />
                                                        {selectedEndpoint.method === 'WS'
                                                            ? '查看连接命令'
                                                            : '查看 curl'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={runRequest}
                                                        disabled={
                                                            running ||
                                                            !selectedEnv ||
                                                            selectedEndpoint.method === 'WS'
                                                        }
                                                        className="inline-flex min-h-[60px] items-center justify-center gap-2 whitespace-nowrap rounded-[20px] bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                                                    >
                                                        {running ? (
                                                            <RefreshCw size={16} className="animate-spin" />
                                                        ) : (
                                                            <Play size={16} />
                                                        )}
                                                        {selectedEndpoint.method === 'WS'
                                                            ? '页面内暂不执行 WS'
                                                            : running
                                                              ? '执行中...'
                                                              : '执行请求'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={saveCurrentAsExample}
                                                        disabled={!runResult}
                                                        className="inline-flex min-h-[54px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] border border-white/12 bg-white/8 px-4 text-sm font-medium text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <Save size={16} />
                                                        保存为样例
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={createMonitor}
                                                        disabled={
                                                            !selectedEnv || selectedEndpoint.method === 'WS'
                                                        }
                                                        className="inline-flex min-h-[54px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] border border-white/12 bg-white/8 px-4 text-sm font-medium text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <Activity size={16} />
                                                        加入巡检
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-[26px] border border-slate-200 bg-white/92">
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                                        <div className="inline-flex flex-wrap rounded-full border border-slate-200 bg-slate-50 p-1">
                                            {[
                                                { key: 'body', label: '请求体' },
                                                { key: 'query', label: 'Query' },
                                                { key: 'headers', label: 'Headers' },
                                                ...(selectedEndpoint.contentType === 'multipart/form-data'
                                                    ? [{ key: 'file', label: '文件' }]
                                                    : []),
                                            ].map((tab) => (
                                                <button
                                                    key={tab.key}
                                                    type="button"
                                                    onClick={() =>
                                                        openRequestEditor(
                                                            tab.key as 'body' | 'query' | 'headers' | 'file',
                                                        )
                                                    }
                                                    className={`rounded-full px-3 py-1.5 text-sm transition ${
                                                        requestTab === tab.key
                                                            ? 'bg-slate-900 text-white'
                                                            : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                                    }`}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowRequestEditorModal(true)}
                                                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
                                            >
                                                弹窗编辑
                                            </button>
                                            <button type="button" onClick={formatCurrentRequestTab} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                                                格式化当前
                                            </button>
                                            <button type="button" onClick={() => { setBodyText(formatJson(selectedEndpoint.requestTemplate)); setQueryText(formatJson(selectedEndpoint.queryTemplate)); setHeaderText(formatJson(selectedEndpoint.headerTemplate)); setSelectedFile(null); setNotice('已恢复为接口默认模板。'); }} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                                                重置为模板
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3">
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900">
                                                    请求配置改为弹窗编辑
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    主界面只保留摘要，点击任意卡片即可打开完整编辑器。
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                                {selectedEnv ? (
                                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                                        环境 · {selectedEnv.name}
                                                    </span>
                                                ) : null}
                                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                                    Method · {selectedEndpoint.method}
                                                </span>
                                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                                    {selectedEndpoint.contentType}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`grid gap-3 ${selectedEndpoint.contentType === 'multipart/form-data' ? 'lg:grid-cols-4' : 'md:grid-cols-3'}`}>
                                            <button
                                                type="button"
                                                onClick={() => openRequestEditor('body')}
                                                className={`rounded-[22px] border px-4 py-4 text-left transition hover:-translate-y-0.5 ${
                                                    requestTab === 'body'
                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                                                }`}
                                            >
                                                <div className={`text-xs font-semibold uppercase tracking-[0.16em] ${requestTab === 'body' ? 'text-slate-300' : 'text-slate-400'}`}>
                                                    请求体
                                                </div>
                                                <div className="mt-2 text-base font-semibold">
                                                    {bodyDraftSummary.title}
                                                </div>
                                                <div className={`mt-2 text-xs leading-5 ${requestTab === 'body' ? 'text-slate-200' : bodyDraftSummary.isError ? 'text-amber-700' : 'text-slate-500'}`}>
                                                    {bodyDraftSummary.detail}
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openRequestEditor('query')}
                                                className={`rounded-[22px] border px-4 py-4 text-left transition hover:-translate-y-0.5 ${
                                                    requestTab === 'query'
                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                                                }`}
                                            >
                                                <div className={`text-xs font-semibold uppercase tracking-[0.16em] ${requestTab === 'query' ? 'text-slate-300' : 'text-slate-400'}`}>
                                                    Query
                                                </div>
                                                <div className="mt-2 text-base font-semibold">
                                                    {queryDraftSummary.title}
                                                </div>
                                                <div className={`mt-2 text-xs leading-5 ${requestTab === 'query' ? 'text-slate-200' : queryDraftSummary.isError ? 'text-amber-700' : 'text-slate-500'}`}>
                                                    {queryDraftSummary.detail}
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openRequestEditor('headers')}
                                                className={`rounded-[22px] border px-4 py-4 text-left transition hover:-translate-y-0.5 ${
                                                    requestTab === 'headers'
                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                                                }`}
                                            >
                                                <div className={`text-xs font-semibold uppercase tracking-[0.16em] ${requestTab === 'headers' ? 'text-slate-300' : 'text-slate-400'}`}>
                                                    Headers
                                                </div>
                                                <div className="mt-2 text-base font-semibold">
                                                    {headerDraftSummary.title}
                                                </div>
                                                <div className={`mt-2 text-xs leading-5 ${requestTab === 'headers' ? 'text-slate-200' : headerDraftSummary.isError ? 'text-amber-700' : 'text-slate-500'}`}>
                                                    {headerDraftSummary.detail}
                                                </div>
                                            </button>

                                            {selectedEndpoint.contentType === 'multipart/form-data' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => openRequestEditor('file')}
                                                    className={`rounded-[22px] border px-4 py-4 text-left transition hover:-translate-y-0.5 ${
                                                        requestTab === 'file'
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                                                            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                                                    }`}
                                                >
                                                    <div className={`text-xs font-semibold uppercase tracking-[0.16em] ${requestTab === 'file' ? 'text-slate-300' : 'text-slate-400'}`}>
                                                        文件
                                                    </div>
                                                    <div className="mt-2 text-base font-semibold">
                                                        {selectedFile ? '已选择文件' : '未选择文件'}
                                                    </div>
                                                    <div className={`mt-2 text-xs leading-5 ${requestTab === 'file' ? 'text-slate-200' : 'text-slate-500'}`}>
                                                        {selectedFile
                                                            ? selectedFile.name
                                                            : `字段名 ${selectedEndpoint.fileFieldName || 'file'}`}
                                                    </div>
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full min-h-[55vh] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 text-slate-500">还没有接口，先新增一个接口模板。</div>
                        )}
                    </section>

                    <aside className="min-h-0 flex flex-col gap-4">
                        <div className="min-h-0 flex-[1.15] overflow-hidden rounded-[30px] border border-white/70 bg-white/84 p-4 shadow-[0_22px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                            <div className="flex h-full flex-col">
                                <SectionTitle
                                    icon={Globe}
                                    title="响应结果"
                                    action={
                                        runResult ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const curlToCopy = isExampleRunResult(runResult) ? curlPreview : runResult.curlCommand;
                                                    void copyToClipboard(curlToCopy).then(() =>
                                                        setNotice(
                                                            isExampleRunResult(runResult)
                                                                ? '已复制当前样例对应的 curl。'
                                                                : '已复制最近执行生成的 curl。',
                                                        ),
                                                    );
                                                }}
                                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                            >
                                                <Copy size={14} />
                                                {isExampleRunResult(runResult) ? '当前 curl' : '最近 curl'}
                                            </button>
                                        ) : null
                                    }
                                />
                                {runResult ? (
                                    <div className="grid min-h-0 flex-1 grid-rows-[auto_auto_1fr] gap-4">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Status</div>
                                                <div className={`mt-1 font-semibold ${runResult.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{runResult.status || 'ERR'}</div>
                                            </div>
                                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{isExampleRunResult(runResult) ? 'Preview' : 'Duration'}</div>
                                                <div className="mt-1 font-semibold text-slate-900">{isExampleRunResult(runResult) ? '样例返回' : `${runResult.durationMs} ms`}</div>
                                            </div>
                                        </div>
                                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                            <div className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400">Request URL</div>
                                            <div className="break-all font-mono text-xs leading-6 text-slate-700">{runResult.requestUrl}</div>
                                        </div>
                                        <div className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-slate-950 px-4 py-3 text-white">
                                            <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
                                                <div className="inline-flex flex-wrap rounded-full border border-white/10 bg-white/5 p-1">
                                                    {[
                                                        { key: 'body', label: isExampleRunResult(runResult) ? '样例返回' : '返回体' },
                                                        { key: 'request', label: '请求报文' },
                                                        { key: 'headers', label: '响应头' },
                                                    ].map((tab) => (
                                                        <button
                                                            key={tab.key}
                                                            type="button"
                                                            onClick={() => setResponseTab(tab.key as 'body' | 'request' | 'headers')}
                                                            className={`rounded-full px-3 py-1.5 text-xs transition ${
                                                                responseTab === tab.key
                                                                    ? 'bg-white text-slate-900'
                                                                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                                            }`}
                                                        >
                                                            {tab.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {responseTab === 'body' && runResult.responseBody && !isAudioResult(selectedEndpoint, runResult) ? <button type="button" onClick={() => void copyToClipboard(runResult.responseBody || '').then(() => setNotice('已复制返回内容。'))} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/14"><Copy size={14} />复制</button> : null}
                                                    {responseTab === 'body' && runResult.responseBody ? <button type="button" onClick={() => setShowResponseBodyModal(true)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/14"><Eye size={14} />查看代码</button> : null}
                                                    {responseTab === 'request' ? <button type="button" onClick={() => void copyToClipboard(JSON.stringify({ url: runResult.requestUrl, headers: runResult.requestHeaders, query: runResult.requestQuery, body: runResult.requestBody, files: runResult.requestFiles }, null, 2)).then(() => setNotice('已复制请求报文。'))} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/14"><Copy size={14} />复制</button> : null}
                                                    {responseTab === 'headers' ? <button type="button" onClick={() => void copyToClipboard(formatJson(runResult.responseHeaders)).then(() => setNotice('已复制响应头。'))} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/14"><Copy size={14} />复制</button> : null}
                                                    <button type="button" onClick={() => setShowCurlModal(true)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/14">
                                                        <Eye size={14} />
                                                        查看 curl
                                                    </button>
                                                </div>
                                            </div>
                                            {runResult.errorMessage ? <div className="mb-3 shrink-0 rounded-[18px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{runResult.errorMessage}</div> : null}
                                            {responseTab === 'body' ? (
                                                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                                                    {isAudioResult(selectedEndpoint, runResult) && runResult.responseBody ? (
                                                        <div className="flex h-full flex-col justify-center">
                                                            <div className="rounded-[18px] border border-slate-800 bg-slate-900 px-3 py-3">
                                                                <div className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400">Audio Preview</div>
                                                                <audio controls className="w-full" src={`data:${typeof runResult.responseHeaders['content-type'] === 'string' ? runResult.responseHeaders['content-type'] : 'audio/mpeg'};base64,${runResult.responseBody}`} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-6 text-slate-100">{runResult.responseBody || '<empty>'}</pre>
                                                    )}
                                                </div>
                                            ) : null}
                                            {responseTab === 'request' ? (
                                                <div className="grid min-h-0 flex-1 gap-3 overflow-auto">
                                                    <DetailBlock label="Request Headers" value={formatJson(runResult.requestHeaders)} mono tone="dark" />
                                                    <DetailBlock label="Request Query" value={formatJson(runResult.requestQuery)} mono tone="dark" />
                                                    <DetailBlock label="Request Body" value={runResult.requestBody || '<empty>'} mono tone="dark" />
                                                    <DetailBlock label="Uploaded Files" value={formatJson(runResult.requestFiles)} mono tone="dark" />
                                                </div>
                                            ) : null}
                                            {responseTab === 'headers' ? (
                                                <div className="min-h-0 flex-1 overflow-auto">
                                                    <DetailBlock label="Response Headers" value={formatJson(runResult.responseHeaders)} mono tone="dark" />
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex h-full items-center justify-center rounded-[26px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">执行一次接口，或加载推荐样例后，这里会显示状态码和返回体。</div>
                                )}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-hidden rounded-[30px] border border-white/70 bg-white/84 p-4 shadow-[0_22px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                            <div className="flex h-full flex-col">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-slate-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
                                            <Save size={18} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-slate-900">样例 / 日志 / 巡检</h2>
                                        </div>
                                    </div>
                                    {activityTab === 'monitors' ? (
                                        <button type="button" onClick={() => void runMonitors()} disabled={runningMonitors || !monitors.length} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
                                            {runningMonitors ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
                                            运行全部
                                        </button>
                                    ) : null}
                                </div>
                                <div className="mb-3 inline-flex flex-wrap rounded-full border border-slate-200 bg-slate-50 p-1">
                                    {[
                                        { key: 'examples', label: `样例 (${examples.length})` },
                                        { key: 'logs', label: `日志 (${logs.length})` },
                                        { key: 'monitors', label: `巡检 (${visibleMonitors.length})` },
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setActivityTab(tab.key as 'examples' | 'logs' | 'monitors')}
                                            className={`rounded-full px-3 py-1.5 text-sm transition ${
                                                activityTab === tab.key
                                                    ? 'bg-slate-900 text-white'
                                                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="min-h-0 flex-1 overflow-auto pr-1">
                                    {activityTab === 'examples' ? (
                                        examples.length ? (
                                            <div className="space-y-2">
                                                {examples.map((example) => (
                                                    <button key={example.id} type="button" onClick={() => applyExample(example)} className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="font-medium text-slate-900">{example.name}</div>
                                                                <div className="mt-1 text-xs text-slate-500">{example.responseStatus || '--'} · {example.responseBodyFormat}</div>
                                                            </div>
                                                            {example.isRecommended ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-700">推荐</span> : null}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">还没有样例，执行成功后可保存。</div>
                                    ) : null}

                                    {activityTab === 'logs' ? (
                                        logs.length ? (
                                            <div className="space-y-2">
                                                {logs.map((log) => (
                                                    <button key={log.id} type="button" onClick={() => { setRunResult(extractLogResult(log)); setNotice('已切换到历史运行记录。'); }} className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div>
                                                                <div className="font-medium text-slate-900">{log.responseStatus || 'ERR'} · {log.durationMs}ms</div>
                                                                <div className="mt-1 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</div>
                                                            </div>
                                                            <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${log.isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{log.isSuccess ? '成功' : '失败'}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">还没有运行记录。</div>
                                    ) : null}

                                    {activityTab === 'monitors' ? (
                                        visibleMonitors.length ? (
                                            <div className="space-y-2">
                                                {visibleMonitors.map((monitor) => {
                                                    const latestRun = latestMonitorRunById.get(monitor.id);
                                                    const env = envs.find((item) => item.id === monitor.envId);
                                                    return (
                                                        <div key={monitor.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <div className="font-medium text-slate-900">{monitor.name}</div>
                                                                    <div className="mt-1 text-xs text-slate-500">{env?.name || '未知环境'} · 期望 {monitor.expectedStatus} · {monitor.maxDurationMs}ms</div>
                                                                </div>
                                                                <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${monitor.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{monitor.isActive ? '启用' : '暂停'}</span>
                                                            </div>
                                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                                <button type="button" onClick={() => void runMonitors(monitor.id)} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-white hover:text-slate-900">
                                                                    运行
                                                                </button>
                                                                <button type="button" onClick={() => void toggleMonitor(monitor)} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-white hover:text-slate-900">
                                                                    {monitor.isActive ? '暂停' : '启用'}
                                                                </button>
                                                                {latestRun ? (
                                                                    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${latestRun.isPassing ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                        {latestRun.statusCode || 'ERR'} · {latestRun.durationMs}ms
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            {latestRun?.failureReason ? <div className="mt-2 text-xs leading-5 text-rose-600">{latestRun.failureReason}</div> : null}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">还没有巡检项，可以把当前接口加入巡检。</div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
            {showEnvDetailModal && selectedEnv ? (
                <QuickViewModal
                    title={`环境详情 · ${selectedEnv.name}`}
                    subtitle={`${selectedEnv.serviceName} / ${selectedEnv.serviceKey}`}
                    onClose={() => setShowEnvDetailModal(false)}
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <DetailBlock
                            label="Base URL"
                            value={selectedEnv.baseUrl}
                            mono
                            onCopy={() => void copyToClipboard(selectedEnv.baseUrl).then(() => setNotice('已复制 Base URL。'))}
                        />
                        <DetailBlock
                            label="WebSocket URL"
                            value={selectedEnv.websocketUrl || '未配置'}
                            mono
                            onCopy={() =>
                                void copyToClipboard(selectedEnv.websocketUrl || '').then(() =>
                                    setNotice('已复制 WebSocket URL。'),
                                )
                            }
                        />
                        <DetailBlock
                            label="API Key"
                            value={selectedEnv.apiKey || '未配置'}
                            mono
                            onCopy={() =>
                                void copyToClipboard(selectedEnv.apiKey || '').then(() =>
                                    setNotice('已复制 API Key。'),
                                )
                            }
                        />
                        <DetailBlock
                            label="Timeout"
                            value={`${selectedEnv.timeoutMs} ms`}
                            onCopy={() =>
                                void copyToClipboard(String(selectedEnv.timeoutMs)).then(() =>
                                    setNotice('已复制 Timeout。'),
                                )
                            }
                        />
                    </div>
                    <div className="mt-4">
                        <DetailBlock
                            label="Extra Headers"
                            value={formatJson(selectedEnv.extraHeaders)}
                            mono
                            onCopy={() =>
                                void copyToClipboard(formatJson(selectedEnv.extraHeaders)).then(() =>
                                    setNotice('已复制额外 Headers。'),
                                )
                            }
                        />
                    </div>
                </QuickViewModal>
            ) : null}

            {showEndpointDetailModal && selectedEndpoint ? (
                <QuickViewModal
                    title={`接口详情 · ${selectedEndpoint.name}`}
                    subtitle={`${selectedEndpoint.serviceName} / ${selectedEndpoint.category}`}
                    onClose={() => setShowEndpointDetailModal(false)}
                    action={
                        selectedEndpoint.docUrl ? (
                            <a
                                href={selectedEndpoint.docUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <Link2 size={14} />
                                打开文档
                            </a>
                        ) : null
                    }
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <DetailBlock
                            label="Path"
                            value={selectedEndpoint.path}
                            mono
                            onCopy={() =>
                                void copyToClipboard(selectedEndpoint.path).then(() =>
                                    setNotice('已复制接口 Path。'),
                                )
                            }
                        />
                        <DetailBlock
                            label="Notes"
                            value={selectedEndpoint.notes || '暂无备注'}
                            onCopy={() =>
                                void copyToClipboard(selectedEndpoint.notes || '').then(() =>
                                    setNotice('已复制接口备注。'),
                                )
                            }
                        />
                    </div>
                    <div className="mt-4 grid gap-4">
                        <DetailBlock
                            label="Request Template"
                            value={formatJson(selectedEndpoint.requestTemplate)}
                            mono
                            onCopy={() =>
                                void copyToClipboard(formatJson(selectedEndpoint.requestTemplate)).then(() =>
                                    setNotice('已复制请求模板。'),
                                )
                            }
                        />
                        <DetailBlock
                            label="Query Template"
                            value={formatJson(selectedEndpoint.queryTemplate)}
                            mono
                            onCopy={() =>
                                void copyToClipboard(formatJson(selectedEndpoint.queryTemplate)).then(() =>
                                    setNotice('已复制 Query 模板。'),
                                )
                            }
                        />
                        <DetailBlock
                            label="Header Template"
                            value={formatJson(selectedEndpoint.headerTemplate)}
                            mono
                            onCopy={() =>
                                void copyToClipboard(formatJson(selectedEndpoint.headerTemplate)).then(() =>
                                    setNotice('已复制 Header 模板。'),
                                )
                            }
                        />
                    </div>
                </QuickViewModal>
            ) : null}

            {showRequestEditorModal && selectedEndpoint ? (
                <QuickViewModal
                    title={`请求配置 · ${selectedEndpoint.name}`}
                    subtitle="请求体 / Query / Headers / 文件都改为弹窗编辑"
                    onClose={() => setShowRequestEditorModal(false)}
                    maxWidthClass="max-w-5xl"
                    action={
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={formatCurrentRequestTab}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                格式化当前
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setBodyText(formatJson(selectedEndpoint.requestTemplate));
                                    setQueryText(formatJson(selectedEndpoint.queryTemplate));
                                    setHeaderText(formatJson(selectedEndpoint.headerTemplate));
                                    setSelectedFile(null);
                                    setNotice('已恢复为接口默认模板。');
                                }}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                重置为模板
                            </button>
                        </div>
                    }
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3">
                            <div className="inline-flex flex-wrap rounded-full border border-slate-200 bg-white p-1">
                                {[
                                    { key: 'body', label: '请求体' },
                                    { key: 'query', label: 'Query' },
                                    { key: 'headers', label: 'Headers' },
                                    ...(selectedEndpoint.contentType === 'multipart/form-data'
                                        ? [{ key: 'file', label: '文件' }]
                                        : []),
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() =>
                                            setRequestTab(
                                                tab.key as 'body' | 'query' | 'headers' | 'file',
                                            )
                                        }
                                        className={`rounded-full px-3 py-1.5 text-sm transition ${
                                            requestTab === tab.key
                                                ? 'bg-slate-900 text-white'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                {selectedEnv ? (
                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                        环境 · {selectedEnv.name}
                                    </span>
                                ) : null}
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                    Method · {selectedEndpoint.method}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                    {selectedEndpoint.contentType}
                                </span>
                            </div>
                        </div>

                        {requestTab === 'body' ? (
                            <textarea
                                value={bodyText}
                                onChange={(event) => setBodyText(event.target.value)}
                                rows={22}
                                className="min-h-[56vh] w-full rounded-[24px] border border-slate-200 px-4 py-3 font-mono text-xs leading-6 text-slate-700 outline-none transition focus:border-slate-900"
                            />
                        ) : null}
                        {requestTab === 'query' ? (
                            <textarea
                                value={queryText}
                                onChange={(event) => setQueryText(event.target.value)}
                                rows={22}
                                className="min-h-[56vh] w-full rounded-[24px] border border-slate-200 px-4 py-3 font-mono text-xs leading-6 text-slate-700 outline-none transition focus:border-slate-900"
                            />
                        ) : null}
                        {requestTab === 'headers' ? (
                            <textarea
                                value={headerText}
                                onChange={(event) => setHeaderText(event.target.value)}
                                rows={22}
                                className="min-h-[56vh] w-full rounded-[24px] border border-slate-200 px-4 py-3 font-mono text-xs leading-6 text-slate-700 outline-none transition focus:border-slate-900"
                            />
                        ) : null}
                        {requestTab === 'file' ? (
                            <div className="flex min-h-[56vh] items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 p-6">
                                <div className="w-full max-w-2xl text-center">
                                    <div className="mb-3 text-sm font-medium text-slate-700">上传文件</div>
                                    <input
                                        type="file"
                                        accept={selectedEndpoint.fileAccept || undefined}
                                        onChange={(event) =>
                                            setSelectedFile(event.target.files?.[0] || null)
                                        }
                                        className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
                                    />
                                    <div className="mt-3 text-xs text-slate-500">
                                        字段名：{selectedEndpoint.fileFieldName || 'file'}{' '}
                                        {selectedEndpoint.fileAccept
                                            ? `· accept: ${selectedEndpoint.fileAccept}`
                                            : ''}
                                    </div>
                                    {selectedFile ? (
                                        <div className="mt-3 rounded-full bg-white px-3 py-2 text-xs text-slate-600">
                                            已选择：{selectedFile.name}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </QuickViewModal>
            ) : null}

            {showResponseBodyModal && runResult ? (
                <QuickViewModal
                    title={isAudioResult(selectedEndpoint, runResult) ? '音频返回代码' : '返回代码'}
                    subtitle={selectedEndpoint?.name || '当前响应'}
                    onClose={() => setShowResponseBodyModal(false)}
                    maxWidthClass="max-w-5xl"
                    action={
                        runResult.responseBody ? (
                            <button
                                type="button"
                                onClick={() =>
                                    void copyToClipboard(runResult.responseBody || '').then(() =>
                                        setNotice('已复制返回代码。'),
                                    )
                                }
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <Copy size={14} />
                                复制代码
                            </button>
                        ) : null
                    }
                >
                    <DetailBlock
                        label={isAudioResult(selectedEndpoint, runResult) ? 'Audio Response Data' : 'Response Body'}
                        value={runResult.responseBody || '<empty>'}
                        mono
                    />
                </QuickViewModal>
            ) : null}

            {showCurlModal ? (
                <QuickViewModal
                    title={selectedEndpoint?.method === 'WS' ? '连接命令预览' : 'curl 预览'}
                    subtitle={selectedEndpoint?.name || '未选择接口'}
                    onClose={() => setShowCurlModal(false)}
                    maxWidthClass="max-w-5xl"
                    action={
                        <button
                            type="button"
                            onClick={() =>
                                void copyToClipboard(curlPreview).then(() =>
                                    setNotice(
                                        selectedEndpoint?.method === 'WS'
                                            ? '已复制当前连接命令。'
                                            : '已复制当前 curl。',
                                    ),
                                )
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                            <Copy size={14} />
                            {selectedEndpoint?.method === 'WS' ? '复制命令' : '复制 curl'}
                        </button>
                    }
                >
                    <DetailBlock
                        label={selectedEndpoint?.method === 'WS' ? 'Connection Command' : 'cURL'}
                        value={curlPreview}
                        mono
                    />
                </QuickViewModal>
            ) : null}

            {showPacketModal ? (
                <QuickViewModal
                    title="报文中心"
                    subtitle={selectedEndpoint?.name || '未选择接口'}
                    onClose={() => setShowPacketModal(false)}
                    maxWidthClass="max-w-5xl"
                    action={
                        packetModalCopyText ? (
                            <button
                                type="button"
                                onClick={() =>
                                    void copyToClipboard(packetModalCopyText).then(() =>
                                        setNotice('已复制当前报文视图。'),
                                    )
                                }
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <Copy size={14} />
                                复制报文
                            </button>
                        ) : null
                    }
                >
                    {currentRequestPreview ? (
                        <div>
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                                    当前待发请求
                                </span>
                                <span className="text-sm text-slate-500">
                                    这里会跟随当前请求配置实时变化。
                                </span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <DetailBlock
                                    label="Request URL"
                                    value={currentRequestPreview.requestUrl}
                                    mono
                                    onCopy={() =>
                                        void copyToClipboard(
                                            currentRequestPreview.requestUrl,
                                        ).then(() => setNotice('已复制当前请求 URL。'))
                                    }
                                />
                                <DetailBlock
                                    label="Method / Env"
                                    value={`${currentRequestPreview.requestMethod} · ${
                                        selectedEnv?.name || '未选择环境'
                                    }`}
                                />
                            </div>
                            <div className="mt-4 grid gap-4">
                                <DetailBlock
                                    label="Request Headers"
                                    value={formatJson(currentRequestPreview.requestHeaders)}
                                    mono
                                />
                                <DetailBlock
                                    label="Request Query"
                                    value={formatJson(currentRequestPreview.requestQuery)}
                                    mono
                                />
                                <DetailBlock
                                    label="Request Body"
                                    value={currentRequestPreview.requestBody || '<empty>'}
                                    mono
                                />
                                <DetailBlock
                                    label="Uploaded Files"
                                    value={formatJson(currentRequestPreview.requestFiles)}
                                    mono
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                            {currentJsonError
                                ? `当前请求配置里有 JSON 错误：${currentJsonError}`
                                : '先选择环境并补全请求配置后，这里会显示完整待发报文。'}
                        </div>
                    )}

                    {runResult ? (
                        <div className="mt-8">
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                        runResult.ok
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700'
                                    }`}
                                >
                                    最近一次执行
                                </span>
                                <span className="text-sm text-slate-500">
                                    这里保留真实发出的请求和收到的响应。
                                </span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <DetailBlock label="Status" value={String(runResult.status || 'ERR')} />
                                <DetailBlock
                                    label={isExampleRunResult(runResult) ? 'Preview' : 'Duration'}
                                    value={
                                        isExampleRunResult(runResult)
                                            ? '样例返回'
                                            : `${runResult.durationMs} ms`
                                    }
                                />
                                <DetailBlock
                                    label="Request URL"
                                    value={runResult.requestUrl}
                                    mono
                                    onCopy={() =>
                                        void copyToClipboard(runResult.requestUrl).then(() =>
                                            setNotice('已复制最近一次请求 URL。'),
                                        )
                                    }
                                />
                            </div>
                            <div className="mt-4 grid gap-4">
                                <DetailBlock
                                    label="Request Headers"
                                    value={formatJson(runResult.requestHeaders)}
                                    mono
                                />
                                <DetailBlock
                                    label="Request Query"
                                    value={formatJson(runResult.requestQuery)}
                                    mono
                                />
                                <DetailBlock
                                    label="Request Body"
                                    value={runResult.requestBody || '<empty>'}
                                    mono
                                />
                                <DetailBlock
                                    label="Uploaded Files"
                                    value={formatJson(runResult.requestFiles)}
                                    mono
                                />
                                <DetailBlock
                                    label="Response Headers"
                                    value={formatJson(runResult.responseHeaders)}
                                    mono
                                />
                                <DetailBlock
                                    label={
                                        isExampleRunResult(runResult) ? 'Example Response' : 'Response Body'
                                    }
                                    value={runResult.responseBody || '<empty>'}
                                    mono
                                />
                            </div>
                        </div>
                    ) : null}
                </QuickViewModal>
            ) : null}

            {showEnvModal ? (
                <EnvModal
                    env={editingEnv}
                    defaultServiceKey={selectedEndpoint?.serviceKey}
                    defaultServiceName={selectedEndpoint?.serviceName}
                    onClose={() => {
                        setShowEnvModal(false);
                        setEditingEnv(null);
                    }}
                    onSaved={onEnvSaved}
                />
            ) : null}

            {showEndpointModal ? (
                <EndpointModal
                    endpoint={editingEndpoint}
                    defaultServiceKey={selectedEndpoint?.serviceKey}
                    defaultServiceName={selectedEndpoint?.serviceName}
                    onClose={() => {
                        setShowEndpointModal(false);
                        setEditingEndpoint(null);
                    }}
                    onSaved={onEndpointSaved}
                />
            ) : null}
        </main>
    );
}
