<template>
  <div
    class="stat-card monitor-metric !min-h-[6.5rem] !rounded-3xl !border-0 !p-4 shadow-sm"
    :title="title || undefined"
  >
    <div
      v-if="resolvedState"
      class="mt-1 h-2 w-2 shrink-0 rounded-full"
      :class="dotClass"
      aria-hidden="true"
    ></div>
    <div class="min-w-0 flex-1">
      <span class="stat-label monitor-metric__label text-[10px] font-bold uppercase tracking-wider">{{ label }}</span>
      <strong
        class="stat-value monitor-metric__value mt-1 block overflow-visible text-xl tabular-nums leading-tight !text-clip !whitespace-normal"
        :class="stateClass"
      >{{ value }}</strong>
      <div
        v-if="detailParts.length > 1"
        class="monitor-metric__detail mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] leading-snug"
      >
        <span
          v-for="(part, index) in detailParts"
          :key="`${index}:${part}`"
          class="whitespace-nowrap tabular-nums"
        >{{ part }}</span>
      </div>
      <small
        v-else-if="detail"
        class="monitor-metric__detail mt-1.5 block text-[11px] leading-snug"
      >{{ detail }}</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HealthState } from '@/api/channelMonitorV2'

const props = defineProps<{
  label: string
  value: string
  detail: string
  state?: HealthState
  /** Exact numeric tooltip (e.g. uncompacted RPM/TPM). */
  title?: string
}>()

/** Split "AVG 475ms · P90 800ms" into chips so nothing is ellipsized. */
const detailParts = computed(() => {
  const raw = (props.detail || '').trim()
  if (!raw || raw === '-') return []
  return raw
    .split(/\s*[·|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
})

const missingValue = computed(() => {
  const value = (props.value || '').trim()
  return value === '' || value === '-' || value === '—'
})

const resolvedState = computed(() => (missingValue.value ? undefined : props.state))

const stateClass = computed(() => {
  if (!resolvedState.value) return missingValue.value ? 'monitor-metric__value--muted' : 'monitor-metric__value--default'
  if (resolvedState.value === 'healthy') return 'monitor-metric__value--ok'
  if (resolvedState.value === 'warning') return 'monitor-metric__value--warn'
  if (resolvedState.value === 'critical') return 'monitor-metric__value--critical'
  return 'monitor-metric__value--muted'
})

const dotClass = computed(() => {
  if (resolvedState.value === 'healthy') return 'monitor-metric__dot--ok'
  if (resolvedState.value === 'warning') return 'monitor-metric__dot--warn'
  if (resolvedState.value === 'critical') return 'monitor-metric__dot--critical'
  return 'monitor-metric__dot--idle'
})
</script>

<style scoped>
.monitor-metric {
  display: flex;
  gap: 10px;
  background: var(--st-bg) !important;
  border: 1px solid var(--st-line) !important;
  box-shadow: none !important;
}
.monitor-metric__label { color: var(--st-ink-3) !important; }
.monitor-metric__value {
  font-family: var(--st-font-display);
  letter-spacing: -0.02em;
}
.monitor-metric__value--default { color: var(--st-ink); }
.monitor-metric__value--muted { color: var(--st-ink-3); }
.monitor-metric__value--ok { color: var(--st-ok); }
.monitor-metric__value--warn { color: var(--st-warn); }
.monitor-metric__value--critical { color: var(--st-danger); }
.monitor-metric__detail { color: var(--st-ink-3) !important; }
.monitor-metric__dot--ok { background: var(--st-ok); }
.monitor-metric__dot--warn { background: var(--st-warn); }
.monitor-metric__dot--critical { background: var(--st-danger); }
.monitor-metric__dot--idle { background: var(--st-ink-3); }
</style>
