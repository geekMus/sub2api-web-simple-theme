# beichen-web

从 [sub2api](https://github.com/Wei-Shaw/sub2api)（fork: sub2api-beichen）中剥离出来的**独立前端项目**。
技术栈：Vue 3 + Vite 5 + TypeScript + Pinia + Tailwind，包管理使用 **pnpm**。

后端 API 契约未做任何改动，页面仍然走相对路径 `/api/v1/...`，因此：

* 开发时由 Vite 代理到本地后端；
* 独立部署时由 Nginx（或任意静态服务器）把 `/api`、`/v1`、`/setup` 反代到后端；
* 嵌入后端部署时由后端同源提供静态资源，不需要反代。

## 项目定位

**只做用户界面，不改 API。** `src/api/**`、`src/types/**` 是冻结的接口契约（后端 REST 契约的映射），
改界面时不许碰；需要新字段时走 [`docs/UI-REQUESTS.md`](./docs/UI-REQUESTS.md) 登记。

## 文档

| 文档 | 内容 |
| --- | --- |
| [AGENTS.md](./AGENTS.md) | 给 AI/协作者的硬性约定：冻结目录、允许范围、验收标准、任务落点 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 环境、分支、提交信息、提交前闸门、PR 清单 |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 启动链路、目录职责、数据流、i18n、样式系统、构建形态 |
| [docs/UPSTREAM-SYNC.md](./docs/UPSTREAM-SYNC.md) | 从 `sub2api-beichen/frontend` 同步上游代码的流程与必守差异 |
| [docs/UI-REQUESTS.md](./docs/UI-REQUESTS.md) | 「界面需要后端新字段」的登记处 |
| [CHANGELOG.md](./CHANGELOG.md) | 版本变更记录 |

## 快速开始

```bash
pnpm install          # 必须用 pnpm（项目锁在 pnpm 10）
pnpm dev              # http://localhost:3000，/api 自动代理到 http://127.0.0.1:8080
```

后端默认地址可用环境变量覆盖（见 `env.example`，需要时复制成 `.env.local`）：

```bash
VITE_DEV_PROXY_TARGET=http://127.0.0.1:8080 VITE_DEV_PORT=3000 pnpm dev
```

## 构建

```bash
pnpm build            # 产物在 dist/（先跑 i18n 完整性检查 + vue-tsc 类型检查）
pnpm preview          # 用 vite preview 打开 dist/，并把 /api 代理到后端，便于联调验证
```

需要改产物目录时设置 `VITE_OUT_DIR`（默认 `dist`）。

## 嵌入后端二进制部署（推荐与 sub2api 同仓部署时使用）

后端 `internal/web/embed_on.go` 通过 `//go:embed all:dist` 把前端打进二进制，
所以只要把 `dist/` 放到 `<后端仓库>/backend/internal/web/dist/`，再带 `embed` 构建标签编译即可：

```bash
# 一条命令：构建 + 同步产物到后端 embed 目录
pnpm build:embed -- --backend ../sub2api-beichen

# 然后编译并启动带前端的后端
cd ../sub2api-beichen/backend
go build -tags embed -o bin/server-embed ./cmd/server
./bin/server-embed            # 前端与 API 同源，默认 http://127.0.0.1:8080
```

只同步产物（不重新构建）：`pnpm sync:backend -- --backend ../sub2api-beichen`
加 `--dry-run` 只做校验。后端仓库里 `backend/internal/web/dist/` 已被 `.gitignore` 忽略，
所以**同步产物不会污染后端仓库的工作区**。

## 独立部署（前后端分开）

```bash
pnpm build
# 把 dist/ 交给任意静态服务器，例如 Nginx：
#   location / { try_files $uri $uri/ /index.html; }
#   location /api { proxy_pass http://127.0.0.1:8080; }
#   location /v1  { proxy_pass http://127.0.0.1:8080; }
#   location /setup { proxy_pass http://127.0.0.1:8080; }
```

注意 SPA 回退（`try_files ... /index.html`）必须配置，否则刷新子路由会 404。

## 与上游前端的差异

拆分时只做了下面这些最小改动，业务代码本身未改：

1. `vite.config.ts`：
   * `build.outDir` 由写死 `../backend/internal/web/dist` 改为可配置（默认 `dist`）；
   * 新增 `preview.proxy`，让 `pnpm preview` 也能连真实后端；
   * 新增 `VITE_PREVIEW_PORT`。
2. `package.json`：包名改为 `beichen-web`，新增 `build:embed` / `sync:backend` 两个脚本。
3. 法务文档 `docs/legal/admin-compliance.{zh,en}.md` 从仓库根目录搬到本项目的 `docs/legal/`，
   两个引用它的组件（`AdminComplianceDialog.vue`、`LegalDocumentView.vue`）的相对路径由
   `../../../../docs/legal/` 改成 `../../../docs/legal/`。
4. `src/components/admin/settings/__tests__/AdminAccessKeysSettings.i18n.spec.ts` 原本从
   `../backend/internal/pkg/adminaccess/catalog.go` 读后端权限目录做契约校验。现在后端仓库路径可用
   `BACKEND_REPO` 指定（默认 `../sub2api-beichen`）；找不到后端仓库时该用例自动跳过，
   不再让独立项目跑不动测试。

## 测试

```bash
pnpm test:run                                  # 全部单测（无后端仓库时自动跳过 1 个契约用例）
BACKEND_REPO=../sub2api-beichen pnpm test:run  # 指定后端仓库，跑完整契约校验
```

## 从上游同步更新

上游业务代码仍在 `sub2api-beichen/frontend/` 里演进。需要同步时：

```bash
rsync -a --delete --exclude node_modules --exclude dist \
  ../sub2api-beichen/frontend/src/ src/
# 若上游改了 docs/legal，同样同步 docs/legal/
```

同步后务必重跑 `pnpm typecheck && pnpm build` 并验证两个法务组件（它们依赖 docs/legal 相对路径）。
