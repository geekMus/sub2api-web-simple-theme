<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@/composables/useClipboard'
import type { CustomEndpoint } from '@/types'

const props = defineProps<{
  apiBaseUrl: string
  customEndpoints: CustomEndpoint[]
}>()

const { t } = useI18n()
const { copyToClipboard } = useClipboard()
const copiedEndpoint = ref<string | null>(null)

let copiedResetTimer: number | undefined

const allEndpoints = computed(() => {
  const items: Array<{ name: string; endpoint: string; description: string; isDefault: boolean }> = []
  if (props.apiBaseUrl) {
    items.push({
      name: t('keys.endpoints.title'),
      endpoint: props.apiBaseUrl,
      description: '',
      isDefault: true,
    })
  }
  for (const ep of props.customEndpoints) {
    items.push({ ...ep, isDefault: false })
  }
  return items
})

async function copy(url: string) {
  const success = await copyToClipboard(url, t('keys.endpoints.copied'))
  if (!success) return

  copiedEndpoint.value = url
  if (copiedResetTimer !== undefined) {
    window.clearTimeout(copiedResetTimer)
  }
  copiedResetTimer = window.setTimeout(() => {
    if (copiedEndpoint.value === url) {
      copiedEndpoint.value = null
    }
  }, 1800)
}

function tooltipHint(endpoint: string): string {
  return copiedEndpoint.value === endpoint
    ? t('keys.endpoints.copiedHint')
    : t('keys.endpoints.clickToCopy')
}

function speedTestUrl(endpoint: string): string {
  return `https://www.tcptest.cn/http/${encodeURIComponent(endpoint)}`
}

onBeforeUnmount(() => {
  if (copiedResetTimer !== undefined) {
    window.clearTimeout(copiedResetTimer)
  }
})
</script>

<template>
  <div v-if="allEndpoints.length > 0" class="keys-ep" data-testid="endpoint-popover">
    <div v-for="(item, index) in allEndpoints" :key="index" class="keys-ep__chip">
      <span class="keys-ep__name">{{ item.name }}</span>
      <span v-if="item.isDefault" class="keys-ep__tag">{{ t('keys.endpoints.default') }}</span>
      <span class="keys-ep__div" aria-hidden="true">|</span>

      <div class="keys-ep__value">
        <div class="keys-ep__tip" role="tooltip">
          <p v-if="item.description" class="keys-ep__tip-desc">{{ item.description }}</p>
          <p class="keys-ep__tip-hint">
            <span class="keys-ep__dot" aria-hidden="true"></span>
            {{ tooltipHint(item.endpoint) }}
          </p>
        </div>

        <code
          class="keys-ep__code"
          role="button"
          tabindex="0"
          @click="copy(item.endpoint)"
          @keydown.enter.prevent="copy(item.endpoint)"
          @keydown.space.prevent="copy(item.endpoint)"
        >{{ item.endpoint }}</code>

        <button
          type="button"
          class="keys-ep__icon"
          :class="{ 'keys-ep__icon--done': copiedEndpoint === item.endpoint }"
          :aria-label="tooltipHint(item.endpoint)"
          @click="copy(item.endpoint)"
        >
          <svg v-if="copiedEndpoint === item.endpoint" class="keys-ep__glyph" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="keys-ep__glyph" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        <a
          :href="speedTestUrl(item.endpoint)"
          target="_blank"
          rel="noopener noreferrer"
          class="keys-ep__icon keys-ep__icon--test"
          :title="t('keys.endpoints.speedTest')"
        >
          <svg class="keys-ep__glyph" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.keys-ep { display: flex; flex-wrap: wrap; gap: 8px; min-width: 0; }
.keys-ep__chip {
  display: flex; align-items: center; gap: 6px; min-width: 0;
  max-width: 100%; padding: 5px 9px;
  border-radius: var(--st-r-sm); border: 1px solid var(--st-line);
  background: var(--st-bg); font-size: 0.76rem;
  transition: border-color var(--st-t) var(--st-ease);
}
.keys-ep__chip:hover { border-color: var(--st-line-2); }
.keys-ep__name { color: var(--st-ink-2); font-weight: 500; white-space: nowrap; }
.keys-ep__tag {
  padding: 0 5px; border-radius: 5px;
  background: var(--st-brand-soft); color: var(--st-brand-text);
  font-size: 0.66rem; font-weight: 600; white-space: nowrap;
}
.keys-ep__div { color: var(--st-ink-3); }
.keys-ep__value { position: relative; display: flex; align-items: center; gap: 4px; min-width: 0; }
.keys-ep__tip {
  position: absolute; left: 50%; bottom: calc(100% + 8px); z-index: 20;
  width: max-content; max-width: min(24rem, 70vw);
  transform: translateX(-50%) translateY(4px);
  padding: 9px 11px; border-radius: var(--st-r-md);
  border: 1px solid var(--st-line); background: var(--st-bg);
  box-shadow: var(--st-shadow-2);
  opacity: 0; pointer-events: none;
  transition: opacity var(--st-t) var(--st-ease), transform var(--st-t) var(--st-ease);
}
.keys-ep__value:hover .keys-ep__tip,
.keys-ep__value:focus-within .keys-ep__tip { opacity: 1; transform: translateX(-50%) translateY(0); }
.keys-ep__tip-desc { font-size: 0.74rem; line-height: 1.55; color: var(--st-ink-2); overflow-wrap: anywhere; }
.keys-ep__tip-hint {
  display: flex; align-items: center; gap: 5px; margin-top: 4px;
  font-size: 0.7rem; color: var(--st-ink-2);
}
.keys-ep__dot { width: 5px; height: 5px; border-radius: 50%; background: var(--st-brand); flex: none; }
.keys-ep__code {
  min-width: 0; max-width: 46vw;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-family: var(--st-font-mono); font-size: 0.74rem; color: var(--st-ink-3);
  text-decoration: underline dashed; text-underline-offset: 2px;
  cursor: pointer; outline: none;
}
.keys-ep__code:hover, .keys-ep__code:focus { color: var(--st-ink); }
.keys-ep__icon {
  display: inline-grid; place-items: center; flex: none;
  width: 18px; height: 18px; padding: 0;
  border: 0; background: none; cursor: pointer;
  color: var(--st-ink-3); transition: color var(--st-t) var(--st-ease);
}
.keys-ep__icon:hover { color: var(--st-ink); }
.keys-ep__icon--done { color: var(--st-ok); }
.keys-ep__icon--test:hover { color: var(--st-warn); }
.keys-ep__glyph { width: 13px; height: 13px; }
</style>