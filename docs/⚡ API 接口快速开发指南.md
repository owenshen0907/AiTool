# API 接口开发指南

## A. 项目接口相关结构与职责

| 路径 / 文件 | 作用 | 关键注意事项 |
| --- | --- | --- |
| `src/app/api/**/route.ts` | Next.js App Router API 入口（定义 GET/POST/PUT/PATCH/DELETE）。 | 必须引入鉴权包装：`import { withUser } from '@/lib/api/auth';`；返回统一 JSON；不要写业务/SQL。 |
| `withUser (@/lib/api/auth)` | 鉴权高阶函数，解析 Session/Cookie，向 handler 传入 userId。 | 未登录返回 401；handler 签名：`(req, userId) => NextResponse`。 |
| `src/lib/db/client.ts` | 导出数据库连接池 pool（pg）。 | 引用方式固定：`import { pool } from '@/lib/db/client';`；禁止在 Route 直接拼 SQL（放 repository）。 |
| `src/lib/models/*.ts` | 存放类型接口（DTO、请求体、响应体、DB 行结构）。 | 仅类型，不写逻辑；命名建议：`<Resource>DBRow`, `<Resource>Upsert`, `Save<Resource>Payload`, `<Resource>Response`。 |
| `src/lib/repositories/*Repository.ts` | 数据访问层：纯 SQL。 | 只做 CRUD / Upsert；不做权限/过滤逻辑；使用参数化查询；需要事务时手动 BEGIN/COMMIT/ROLLBACK。 |
| `src/lib/services/*Service.ts` | 业务组合层：校验 → 过滤 → 调 repository → 组装返回对象。 | 不返回 NextResponse；抛错交给上层 route 捕获；放权限校验、去重、空值过滤。 |
| `src/lib/utils/` | 通用工具（如脱敏、校验器）。 | 与业务无关；避免互相依赖循环。 |
| `src/lib/db/migrations/*.ts` | 迁移脚本：建表、索引、触发器。 | 函数命名 `<resource>Migration`；在 `initDb.ts` 中显式调用；幂等（IF NOT EXISTS）。 |
| `src/lib/db/initDb.ts` | 启动时执行迁移。 | 新迁移需添加 `await xxxMigration(client);`；不要在这里写业务。 |
| `src/app/components/**` | 前端组件 / Hooks。 | 调接口时 `fetch(url, { credentials:'include' })`；错误统一处理。 |
| `src/lib/repositories/...validateOwnership` | 可选：校验资源属于当前用户。 | 在 Service 中调用；失败抛错（403/业务错误）。 |

## B. 开发一个新接口前需要规划的内容

| 规划项 | 要回答/整理的内容 | 示例（以“Agent 场景配置”说明） |
| --- | --- | --- |
| 资源名称 / 英文标识 | 业务名 + 唯一标识（用于文件/路由） | Agent 场景配置 / agent |
| 主查询 key | GET 要依赖的查询参数或仅 userId | agentId |
| 操作模式 | 只读 / Upsert / 全 CRUD / 批量 | 查询 + 批量 Upsert |
| 表结构 | 新表或复用？字段、唯一约束、索引 | 表：agent_scene_config；唯一 (user_id, agent_id, scene_key) |
| 外键归属 | 是否需要校验供应商/模型属于该用户 | 需要（校验 supplier / model） |
| 返回结构 | 前端需要哪些字段？是否返回敏感字段 | 供应商原始 apiKey + 模型基本信息 |
| 脱敏策略 | 是否脱敏 apiKey | 不脱敏 |
| prune 逻辑 | 保存时是否删除未提交场景 | 由前端传 prune 决定 |
| 错误规范 | 缺参数 / 未登录 / 权限 / 其它 | 400 / 401 / 403 / 500 |
| 可空规则 | 不完整记录如何处理（跳过 or 抛错） | 过滤掉不完整 scene |
| 事务需求 | 多条写入是否需原子性 | 是（批量 upsert） |
| 幂等性 | 重复调用是否产生重复数据 | Yes，使用 ON CONFLICT |
| 性能 | 预估行数、是否需要分页 | 行数小，不分页 |
| 未来扩展 | 预留 JSONB extras / 审计 | 保留 extras |

