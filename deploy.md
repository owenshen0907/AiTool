# 🛠️ AiTool 一容器多进程生产部署笔记

**场景**
- Next 13 / App Router 项目
- 还需一个 Node WebSocket 中转服务 (`server/real-time.cjs`)
- 生产机只开放 **80 / 443**，其余端口内部使用
- 单 **Docker 容器**，用 **PM2** 同时跑 Next + WS Relay

---

## 1 | 目录结构（关键文件）

```text
.
├─ Dockerfile
├─ docker-compose.yml
├─ ecosystem.config.cjs   <-- PM2 多进程配置 (CJS!)
├─ server/
│   └─ real-time.cjs      <-- WS 中转
├─ src/                   <-- Next.js 源码
└─ .env.local             <-- 生产环境变量
```

## 2 | PM2 配置 ecosystem.config.cjs

```javascript
module.exports = {
  apps: [
    {
      name: 'nextjs',
      script: 'npm',
      args: 'start',   // next start
      cwd: '/app',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'ws-relay',
      script: 'server/real-time.cjs',
      cwd: '/app',
      env: {
        NODE_ENV: 'production',
        PORT: 3001      // 如 real-time.cjs 读取 process.env.PORT
      }
    }
  ]
};
```

**为何 .cjs？**
项目 package.json 声明 "type": "module"，PM2 只能用 require() 载入配置；
把文件改成 CommonJS (.cjs + module.exports) 即可。

## 3 | Dockerfile（核心片段）

```dockerfile
FROM node:18.20.7-alpine
WORKDIR /app

# ——依赖——
RUN apk add --no-cache python3 make g++ git bash openssl libpq postgresql-libs

# ——安装——
COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY src .

# Next.js 预编译
RUN npm run build

# 安装 PM2
RUN npm i -g pm2

ENV NODE_ENV=production
EXPOSE 3000 3001

CMD ["pm2-runtime", "ecosystem.config.cjs"]
```

## 4 | docker-compose.yml（最小化示例）

```yaml
services:
  aitool:
    build: .
    container_name: aitool
    restart: always
    ports:
      - "3000:3000"   # Next.js
      - "3001:3001"   # WS Relay
    env_file: .env.local
```

## 5 | Nginx 反向代理

### 80 → 443

```nginx
server {
  listen 80;
  server_name owenshen.top login.owenshen.top;
  location /.well-known/acme-challenge/ { root /var/www/certbot; }
  location / { return 301 https://$host$request_uri; }
}
```

### 443 主站 & WebSocket

```nginx
server {
  listen 443 ssl http2;
  server_name owenshen.top;

  ssl_certificate     /etc/letsencrypt/live/owenshen.top/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/owenshen.top/privkey.pem;

  # Next.js
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade           $http_upgrade;
    proxy_set_header Connection        "upgrade";
  }

  # WebSocket Relay
  location /ws {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade           $http_upgrade;
    proxy_set_header Connection        "upgrade";
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_buffering off;  # 流式
  }
}
```

前端 `useRealtimeClient.ts` 里构造目标地址：

```typescript
const wsOrigin =
  typeof window === 'undefined'
    ? 'ws://localhost:3001/ws'
    : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
```

## 6 | 一键脚本示例

```bash
#!/bin/bash
set -e
echo "Pulling latest code..."
git pull

echo "Re-building container..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo "Done ✅"
```

## 7 | 常见报错 & 排查

| ❌ 报错 | 原因 | 处理 |
| --- | --- | --- |
| require() of ES Module ecosystem.config.js not supported | PM2 配置文件冲突 ESM vs CJS | 重命名 ecosystem.config.cjs 并用 module.exports |
| Could not connect to "ws://localhost:3001/ws?..." | ① Relay 没跑 ② Nginx 未转发 ③ 防火墙 | docker ps/logs & nginx -t 检查 |
| Could not start media stream | 浏览器麦克风权限被拒 | 在 HTTPS 域名手动允许麦克风 |
| RealtimeAPI is not connected | 前端调用 appendInputAudio() 早于 WebSocket open | 确保连接成功后再录音；客户端有重连逻辑 |
| 容器无限重启 | pm2 载入配置失败、环境变量缺失、端口被占用 | docker compose logs -f 查看首条错误 |

## 8 | 最佳实践

1. **环境变量**
   `.env.local` 放在宿主机，用 `env_file:` 或 `docker secret` 注入，不要写进镜像。

2. **分层缓存**
   `COPY package*.json → npm ci → COPY . .`，修改代码不重新装依赖。

3. **健康检查**
   `docker-compose.yml` 里给 Next.js & WS Relay 各加 `healthcheck` (`curl -f http://localhost:3000/healthz`).

4. **自动 SSL 续期**
   利用 `certbot + location /.well-known/` 或用 `nginx-certbot` 镜像。

5. **灰度/回滚**
   镜像打版本号 `tag`；Compose 里用 `${TAG:-latest}`，回滚只需 `docker compose up -d`.

参考此文档即可快速重现 一容器多进程（Next.js + WS Relay） 的部署流程，并在出现连接 / 环境 / 端口冲突等问题时，第一时间定位。