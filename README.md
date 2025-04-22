# Nihongo

[![Node.js](https://img.shields.io/badge/Node.js-v18.20.7-green)](https://nodejs.org/) [![npm](https://img.shields.io/badge/npm-v10.8.2-blue)](https://www.npmjs.com/)

## **Nihongo**
- 是一款支持**翻译**、**笔记记录**、**学习推荐**的工具。**可拍照或输入文本翻译**，**提取单词和语法并解析**，**自动生成学习笔记**，**支持熟练度标记与推荐复习**。**提供单词/语法卡片打印**、**线下练习记录**、Markdown 笔记管理，并**跟踪学习进度**。未来将增强实体笔记扫描。欢迎反馈，我会尽快适配上线！
- 是一个使用 **Next.js**、**TypeScript** 和 **Tailwind CSS** 构建的现代化 Web 应用。它集成了 Casdoor 认证、PostgreSQL 数据库管理，并支持 Markdown 渲染。

---

## 目录

- [概述](#概述)
- [功能](#功能)
- [要求](#要求)
- [安装](#安装)
- [开发](#开发)
- [项目结构](#项目结构)
- [环境变量](#环境变量)
- [许可证](#许可证)

---

## 概述

本项目基于 Next.js 构建，支持服务端渲染（SSR）和静态站点生成（SSG）。利用 TypeScript 保证类型安全，并通过 Tailwind CSS 快速构建响应式用户界面。主要集成包括：
- **Casdoor** 用于安全认证。
- **PostgreSQL**（使用 `pg` 和 `pgvector`）进行数据存储。
- **Markdown 渲染**：使用 `react-markdown` 和 `remark-gfm` 解析 Markdown 内容。

---

## 功能

- **Next.js**：支持 SSR 和 SSG。
- **TypeScript**：利用静态类型提高代码质量。
- **Tailwind CSS**：快速构建响应式设计。
- **PostgreSQL**：通过 `pg` 和 `pgvector` 实现数据管理。
- **Casdoor 认证**：实现安全的用户认证。
- **Markdown 渲染**：使用 `react-markdown` 和 `remark-gfm` 解析 Markdown 内容。

---

## 要求

| 依赖项      | 版本要求      |
| ----------- | ------------- |
| Node.js     | >= 18.20.7    |
| npm         | >= 10.8.2     |

---




# 安装

## 1. 克隆仓库

```bash
git clone https://github.com/owenshen0907/NihonGO.git
```

## 2. 进入项目目录

```bash
cd nihongo
```

## 3. 安装依赖

```bash
npm install
```

# 开发

## 1. 启动开发服务器

此命令将初始化数据库并启动 Next.js 开发服务器：

```bash
npm run dev
```

## 2. 构建生产环境

生成生产环境所需的静态文件：

```bash
npm run build
```

## 3. 启动生产服务器

在构建完成后，启动生产环境服务器：

```bash
npm run start
```

## 4. 数据库初始化

仅执行数据库初始化脚本：

```bash
npm run init-db
```

# 项目结构

```
nihongo/
├── src/                    # 源码目录
│   ├── db/                 # 数据库相关文件
│   │   └── initDb.ts       # 数据库初始化脚本
│   ├── pages/              # Next.js 页面
│   ├── components/         # 可复用的 React 组件
│   └── styles/             # Tailwind CSS 样式文件
├── public/                 # 静态资源（图片、字体等）
├── .env                    # 环境变量文件（本地）
├── .gitignore              # Git 忽略文件
├── package.json            # 项目依赖与脚本管理
└── README.md               # 项目说明文档
```

# 环境变量

本项目使用 dotenv 管理环境变量。在项目根目录下创建 `.env` 文件，并填写如下配置：

```env
# 数据库配置
DATABASE_URL=postgres://username:password@localhost:5432/your_database

# Casdoor 配置
CASDOOR_ENDPOINT=https://your-casdoor-domain.com
CASDOOR_CLIENT_ID=your_client_id
CASDOOR_CLIENT_SECRET=your_client_secret
```

# 许可证

本项目采用 [MIT 许可证](https://opensource.org/licenses/MIT) 进行授权。
