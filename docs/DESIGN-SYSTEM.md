# UI 重构规范（simple-theme）

面向"用户端"（普通用户可见）的界面重构规范。管理员后台**不在范围内**，保持原样。

## 1. 气质

C 端消费产品，不是管理后台：

- 大标题、少表格、多留白；信息靠**排版层级**区分，不靠边框和颜色块堆叠。
- 语气像在对人说话：'你的通行证' 而不是 'API 密钥管理'；'今日调用' 而不是 '请求统计'。
- 一屏一件事；每节只讲一个意思。
- 动效克制但顺滑：入场 600ms、悬停 280ms、按压缩放 0.985，缓动一律 `var(--st-ease)`。

## 2. 只能用的东西

- 颜色/圆角/间距/阴影/缓动：一律用 CSS 变量（`--st-*`，见 `src/styles/simple-theme.css`）。
  **禁止**写死 hex；需要新色时用 `color-mix(var(--st-accent) 12%, transparent)` 这类组合。
- 组件类：`.st-btn / .st-btn--primary|quiet|ghost|sm|lg`、`.st-card / --pad / --lift / --glass / --halo`、
  `.st-input / .st-textarea / .st-select / .st-label`、`.st-pill / --accent / --dot`、`.st-seg / __item`、
  `.st-stat / __label / __value`、`.st-row / __title / __meta`、`.st-code`、`.st-skeleton`、
  `.st-eyebrow`、`.st-display-1|2|3`、`.st-lede`、`.st-body`、`.st-muted`、`.st-num`、`.st-root`、`.st-shell`、`.st-section`。
- 页面外壳：用户端页面统一用 `<UserShell>`（`@/components/shell/UserShell.vue`），**不要**再用 `AppLayout`
  （那是 admin 的壳，用户端已改为顶部导航形态）。
- 图标：内联 SVG，`stroke="currentColor"`，1.6 线宽；不要引新的图标库。

## 3. 硬边界（会被打回）

1. 不改 `src/api/**`、`src/types/**`（接口契约）。数据怎么来不要动，只动"怎么展示"。
2. 不改 `src/views/admin/**`、`src/components/admin/**`、`src/components/layout/App*Layout.vue`、`AppSidebar/AppHeader`。
3. 不改组件里的业务逻辑：请求参数、路由跳转目标、权限判断、表单校验、事件处理语义都要保持。
   只允许改：模板结构、class、scoped 样式、展示用 computed、以及 import 外壳组件。
4. 不新增 npm 依赖。
5. 不动 `src/router/index.ts`（除非某页必须换壳，此时只改 `AppLayout` → `UserShell`，不要动路由表）。

## 4. 页面骨架约定

```vue
<template>
  <UserShell>
    <section class="st-section">
      <div class="st-shell">
        <p class="st-eyebrow">小标签</p>
        <h1 class="st-display-2">一句话说明这页在干什么</h1>
        <p class="st-lede">一到两句人话。</p>
        <!-- 内容 -->
      </div>
    </section>
  </UserShell>
</template>
```

## 5. 列表/表格

用户端**不许出现**传统数据表格：用 `.st-row` 的行式列表（左标题+副信息，右数值/操作），
或卡片网格。确实需要多维对比时才用极简两列。

## 6. 文案

- 中文侧优先人话、动词开头、句子短；英文侧同义不逐字翻。
- 文案放各自的 `src/composables/copy/*.ts`（模板已给），**不要**改 `src/i18n/locales/**` 里的既有 key。
- 数字用 `.st-num`（等宽数字），金额/百分比带单位小字。

## 7. 验收

```bash
pnpm typecheck            # 必须 0 error
node scripts/dev/shot.mjs --url http://localhost:3000/<路由> --out .tmp-shots/<名字>.png
```

每条改动都要自己截图看：暗色（默认）+ 亮色（`--theme light`）、1440 宽、390 宽各一张。
截图只做无头浏览器，**不要**抢窗口焦点、不要置顶。

## 8. 参考实现

`src/views/HomeView.vue` 与 `src/components/shell/UserTopNav.vue` 是本套设计语言的样板，照着它的
语气、间距、卡片处理方式来写。
