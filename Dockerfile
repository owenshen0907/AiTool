FROM node:18.20.7-alpine
LABEL authors="shenting"

WORKDIR /app

# 使用阿里源加速（可选）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 安装依赖工具
RUN apk add --no-cache python3 make g++ openssl libpq postgresql-libs git bash

# 复制依赖声明并安装
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# 复制全部代码
COPY . .

# 构建生产版本（如果是 next.js）
RUN npm run build

# 切换为生产模式
ENV NODE_ENV=production

# 启动命令
CMD ["npm", "run", "start"]