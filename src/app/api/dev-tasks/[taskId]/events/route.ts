import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/devTaskService';

const eventSchema = z.object({
    revision_id: z.string().uuid(),
    status: z.enum(['draft', 'queued', 'claimed', 'planning', 'awaiting_approval', 'executing', 'checking', 'completed', 'needs_tuning', 'failed', 'cancelled', 'interrupted']).optional(),
    status_note: z.string().optional(),
    plan_summary: z.string().optional(),
    execution_summary: z.string().optional(),
    check_report: z.record(z.unknown()).optional(),
    next_step: z.string().optional(),
    follow_ups: z.array(z.string()).optional(),
    blockers: z.array(z.string()).optional(),
    final_digest: z.object({
        title: z.string().min(1),
        summary: z.string().optional(),
        body: z.string().optional(),
    }).optional(),
});

export const POST = withUser(async (req: NextRequest, userId: string, context?: any) => {
    const taskId = context?.params?.taskId;
    if (!taskId) {
        return NextResponse.json({ error: 'Missing task id' }, { status: 400 });
    }

    const parsed = eventSchema.parse(await req.json());
    const event = await service.appendDevTaskEvent(userId, taskId, {
        revisionId: parsed.revision_id,
        status: parsed.status,
        statusNote: parsed.status_note,
        planSummary: parsed.plan_summary,
        executionSummary: parsed.execution_summary,
        checkReport: parsed.check_report,
        nextStep: parsed.next_step,
        followUps: parsed.follow_ups,
        blockers: parsed.blockers,
        finalDigest: parsed.final_digest,
    });
    return NextResponse.json(event, { status: 201 });
});
