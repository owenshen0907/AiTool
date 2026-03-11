export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
    [key: string]: JsonValue;
}

export type ApiLabMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'WS';
export type ApiLabAuthType = 'bearer' | 'x-api-key' | 'none' | 'custom';
export type ApiLabContentType =
    | 'application/json'
    | 'multipart/form-data'
    | 'application/x-www-form-urlencoded'
    | 'none';
export type ApiLabResponseType = 'json' | 'text' | 'sse' | 'binary' | 'audio';
export type ApiLabBodyFormat = 'json' | 'text' | 'sse' | 'base64' | 'empty';

export interface ApiLabEnv {
    id: string;
    userId: string;
    serviceKey: string;
    serviceName: string;
    name: string;
    baseUrl: string;
    websocketUrl: string | null;
    apiKey: string;
    extraHeaders: JsonObject;
    timeoutMs: number;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiLabEndpoint {
    id: string;
    userId: string;
    slug: string;
    serviceKey: string;
    serviceName: string;
    category: string;
    name: string;
    description: string | null;
    method: ApiLabMethod;
    path: string;
    authType: ApiLabAuthType;
    authHeaderName: string;
    contentType: ApiLabContentType;
    responseType: ApiLabResponseType;
    requestTemplate: JsonObject;
    queryTemplate: JsonObject;
    headerTemplate: JsonObject;
    fileFieldName: string | null;
    fileAccept: string | null;
    docUrl: string | null;
    notes: string | null;
    sortOrder: number;
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiLabExample {
    id: string;
    endpointId: string;
    name: string;
    requestBody: JsonObject;
    requestQuery: JsonObject;
    requestHeaders: JsonObject;
    responseStatus: number | null;
    responseHeaders: JsonObject;
    responseBody: string | null;
    responseBodyFormat: ApiLabBodyFormat;
    isRecommended: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiLabRunLog {
    id: string;
    userId: string;
    endpointId: string;
    envId: string;
    requestUrl: string;
    requestMethod: ApiLabMethod;
    requestHeaders: JsonObject;
    requestQuery: JsonObject;
    requestBody: string | null;
    requestFiles: JsonObject;
    curlCommand: string;
    responseStatus: number | null;
    responseHeaders: JsonObject;
    responseBody: string | null;
    responseBodyFormat: ApiLabBodyFormat;
    durationMs: number;
    isSuccess: boolean;
    errorMessage: string | null;
    createdAt: string;
}

export interface ApiLabMonitor {
    id: string;
    userId: string;
    endpointId: string;
    envId: string;
    name: string;
    expectedStatus: number;
    maxDurationMs: number;
    bodyIncludes: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiLabMonitorRun {
    id: string;
    monitorId: string;
    runLogId: string;
    monitorName: string;
    endpointId: string;
    envId: string;
    statusCode: number | null;
    durationMs: number;
    isPassing: boolean;
    failureReason: string | null;
    createdAt: string;
}

export interface ApiLabSummary {
    envs: ApiLabEnv[];
    endpoints: ApiLabEndpoint[];
}

export interface ApiLabRunResult {
    ok: boolean;
    status: number | null;
    durationMs: number;
    requestUrl: string;
    requestMethod: ApiLabMethod;
    requestHeaders: JsonObject;
    requestQuery: JsonObject;
    requestBody: string | null;
    requestFiles: JsonObject;
    curlCommand: string;
    responseHeaders: JsonObject;
    responseBody: string | null;
    responseBodyFormat: ApiLabBodyFormat;
    errorMessage: string | null;
    runLogId: string;
}

export interface ApiLabBootstrapResult {
    createdEnvCount: number;
    createdEndpointCount: number;
    createdExampleCount: number;
}
