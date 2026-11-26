# AGENTS.md

给 AI 助手（以及人类协作者）的仓库约定。**动手前先读完第 1 节。**

## 1. 硬性边界：只改用户界面，不动 API

本项目是 `sub2api` 的后端契约之上的一层**纯前端**。所有任务默认只做界面（UI/UX）改动。

### 冻结（只读，不允许修改）

| 路径 | 说明 |
| --- | --- |
| `src/api/**` | 请求层：`client.ts`（axios 实例、拦截器、token 刷新、错误分类）+ 各资源接口 + `__tests__` |
| `src/types/**` | 后端契约的 TypeScript 映射（`index.ts`、`payment.ts`、`openaiReferrals.ts`、`global.d.ts`） |

改这两个目录等于改接口契约，会连带影响后端与线上行为 —— **即使只是为了"让类型编译通过"也不行**。

### 允许修改

`src/views/**`、`src/components/**`、`src/features/**`、`src/styles/**`、`src/style.css`、
`src/i18n/**`（新增 key 可以，**不要改已有 key 的语义/结构**）、`src/router/**`（只限路由与 meta）、
`src/stores/**`（只限视图状态；不得改请求参数、接口路径、字段名）、`tailwind.config.js`。

### 需要新数据时

不要自己拼请求、不要猜字段。在 `docs/UI-REQUESTS.md` 追加一条需求，交给人去和后端对齐。
如果真的只是渲染需要，优先在视图里用已有数据做派生（`computed`），而不是碰 `src/api`。

### 其他不要动

- `package.json` 的依赖版本；新增 UI 依赖必须先说明理由并得到确认。
- `vite.config.ts` 的 `server.proxy` / `build.outDir` / `injectPublicSettings` 行为。
- `dist/` 与 `*.tsbuildinfo`、`vite.config.js`：构建产物，已忽略。
- 后端仓库 `../sub2api-beichen/`：只作为本地联调的后端，**不改任何后端代码**。

## 2. 提交前必须跑

```bash
pnpm lint:check     # eslint
pnpm typecheck      # vue-tsc --noEmit
pnpm test:run       # vitest（391 个文件 / 3200+ 用例，约 45s）
```

只跑改动用例不够，这三条是合并闸门。

## 3. 视觉改动的验收

- 必须给出**真实渲染的截图**，不接受口头描述。
- 截图方式：本地起后端（`sub2api-beichen/backend`）+ `pnpm dev`，或用 `pnpm preview` 连真实后端；
  无头浏览器截图（`msedge --headless=new --screenshot=...`）即可，**不要**抢窗口焦点、不要把窗口置顶。
- 亮/暗两套主题、中/英两种语言至少各看一眼（本项目 i18n 与暗色是默认形态）。

## 4. 任务坐标（常见改动落在哪）

| 想做的事 | 落点 |
| --- | --- |
| 新增页面 | `src/views/...` + `src/router/index.ts` + `src/i18n/locales/{zh,en}/` |
| 改侧边栏/导航 | `src/components/layout/AppSidebar.vue`、`src/router/meta.d.ts` |
| 改表格/表单 | 优先复用 `src/components/common/`；不要新造一套 |
| 改颜色/间距/圆角 | `tailwind.config.js` + `src/style.css` 的 CSS 变量（暗色主题靠变量切换，禁止写死 hex） |
| 改文案 | `zh` 与 `en` 同步改，key 必须一一对应（有 `localeKeyCompleteness` 用例兜底） |
| 渠道监控大屏 | `src/features/channel-monitor-v2/` |
| 提示词审计 | `src/features/prompt-audit/` |

## 5. 构建与部署（只需了解，不需要在 UI 任务里执行）

```bash
pnpm build    # 产物就是 dist/，交给静态服务器即可
```

详见 `README.md`。
