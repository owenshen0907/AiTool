import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/devTaskService';

const claimSchema = z.object({
    agent_id: z.string().min(1),
    agent_name: z.string().optional(),
    device_type: z.enum(['work', 'personal', 'any']),
    workspace_keys: z.array(z.string().min(1)).min(1),
    project_slugs: z.array(z.string().min(1)).optional(),
    max_parallel_projects: z.number().int().positive().default(2),
    lease_seconds: z.number().int().positive().default(30),
});

export const POST = withUser(async (req: NextRequest, userId: string) => {
    const parsed = claimSchema.parse(await req.json());
    const claimed = await service.claimDevTask(userId, {
        agentId: parsed.agent_id,
        agentName: parsed.agent_name,
        deviceType: parsed.device_type,
        workspaceKeys: parsed.workspace_keys,
        projectSlugs: parsed.project_slugs,
        maxParallelProjects: parsed.max_parallel_projects,
        leaseSeconds: parsed.lease_seconds,
    });

    if (!claimed) {
        return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(claimed);
});
