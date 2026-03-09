import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import * as service from '@/lib/services/devTaskService';

export const GET = withUser(async (req: NextRequest, userId: string) => {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agent_id');
    if (!agentId) {
        return NextResponse.json({ error: 'Missing agent_id' }, { status: 400 });
    }

    const commands = await service.listPendingDevTaskCommands(userId, agentId);
    return NextResponse.json(commands.map((command) => ({
        type: command.type,
        command_id: command.commandId,
        request_id: command.requestId,
        task_id: command.taskId,
        revision_id: command.revisionId,
        message: command.message,
        created_at: command.createdAt,
    })));
});
