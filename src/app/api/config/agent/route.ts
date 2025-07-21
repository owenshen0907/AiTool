// src/app/api/config/agent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import { getAgentConfig, saveAgentConfig } from '@/lib/services/agentConfigService';
import type { SaveAgentConfigPayload } from '@/lib/models/agentConfig';

/**
 * GET /api/config/agent?agentId=xxx
 * 返回该用户对单个 agent 的所有已配置场景
 */
export const GET = withUser(async (req: NextRequest, userId: string) => {
    try {
        const agentId = req.nextUrl.searchParams.get('agentId');
        if (!agentId) {
            return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
        }
        const data = await getAgentConfig(userId, agentId);
        return NextResponse.json({ data });
    } catch (e: any) {
        console.error('[AgentConfig][GET]', e);
        return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
    }
});

/**
 * PUT /api/config/agent
 * Body: { agentId, scenes: [{sceneKey,supplierId,modelId,extras?}], prune? }
 * upsert 场景配置；prune=true 时删除未提交的旧场景
 */
export const PUT = withUser(async (req: NextRequest, userId: string) => {
    try {
        const body = await req.json() as SaveAgentConfigPayload;
        const result = await saveAgentConfig(userId, body);
        return NextResponse.json(result);
    } catch (e: any) {
        console.error('[AgentConfig][PUT]', e);
        return NextResponse.json({ error: e.message || 'Internal error' }, { status: 400 });
    }
});