import type { NextApiRequest, NextApiResponse } from 'next';
import { initDevTaskSocketServer, listConnectedAgents } from '@/lib/devTasks/wsHub';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const server = (res.socket as any)?.server as any;
    if (server) {
        initDevTaskSocketServer(server);
    }

    res.status(200).json({
        ok: true,
        connectedAgents: listConnectedAgents(req.headers['x-user-id'] as string | undefined),
    });
}
