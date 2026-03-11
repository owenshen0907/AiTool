'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
    Activity,
    Copy,
    FileCode2,
    Globe,
    Link2,
    Play,
    Plus,
    RefreshCw,
    Save,
    Settings2,
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

function EnvModal({ env, defaultServiceKey, defaultServiceName, onClose, onSaved }: EnvModalProps) {
    const [serviceKey, setServiceKey] = useState(env?.serviceKey || defaultServiceKey || 'stepfun');
    const [serviceName, setServiceName] = useState(env?.serviceName || defaultServiceName || 'Stepfun');
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
        const grouped = new Map<string, ApiLabEndpoint[]>();
        endpoints.forEach((endpoint) => {
            const key = `${endpoint.serviceName} / ${endpoint.category}`;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)?.push(endpoint);
        });
        return Array.from(grouped.entries());
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

    const currentJsonError = useMemo(() => {
        const parts = [parseJsonText(bodyText), parseJsonText(queryText), parseJsonText(headerText)];
        return parts.find((item) => item.error)?.error || null;
    }, [bodyText, queryText, headerText]);

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
        setExamples((await res.json()) as ApiLabExample[]);
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

        const defaultEnv = serviceEnvs.find((env) => env.isDefault) || serviceEnvs[0] || null;
        if (!selectedEnvId || !serviceEnvs.some((env) => env.id === selectedEnvId)) {
            setSelectedEnvId(defaultEnv?.id || '');
        }

        void Promise.all([loadExamples(selectedEndpoint.id), loadLogs(selectedEndpoint.id)]).catch((loadError) => {
            setError(loadError instanceof Error ? loadError.message : '加载样例或日志失败。');
        });
    }, [selectedEndpointId, selectedEndpoint, serviceEnvs]);

    const applyExample = (example: ApiLabExample) => {
        setBodyText(formatJson(example.requestBody));
        setQueryText(formatJson(example.requestQuery));
        setHeaderText(formatJson(example.requestHeaders));
        setNotice(`已加载样例：${example.name}`);
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
            const data = (await res.json()) as ApiLabRunResult | { error: string };
            if (!res.ok) {
                throw new Error('error' in data ? data.error : '执行失败');
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
                        <div className="mt-2 text-sm text-slate-500">首次打开会自动导入 Stepfun 的 chat / tts / asr / files 模板。</div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.72),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.20),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-8 md:px-6 lg:px-10">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(30,41,59,0.88)_62%,rgba(14,116,144,0.82)_100%)] px-6 py-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] md:px-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-200">
                                <Activity size={14} />
                                API Lab
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">把公司接口沉成你的可执行资产库</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                                这里优先解决 3 件事：快速切环境、直接复制可用 curl、保留最近一次可参考的返回值。
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
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

                {error ? <div className="mb-4 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div> : null}
                {notice ? <div className="mb-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">{notice}</div> : null}

                <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)_360px]">
                    <aside className="rounded-[32px] border border-white/70 bg-white/78 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
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
                        <div className="space-y-4">
                            {groupedEndpoints.map(([groupName, items]) => (
                                <div key={groupName}>
                                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{groupName}</div>
                                    <div className="space-y-2">
                                        {items.map((item) => {
                                            const active = item.id === selectedEndpointId;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setSelectedEndpointId(item.id)}
                                                    className={`w-full rounded-[24px] border px-4 py-3 text-left transition ${
                                                        active
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]'
                                                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="font-medium">{item.name}</div>
                                                            <div className={`mt-1 text-xs ${active ? 'text-slate-300' : 'text-slate-500'}`}>{item.path}</div>
                                                        </div>
                                                        {item.isSystem ? <span className={`rounded-full px-2 py-1 text-[10px] ${active ? 'bg-white/14 text-white' : 'bg-slate-200 text-slate-600'}`}>内置</span> : null}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    <section className="rounded-[32px] border border-white/70 bg-white/82 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                        <SectionTitle
                            icon={Settings2}
                            title={selectedEndpoint ? selectedEndpoint.name : '接口调试'}
                            action={
                                selectedEndpoint?.docUrl ? (
                                    <a href={selectedEndpoint.docUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                                        <Link2 size={14} />
                                        文档
                                    </a>
                                ) : null
                            }
                        />

                        {selectedEndpoint ? (
                            <>
                                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                                    <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
                                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                                            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-white">{selectedEndpoint.method}</span>
                                            <span>{selectedEndpoint.serviceName}</span>
                                            <span>/</span>
                                            <span>{selectedEndpoint.category}</span>
                                        </div>
                                        <div className="mt-3 text-sm text-slate-700">{selectedEndpoint.description || '暂无描述'}</div>
                                        <div className="mt-4 rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                                            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Path</div>
                                            <div className="mt-1 break-all font-mono text-sm text-slate-900">{selectedEndpoint.path}</div>
                                        </div>
                                        {selectedEndpoint.notes ? (
                                            <div className="mt-4 rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-600">
                                                {selectedEndpoint.notes}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
                                        <div className="mb-2 text-sm font-medium text-slate-700">环境</div>
                                        <div className="flex gap-2">
                                            <select value={selectedEnvId} onChange={(event) => setSelectedEnvId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900">
                                                {serviceEnvs.map((env) => (
                                                    <option key={env.id} value={env.id}>
                                                        {env.name} · {env.baseUrl}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedEnv ? (
                                                <button type="button" onClick={() => { setEditingEnv(selectedEnv); setShowEnvModal(true); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:bg-white hover:text-slate-900">
                                                    编辑
                                                </button>
                                            ) : null}
                                        </div>
                                        <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                            <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                                                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Base URL</div>
                                                <div className="mt-1 break-all font-mono text-[13px] text-slate-900">{selectedEnv?.baseUrl || '未选择环境'}</div>
                                            </div>
                                            <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                                                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">WebSocket URL</div>
                                                <div className="mt-1 break-all font-mono text-[13px] text-slate-900">{selectedEnv?.websocketUrl || '未配置'}</div>
                                            </div>
                                            <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                                                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">API Key</div>
                                                <div className="mt-1 break-all font-mono text-[13px] text-slate-900">{selectedEnv?.apiKey ? `${selectedEnv.apiKey.slice(0, 6)}******${selectedEnv.apiKey.slice(-4)}` : '未配置'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
                                    <div>
                                        <div className="mb-2 text-sm font-medium text-slate-700">Headers 覆盖</div>
                                        <textarea value={headerText} onChange={(event) => setHeaderText(event.target.value)} rows={10} className="w-full rounded-[28px] border border-slate-200 px-4 py-3 font-mono text-xs leading-6 text-slate-700 outline-none transition focus:border-slate-900" />
                                    </div>
                                    <div>
                                        <div className="mb-2 text-sm font-medium text-slate-700">Query 覆盖</div>
                                        <textarea value={queryText} onChange={(event) => setQueryText(event.target.value)} rows={10} className="w-full rounded-[28px] border border-slate-200 px-4 py-3 font-mono text-xs leading-6 text-slate-700 outline-none transition focus:border-slate-900" />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <div className="text-sm font-medium text-slate-700">请求体</div>
                                        <button type="button" onClick={() => { setBodyText(formatJson(selectedEndpoint.requestTemplate)); setQueryText(formatJson(selectedEndpoint.queryTemplate)); setHeaderText(formatJson(selectedEndpoint.headerTemplate)); setSelectedFile(null); setNotice('已恢复为接口默认模板。'); }} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                                            重置为模板
                                        </button>
                                    </div>
                                    <textarea value={bodyText} onChange={(event) => setBodyText(event.target.value)} rows={16} className="w-full rounded-[28px] border border-slate-200 px-4 py-3 font-mono text-xs leading-6 text-slate-700 outline-none transition focus:border-slate-900" />
                                </div>

                                {selectedEndpoint.contentType === 'multipart/form-data' ? (
                                    <div className="mt-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50/80 p-4">
                                        <div className="mb-2 text-sm font-medium text-slate-700">上传文件</div>
                                        <input type="file" accept={selectedEndpoint.fileAccept || undefined} onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700" />
                                        <div className="mt-2 text-xs text-slate-500">字段名：{selectedEndpoint.fileFieldName || 'file'} {selectedEndpoint.fileAccept ? `· accept: ${selectedEndpoint.fileAccept}` : ''}</div>
                                    </div>
                                ) : null}

                                <div className="mt-4 rounded-[28px] border border-slate-200 bg-slate-950 p-4 text-white">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <div className="text-sm font-medium text-slate-200">{selectedEndpoint?.method === 'WS' ? '连接命令预览' : 'curl 预览'}</div>
                                        <button type="button" onClick={() => void copyToClipboard(curlPreview).then(() => setNotice(selectedEndpoint?.method === 'WS' ? '已复制当前连接命令。' : '已复制当前 curl。'))} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/14">
                                            <Copy size={14} />
                                            {selectedEndpoint?.method === 'WS' ? '复制命令' : '复制 curl'}
                                        </button>
                                    </div>
                                    <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-6 text-slate-200">{curlPreview}</pre>
                                </div>

                                {currentJsonError ? <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">JSON 提示：{currentJsonError}</div> : null}

                                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap gap-3">
                                            <button type="button" onClick={runRequest} disabled={running || !selectedEnv || selectedEndpoint?.method === 'WS'} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                                                {running ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                                                {selectedEndpoint?.method === 'WS' ? '页面内暂不执行 WS' : running ? '执行中...' : '执行请求'}
                                            </button>
                                            <button type="button" onClick={saveCurrentAsExample} disabled={!runResult} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                                                <Save size={16} />
                                                保存为样例
                                            </button>
                                            <button type="button" onClick={createMonitor} disabled={!selectedEnv || selectedEndpoint?.method === 'WS'} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                                                <Activity size={16} />
                                                加入巡检
                                            </button>
                                        </div>
                                        {runResult ? <div className={`rounded-full px-3 py-1 text-xs font-medium ${runResult.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{runResult.status || 'ERR'} · {runResult.durationMs}ms</div> : null}
                                    </div>
                            </>
                        ) : (
                            <div className="flex min-h-[55vh] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 text-slate-500">还没有接口，先新增一个接口模板。</div>
                        )}
                    </section>

                    <aside className="space-y-5">
                        <div className="rounded-[32px] border border-white/70 bg-white/82 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                            <SectionTitle
                                icon={Globe}
                                title="响应结果"
                                action={
                                    runResult?.curlCommand ? (
                                        <button type="button" onClick={() => void copyToClipboard(runResult.curlCommand).then(() => setNotice('已复制最近执行生成的 curl。'))} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                                            <Copy size={14} />
                                            最近 curl
                                        </button>
                                    ) : null
                                }
                            />
                            {runResult ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Status</div>
                                            <div className={`mt-1 font-semibold ${runResult.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{runResult.status || 'ERR'}</div>
                                        </div>
                                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Duration</div>
                                            <div className="mt-1 font-semibold text-slate-900">{runResult.durationMs} ms</div>
                                        </div>
                                    </div>
                                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400">Request URL</div>
                                        <div className="break-all font-mono text-xs leading-6 text-slate-700">{runResult.requestUrl}</div>
                                    </div>
                                    {runResult.errorMessage ? <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{runResult.errorMessage}</div> : null}
                                    {isAudioResult(selectedEndpoint, runResult) && runResult.responseBody ? (
                                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                            <div className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400">Audio Preview</div>
                                            <audio controls className="w-full" src={`data:${typeof runResult.responseHeaders['content-type'] === 'string' ? runResult.responseHeaders['content-type'] : 'audio/mpeg'};base64,${runResult.responseBody}`} />
                                        </div>
                                    ) : null}
                                    <div className="rounded-[22px] border border-slate-200 bg-slate-950 px-4 py-3 text-white">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Response Body</div>
                                            {runResult.responseBody ? <button type="button" onClick={() => void copyToClipboard(runResult.responseBody || '').then(() => setNotice('已复制返回内容。'))} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/14"><Copy size={14} />复制</button> : null}
                                        </div>
                                        <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-6 text-slate-100">{runResult.responseBody || '<empty>'}</pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-[26px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">执行一次接口后，这里会显示状态码、耗时和返回体。</div>
                            )}
                        </div>

                        <div className="rounded-[32px] border border-white/70 bg-white/82 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                            <SectionTitle icon={Save} title="样例与最近运行" />
                            <div className="space-y-4">
                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">巡检</div>
                                        <button type="button" onClick={() => void runMonitors()} disabled={runningMonitors || !monitors.length} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
                                            {runningMonitors ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
                                            运行全部
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {visibleMonitors.length ? visibleMonitors.slice(0, 6).map((monitor) => {
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
                                        }) : <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">还没有巡检项，可以把当前接口加入巡检。</div>}
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">推荐样例</div>
                                    <div className="space-y-2">
                                        {examples.length ? examples.map((example) => (
                                            <button key={example.id} type="button" onClick={() => applyExample(example)} className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="font-medium text-slate-900">{example.name}</div>
                                                        <div className="mt-1 text-xs text-slate-500">{example.responseStatus || '--'} · {example.responseBodyFormat}</div>
                                                    </div>
                                                    {example.isRecommended ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-700">推荐</span> : null}
                                                </div>
                                            </button>
                                        )) : <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">还没有样例，执行成功后可保存。</div>}
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">最近运行</div>
                                    <div className="space-y-2">
                                        {logs.length ? logs.map((log) => (
                                            <button key={log.id} type="button" onClick={() => { setRunResult(extractLogResult(log)); setNotice('已切换到历史运行记录。'); }} className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <div className="font-medium text-slate-900">{log.responseStatus || 'ERR'} · {log.durationMs}ms</div>
                                                        <div className="mt-1 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</div>
                                                    </div>
                                                    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${log.isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{log.isSuccess ? '成功' : '失败'}</span>
                                                </div>
                                            </button>
                                        )) : <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">还没有运行记录。</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

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
