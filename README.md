# Owenshen's AiTool

[![Node.js](https://img.shields.io/badge/Node.js-v18.20.7-green)](https://nodejs.org/) [![npm](https://img.shields.io/badge/npm-v10.8.2-blue)](https://www.npmjs.com/)

## 介绍

AiTool 正在从“功能堆叠的 AI 工具箱”收敛成一个可持续使用的 AI 工作台，核心方向是把创作、学习、需求整理和个人资产沉淀放回同一套日常入口。

当前项目主要包含这些能力：

- **Workspace**：工作台首页、今日摘要、个性化首页模板与首页生成器
- **Prompt**：提示词管理、案例调试、结构化记录
- **Requirements**：站内需求看板、内容页与需求生命周期流转
- **Audio / TTS**：文本转语音、流式语音能力接入
- **Image / Video / Web Agent**：图像生成、视频配音、网页生成等 Agent 场景
- **Docs**：日语笔记、Demo 内容等长期沉淀空间
- **Files / Supplier Config**：文件工具、模型供应商与模型配置

项目基于 **Next.js**、**TypeScript**、**Tailwind CSS**、**PostgreSQL** 构建，并集成了 Casdoor 认证。

## 功能概览

### 工作台

- 默认承接登录后的主入口
- 展示需求脉搏、AI 每日摘要和建议下一步
- 支持生活 / 学习 / 工作 / 综合四类个性首页模板

### Prompt

- 提示词树形管理与编辑
- Prompt case 对比调试
- 配套目录、内容与元数据管理

### Requirements

- 需求看板与需求内容页
- 待处理、梳理、待开始、开发中、验证中、已归档等状态流转
- 与工作台摘要联动

### Audio / TTS

- 流式 TTS 接口
- 供应商、模型、音色配置
- 适合作为日语学习和内容输出的语音承接层

### Agent 场景

- 图片生成 Agent
- 视频配音 Agent
- 网页生成 Agent

### 内容与工具

- 日语笔记
- Demo 内容页
- 文件工具

## 技术栈

- **框架**：Next.js 13 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **认证**：Casdoor
- **数据库**：PostgreSQL (`pg` + `pgvector`)
- **实时能力**：WebSocket

## 要求

| 依赖项  | 版本要求   |
| ------- | ---------- |
| Node.js | >= 18.20.7 |
| npm     | >= 10.8.2  |

## 安装

```bash
git clone https://github.com/owenshen0907/AiTool.git
cd AiTool
npm install
```

## 开发

- 启动开发服务器（会先执行数据库初始化）

```bash
npm run dev
```

- 构建生产版本

```bash
npm run build
```

- 启动生产服务

```bash
npm run start
```

- 单独执行数据库初始化脚本

```bash
npm run init-db
```

## 项目结构

```text
AiTool/
├── src/
│   ├── app/
│   │   ├── workspace/           # 工作台与首页生成器
│   │   ├── prompt/              # Prompt 管理与 case 调试
│   │   ├── requirements/        # 需求看板与内容页
│   │   ├── audio/tts/           # TTS 页面
│   │   ├── agent/               # 图片 / 视频 / 网页 Agent
│   │   ├── docs/                # 日语笔记、Demo 等内容页
│   │   ├── stepfun/file/        # 文件工具
│   │   └── api/                 # App Router API
│   ├── lib/
│   │   ├── api/                 # 前端 API 封装
│   │   ├── auth/                # 登录与鉴权辅助
│   │   ├── db/                  # 数据库连接与初始化
│   │   ├── repositories/        # 数据访问层
│   │   ├── services/            # 业务逻辑层
│   │   ├── openai/              # 模型调用与封装
│   │   └── ws/                  # WebSocket 客户端能力
│   └── ...
├── pages/api/                   # 兼容 pages router 的少量 API
├── public/                      # 静态资源
├── docs/                        # 设计与运维文档
├── package.json
└── README.md
```

## 环境变量

项目默认从根目录的 `.env.local` 读取配置，至少需要：

```env
DATABASE_URL=postgres://username:password@localhost:5432/your_db

CASDOOR_ENDPOINT=https://your-casdoor-domain.com
CASDOOR_CLIENT_ID=your_client_id
CASDOOR_CLIENT_SECRET=your_client_secret
```

如果你要初始化数据库，请确保 `DATABASE_URL` 指向正确实例，并在执行 `npm run init-db` 前确认环境。

## 调试

在浏览器开发者工具中执行下面的代码，可以开启请求日志：

```javascript
localStorage.setItem('FETCH_DEBUG', '1');
location.reload();
```

## 许可证

本项目基于 [MIT License](https://opensource.org/licenses/MIT) 开源。
