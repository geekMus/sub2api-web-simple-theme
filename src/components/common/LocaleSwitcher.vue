<template>
  <div class="ls" ref="dropdownRef">
    <button
      class="ls__btn"
      type="button"
      @click="toggleDropdown"
      :disabled="switching"
      :title="currentName"
      :aria-label="currentName"
    >
      <span>{{ currentName }}</span>
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"
        :class="['ls__caret', { 'ls__caret--open': isOpen }]">
        <path d="M3 4.5L6 7.5l3-3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <transition name="ls-pop">
      <div v-if="isOpen" class="ls__menu">
        <button
          v-for="item in availableLocales"
          :key="item.code"
          class="ls__item"
          :class="{ 'ls__item--on': item.code === currentLocaleCode }"
          type="button"
          :disabled="switching"
          @click="selectLocale(item.code)"
        >
          <span>{{ item.name }}</span>
          <svg v-if="item.code === currentLocaleCode" viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const switching = ref(false)

const currentLocaleCode = computed(() => String(locale.value || 'zh'))
const currentName = computed(
  () => availableLocales.find((l) => l.code === currentLocaleCode.value)?.name ?? '中文'
)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

async function selectLocale(code: string) {
  if (switching.value || code === currentLocaleCode.value) {
    isOpen.value = false
    return
  }
  switching.value = true
  try {
    await setLocale(code)
    isOpen.value = false
    // 即时切换：i18n 的 locale 是响应式的，界面文案立刻更新，不刷新页面。
    // 由后端按请求语言返回的数据（如分组名）会保持旧语言，直到下次请求重新拉取。
  } finally {
    switching.value = false
  }
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.ls { position: relative; }

.ls__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding-inline: 9px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--st-ink-2);
  font-family: inherit;
  font-size: 0.84rem;
  cursor: pointer;
  transition: background-color var(--st-t) var(--st-ease), color var(--st-t) var(--st-ease);
}
.ls__btn:hover { background: var(--st-bg-soft); color: var(--st-ink); }
.ls__caret { transition: transform var(--st-t) var(--st-ease); }
.ls__caret--open { transform: rotate(180deg); }

.ls__menu {
  position: absolute;
  top: 38px;
  right: 0;
  min-width: 128px;
  padding: 5px;
  border-radius: var(--st-r-md);
  border: 1px solid var(--st-line);
  background: var(--st-bg);
  box-shadow: var(--st-shadow-3);
  z-index: 60;
}

.ls__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 7px 10px;
  border: 0;
  border-radius: 6px;
  background: none;
  font-family: inherit;
  font-size: 0.86rem;
  color: var(--st-ink-2);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--st-t-fast) var(--st-ease), color var(--st-t-fast) var(--st-ease);
}
.ls__item:hover { background: var(--st-bg-soft); color: var(--st-ink); }
.ls__item--on { color: var(--st-ink); font-weight: 500; }

.ls-pop-enter-active, .ls-pop-leave-active { transition: opacity var(--st-t-fast) var(--st-ease), transform var(--st-t-fast) var(--st-ease); }
.ls-pop-enter-from, .ls-pop-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }
</style>
