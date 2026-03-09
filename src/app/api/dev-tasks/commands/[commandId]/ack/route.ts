import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/devTaskService';

const ackSchema = z.object({
    status: z.enum(['applied', 'dismissed']),
    note: z.string().optional(),
});

export const POST = withUser(async (req: NextRequest, userId: string, context?: any) => {
    const commandId = context?.params?.commandId;
    if (!commandId) {
        return NextResponse.json({ error: 'Missing command id' }, { status: 400 });
    }

    const parsed = ackSchema.parse(await req.json());
    const updated = await service.ackDevTaskCommand(userId, commandId, {
        status: parsed.status,
        note: parsed.note,
    });

    if (!updated) {
        return NextResponse.json({ error: 'Command not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
});
