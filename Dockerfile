# ─────────────────────────────────────────────────
# 基础镜像
# ─────────────────────────────────────────────────
FROM node:18.20.7-alpine
LABEL maintainer="owenshen"

WORKDIR /app

# ①（可选）替换 Alpine 镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' \
    /etc/apk/repositories

# ② 安装系统依赖
RUN apk add --no-cache python3 make g++ git bash openssl libpq postgresql-libs

# ③ 仅复制依赖声明，做缓存层
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# ④ 复制全部源码
COPY . .

# ⑤ 构建 Next.js 产物
RUN npm run build

# ⑥ 安装 PM2 全局
RUN npm i -g pm2

# ⑦ 生产环境变量
ENV NODE_ENV=production

# ⑧ 暴露 Next.js
EXPOSE 3000

# ⑨ 启动 Web 进程
CMD ["pm2-runtime", "ecosystem.config.cjs"]
