# Owenshen‘s AI Tool 平台

[![Node.js](https://img.shields.io/badge/Node.js-v18.20.7-green)](https://nodejs.org/) [![npm](https://img.shields.io/badge/npm-v10.8.2-blue)](https://www.npmjs.com/)

## 介绍

Owenshen‘s AI Tool 平台是一款一站式 AI 能力工具集，集成了以下六大核心模块：

- **Prompt**：Prompt 管理、生成与调试
- **知识库**：知识库管理与文件管理
- **模型微调**：微调任务管理与数据集管理
- **语音**：ASR、TTS 与实时语音交互
- **图片**：AI 图片生成
- **实用 Agent**：视频、图片、文件、代码与自定义接口测试等多场景 Agent

平台基于 **Next.js**、**TypeScript** 和 **Tailwind CSS** 构建，并集成了 Casdoor 认证与 PostgreSQL 数据存储，为开发者和产品团队提供高效、可扩展的 AI 能力支撑。

---

## 目录

- [功能](#功能)
- [技术栈](#技术栈)
- [要求](#要求)
- [安装](#安装)
- [开发](#开发)
- [项目结构](#项目结构)
- [环境变量](#环境变量)
- [许可证](#许可证)

---

## 功能

### Prompt

- Prompt 管理：列表、编辑、删除与权限控制
- Prompt 生成：快速创建模板化 Prompt
- Prompt 调试：实时测试与对比不同 Prompt 效果

### 知识库

- 知识库管理：统一创建与维护多个知识库
- 文件管理：上传、索引与检索文档、图片等资源

### 模型微调

- 微调管理：提交、监控与管理微调任务
- 数据集管理：上传、标注与划分训练集/验证集

### 语音

- ASR：实时语音转文字
- TTS：文本转语音合成
- Real‑Time：低时延双向语音交互示例

### 图片

- 图片生成：基于文本或模板批量生成 AI 图片

### 实用 Agent

- 视频：视频总结、剪辑脚本与文案生成
- 图片：图片批量分析与标注
- 文件：一键文本/图片总结
- 代码：一键生成 README 与接口文档
- 其它：自定义接口测试 Agent

---

## 技术栈

- **框架**：Next.js (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **认证**：Casdoor
- **数据库**：PostgreSQL (`pg` + `pgvector`)
- **Markdown 渲染**：`react-markdown` + `remark-gfm`

---

## 要求

| 依赖项      | 版本要求      |
| ----------- | ------------- |
| Node.js     | >= 18.20.7    |
| npm         | >= 10.8.2     |

---

## 安装

1. 克隆仓库

   ```bash
   git clone https://github.com/owenshen0907/AiTool.git
   ```

2. 进入项目目录

   ```bash
   cd AiTool
   ```

3. 安装依赖

   ```bash
   npm install
   ```

---

## 开发

- 启动开发服务器（包含 DB 初始化）

  ```bash
  npm run dev
  ```

- 构建生产环境静态文件

  ```bash
  npm run build
  ```

- 启动生产服务器

  ```bash
  npm run start
  ```

- 单独执行数据库初始化脚本

  ```bash
  npm run init-db
  ```

---

## 项目结构

```
AiTool/
├── src/                  # 源码目录
│   ├── app/              # Next.js App Router 页面与布局
│   ├── components/       # 可复用 React 组件
│   ├── db/               # 数据库初始化与连接逻辑
│   ├── lib/              # 公用工具函数
│   └── styles/           # 全局与模块化 Tailwind CSS 样式
├── public/               # 静态资源
├── .env                  # 环境变量示例
├── package.json          # 项目依赖与脚本
└── README.md             # 项目说明文档
```

---

## 环境变量

在项目根目录创建 `.env` 并配置：

```env
# 数据库连接
DATABASE_URL=postgres://username:password@localhost:5432/your_db

# Casdoor
CASDOOR_ENDPOINT=https://your-casdoor-domain.com
CASDOOR_CLIENT_ID=your_client_id
CASDOOR_CLIENT_SECRET=your_client_secret
```

---

## 许可证

本项目基于 [MIT 许可证](https://opensource.org/licenses/MIT) 开源。

