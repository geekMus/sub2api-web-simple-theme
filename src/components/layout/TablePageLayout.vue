<template>
  <div class="table-page-layout" :class="{ 'mobile-mode': isMobile, 'table-page-layout--user': variant === 'user' }">
    <!-- 固定区域：操作按钮 -->
    <div v-if="$slots.actions" class="layout-section-fixed">
      <slot name="actions" />
    </div>

    <!-- 固定区域：搜索和过滤器 -->
    <div v-if="$slots.filters" class="layout-section-fixed">
      <slot name="filters" />
    </div>

    <!-- 滚动区域：表格 -->
    <div class="layout-section-scrollable">
      <div class="card table-scroll-container">
        <slot name="table" />
      </div>
    </div>

    <!-- 固定区域：分页器 -->
    <div v-if="$slots.pagination" class="layout-section-fixed">
      <slot name="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

/** 用户端（.st-root 内）使用 user 变体：取消固定视口高度，改用卡片外观 */
withDefaults(defineProps<{ variant?: 'default' | 'user' }>(), { variant: 'default' })

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
/* 桌面端：Flexbox 布局 */
.table-page-layout {
  @apply flex flex-col gap-6;
  height: calc(100vh - 64px - 4rem); /* 减去 header + lg:p-8 的上下padding */
}

/* 用户端变体：随内容高度，不锁视口 */
.table-page-layout--user {
  height: auto;
  gap: clamp(16px, 2vw, 22px);
}
.table-page-layout--user .layout-section-scrollable {
  flex: none;
  min-height: 0;
}
.table-page-layout--user .table-scroll-container {
  border: 1px solid var(--st-line) !important;
  background: var(--st-bg) !important;
  border-radius: var(--st-r-lg);
  box-shadow: var(--st-shadow-1);
  overflow: hidden;
  margin-bottom: 8px;
}
.table-page-layout--user .table-scroll-container :deep(thead) {
  background: var(--st-bg-soft) !important;
}
.table-page-layout--user .table-scroll-container :deep(th) {
  color: var(--st-ink-2) !important;
  border-bottom: 1px solid var(--st-line) !important;
}
.table-page-layout--user .table-scroll-container :deep(td) {
  color: var(--st-ink-2) !important;
  border-bottom: 1px solid var(--st-line) !important;
}
.table-page-layout--user .table-scroll-container :deep(tbody tr:hover) {
  background: var(--st-bg-soft);
}

.layout-section-fixed {
  @apply flex-shrink-0;
}

.layout-section-scrollable {
  @apply flex-1 min-h-0 flex flex-col;
}

/* 表格滚动容器 - 增强版表体滚动方案 */
.table-scroll-container {
  @apply flex flex-col overflow-hidden h-full bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 shadow-sm;
}

.table-scroll-container :deep(.table-wrapper) {
  @apply flex-1 overflow-x-auto overflow-y-auto;
  /* 确保横向滚动条显示在最底部 */
  scrollbar-gutter: stable;
}

.table-scroll-container :deep(table) {
  @apply w-full;
  min-width: max-content; /* 关键：确保表格宽度根据内容撑开，从而触发横向滚动 */
  display: table; /* 使用标准 table 布局以支持 sticky 列 */
}

.table-scroll-container :deep(thead) {
  @apply bg-gray-50/80 dark:bg-dark-800/80 backdrop-blur-sm;
}

.table-scroll-container :deep(tbody) {
  /* 保持默认 table-row-group 显示，不使用 block */
}

.table-scroll-container :deep(th) {
  @apply px-5 py-4 text-left text-sm font-medium text-gray-600 dark:text-dark-300 border-b border-gray-200 dark:border-dark-700;
}

.table-scroll-container :deep(td) {
  @apply px-5 py-4 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-dark-800;
}

/* 移动端：恢复正常滚动 */
.table-page-layout.mobile-mode .table-scroll-container {
  @apply h-auto overflow-visible border-none shadow-none bg-transparent;
}

.table-page-layout.mobile-mode .layout-section-scrollable {
  @apply flex-none min-h-fit;
}

.table-page-layout.mobile-mode .table-scroll-container :deep(table) {
  @apply flex-none;
  display: table;
  min-width: 100%;
}
</style>
