# 架构说明

## 技术栈

Vue 3.5（`<script setup>` + TypeScript）、Vite 5、Pinia、vue-router 4（`createWebHistory`）、
vue-i18n 11（runtime-only，无 `unsafe-eval`）、Tailwind 3 + 少量全局 CSS 变量、Vitest 2 + @vue/test-utils。

## 启动链路

```
index.html
└─ src/main.ts          createApp → pinia → router → i18n → mount('#app')
   └─ src/App.vue       全局壳：主题/语言初始化、RouterView、全局弹层
      └─ src/router/index.ts   createWebHistory，路由 → 布局 + 视图
         └─ src/components/layout/*   AppLayout / AppSidebar / 顶栏
            └─ src/views/**          页面级组件
               └─ src/components/**  复用组件
```

注意：路由是 **HTML5 history 模式**，独立部署时服务器必须配 SPA 回退（`try_files ... /index.html`），
否则刷新子路由 404。嵌入后端部署时后端已处理。

## 目录职责

| 目录 | 职责 | 本仓库是否可改 |
| --- | --- | --- |
| `src/api/` | axios 实例（`client.ts`：baseURL、拦截器、token 刷新、错误分类）+ 各资源接口 | **冻结** |
| `src/types/` | 后端契约的 TS 类型映射 | **冻结** |
| `src/stores/` | Pinia：鉴权、设置、订阅、支付、公告、onboarding 等状态 | 可改（仅视图状态） |
| `src/router/` | 路由表、meta、标题、setup 重定向 | 可改（路由/meta） |
| `src/views/` | 页面（user / admin / auth / public / setup） | 可改 |
| `src/components/` | 复用组件，按领域分目录（account / admin / channels / common / keys / layout / payment …） | 可改 |
| `src/features/` | 自成体系的功能模块（channel-monitor-v2、prompt-audit） | 可改 |
| `src/composables/` | 组合式逻辑（分页、轮询、模型白名单等） | 可改 |
| `src/i18n/` | vue-i18n 实例 + `locales/{zh,en}/` 分层文案 | 可改（只增 key） |
| `src/styles/` + `src/style.css` | 全局样式、CSS 变量主题、Tailwind 基础层 | 可改 |
| `src/utils/` `src/constants/` | 纯函数与常量（平台目录、格式化） | 可改（不改语义） |
| `docs/legal/` | 法务文档（管理端合规弹窗以 `?raw` 形式内联） | 可改文案 |

## 数据流

```
后端 REST /api/v1/**  ←→  src/api/*.ts（请求 + 类型）
                          ↑
                    src/stores/*（缓存与跨组件状态）  ←→  src/views/*（页面）
                                                        ↓
                                                    src/components/*（展示）
```

现状：请求调用点分布在 `stores`、`views`，以及少量 `components`（如 `account/*Modal.vue`）。
新增调用时优先放进 store 或 `composables`，但**不要为了重构而重构**——UI 任务不承担架构整改。

## i18n

- `src/i18n/index.ts` 组装 `locales/zh`、`locales/en`；每个领域一个文件（`adminAccessKeys.ts` 等）。
- 有 `src/i18n/__tests__/localeKeyCompleteness.spec.ts` 兜底：zh/en key 必须完全一致。
- 新增文案：两个语言文件同时改，key 命名沿用该领域已有风格。

## 样式系统

- Tailwind 为主；主题色/圆角/阴影走 `src/style.css` 里的 CSS 变量，暗色通过根节点 class 切换。
- `tailwind.config.js` 定义色板与内容扫描范围。
- 禁止在组件里写死十六进制颜色，否则亮/暗切换会破。

## 测试

- 单测与源码同目录的 `__tests__/`，Vitest + jsdom。
- 有若干「结构化契约」用例会读源码/路由/文案做断言（例如 Stripe 懒加载、i18n 完整性、设计系统结构）。
  改 UI 时如果这类用例失败，说明改动碰到了它们守护的约定，先判断哪一方该让步，不要直接改断言。
- `src/components/admin/settings/__tests__/AdminAccessKeysSettings.i18n.spec.ts` 需要后端仓库
  （`BACKEND_REPO`，默认 `../sub2api-beichen`）；找不到时自动跳过。

## 构建产物与部署形态

| 形态 | 命令 | 说明 |
| --- | --- | --- |
| 静态站点 | `pnpm build` → `dist/` | 交给 Nginx，需 `/api`、`/v1`、`/setup` 反代 + SPA 回退 |
| 嵌入后端 | `pnpm build:embed -- --backend ../sub2api-beichen` | 产物写进 `backend/internal/web/dist`，后端 `go build -tags embed` 打进二进制 |
| 本地预览 | `pnpm preview` | 用 `dist/` 起服务，并把 API 代理到后端 |
