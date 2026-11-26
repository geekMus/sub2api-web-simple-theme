# 贡献指南

## 环境

| 项 | 版本 |
| --- | --- |
| Node.js | 24（见 `.nvmrc`，CI 同版本） |
| pnpm | 10（`package.json` 的 `packageManager` 已锁 10.15.0） |

```bash
pnpm install          # 必须 pnpm；用 pnpm 11 会因 "pnpm" 字段变更报 lockfile 不匹配
pnpm dev              # http://localhost:3000
```

后端默认在 `http://127.0.0.1:8080`（`VITE_DEV_PROXY_TARGET` 可改）。

## 最重要的一条

**只改用户界面，不改 API。** 冻结范围、允许范围、需要新数据时怎么做，全部写在
[AGENTS.md](./AGENTS.md) 第 1 节，提交前必读。

## 分支与提交

```
feat/ui-xxx     新界面/新交互
fix/ui-xxx      界面缺陷
style/xxx       纯样式/排版
docs/xxx        文档
chore/xxx       工具链、依赖（依赖变更需先说明）
```

提交信息用 `type: 中文描述`，例如 `feat: 账号列表支持按平台折叠分组`。

## 提交前闸门

```bash
pnpm lint:check
pnpm typecheck
pnpm test:run
```

三条都过才提交。只跑改动的用例不算。

## 视觉改动

- 必须在 PR/回复里附**真实渲染截图**（不是描述、不是设计稿）。
- 无头浏览器截图即可，注意不要抢窗口焦点、不要置顶窗口。
- 至少检查：暗色（默认）/亮色、中文/英文。

## PR 检查清单

- [ ] 没有改 `src/api/**`、`src/types/**`
- [ ] 新增文案 zh/en 都补齐，key 结构一致
- [ ] `pnpm lint:check` / `pnpm typecheck` / `pnpm test:run` 全绿
- [ ] 附截图（含暗色 + 一种语言之外的对照）
- [ ] 没有提交 `dist/`、`*.tsbuildinfo`、`vite.config.js`
