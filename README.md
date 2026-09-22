# AiTool 2.0

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.20.7-green)](https://nodejs.org/) [![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black)](https://nextjs.org/) [![License](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/licenses/MIT)

AiTool 2.0 是 Owen 的个人工具与工作网站：把正在做的 AI 产品、日常工具、App Store 上架材料、个人链接和长期记录收在同一个入口。

线上地址：[https://owenshen.top](https://owenshen.top)

## 当前定位

这个项目不再是旧版的“功能堆叠式工作台”，而是一个个人大杂烩式的长期站点：

- **产品展示**：整理日语学习、亲人关系 AI 社交、AI Vlog、自进化 Agent 等方向。
- **工具入口**：沉淀自己日常会用的模型接口、文件管理、Mermaid 预览等工具。
- **公开记录**：按时间线公开记录每日总结、产品判断、旧内容补录和素材摘录。
- **App Store 支持材料**：集中放隐私政策、支持页、条款、数据删除说明和上架检查清单。
- **个人链接**：把常用站点、产品入口和公开资料整理成自己的工作导航。

## 功能概览

### 首页与个人站点

- `/`：个人介绍与 4 条主要产品方向。
- `/products`：产品目录与 App Store 相关入口。
- `/links`：个人常用链接与站点导航。
- `/roadmap`：产品和站点后续规划。

### 工具箱

- `/tools`：AiTool 2.0 工具入口。
- `/tools/api-lab`：统一的模型接口实验室，用于整理供应商能力并生成客户端请求样例；站点不代用户转发模型请求，也不保存供应商密钥。
- `/tools/mermaid`：Mermaid 在线查看与调试。
- `/stepfun/file`：保留的历史文件管理工具入口，仅作为兼容工具继续使用。

### 公开记录

- `/notes`:公开时间线,顶部 5 个快捷视图(产品 / 生活 / AI / 工具 / 全部)按 tag 过滤。
- `/notes/[slug]`:文章详情,支持 Markdown + GFM + 内嵌 HTML(iframe / `<audio>`)+ 代码高亮。
- 内容来自独立 git 仓库 [`AiTool-content`](../AiTool-content),本地写 Markdown,git push 即发布。视频走 YouTube/B 站 iframe,**不存在本仓**。
- 渲染契约与内容规范见 [`docs/notes-content-guide.md`](./docs/notes-content-guide.md)。

### App Store 材料

- `/legal/apple-privacy`：Apple App 隐私政策。
- `/support`：App 支持页。
- `/legal/terms`：服务条款。
- `/legal/data-deletion`：数据删除说明。
- `/legal/app-store-checklist`：App Store 上架材料检查清单。

## 技术栈

- **框架**：Next.js 14 App Router
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **内容**：独立 git 仓库 `AiTool-content`,Markdown + frontmatter
- **认证**：unified-app-backend
- **运行方式**：本地 Node.js / Docker Compose

## 本地开发

### 依赖要求

| 依赖项 | 版本要求 |
| --- | --- |
| Node.js | >= 18.20.7 |
| npm | >= 10.8.2 |

依赖以 `package-lock.json` 为唯一锁文件，和 Docker 生产构建使用的 `npm ci` 保持一致。

### 安装

```bash
git clone https://github.com/owenshen0907/AiTool.git
cd AiTool
npm install
```

### 环境变量

项目默认读取根目录的 `.env.local`。如果需要启用登录或受保护接口，需要配置 unified-app-backend：

```env
UNIFIED_APP_BACKEND_URL=https://appapi.example.com
NEXT_PUBLIC_UNIFIED_APP_BACKEND_URL=https://appapi.example.com

# 可选：Google OAuth 建议走可稳定访问 Google 的后端区域，例如东京。
UNIFIED_APP_GOOGLE_BACKEND_URL=https://jp-appapi.example.com

UNIFIED_APP_CODE=aitool
NEXT_PUBLIC_UNIFIED_APP_CODE=aitool

UNIFIED_APP_NAME=AiTool 2.0
NEXT_PUBLIC_UNIFIED_APP_NAME=AiTool 2.0

UNIFIED_APP_BUNDLE_ID=top.owenshen.aitool
NEXT_PUBLIC_UNIFIED_APP_BUNDLE_ID=top.owenshen.aitool

NEXT_PUBLIC_APP_URL=http://localhost:3002
```

内容仓库默认从同级目录 `../AiTool-content` 读取,可通过环境变量覆盖:

```env
# 默认: <AiTool 上级目录>/AiTool-content
CONTENT_REPO_PATH=/absolute/path/to/AiTool-content
```

### 启动

开发服务器默认跑在 `3002` 端口：

```bash
npm run dev
```

生产构建：

```bash
npm run check:security
npm run build
npm run start
```

`check:security` 会阻止已废弃的服务端模型代理、供应商密钥配置和“只解码、不验签”的 JWT 鉴权重新进入公开站。公开页面不依赖登录中间件；`/dashboard` 与账号 API 会把 session token 交给 unified-app-backend 实际校验。StepFun 文件工具只转发用户在当前请求中提供的 Bearer token；站点不持久化该 token。

## 内容仓库 (AiTool-content)

公开记录的所有 Markdown 都在独立仓库 `AiTool-content` 里,网站只负责渲染。完整的 frontmatter 规范、写作流程见 [`AiTool-content/README.md`](../AiTool-content/README.md)。

最小示例:

```markdown
---
title: 开始运营 X 的第一天
date: 2026-05-01
tags: [产品, X运营, daily]
excerpt: 今天把对外表达正式拉起来。
---

正文是普通 Markdown,GFM 全开。

视频用 iframe:

<iframe src="https://www.youtube.com/embed/VIDEO_ID" width="100%" height="420" allowfullscreen></iframe>
```

写完 push 到 `AiTool-content` 仓库,网站构建/启动时会读取并渲染到 `/notes`。

## 项目结构

```text
AiTool/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # 首页
│   │   ├── tools/                   # 工具箱与 API Lab / Mermaid
│   │   ├── notes/                   # 公开记录页
│   │   ├── products/                # 产品目录
│   │   ├── legal/                   # 隐私政策、条款、检查清单
│   │   ├── support/                 # App 支持页
│   │   ├── stepfun/file/            # 保留的历史文件管理入口
│   │   └── api/                     # App Router API
│   ├── lib/
│   │   ├── auth/                    # unified-app-backend 鉴权
│   │   ├── posts/                   # 读取 AiTool-content 的 Markdown
│   │   └── providerLab.ts           # API Lab 静态数据
│   └── config.ts                    # 站点与后端配置
├── public/                          # 静态资源与上传文件
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

## 部署

项目可以通过 Docker Compose 部署，默认将 Next.js 服务暴露在 `3000` 端口：

```bash
docker compose up -d --build aitool
```

生产环境建议：

- 使用 Nginx / HTTPS 反向代理到容器 `3000` 端口。
- `.env.local` 只保存在服务器，不提交到仓库。
- Casdoor 已不再作为本项目登录依赖。

## 许可证

本项目基于 [MIT License](https://opensource.org/licenses/MIT) 开源。
