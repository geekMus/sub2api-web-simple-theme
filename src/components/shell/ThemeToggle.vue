<template>
  <button
    class="thm"
    :class="{ 'thm--pulse': pulsing }"
    type="button"
    :aria-label="label"
    :title="label"
    @click="onClick"
  >
    <span class="thm__ico">
      <svg v-if="isDark" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="10" cy="10" r="3.4" />
        <path d="M10 1.6v1.6M10 16.8v1.6M1.6 10h1.6M16.8 10h1.6M4.1 4.1l1.1 1.1M14.8 14.8l1.1 1.1M15.9 4.1l-1.1 1.1M5.2 14.8l-1.1 1.1" stroke-linecap="round" />
      </svg>
      <svg v-else viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M17 11.9A7.4 7.4 0 1 1 8.1 3a5.9 5.9 0 0 0 8.9 8.9Z" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toggleThemeFrom, toggleThemeFromElement, currentTheme } from '@/utils/theme-transition'

const isDark = ref(typeof document !== 'undefined' && currentTheme() === 'dark')
const pulsing = ref(false)
const label = 'Theme'

function onClick(e: MouseEvent) {
  pulsing.value = true
  window.setTimeout(() => { pulsing.value = false }, 720)
  const next = e && typeof e.clientX === 'number'
    ? toggleThemeFrom(e.clientX, e.clientY)
    : toggleThemeFromElement(e?.currentTarget as HTMLElement | null)
  isDark.value = next === 'dark'
}
</script>

<style scoped>
.thm {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid var(--st-line-2);
  background: var(--st-bg-soft);
  color: var(--st-ink-2);
  cursor: pointer;
  transition: color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease),
    border-color var(--st-t) var(--st-ease), transform var(--st-t-fast) var(--st-ease),
    box-shadow var(--st-t) var(--st-ease);
}
.thm:hover {
  color: var(--st-ink);
  background: var(--st-bg);
  border-color: var(--st-ink-3);
  transform: translateY(-1px);
  box-shadow: var(--st-shadow-1);
}
.thm:active { transform: translateY(0) scale(0.94); }
.thm:focus-visible { outline: 2px solid var(--st-brand); outline-offset: 2px; }
.thm__ico { display: grid; place-items: center; transition: transform 520ms var(--st-ease); }
.thm:hover .thm__ico { transform: rotate(20deg); }
.thm--pulse::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  pointer-events: none;
  animation: thm-ripple 680ms var(--st-ease);
}
@keyframes thm-ripple {
  0% { box-shadow: 0 0 0 0 var(--st-brand-line); }
  100% { box-shadow: 0 0 0 16px transparent; }
}
@media (prefers-reduced-motion: reduce) {
  .thm--pulse::after { animation: none; }
  .thm__ico, .thm { transition: none; }
}
</style>
