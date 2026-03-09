import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/devTaskService';

const createTaskSchema = z.object({
    task_id: z.string().uuid().optional(),
    revision_id: z.string().uuid().optional(),
    project_slug: z.string().min(1),
    project_name: z.string().min(1),
    template_id: z.string().min(1),
    workspace_key: z.string().min(1),
    allowed_device_types: z.array(z.enum(['work', 'personal', 'any'])).min(1),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    created_from: z.enum(['maintask', 'aitool']).default('aitool'),
    created_by: z.string().min(1),
    requested_by: z.string().min(1),
    goal: z.string().min(1),
    inputs: z.record(z.unknown()).default({}),
});

export const POST = withUser(async (req: NextRequest, userId: string) => {
    const parsed = createTaskSchema.parse(await req.json());
    const created = await service.createDevTask(userId, {
        taskId: parsed.task_id || uuidv4(),
        revisionId: parsed.revision_id || uuidv4(),
        projectSlug: parsed.project_slug,
        projectName: parsed.project_name,
        templateId: parsed.template_id,
        workspaceKey: parsed.workspace_key,
        allowedDeviceTypes: parsed.allowed_device_types,
        priority: parsed.priority,
        createdFrom: parsed.created_from,
        createdBy: parsed.created_by,
        requestedBy: parsed.requested_by,
        goal: parsed.goal,
        inputs: parsed.inputs,
    });
    return NextResponse.json(created, { status: 201 });
});
