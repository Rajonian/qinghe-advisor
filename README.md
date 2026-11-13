# 青禾顾问工作台 · Qinghe Advisor Workspace

> 面向营养咨询成交与老客经营的 AI 工作台：基于 **Next.js (Vinext) + Cloudflare Worker + D1** 构建，
> 覆盖双向模拟会话、RAG 知识中心、动态档案与任务管理、AI 密钥安全配置的完整闭环。

[![在线演示](https://img.shields.io/badge/在线演示-qinghe--advisor.tajonyusheng.workers.dev-0f7a5a)](https://qinghe-advisor.tajonyusheng.workers.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-0f7a5a)](./LICENSE)

## 项目背景

营养咨询机构的顾问在日常工作中需要同时处理客户接待、档案维护、补货跟进、回访安排与知识检索，
信息分散在多个工具中。本项目把这些工作流收敛到一个工作台：会话驱动客户经营，知识中心提供可溯源的
专业资料，AI 能力在明确的边界内辅助生成回复草稿与摘要，关键决策始终由顾问确认。

## 核心功能

- **咨询接待**：双向模拟会话，支持自定义客户消息与四种预设场景；动态生成摘要、标签、回复草稿与下一步行动。
- **客户与任务**：顾问分别确认档案与任务调整，自动结束旧补货跟进、创建待确认回访，全程版本冲突保护。
- **知识中心（RAG）**：TXT/Markdown 导入、分类、版本与审核；可配置切片长度、Top K、匹配分、标题权重；
  提供检索试验台，按片段召回、按完整资料组装，答案可溯源。
- **数据云端同步**：按账号保存会话、档案、备注、任务与草稿，支持旧版浏览器数据导入。
- **AI 与安全配置**：API Key 以 AES-GCM 密文存入 D1，支持启停、连接测试与脱敏调用记录；
  未配置 Key 时为明确标注的规则演示模式，启用后服务端调用 DeepSeek，不做静默降级。
- **公开演示模式**：非托管环境下以固定演示账号进入，便于直接体验，数据与真实账号隔离。

## 技术架构

| 层 | 技术选型 |
| --- | --- |
| 前端 | React 19 / Next.js 16 (Vinext)、TypeScript、Tailwind CSS、shadcn 组件 |
| 运行时 | Cloudflare Worker（`nodejs_compat`） |
| 数据库 | Cloudflare D1（SQLite），Drizzle ORM 管理迁移 |
| AI 接入 | DeepSeek（服务端代理调用）、RAG 检索、AES-GCM 密钥加密 |
| 工程 | Wrangler、Node test、Playwright、类型检查 |

## 快速开始

需要 Node.js >= 22.13。

```sh
# 安装依赖
npm install

# 本地开发
npm run dev -- --port 4173

# 构建
npm run build

# 类型检查与测试
node node_modules/typescript/bin/tsc --noEmit
node --test tests/advisor.test.mjs
```

本地 `.dev.vars` 可配置 32 字节 base64 加密主密钥 `CONFIG_ENCRYPTION_KEY`（已被 Git 忽略），
可参考 `.env.example`。

### 部署到 Cloudflare

1. `wrangler d1 create <db-name>` 创建数据库，并将返回的 database_id 写入 `dist/server/wrangler.json`；
2. 应用 `drizzle/` 下的迁移：`wrangler d1 execute <db-name> --remote --file=<migration.sql>`；
3. 配置加密主密钥：`wrangler secret put CONFIG_ENCRYPTION_KEY`；
4. 在 `dist/server` 下执行 `wrangler deploy --config=./wrangler.json`。

## 项目结构

```
app/                 # Next.js 应用：页面、服务端 API、鉴权与工作台
  api/               # 会话、知识、检索、设置等 API 路由
  chatgpt-auth.ts    # 身份解析与演示账号回退
  workspace.tsx      # 工作台客户端挂载点
db/                  # Drizzle schema
drizzle/             # 数据库迁移文件
lib/                 # 服务端通用能力（鉴权、AI 代理、数据访问）
scripts/             # 构建与环境工具
dist/                # 构建产物（已 gitignore，不入库）
```

## 数据与安全说明

- 所有客户、订单、价格与基线业绩均为**样例数据**；无真实渠道发送、支付或订单同步。
- API Key 仅以密文保存，GET 接口不返回明文或密文；加密主密钥由运行时 secret 提供。
- 知识资料须经审核后才进入模型上下文；向量检索、重排与独立审核角色为后续规划，当前检索为
  中文双字词与英数词覆盖排序，分数不代表可信概率。

## 范围与边界

本项目为独立开发的产品原型，完整跑通了需求、开发、评测与部署链路，但不包含多顾问权限管理、
真实支付与生产级运维。业务记录、模型配置与调用元数据按登录账号隔离保存。

## 许可证

基于 [MIT License](./LICENSE) 开源。
