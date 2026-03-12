import { pool } from '@/lib/db/client';
import {
    apiLabSeedEndpoints,
    apiLabSeedEnvs,
    apiLabSeedExamples,
    type ApiLabSeedEndpoint,
    type ApiLabSeedEnv,
    type ApiLabSeedExample,
} from '@/lib/api-lab/defaults';
import type {
    ApiLabBootstrapResult,
    ApiLabEndpoint,
    ApiLabEnv,
    ApiLabExample,
    ApiLabMonitor,
    ApiLabMonitorRun,
    ApiLabRunLog,
    JsonObject,
} from '@/lib/models/apiLab';

interface ApiLabEnvRow {
    id: string;
    user_id: string;
    service_key: string;
    service_name: string;
    name: string;
    base_url: string;
    websocket_url: string | null;
    api_key: string;
    extra_headers: unknown;
    timeout_ms: number;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

interface ApiLabEndpointRow {
    id: string;
    user_id: string;
    slug: string;
    service_key: string;
    service_name: string;
    category: string;
    name: string;
    description: string | null;
    method: ApiLabEndpoint['method'];
    path: string;
    auth_type: ApiLabEndpoint['authType'];
    auth_header_name: string;
    content_type: ApiLabEndpoint['contentType'];
    response_type: ApiLabEndpoint['responseType'];
    request_template: unknown;
    query_template: unknown;
    header_template: unknown;
    file_field_name: string | null;
    file_accept: string | null;
    doc_url: string | null;
    notes: string | null;
    sort_order: number;
    is_system: boolean;
    created_at: string;
    updated_at: string;
}

interface ApiLabExampleRow {
    id: string;
    endpoint_id: string;
    name: string;
    request_body: unknown;
    request_query: unknown;
    request_headers: unknown;
    response_status: number | null;
    response_headers: unknown;
    response_body: string | null;
    response_body_format: ApiLabExample['responseBodyFormat'];
    is_recommended: boolean;
    created_at: string;
    updated_at: string;
}

interface ApiLabRunLogRow {
    id: string;
    user_id: string;
    endpoint_id: string;
    env_id: string;
    request_url: string;
    request_method: ApiLabRunLog['requestMethod'];
    request_headers: unknown;
    request_query: unknown;
    request_body: string | null;
    request_files: unknown;
    curl_command: string;
    response_status: number | null;
    response_headers: unknown;
    response_body: string | null;
    response_body_format: ApiLabRunLog['responseBodyFormat'];
    duration_ms: number;
    is_success: boolean;
    error_message: string | null;
    created_at: string;
}

interface ApiLabMonitorRow {
    id: string;
    user_id: string;
    endpoint_id: string;
    env_id: string;
    name: string;
    expected_status: number;
    max_duration_ms: number;
    body_includes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface ApiLabMonitorRunRow {
    id: string;
    monitor_id: string;
    run_log_id: string;
    monitor_name: string;
    endpoint_id: string;
    env_id: string;
    status_code: number | null;
    duration_ms: number;
    is_passing: boolean;
    failure_reason: string | null;
    created_at: string;
}

function asJsonObject(value: unknown): JsonObject {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
        return {};
    }

