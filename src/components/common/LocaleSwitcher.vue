<template>
  <div class="ls" role="group" aria-label="Language">
    <button
      v-for="item in availableLocales"
      :key="item.code"
      type="button"
      class="ls__tab"
      :class="{ 'ls__tab--on': item.code === currentLocaleCode }"
      :disabled="switching"
      @click="select(item.code)"
    >
      {{ item.code === 'zh' ? '中文' : 'EN' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, availableLocales } from '@/i18n'

const i18n = (() => {
  try {
    return useI18n() as unknown as { locale?: { value?: string } }
  } catch {
    return null
  }
})()
const locale = i18n?.locale ?? { value: 'zh' }

const switching = ref(false)
const currentLocaleCode = computed(() => String(locale.value || 'zh'))

async function select(code: string) {
  if (switching.value || code === currentLocaleCode.value) return
  switching.value = true
  try {
    await setLocale(code)
  } finally {
    switching.value = false
  }
}
</script>

<style scoped>
.ls {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 999px;
  border: 1px solid var(--st-line);
  background: var(--st-bg-soft);
}

.ls__tab {
  height: 26px;
  padding-inline: 10px;
  white-space: nowrap;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--st-ink-2);
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease);
}
.ls__tab:hover { color: var(--st-ink); }
.ls__tab--on {
  background: var(--st-bg);
  color: var(--st-ink);
  box-shadow: var(--st-shadow-1);
}
.ls__tab:disabled { opacity: 0.6; cursor: default; }
</style>
