import { NextRequest, NextResponse } from 'next/server';
import { withApiLabUser } from '@/lib/api-lab/access';
import { executeApiLabRequest } from '@/lib/api-lab/runner';
import {
    createApiLabMonitorRun,
    getApiLabMonitorById,
    listApiLabMonitors,
} from '@/lib/repositories/apiLabRepository';
import type { ApiLabMonitor } from '@/lib/models/apiLab';

function getFailureReason(monitor: ApiLabMonitor, result: Awaited<ReturnType<typeof executeApiLabRequest>>): string | null {
    if (result.status !== monitor.expectedStatus) {
        return `状态码不符合预期：${result.status ?? 'ERR'} / ${monitor.expectedStatus}`;
    }
    if (result.durationMs > monitor.maxDurationMs) {
        return `响应耗时超限：${result.durationMs}ms / ${monitor.maxDurationMs}ms`;
    }
    if (monitor.bodyIncludes && !(result.responseBody || '').includes(monitor.bodyIncludes)) {
        return `返回内容未命中关键字：${monitor.bodyIncludes}`;
    }
    if (!result.ok && result.errorMessage) {
        return result.errorMessage;
    }
    return null;
}

export const POST = withApiLabUser(async (req: NextRequest, userId: string) => {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const monitorId = body.monitorId ? String(body.monitorId) : null;
    const singleMonitor = monitorId ? await getApiLabMonitorById(userId, monitorId) : null;
    const allMonitors = monitorId
        ? singleMonitor
            ? [singleMonitor]
            : []
        : (await listApiLabMonitors(userId)).filter((item) => item.isActive);

    if (!allMonitors.length) {
        return NextResponse.json({ results: [] });
    }

    const results = [] as Array<{
        monitorId: string;
        runLogId: string;
        statusCode: number | null;
        durationMs: number;
        isPassing: boolean;
        failureReason: string | null;
    }>;

    for (const monitor of allMonitors) {
        try {
            const runResult = await executeApiLabRequest({
                userId,
                endpointId: monitor.endpointId,
                envId: monitor.envId,
            });
            const failureReason = getFailureReason(monitor, runResult);
            await createApiLabMonitorRun({
                monitorId: monitor.id,
                runLogId: runResult.runLogId,
                statusCode: runResult.status,
                durationMs: runResult.durationMs,
                isPassing: !failureReason,
                failureReason,
            });
            results.push({
                monitorId: monitor.id,
                runLogId: runResult.runLogId,
                statusCode: runResult.status,
                durationMs: runResult.durationMs,
                isPassing: !failureReason,
                failureReason,
            });
        } catch (error) {
            results.push({
                monitorId: monitor.id,
                runLogId: '',
                statusCode: null,
                durationMs: 0,
                isPassing: false,
                failureReason: error instanceof Error ? error.message : String(error),
            });
        }
    }

    return NextResponse.json({ results });
});
