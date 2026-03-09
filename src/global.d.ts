declare module 'ws' {
  export type WebSocket = any;
  export class WebSocketServer {
    constructor(options?: any);
    on(event: string, listener: (...args: any[]) => void): this;
    handleUpgrade(request: any, socket: any, head: any, callback: (socket: any) => void): void;
    emit(event: string, ...args: any[]): boolean;
  }
}
