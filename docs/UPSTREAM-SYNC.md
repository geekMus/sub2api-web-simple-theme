# 从上游同步前端代码

上游业务代码仍在 `sub2api-beichen/frontend/` 里演进（fork 自 Wei-Shaw/sub2api）。
本项目是它的 UI 层副本，**只有两处刻意的结构差异**，同步时注意别覆盖回去。

## 同步命令

在 `beichen-web/` 下：

```bash
# 1) 业务源码
rsync -a --delete --exclude 'node_modules' --exclude 'dist' \
  ../sub2api-beichen/frontend/src/ src/

# 2) 静态资源与入口
rsync -a ../sub2api-beichen/frontend/public/ public/
cp ../sub2api-beichen/frontend/index.html index.html

# 3) 配置（这三个上游是同样的，可整体覆盖）
cp ../sub2api-beichen/frontend/{tailwind.config.js,postcss.config.js,vitest.config.ts} .

# 4) 法务文档
cp ../sub2api-beichen/docs/legal/admin-compliance.{zh,en}.md docs/legal/
```

**不要**直接覆盖 `vite.config.ts`、`package.json`、`tsconfig*.json`、`.eslintrc.cjs`，见下。

## 必须手工合并的差异

| 文件 | 上游 | 本仓库 | 原因 |
| --- | --- | --- | --- |
| `vite.config.ts` | `build.outDir: '../backend/internal/web/dist'` 写死 | `VITE_OUT_DIR` 可配（默认 `dist`）+ `preview.proxy` | 独立项目不能写死后端路径 |
| `package.json` | 名字 `sub2api-frontend`，只有基础脚本 | `beichen-web`、`packageManager: pnpm@10.15.0`、`build:embed` / `sync:backend` | 独立仓库与嵌入构建需要 |
| `src/components/admin/AdminComplianceDialog.vue` | `../../../../docs/legal/...` | `../../../docs/legal/...` | 文档从仓库根搬到本项目 `docs/legal/` |
| `src/views/public/LegalDocumentView.vue` | 同上 | 同上 | 同上 |
| `src/components/admin/settings/__tests__/AdminAccessKeysSettings.i18n.spec.ts` | 读 `../backend/...catalog.go` | `BACKEND_REPO` 可配、缺失时跳过 | 独立仓库不一定有后端在旁边 |

## 同步后必须验证

```bash
pnpm install            # 若 lockfile 有变化
pnpm lint:check
pnpm typecheck
pnpm test:run
pnpm build
```

然后按 README 的嵌入流程构建一次，确认法务弹窗仍能打开（它依赖 `docs/legal/*.md?raw` 的相对路径）。

## 判断"上游改动是否属于 UI 层"

本项目只做 UI。如果上游 diff 里出现 `src/api/**`、`src/types/**` 的变更，说明后端契约动了：
同步这些文件要**单独的评审**，因为接口契约变化意味着本仓库的冻结边界也要跟着移动。
