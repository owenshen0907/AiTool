module.exports = {
    apps: [
        /* Next.js —— 3000 */
        {
            name: 'web',
            script: 'node_modules/.bin/next',
            args : 'start -p 3000',
            env  : { NODE_ENV: 'production' }
        },

        /* WebSocket 中转 —— 3001 */
        {
            name: 'proxy',
            script: 'server/real-time.cjs',
            env  : { NODE_ENV: 'production', PORT: 3001 }   // 若 real-time.cjs 端口可配置
        }
    ]
};