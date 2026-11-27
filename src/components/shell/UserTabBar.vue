<template>
  <nav class="tabbar" :aria-label="c('nav.menu')">
    <template v-for="item in items" :key="item.to">
      <!-- 中间：放大的圆形主操作 -->
      <router-link
        v-if="item.center"
        :to="item.to"
        class="tabbar__center"
        :class="{ 'is-active': isActive(item.to) }"
        :aria-label="item.label"
      >
        <span class="tabbar__center-disc" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7">
            <path v-for="(d, i) in item.paths" :key="i" :d="d" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="tabbar__center-label">{{ item.label }}</span>
      </router-link>

      <!-- 其余四项 -->
      <router-link
        v-else
        :to="item.to"
        class="tabbar__item"
        :class="{ 'is-active': isActive(item.to) }"
      >
        <span class="tabbar__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6">
            <path v-for="(d, i) in item.paths" :key="i" :d="d" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="tabbar__label">{{ item.label }}</span>
      </router-link>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useSimpleCopy } from '@/composables/useSimpleCopy'
import { useTabBarNav } from '@/composables/useTabBarNav'

const route = useRoute()
const { c } = useSimpleCopy()
const { items } = useTabBarNav()

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 45;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: end;
  padding: 6px max(6px, env(safe-area-inset-left)) calc(6px + env(safe-area-inset-bottom))
    max(6px, env(safe-area-inset-right));
  border-top: 1px solid var(--st-line);
  background: color-mix(in srgb, var(--st-bg) 94%, transparent);
  backdrop-filter: blur(20px) saturate(160%);
}

/* ---- 普通项 ---- */
.tabbar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 0;
  padding: 6px 2px 4px;
  border-radius: 12px;
  color: var(--st-ink-3);
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: color var(--st-t) var(--st-ease);
}
.tabbar__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 26px;
  border-radius: 9px;
  transition: background-color var(--st-t) var(--st-ease), color var(--st-t) var(--st-ease),
    transform var(--st-t-fast) var(--st-ease);
}
.tabbar__label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.66rem;
  line-height: 1;
  letter-spacing: 0.01em;
}
.tabbar__item.is-active { color: var(--st-ink); }
.tabbar__item.is-active .tabbar__icon {
  background: var(--st-brand-soft);
  color: var(--st-brand-text);
}
.tabbar__item:active .tabbar__icon { transform: scale(0.92); }

/* ---- 中间圆形主操作 ---- */
.tabbar__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}
.tabbar__center-disc {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  margin-top: -22px;
  border-radius: 50%;
  border: 4px solid var(--st-bg);
  background: var(--st-brand);
  color: var(--st-brand-ink);
  box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--st-brand-line);
  transition: transform var(--st-t) var(--st-ease), box-shadow var(--st-t) var(--st-ease),
    background-color var(--st-t) var(--st-ease);
}
.tabbar__center:active .tabbar__center-disc { transform: scale(0.94); }
.tabbar__center-label {
  font-size: 0.66rem;
  line-height: 1;
  color: var(--st-ink-2);
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.tabbar__center.is-active .tabbar__center-disc {
  box-shadow: 0 10px 24px -6px rgba(0, 0, 0, 0.4), 0 0 0 3px var(--st-brand-soft);
}
.tabbar__center.is-active .tabbar__center-label { color: var(--st-ink); font-weight: 550; }

/* 矮屏手机：整体压矮一点 */
@media (max-width: 719px) and (max-height: 740px) {
  .tabbar { padding-top: 4px; padding-bottom: calc(4px + env(safe-area-inset-bottom)); }
  .tabbar__item { padding-top: 4px; padding-bottom: 3px; gap: 2px; }
  .tabbar__icon { height: 22px; }
  .tabbar__label,
  .tabbar__center-label { font-size: 0.62rem; }
  .tabbar__center-disc { width: 48px; height: 48px; margin-top: -18px; }
}

/* 平板：居中悬浮胶囊 */
@media (min-width: 700px) and (max-width: 1023px) {
  .tabbar {
    left: 50%;
    right: auto;
    bottom: 14px;
    transform: translateX(-50%);
    width: min(560px, calc(100vw - 32px));
    border: 1px solid var(--st-line);
    border-radius: 20px;
    padding-bottom: 6px;
    box-shadow: var(--st-shadow-2);
  }
}

@media (min-width: 1024px) {
  .tabbar { display: none; }
}
</style>
