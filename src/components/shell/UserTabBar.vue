<template>
  <nav class="tabbar" :aria-label="c('nav.menu')">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="tabbar__item"
      :class="{ 'is-active': isActive(item.to) }"
    >
      <span class="tabbar__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.6">
          <path v-for="(d, i) in item.paths" :key="i" :d="d" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <span class="tabbar__label">{{ item.label }}</span>
    </router-link>
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
  display: flex;
  align-items: stretch;
  gap: 2px;
  padding: 5px max(8px, env(safe-area-inset-left)) calc(5px + env(safe-area-inset-bottom))
    max(8px, env(safe-area-inset-right));
  border-top: 1px solid var(--st-line);
  background: color-mix(in srgb, var(--st-bg) 92%, transparent);
  backdrop-filter: blur(20px) saturate(160%);
}
.tabbar__item {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 2px 5px;
  border-radius: 11px;
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
  transition: background-color var(--st-t) var(--st-ease), color var(--st-t) var(--st-ease);
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
.tabbar__item.is-active .tabbar__icon { background: var(--st-brand); color: var(--st-brand-ink); }
.tabbar__item:active .tabbar__icon { transform: scale(0.94); }
/* 矮屏手机：把 Tab 条压矮一点，给内容多留 8px */
@media (max-width: 719px) and (max-height: 740px) {
  .tabbar { padding-top: 3px; padding-bottom: calc(3px + env(safe-area-inset-bottom)); }
  .tabbar__item { padding-top: 4px; padding-bottom: 3px; gap: 2px; }
  .tabbar__icon { height: 22px; }
  .tabbar__label { font-size: 0.62rem; }
}
@media (min-width: 700px) and (max-width: 1023px) {
  .tabbar {
    left: 50%;
    right: auto;
    bottom: 14px;
    transform: translateX(-50%);
    width: min(560px, calc(100vw - 32px));
    border: 1px solid var(--st-line);
    border-radius: 18px;
    padding-bottom: 5px;
    box-shadow: var(--st-shadow-2);
  }
}
@media (min-width: 1024px) {
  .tabbar { display: none; }
}
</style>
