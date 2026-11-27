<template>
  <div class="tt" role="radiogroup" :aria-label="label">
    <button
      v-for="item in options"
      :key="item.value"
      type="button"
      role="radio"
      class="tt__item"
      :class="{ 'tt__item--on': preference === item.value }"
      :aria-checked="preference === item.value"
      :title="item.label"
      @click="pick(item.value, $event)"
    >
      <svg class="tt__ico" viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path v-for="(d, i) in item.paths" :key="i" :d="d" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="tt__label">{{ item.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getThemePreference, setThemePreference, watchSystemTheme, type ThemePreference } from '@/utils/theme-transition'

withDefaults(defineProps<{ label?: string }>(), { label: 'Theme' })

const preference = ref<ThemePreference>(getThemePreference())
let stopWatch: (() => void) | null = null

const options = [
  {
    value: 'system' as ThemePreference,
    label: '系统',
    paths: ['M3 4.5h14v9H3z', 'M8 17h4', 'M10 13.5V17'],
  },
  {
    value: 'light' as ThemePreference,
    label: '亮色',
    paths: ['M10 3.2v1.6M10 15.2v1.6M3.2 10h1.6M15.2 10h1.6M5.2 5.2l1.1 1.1M13.7 13.7l1.1 1.1M14.8 5.2l-1.1 1.1M6.3 13.7l-1.1 1.1', 'M10 13a3 3 0 100-6 3 3 0 000 6z'],
  },
  {
    value: 'dark' as ThemePreference,
    label: '暗色',
    paths: ['M15.5 12.4A6.2 6.2 0 018.1 4.7a6.4 6.4 0 107.4 7.7z'],
  },
]

function pick(value: ThemePreference, e: MouseEvent) {
  if (preference.value === value) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  preference.value = value
  setThemePreference(value, origin)
}

onMounted(() => {
  stopWatch = watchSystemTheme(() => {
    preference.value = getThemePreference()
  })
})
onBeforeUnmount(() => {
  stopWatch?.()
  stopWatch = null
})
</script>

<style scoped>
.tt {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid var(--st-line);
  background: var(--st-bg-sink);
}
.tt__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  flex: 1 1 0;
  min-width: 0;
  height: 28px;
  padding-inline: 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  font-family: inherit;
  font-size: 0.79rem;
  font-weight: 450;
  color: var(--st-ink-2);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--st-t) var(--st-ease), color var(--st-t) var(--st-ease),
    box-shadow var(--st-t) var(--st-ease);
}
.tt__item:hover { color: var(--st-ink); }
.tt__item:focus-visible { outline: 2px solid var(--st-brand); outline-offset: 2px; }
.tt__item--on {
  background: var(--st-bg);
  color: var(--st-ink);
  box-shadow: var(--st-shadow-1);
  font-weight: 550;
}
.tt__ico { flex: none; }
.tt__label { overflow: hidden; text-overflow: ellipsis; }
</style>
