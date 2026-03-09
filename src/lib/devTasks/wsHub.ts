import type { IncomingMessage } from 'http';
import { WebSocketServer, type WebSocket } from 'ws';

interface AgentSocketEntry {
    ownerId: string;
    agentId: string;
    deviceType: string;
    socket: WebSocket;
    connectedAt: string;
}

type DevTaskWireMessage = Record<string, unknown>;

const agentSockets = new Map<string, AgentSocketEntry>();
let registeredUpgradeServer: any = null;

function agentKey(ownerId: string, agentId: string) {
    return `${ownerId}:${agentId}`;
}

export function initDevTaskSocketServer(server: any) {
    if (server.__devTaskWss) {
        return server.__devTaskWss as WebSocketServer;
    }

    const wss = new WebSocketServer({ noServer: true });

    if (registeredUpgradeServer !== server) {
        registeredUpgradeServer = server;
        server.on('upgrade', (request: IncomingMessage, socket: any, head: Buffer) => {
            const url = new URL(request.url || '', 'http://localhost');
            if (url.pathname !== '/api/dev-tasks/socket') {
                return;
            }

            wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
                wss.emit('connection', ws, request);
            });
        });
    }

    wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
        const url = new URL(request.url || '', 'http://localhost');
        const ownerId = url.searchParams.get('userId');
        const agentId = url.searchParams.get('agentId');
        const deviceType = url.searchParams.get('deviceType') || 'unknown';

        if (!ownerId || !agentId) {
            socket.close(1008, 'missing identity');
            return;
        }

        const key = agentKey(ownerId, agentId);
        agentSockets.set(key, {
            ownerId,
            agentId,
            deviceType,
            socket,
            connectedAt: new Date().toISOString(),
        });

        socket.send(JSON.stringify({
            type: 'registered',
            owner_id: ownerId,
            agent_id: agentId,
            connected_at: new Date().toISOString(),
        }));

        socket.on('message', (buffer: Buffer) => {
            const parsed = safeParse(buffer.toString());
            if (!parsed) return;
            if (parsed.type === 'register') {
                socket.send(JSON.stringify({
                    type: 'ack',
                    received_at: new Date().toISOString(),
                }));
            }
        });

        socket.on('close', () => {
            const current = agentSockets.get(key);
            if (current?.socket === socket) {
                agentSockets.delete(key);
            }
        });

        socket.on('error', () => {
            const current = agentSockets.get(key);
            if (current?.socket === socket) {
                agentSockets.delete(key);
            }
        });
    });

    server.__devTaskWss = wss;
    return wss;
}

export function sendCommandToAgent(ownerId: string, agentId: string, payload: DevTaskWireMessage) {
    const entry = agentSockets.get(agentKey(ownerId, agentId));
    if (!entry || entry.socket.readyState !== entry.socket.OPEN) {
        return false;
    }

    entry.socket.send(JSON.stringify(payload));
    return true;
}

export function listConnectedAgents(ownerId?: string) {
    return [...agentSockets.values()]
        .filter((entry) => !ownerId || entry.ownerId === ownerId)
        .map((entry) => ({
            ownerId: entry.ownerId,
            agentId: entry.agentId,
            deviceType: entry.deviceType,
            connectedAt: entry.connectedAt,
        }));
}

function safeParse(text: string): DevTaskWireMessage | null {
    try {
        return JSON.parse(text) as DevTaskWireMessage;
    } catch {
        return null;
    }
}
