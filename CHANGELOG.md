# Changelog

## 0.1.0 — 2026-11-26

从 `sub2api`（fork: sub2api-beichen）剥离为独立前端项目，业务代码未改，仅做结构解耦：

- 新增独立仓库结构：`.gitattributes`、`.editorconfig`、`.nvmrc`、`.eslintrc.cjs`、`.eslintignore`、
  `AGENTS.md`、`CONTRIBUTING.md`、`docs/`、`.github/workflows/ci.yml`。
- `vite.config.ts`：产物目录由写死 `../backend/internal/web/dist` 改为 `VITE_OUT_DIR`（默认 `dist`）；
  新增 `preview.proxy`，让 `pnpm preview` 可连真实后端。
- `package.json`：改名 `sub2api-web-simple-theme`，锁定 pnpm 10；新增 `build:embed`、`sync:backend` 脚本。
- 法务文档迁入 `docs/legal/`，两个引用组件的相对路径同步调整。
- 唯一依赖后端源码的单测改为 `BACKEND_REPO` 可配、缺失时跳过。
- 验证：`pnpm build` 通过（181 文件 / 6.12 MiB），`pnpm test:run` 391 文件 / 3231 用例全绿，
  `go build -tags embed` 内嵌部署的首页 / 静态资源 / 深层路由 / API 全部正常。