**最少必填规划清单（可直接塞进 Prompt）：**

```
资源: <resourceName> (<resourceIdKey>)
用途: <one sentence>
操作: <GET + PUT | ...>
表: <tableName> (新建? Y/N)
唯一约束: <...>
返回字段: <list>
需要校验归属: <Yes/No + 哪些外键>
不完整数据策略: <skip | error>
是否支持 prune: <Yes/No>
是否脱敏敏感字段: <Yes/No>
```

## C. 通用 Prompt 模板（直接复制→填空→发给 AI 让其生成接口代码）

```
你是一个熟悉 Next.js App Router + PostgreSQL 的后端助手。
基于下述“项目约定”和“接口规划”，生成所需文件骨架代码（models / repository / service / route），
保持风格统一、简洁、无多余注释，按约定正确引用 withUser 与 pool。

[项目约定]
1. Route 文件路径: src/app/api/<domain>/<resource>/route.ts
2. 鉴权: import { withUser } from '@/lib/api/auth'
3. DB 连接池: import { pool } from '@/lib/db/client'
4. 分层:
   - models: 只放类型 (DBRow / Upsert / SavePayload / Response)
   - repositories: 只放 SQL（getByKey, upsertBatch, prune 可选, validateOwnership 可选）
   - services: 参数校验 + 过滤 + 调用 repository + 返回 DTO
   - route: 解析请求参数 -> 调服务 -> 返回 NextResponse.json
5. 统一状态码: 缺参数=400, 未登录=withUser 处理, 权限失败=403, 其它=500
6. 事务: 批量 upsert 用 BEGIN/COMMIT, 出错 ROLLBACK
7. JSON 返回结构: GET => { data }, PUT => { updated, data }

[接口规划]
资源名称: <填写>
英文标识(目录名): <resource>
主查询 key: <keyName> (query 参数)
用途: <一句话>
操作: <例如: GET 查询 + PUT 批量 Upsert>
表: <tableName> (是否已存在: Y/N)
唯一约束: <例如: (user_id, <keyName>, item_key)>
外键及归属校验: <例如: supplier_id, model_id 必须属于 user>
返回字段: <列出必须返回的字段>
不完整记录策略: <skip / error>
是否支持 prune: <Yes/No> (说明机制)
是否脱敏敏感字段: <Yes/No>
需要 extras JSONB: <Yes/No>
未来可扩展: <简单列出>

请输出：
1) models/<resource>.ts
2) repositories/<resource>Repository.ts
3) services/<resource>Service.ts
4) app/api/<domain>/<resource>/route.ts
如果表需新建，附建表 SQL (带 IF NOT EXISTS + 唯一约束 + 索引 + updated_at 触发器)。
```

## D. 书写 / 实现注意事项（精要）

| 点 | 说明 |
| --- | --- |
| Route 瘦 | 不在 route 里写 SQL / 业务；只解析参数与返回 |
| 统一导入 | `withUser` 和 `pool` 引用路径固定 |
| 错误抛出 | Service 中 `throw new Error(msg)`；Route 捕获并转 400/500 |
| 幂等 Upsert | `INSERT ... ON CONFLICT (...) DO UPDATE SET ...` |
| 空数据 | GET 返回 `{ data: { agentId, scenes: [] } }` 之类结构 |
| 不完整过滤 | 先过滤再 upsert，避免脏行 |
| 事务 | 多条写操作包事务，避免部分成功 |
| 权限 | `validateOwnership` 放 repository 或 service，不放 route |
| 扩展字段 | 用 extras JSONB，前端未知字段不丢失 |
| 日志 | 出错：`console.error('[<Resource>][Action]', e)` |

## E. 最终 Checklist（开发者自检）

| 项目 | 完成？ |
| --- | --- |
| 规划清单填写完整 |  |
| 建表 / 迁移已执行 |  |
| models 文件创建 |  |
| repository 函数：get / upsert / (prune) / (validateOwnership) |  |
| service：get / save |  |
| route：GET / PUT |  |
| withUser 鉴权工作正常 |  |
| 批量保存事务正常 |  |
| GET 空数据结构正确 |  |
| prune 功能（若声明支持）测试通过 |  |
| 前端调用完成并验证 |  |