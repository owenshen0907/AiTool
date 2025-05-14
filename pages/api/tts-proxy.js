// File: pages/api/tts-proxy.js
import { createProxyServer } from 'http-proxy';
import { parse } from 'url';

// 创建支持 WS 的代理实例
const wsProxy = createProxyServer({
    ws: true,
    changeOrigin: true,
    secure: true,
});

export const config = {
    api: {
        bodyParser: false,      // WebSocket 握手不走 body 解析
        externalResolver: true, // 告诉 Next.js：我们自己处理结束
    },
};

export default function handler(req, res) {
    const { query } = parse(req.url, true);
    const { target, token, model } = query;

    // 第一次触发时，给底层 HTTP Server 挂载 upgrade 事件
    if (!req.socket.server.wsProxySetup) {
        req.socket.server.wsProxySetup = true;
        req.socket.server.on('upgrade', (request, socket, head) => {
            const { query: q } = parse(request.url, true);
            const { target, token, model } = q;
            // 必须同时带上这三个参数才能代理
            if (!target || !token || !model) {
                socket.destroy();
                return;
            }
            // 给真实请求注入 Authorization 头
            wsProxy.on('proxyReqWs', (proxyReq) => {
                proxyReq.setHeader('Authorization', `Bearer ${token}`);
            });
            // 构造真正的服务端 URL，附加 model 参数
            const sep = target.includes('?') ? '&' : '?';
            const realTarget = `${target}${sep}model=${encodeURIComponent(model)}`;
            console.log('[ProxyTTS] upgrading WS to', realTarget);
            // 让 http-proxy 去做 WS 转发
            wsProxy.ws(request, socket, head, { target: realTarget });
        });
    }

    // 对普通 HTTP GET，返回 200 表示就绪
    res.status(200).json({ ok: true });
}