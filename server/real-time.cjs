// File: server/real-time.cjs
// 注意：如果你用 TypeScript，可改成 server.ts，并保证 ts-node 或其他方式能执行

// 1️⃣ 引入基础依赖
const { createServer } = require('http')
const next = require('next')
const WebSocket = require('ws')
const { parse } = require('url')

// 2️⃣ 判断当前环境（开发或生产）
const dev = process.env.NODE_ENV !== 'production'

// 3️⃣ new Next 实例，dir 默认为项目根
const app = next({ dev })
// 4️⃣ 拿到 Next.js 处理路由的 handler
const handle = app.getRequestHandler()

// 5️⃣ 等 Next.js 准备好后，再启动 HTTP+WebSocket 服务
app.prepare().then(() => {
    // 6️⃣ 创建一个通用的 HTTP 服务器，所有 HTTP 请求都交给 Next 处理
    const server = createServer((req, res) => {
        // Next.js 负责处理普通的页面渲染、pages/api、静态文件、Asset 请求等
        handle(req, res)
    })

    // 7️⃣ 在同一个 server 上挂 WebSocket.Server
    //     path:'/ws' 表示只有访问 ws://域名:3000/ws 时才升级到 WebSocket，中转逻辑就放在这里
    const wss = new WebSocket.Server({ server, path: '/ws' })

    // 8️⃣ 中转服务核心逻辑：
    wss.on('connection', (clientWs, req) => {
        // 该回调在客户端发起 WebSocket upgrade 到 /ws 时触发
        // req.url 类似： /ws?apiKey=xxx&model=yyy&wsUrl=https%3A%2F%2Fapi.stepfun.com%2Fv1%2Frealtime
        // 我们要从 querystring 拿到 apiKey、model、wsUrl

        let clientApiKey = ''
        let clientModel  = ''
        let customWsUrl  = ''
        try {
            const parsed = new URL(req.url, `http://${req.headers.host}`)
            clientApiKey = parsed.searchParams.get('apiKey') || ''
            clientModel  = parsed.searchParams.get('model')  || ''
            customWsUrl  = parsed.searchParams.get('wsUrl')  || ''
        } catch (e) {
            console.error('[server.js] 无法解析 query：', e)
            // 如果没法解析，就直接关闭连接
            clientWs.close(1008, 'Invalid query parameters')
            return
        }

        // 9️⃣ 根据有没有 clientModel、clientApiKey、customWsUrl 来决定最终要连哪个远端
        const DEFAULT_WS_URL   = process.env.DEFAULT_WS_URL || 'wss://api.stepfun.com/v1/realtime'
        const DEFAULT_MODEL    = process.env.DEFAULT_MODEL  || 'step-1o-audio'
        const DEFAULT_API_KEY  = process.env.API_KEY        || ''

        // 如果用户在 query 里传了 wsUrl，就先校验它是否合法
        let finalTargetUrl = ''
        if (customWsUrl) {
            try {
                customWsUrl = decodeURIComponent(customWsUrl)
                new URL(customWsUrl) // 校验合法
                finalTargetUrl = customWsUrl.includes('?')
                    ? `${customWsUrl}&model=${clientModel || DEFAULT_MODEL}`
                    : `${customWsUrl}?model=${clientModel || DEFAULT_MODEL}`
            } catch (e) {
                console.error('[server.js] 客户端传的 wsUrl 有问题，改用默认：', customWsUrl, e)
                finalTargetUrl = `${DEFAULT_WS_URL}?model=${clientModel || DEFAULT_MODEL}`
            }
        } else {
            finalTargetUrl = `${DEFAULT_WS_URL}?model=${clientModel || DEFAULT_MODEL}`
        }

        const finalApiKey = clientApiKey || DEFAULT_API_KEY
        console.log(
            `[server.js] 新客户端连入 /ws → 转发到 ${finalTargetUrl}，使用 API Key: ${finalApiKey ? '✔' : '（无）'}`
        )

        // 10️⃣ 建立到最终服务器的 WebSocket 连接
        const finalWs = new WebSocket(finalTargetUrl, {
            // 如果远端需要 Authorization，直接把它放到 headers
            headers: {
                Authorization: `Bearer ${finalApiKey}`,
            }
        })

        // 我们在 clientWs.data 下保存一些状态，比如 queue、connectionFailed
        clientWs.data = {
            finalWs,
            messageQueue: [],     // 缓冲在 finalWs 打开前从 client 发过来的数据
            connectionFailed: false,
            connectionTimeout: null,
        }

        // 11️⃣ 设置连接超时（10s），如果超过 10s finalWs 还没 OPEN，就当连接失败
        clientWs.data.connectionTimeout = setTimeout(() => {
            if (finalWs.readyState !== WebSocket.OPEN) {
                console.log('[server.js] 转发连接到后端超时，断开。')
                clientWs.data.connectionFailed = true
                // 通知前端超时
                clientWs.send(JSON.stringify({
                    type: 'error',
                    error: 'connection_timeout',
                    message: '连接后端服务超时，请稍后重试'
                }))
                // 清空 buffer
                clientWs.data.messageQueue.length = 0
                finalWs.close()
            }
        }, 10000)

        // 12️⃣ 处理远端 finalWs 事件：open / message / close / error
        finalWs.onopen = () => {
            console.log('[server.js] 已连接到后端实时语音/TTS 服务')
            clearTimeout(clientWs.data.connectionTimeout)

            // 一旦连上，就把 buffer 里的东西一次性发给 finalWs
            if (clientWs.data.messageQueue.length > 0 && !clientWs.data.connectionFailed) {
                console.log(`[server.js] 发送 ${clientWs.data.messageQueue.length} 条缓存给后端`)
                clientWs.data.messageQueue.forEach(msg => finalWs.send(msg))
                clientWs.data.messageQueue.length = 0
            }
        }

        finalWs.onmessage = event => {
            // 后端返回数据，原样转给 clientWs
            if (event.data instanceof Buffer) {
                clientWs.send(event.data.toString())
            } else {
                clientWs.send(event.data)
            }
        }

        finalWs.onclose = event => {
            console.log('[server.js] 后端连接关闭，code=', event.code)
            if (event.code !== 1000) {
                try {
                    clientWs.send(JSON.stringify({
                        type: 'error',
                        error: 'connection_closed',
                        message: '后端服务连接意外关闭'
                    }))
                } catch (_){}
            }
            // 同步关闭 clientWs
            clientWs.close()
        }

        finalWs.onerror = err => {
            console.error('[server.js] 与后端 WebSocket 出错：', err)
            clientWs.data.connectionFailed = true
            clientWs.data.messageQueue.length = 0

            try {
                const errMsg = (err && err.message) || ''
                let payload = { type: 'error', error: 'connection_error', message: '连接时发生错误' }
                if (errMsg.includes('401')) {
                    payload.error   = 'invalid_api_key'
                    payload.message = '无效的 API Key'
                }
                clientWs.send(JSON.stringify(payload))
            } catch (_) {}
        }

        // 13️⃣ 处理 clientWs（前端连入中转）发过来的消息
        clientWs.on('message', raw => {
            // 如果 finalWs 还没打开，就先缓存
            if (finalWs.readyState !== WebSocket.OPEN) {
                if (clientWs.data.connectionFailed) {
                    return
                }
                const s = raw instanceof Buffer ? raw.toString() : raw
                clientWs.data.messageQueue.push(s)
                return
            }
            // finalWs OPEN 了，就直接转发
            const s = raw instanceof Buffer ? raw.toString() : raw
            finalWs.send(s)
        })

        // 14️⃣ clientWs 主动断开时，顺带把 finalWs 也关了
        clientWs.on('close', () => {
            console.log('[server.js] 客户端断开连接，清理资源')
            if (clientWs.data.connectionTimeout) clearTimeout(clientWs.data.connectionTimeout)
            if (clientWs.data.finalWs) clientWs.data.finalWs.close()
            clientWs.data.messageQueue.length = 0
        })

        // 15️⃣ 处理背压（可选）
        clientWs.on('drain', () => {
            const amt = clientWs.bufferedAmount || 0
            console.log('[server.js] WebSocket backpressure:', amt)
        })
    })

    // 16️⃣ 启动整个 HTTP + WebSocket 服务器，监听 3000
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, err => {
        if (err) throw err
        console.log(`> WS relay started – listening ${PORT}`);
    })
})