    return value as JsonObject;
}

function mapEnv(row: ApiLabEnvRow): ApiLabEnv {
    return {
        id: row.id,
        userId: row.user_id,
        serviceKey: row.service_key,
        serviceName: row.service_name,
        name: row.name,
        baseUrl: row.base_url,
        websocketUrl: row.websocket_url,
        apiKey: row.api_key,
        extraHeaders: asJsonObject(row.extra_headers),
        timeoutMs: row.timeout_ms,
        isDefault: row.is_default,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapEndpoint(row: ApiLabEndpointRow): ApiLabEndpoint {
    return {
        id: row.id,
        userId: row.user_id,
        slug: row.slug,
        serviceKey: row.service_key,
        serviceName: row.service_name,
        category: row.category,
        name: row.name,
        description: row.description,
        method: row.method,
        path: row.path,
        authType: row.auth_type,
        authHeaderName: row.auth_header_name,
        contentType: row.content_type,
        responseType: row.response_type,
        requestTemplate: asJsonObject(row.request_template),
        queryTemplate: asJsonObject(row.query_template),
        headerTemplate: asJsonObject(row.header_template),
        fileFieldName: row.file_field_name,
        fileAccept: row.file_accept,
        docUrl: row.doc_url,
        notes: row.notes,
        sortOrder: row.sort_order,
        isSystem: row.is_system,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapExample(row: ApiLabExampleRow): ApiLabExample {
    return {
        id: row.id,
        endpointId: row.endpoint_id,
        name: row.name,
        requestBody: asJsonObject(row.request_body),
        requestQuery: asJsonObject(row.request_query),
        requestHeaders: asJsonObject(row.request_headers),
        responseStatus: row.response_status,
        responseHeaders: asJsonObject(row.response_headers),
        responseBody: row.response_body,
        responseBodyFormat: row.response_body_format,
        isRecommended: row.is_recommended,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapRunLog(row: ApiLabRunLogRow): ApiLabRunLog {
    return {
        id: row.id,
        userId: row.user_id,
        endpointId: row.endpoint_id,
        envId: row.env_id,
        requestUrl: row.request_url,
        requestMethod: row.request_method,
        requestHeaders: asJsonObject(row.request_headers),
        requestQuery: asJsonObject(row.request_query),
        requestBody: row.request_body,
        requestFiles: asJsonObject(row.request_files),
        curlCommand: row.curl_command,
        responseStatus: row.response_status,
        responseHeaders: asJsonObject(row.response_headers),
        responseBody: row.response_body,
        responseBodyFormat: row.response_body_format,
        durationMs: row.duration_ms,
        isSuccess: row.is_success,
        errorMessage: row.error_message,
        createdAt: row.created_at,
    };
}

function mapMonitor(row: ApiLabMonitorRow): ApiLabMonitor {
    return {
        id: row.id,
        userId: row.user_id,
        endpointId: row.endpoint_id,
        envId: row.env_id,
        name: row.name,
        expectedStatus: row.expected_status,
        maxDurationMs: row.max_duration_ms,
        bodyIncludes: row.body_includes,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapMonitorRun(row: ApiLabMonitorRunRow): ApiLabMonitorRun {
    return {
        id: row.id,
        monitorId: row.monitor_id,
        runLogId: row.run_log_id,
        monitorName: row.monitor_name,
        endpointId: row.endpoint_id,
        envId: row.env_id,
        statusCode: row.status_code,
        durationMs: row.duration_ms,
        isPassing: row.is_passing,
        failureReason: row.failure_reason,
        createdAt: row.created_at,
    };
}

export interface CreateApiLabEnvPayload {
    serviceKey: string;
    serviceName: string;
    name: string;
    baseUrl: string;
    websocketUrl?: string | null;
    apiKey: string;
    extraHeaders?: JsonObject;
    timeoutMs?: number;
    isDefault?: boolean;
}

export interface UpdateApiLabEnvPayload {
    serviceKey?: string;
    serviceName?: string;
    name?: string;
    baseUrl?: string;
    websocketUrl?: string | null;
    apiKey?: string;
    extraHeaders?: JsonObject;
    timeoutMs?: number;
    isDefault?: boolean;
}

export interface CreateApiLabEndpointPayload {
    slug: string;
    serviceKey: string;
    serviceName: string;
    category: string;
    name: string;
    description?: string | null;
    method: ApiLabEndpoint['method'];
    path: string;
    authType?: ApiLabEndpoint['authType'];
    authHeaderName?: string;
    contentType?: ApiLabEndpoint['contentType'];
    responseType?: ApiLabEndpoint['responseType'];
    requestTemplate?: JsonObject;
    queryTemplate?: JsonObject;
    headerTemplate?: JsonObject;
    fileFieldName?: string | null;
    fileAccept?: string | null;
    docUrl?: string | null;
    notes?: string | null;
    sortOrder?: number;
    isSystem?: boolean;
}

export interface UpdateApiLabEndpointPayload {
    slug?: string;
    serviceKey?: string;
    serviceName?: string;
    category?: string;
    name?: string;
    description?: string | null;
    method?: ApiLabEndpoint['method'];
    path?: string;
    authType?: ApiLabEndpoint['authType'];
    authHeaderName?: string;
    contentType?: ApiLabEndpoint['contentType'];
    responseType?: ApiLabEndpoint['responseType'];
    requestTemplate?: JsonObject;
    queryTemplate?: JsonObject;
    headerTemplate?: JsonObject;
    fileFieldName?: string | null;
    fileAccept?: string | null;
    docUrl?: string | null;
    notes?: string | null;
    sortOrder?: number;
}

export interface CreateApiLabExamplePayload {
    endpointId: string;
    name: string;
    requestBody?: JsonObject;
    requestQuery?: JsonObject;
    requestHeaders?: JsonObject;
    responseStatus?: number | null;
    responseHeaders?: JsonObject;
    responseBody?: string | null;
    responseBodyFormat?: ApiLabExample['responseBodyFormat'];
    isRecommended?: boolean;
}

export interface CreateApiLabRunLogPayload {
    endpointId: string;
    envId: string;
    requestUrl: string;
    requestMethod: ApiLabRunLog['requestMethod'];
    requestHeaders: JsonObject;
    requestQuery: JsonObject;
    requestBody?: string | null;
    requestFiles?: JsonObject;
    curlCommand: string;
    responseStatus?: number | null;
    responseHeaders?: JsonObject;
    responseBody?: string | null;
    responseBodyFormat?: ApiLabRunLog['responseBodyFormat'];
    durationMs: number;
    isSuccess: boolean;
    errorMessage?: string | null;
}

export interface CreateApiLabMonitorPayload {
    endpointId: string;
    envId: string;
    name: string;
    expectedStatus?: number;
    maxDurationMs?: number;
    bodyIncludes?: string | null;
    isActive?: boolean;
}

export interface UpdateApiLabMonitorPayload {
    name?: string;
    expectedStatus?: number;
    maxDurationMs?: number;
    bodyIncludes?: string | null;
    isActive?: boolean;
}

export async function listApiLabEnvs(userId: string): Promise<ApiLabEnv[]> {
    const res = await pool.query<ApiLabEnvRow>(
        `SELECT *
         FROM api_lab_envs
         WHERE user_id = $1
         ORDER BY service_name ASC, is_default DESC, created_at ASC`,
        [userId],
    );

    return res.rows.map(mapEnv);
}

export async function getApiLabEnvById(userId: string, id: string): Promise<ApiLabEnv | null> {
    const res = await pool.query<ApiLabEnvRow>(
        `SELECT *
         FROM api_lab_envs
         WHERE user_id = $1 AND id = $2`,
        [userId, id],
    );

    return res.rows[0] ? mapEnv(res.rows[0]) : null;
}

export async function createApiLabEnv(userId: string, payload: CreateApiLabEnvPayload): Promise<ApiLabEnv> {
    const {
        serviceKey,
        serviceName,
        name,
        baseUrl,
        websocketUrl = null,
        apiKey,
        extraHeaders = {},
        timeoutMs = 30000,
        isDefault = false,
    } = payload;

    if (isDefault) {
        await pool.query(
            `UPDATE api_lab_envs
             SET is_default = FALSE, updated_at = NOW()
             WHERE user_id = $1 AND service_key = $2`,
            [userId, serviceKey],
        );
    }

    const res = await pool.query<ApiLabEnvRow>(
        `INSERT INTO api_lab_envs
            (user_id, service_key, service_name, name, base_url, websocket_url, api_key, extra_headers, timeout_ms, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
         RETURNING *`,
        [
            userId,
            serviceKey,
            serviceName,
            name,
            baseUrl,
            websocketUrl,
            apiKey,
            JSON.stringify(extraHeaders),
            timeoutMs,
            isDefault,
        ],
    );

    return mapEnv(res.rows[0]);
}

export async function updateApiLabEnv(
    userId: string,
    id: string,
    payload: UpdateApiLabEnvPayload,
): Promise<ApiLabEnv | null> {
    const existing = await getApiLabEnvById(userId, id);
    if (!existing) {
        return null;
    }

    const serviceKey = payload.serviceKey ?? existing.serviceKey;
    if (payload.isDefault) {
        await pool.query(
            `UPDATE api_lab_envs
             SET is_default = FALSE, updated_at = NOW()
             WHERE user_id = $1 AND service_key = $2 AND id <> $3`,
            [userId, serviceKey, id],
        );
    }

    const next = {
        serviceKey,
        serviceName: payload.serviceName ?? existing.serviceName,
        name: payload.name ?? existing.name,
        baseUrl: payload.baseUrl ?? existing.baseUrl,
        websocketUrl:
            payload.websocketUrl === undefined ? existing.websocketUrl : payload.websocketUrl,
        apiKey: payload.apiKey ?? existing.apiKey,
        extraHeaders: payload.extraHeaders ?? existing.extraHeaders,
        timeoutMs: payload.timeoutMs ?? existing.timeoutMs,
        isDefault: payload.isDefault ?? existing.isDefault,
    };

    const res = await pool.query<ApiLabEnvRow>(
        `UPDATE api_lab_envs
         SET service_key = $3,
             service_name = $4,
             name = $5,
             base_url = $6,
             websocket_url = $7,
             api_key = $8,
             extra_headers = $9::jsonb,
             timeout_ms = $10,
             is_default = $11,
             updated_at = NOW()
         WHERE user_id = $1 AND id = $2
         RETURNING *`,
        [
            userId,
            id,
            next.serviceKey,
            next.serviceName,
            next.name,
            next.baseUrl,
            next.websocketUrl,
            next.apiKey,
            JSON.stringify(next.extraHeaders),
            next.timeoutMs,
            next.isDefault,
        ],
    );

    return res.rows[0] ? mapEnv(res.rows[0]) : null;
}

export async function listApiLabEndpoints(userId: string): Promise<ApiLabEndpoint[]> {
    const res = await pool.query<ApiLabEndpointRow>(
        `SELECT *
         FROM api_lab_endpoints
         WHERE user_id = $1
         ORDER BY service_name ASC, category ASC, sort_order ASC, name ASC`,
        [userId],
    );

    return res.rows.map(mapEndpoint);
}

export async function getApiLabEndpointById(userId: string, id: string): Promise<ApiLabEndpoint | null> {
    const res = await pool.query<ApiLabEndpointRow>(
        `SELECT *
         FROM api_lab_endpoints
         WHERE user_id = $1 AND id = $2`,
        [userId, id],
    );

    return res.rows[0] ? mapEndpoint(res.rows[0]) : null;
}

export async function createApiLabEndpoint(
    userId: string,
    payload: CreateApiLabEndpointPayload,
): Promise<ApiLabEndpoint> {
    const {
        slug,
        serviceKey,
        serviceName,
        category,
        name,
        description = null,
        method,
        path,
        authType = 'bearer',
        authHeaderName = 'Authorization',
        contentType = 'application/json',
        responseType = 'json',
        requestTemplate = {},
        queryTemplate = {},
        headerTemplate = {},
        fileFieldName = null,
        fileAccept = null,
        docUrl = null,
        notes = null,
        sortOrder = 100,
        isSystem = false,
    } = payload;

    const res = await pool.query<ApiLabEndpointRow>(
        `INSERT INTO api_lab_endpoints (
            user_id, slug, service_key, service_name, category, name, description, method, path,
            auth_type, auth_header_name, content_type, response_type, request_template, query_template,
            header_template, file_field_name, file_accept, doc_url, notes, sort_order, is_system
         ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14::jsonb, $15::jsonb,
            $16::jsonb, $17, $18, $19, $20, $21, $22
         )
         RETURNING *`,
        [
            userId,
            slug,
            serviceKey,
            serviceName,
            category,
            name,
            description,
            method,
            path,
            authType,
            authHeaderName,
            contentType,
            responseType,
            JSON.stringify(requestTemplate),
            JSON.stringify(queryTemplate),
            JSON.stringify(headerTemplate),
            fileFieldName,
            fileAccept,
            docUrl,
            notes,
            sortOrder,
            isSystem,
        ],
    );

    return mapEndpoint(res.rows[0]);
}

export async function updateApiLabEndpoint(
    userId: string,
    id: string,
    payload: UpdateApiLabEndpointPayload,
): Promise<ApiLabEndpoint | null> {
    const existing = await getApiLabEndpointById(userId, id);
    if (!existing) {
        return null;
    }

    const next = {
        slug: payload.slug ?? existing.slug,
        serviceKey: payload.serviceKey ?? existing.serviceKey,
        serviceName: payload.serviceName ?? existing.serviceName,
        category: payload.category ?? existing.category,
        name: payload.name ?? existing.name,
        description: payload.description ?? existing.description,
        method: payload.method ?? existing.method,
        path: payload.path ?? existing.path,
        authType: payload.authType ?? existing.authType,
        authHeaderName: payload.authHeaderName ?? existing.authHeaderName,
        contentType: payload.contentType ?? existing.contentType,
        responseType: payload.responseType ?? existing.responseType,
        requestTemplate: payload.requestTemplate ?? existing.requestTemplate,
        queryTemplate: payload.queryTemplate ?? existing.queryTemplate,
        headerTemplate: payload.headerTemplate ?? existing.headerTemplate,
        fileFieldName:
            payload.fileFieldName === undefined ? existing.fileFieldName : payload.fileFieldName,
        fileAccept: payload.fileAccept === undefined ? existing.fileAccept : payload.fileAccept,
        docUrl: payload.docUrl === undefined ? existing.docUrl : payload.docUrl,
        notes: payload.notes === undefined ? existing.notes : payload.notes,
        sortOrder: payload.sortOrder ?? existing.sortOrder,
    };

    const res = await pool.query<ApiLabEndpointRow>(
        `UPDATE api_lab_endpoints
         SET slug = $3,
             service_key = $4,
             service_name = $5,
             category = $6,
             name = $7,
             description = $8,
             method = $9,
             path = $10,
             auth_type = $11,
             auth_header_name = $12,
             content_type = $13,
             response_type = $14,
             request_template = $15::jsonb,
             query_template = $16::jsonb,
             header_template = $17::jsonb,
             file_field_name = $18,
             file_accept = $19,
             doc_url = $20,
             notes = $21,
             sort_order = $22,
             updated_at = NOW()
         WHERE user_id = $1 AND id = $2
         RETURNING *`,
        [
            userId,
            id,
            next.slug,
            next.serviceKey,
            next.serviceName,
            next.category,
            next.name,
            next.description,
            next.method,
            next.path,
            next.authType,
            next.authHeaderName,
            next.contentType,
            next.responseType,
            JSON.stringify(next.requestTemplate),
            JSON.stringify(next.queryTemplate),
            JSON.stringify(next.headerTemplate),
            next.fileFieldName,
            next.fileAccept,
            next.docUrl,
            next.notes,
            next.sortOrder,
        ],
    );

    return res.rows[0] ? mapEndpoint(res.rows[0]) : null;
}

export async function listApiLabExamples(userId: string, endpointId: string): Promise<ApiLabExample[]> {
    const res = await pool.query<ApiLabExampleRow>(
        `SELECT ex.*
         FROM api_lab_examples ex
         JOIN api_lab_endpoints ep ON ep.id = ex.endpoint_id
         WHERE ep.user_id = $1 AND ex.endpoint_id = $2
         ORDER BY ex.is_recommended DESC, ex.updated_at DESC`,
        [userId, endpointId],
    );

    return res.rows.map(mapExample);
}

export async function createApiLabExample(
    userId: string,
    payload: CreateApiLabExamplePayload,
): Promise<ApiLabExample> {
    const endpoint = await getApiLabEndpointById(userId, payload.endpointId);
    if (!endpoint) {
        throw new Error('Endpoint not found');
    }

    if (payload.isRecommended) {
        await pool.query(
            `UPDATE api_lab_examples
             SET is_recommended = FALSE,
                 updated_at = NOW()
             WHERE endpoint_id = $1`,
            [payload.endpointId],
        );
    }

    const res = await pool.query<ApiLabExampleRow>(
        `INSERT INTO api_lab_examples (
            endpoint_id, name, request_body, request_query, request_headers,
            response_status, response_headers, response_body, response_body_format, is_recommended
         ) VALUES (
            $1, $2, $3::jsonb, $4::jsonb, $5::jsonb,
            $6, $7::jsonb, $8, $9, $10
         )
         RETURNING *`,
        [
            payload.endpointId,
            payload.name,
            JSON.stringify(payload.requestBody ?? {}),
            JSON.stringify(payload.requestQuery ?? {}),
            JSON.stringify(payload.requestHeaders ?? {}),
            payload.responseStatus ?? null,
            JSON.stringify(payload.responseHeaders ?? {}),
            payload.responseBody ?? null,
            payload.responseBodyFormat ?? 'json',
            payload.isRecommended ?? false,
        ],
    );

    return mapExample(res.rows[0]);
}

export async function listApiLabRunLogs(
    userId: string,
    endpointId: string,
    limit = 10,
): Promise<ApiLabRunLog[]> {
    const res = await pool.query<ApiLabRunLogRow>(
        `SELECT logs.*
         FROM api_lab_run_logs logs
         JOIN api_lab_endpoints ep ON ep.id = logs.endpoint_id
         WHERE ep.user_id = $1 AND logs.endpoint_id = $2
         ORDER BY logs.created_at DESC
         LIMIT $3`,
        [userId, endpointId, limit],
    );

    return res.rows.map(mapRunLog);
}

export async function createApiLabRunLog(
    userId: string,
    payload: CreateApiLabRunLogPayload,
): Promise<ApiLabRunLog> {
    const res = await pool.query<ApiLabRunLogRow>(
        `INSERT INTO api_lab_run_logs (
            user_id, endpoint_id, env_id, request_url, request_method, request_headers, request_query,
            request_body, request_files, curl_command, response_status, response_headers, response_body,
            response_body_format, duration_ms, is_success, error_message
         ) VALUES (
            $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb,
            $8, $9::jsonb, $10, $11, $12::jsonb, $13,
            $14, $15, $16, $17
         )
         RETURNING *`,
        [
            userId,
            payload.endpointId,
            payload.envId,
            payload.requestUrl,
            payload.requestMethod,
            JSON.stringify(payload.requestHeaders),
            JSON.stringify(payload.requestQuery),
            payload.requestBody ?? null,
            JSON.stringify(payload.requestFiles ?? {}),
            payload.curlCommand,
            payload.responseStatus ?? null,
            JSON.stringify(payload.responseHeaders ?? {}),
            payload.responseBody ?? null,
            payload.responseBodyFormat ?? 'json',
            payload.durationMs,
            payload.isSuccess,
            payload.errorMessage ?? null,
        ],
    );

    return mapRunLog(res.rows[0]);
}

export async function listApiLabMonitors(userId: string): Promise<ApiLabMonitor[]> {
    const res = await pool.query<ApiLabMonitorRow>(
        `SELECT *
         FROM api_lab_monitors
         WHERE user_id = $1
         ORDER BY is_active DESC, updated_at DESC`,
        [userId],
    );

    return res.rows.map(mapMonitor);
}

export async function getApiLabMonitorById(userId: string, id: string): Promise<ApiLabMonitor | null> {
    const res = await pool.query<ApiLabMonitorRow>(
        `SELECT *
         FROM api_lab_monitors
         WHERE user_id = $1 AND id = $2`,
        [userId, id],
    );

    return res.rows[0] ? mapMonitor(res.rows[0]) : null;
}

export async function createApiLabMonitor(
    userId: string,
    payload: CreateApiLabMonitorPayload,
): Promise<ApiLabMonitor> {
    const endpoint = await getApiLabEndpointById(userId, payload.endpointId);
    const env = await getApiLabEnvById(userId, payload.envId);
    if (!endpoint || !env) {
        throw new Error('Endpoint or env not found');
    }

    const res = await pool.query<ApiLabMonitorRow>(
        `INSERT INTO api_lab_monitors (
            user_id, endpoint_id, env_id, name, expected_status, max_duration_ms, body_includes, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
            userId,
            payload.endpointId,
            payload.envId,
            payload.name,
            payload.expectedStatus ?? 200,
            payload.maxDurationMs ?? 5000,
            payload.bodyIncludes ?? null,
            payload.isActive ?? true,
        ],
    );

    return mapMonitor(res.rows[0]);
}

export async function updateApiLabMonitor(
    userId: string,
    id: string,
    payload: UpdateApiLabMonitorPayload,
): Promise<ApiLabMonitor | null> {
    const existing = await getApiLabMonitorById(userId, id);
    if (!existing) {
        return null;
    }

    const res = await pool.query<ApiLabMonitorRow>(
        `UPDATE api_lab_monitors
         SET name = $3,
             expected_status = $4,
             max_duration_ms = $5,
             body_includes = $6,
             is_active = $7,
             updated_at = NOW()
         WHERE user_id = $1 AND id = $2
         RETURNING *`,
        [
            userId,
            id,
            payload.name ?? existing.name,
            payload.expectedStatus ?? existing.expectedStatus,
            payload.maxDurationMs ?? existing.maxDurationMs,
            payload.bodyIncludes === undefined ? existing.bodyIncludes : payload.bodyIncludes,
            payload.isActive ?? existing.isActive,
        ],
    );

    return res.rows[0] ? mapMonitor(res.rows[0]) : null;
}

export async function createApiLabMonitorRun(payload: {
    monitorId: string;
    runLogId: string;
    statusCode: number | null;
    durationMs: number;
    isPassing: boolean;
    failureReason?: string | null;
}): Promise<ApiLabMonitorRun> {
    const res = await pool.query<ApiLabMonitorRunRow>(
        `INSERT INTO api_lab_monitor_runs (
            monitor_id, run_log_id, status_code, duration_ms, is_passing, failure_reason
         )
         SELECT $1, $2, $3, $4, $5, $6
         FROM api_lab_monitors mon
         WHERE mon.id = $1
         RETURNING
            id,
            monitor_id,
            run_log_id,
            (SELECT name FROM api_lab_monitors WHERE id = $1) AS monitor_name,
            (SELECT endpoint_id FROM api_lab_monitors WHERE id = $1) AS endpoint_id,
            (SELECT env_id FROM api_lab_monitors WHERE id = $1) AS env_id,
            status_code,
            duration_ms,
            is_passing,
            failure_reason,
            created_at`,
        [
            payload.monitorId,
            payload.runLogId,
            payload.statusCode,
            payload.durationMs,
            payload.isPassing,
            payload.failureReason ?? null,
        ],
    );

    return mapMonitorRun(res.rows[0]);
}

export async function listApiLabMonitorRuns(
    userId: string,
    limit = 20,
): Promise<ApiLabMonitorRun[]> {
    const res = await pool.query<ApiLabMonitorRunRow>(
        `SELECT
            runs.id,
            runs.monitor_id,
            runs.run_log_id,
            mon.name AS monitor_name,
            mon.endpoint_id,
            mon.env_id,
            runs.status_code,
            runs.duration_ms,
            runs.is_passing,
            runs.failure_reason,
            runs.created_at
         FROM api_lab_monitor_runs runs
         JOIN api_lab_monitors mon ON mon.id = runs.monitor_id
         WHERE mon.user_id = $1
         ORDER BY runs.created_at DESC
         LIMIT $2`,
        [userId, limit],
    );

    return res.rows.map(mapMonitorRun);
}

async function insertSeedEnv(userId: string, env: ApiLabSeedEnv): Promise<boolean> {
    const res = await pool.query(
        `INSERT INTO api_lab_envs (
            user_id, service_key, service_name, name, base_url, websocket_url, api_key, extra_headers, timeout_ms, is_default
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
         ON CONFLICT (user_id, service_key, name) DO NOTHING`,
        [
            userId,
            env.serviceKey,
            env.serviceName,
            env.name,
            env.baseUrl,
            env.websocketUrl ?? null,
            env.apiKey,
            JSON.stringify(env.extraHeaders),
            env.timeoutMs,
            env.isDefault,
        ],
    );

    return (res.rowCount ?? 0) > 0;
}

async function cleanupLegacySeedEnvs(userId: string): Promise<void> {
    await pool.query(
        `DELETE FROM api_lab_envs env
         WHERE env.user_id = $1
           AND env.service_key = 'stepfun'
           AND env.service_name = 'Stepfun'
           AND env.name = 'production'
           AND env.base_url = 'https://api.stepfun.com/v1'
           AND COALESCE(env.websocket_url, '') = 'wss://api.stepfun.com/v1'
           AND COALESCE(env.api_key, '') = ''
           AND COALESCE(env.extra_headers, '{}'::jsonb) = '{}'::jsonb
           AND env.timeout_ms = 30000
           AND env.is_default = TRUE
           AND NOT EXISTS (
                SELECT 1
                FROM api_lab_run_logs logs
                WHERE logs.env_id = env.id
           )
           AND NOT EXISTS (
                SELECT 1
                FROM api_lab_monitors monitors
                WHERE monitors.env_id = env.id
           )`,
        [userId],
    );
}

async function insertSeedEndpoint(userId: string, endpoint: ApiLabSeedEndpoint): Promise<boolean> {
    const res = await pool.query(
        `INSERT INTO api_lab_endpoints (
            user_id, slug, service_key, service_name, category, name, description, method, path,
            auth_type, auth_header_name, content_type, response_type, request_template,
            query_template, header_template, file_field_name, file_accept, doc_url, notes,
            sort_order, is_system
         ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14::jsonb,
            $15::jsonb, $16::jsonb, $17, $18, $19, $20,
            $21, TRUE
         )
         ON CONFLICT (user_id, slug) DO NOTHING`,
        [
            userId,
            endpoint.slug,
            endpoint.serviceKey,
            endpoint.serviceName,
            endpoint.category,
            endpoint.name,
            endpoint.description,
            endpoint.method,
            endpoint.path,
            endpoint.authType,
            endpoint.authHeaderName,
            endpoint.contentType,
            endpoint.responseType,
            JSON.stringify(endpoint.requestTemplate),
            JSON.stringify(endpoint.queryTemplate),
            JSON.stringify(endpoint.headerTemplate),
            endpoint.fileFieldName ?? null,
            endpoint.fileAccept ?? null,
            endpoint.docUrl,
            endpoint.notes,
            endpoint.sortOrder,
        ],
    );

    return (res.rowCount ?? 0) > 0;
}

async function insertSeedExample(
    userId: string,
    slugToEndpointId: Map<string, string>,
    example: ApiLabSeedExample,
): Promise<boolean> {
    const endpointId = slugToEndpointId.get(example.endpointSlug);
    if (!endpointId) {
        const endpointRes = await pool.query<{ id: string }>(
            `SELECT id
             FROM api_lab_endpoints
             WHERE user_id = $1 AND slug = $2`,
            [userId, example.endpointSlug],
        );
        if (!endpointRes.rows[0]) {
            return false;
        }
        slugToEndpointId.set(example.endpointSlug, endpointRes.rows[0].id);
    }

    const resolvedEndpointId = slugToEndpointId.get(example.endpointSlug);
    if (!resolvedEndpointId) {
        return false;
    }

    const res = await pool.query(
        `INSERT INTO api_lab_examples (
            endpoint_id, name, request_body, request_query, request_headers,
            response_status, response_headers, response_body, response_body_format, is_recommended
         ) VALUES (
            $1, $2, $3::jsonb, $4::jsonb, $5::jsonb,
            $6, $7::jsonb, $8, $9, $10
         )
         ON CONFLICT (endpoint_id, name) DO NOTHING`,
        [
            resolvedEndpointId,
            example.name,
            JSON.stringify(example.requestBody),
            JSON.stringify(example.requestQuery),
            JSON.stringify(example.requestHeaders),
            example.responseStatus,
            JSON.stringify(example.responseHeaders),
            example.responseBody,
            example.responseBodyFormat,
            example.isRecommended,
        ],
    );

    return (res.rowCount ?? 0) > 0;
}

export async function ensureApiLabSeedData(userId: string): Promise<ApiLabBootstrapResult> {
    let createdEnvCount = 0;
    let createdEndpointCount = 0;
    let createdExampleCount = 0;

    await cleanupLegacySeedEnvs(userId);

    for (const env of apiLabSeedEnvs) {
        if (await insertSeedEnv(userId, env)) {
            createdEnvCount += 1;
        }
    }

    for (const endpoint of apiLabSeedEndpoints) {
        if (await insertSeedEndpoint(userId, endpoint)) {
            createdEndpointCount += 1;
        }
    }

    const endpointRows = await pool.query<{ id: string; slug: string }>(
        `SELECT id, slug
         FROM api_lab_endpoints
         WHERE user_id = $1`,
        [userId],
    );
    const slugToEndpointId = new Map<string, string>(
        endpointRows.rows.map((row) => [row.slug, row.id]),
    );

    for (const example of apiLabSeedExamples) {
        if (await insertSeedExample(userId, slugToEndpointId, example)) {
            createdExampleCount += 1;
        }
    }

    return {
        createdEnvCount,
        createdEndpointCount,
        createdExampleCount,
    };
}
