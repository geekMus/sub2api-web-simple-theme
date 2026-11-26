<template>
  <div class="dash-charts">
    <!-- 趋势卡 -->
    <article class="st-card st-card--pad dash-charts__trend">
      <header class="dash-charts__head">
        <div class="dash-charts__head-copy">
          <p class="st-eyebrow">{{ c('usercore.dash.rangeLabel') }}</p>
          <h2 class="st-display-3">{{ c('usercore.dash.trendTitle') }}</h2>
          <p class="st-body dash-charts__lede">{{ c('usercore.dash.trendLede') }}</p>
        </div>
        <div class="dash-charts__controls">
          <DateRangePicker
            :start-date="startDate"
            :end-date="endDate"
            @update:startDate="$emit('update:startDate', $event)"
            @update:endDate="$emit('update:endDate', $event)"
            @change="$emit('dateRangeChange', $event)"
          />
          <div class="st-seg" role="group" :aria-label="c('usercore.dash.granularity')">
            <button
              v-for="option in granularityOptions"
              :key="option.value"
              type="button"
              class="st-seg__item"
              :class="{ 'st-seg__item--active': granularity === option.value }"
              @click="pickGranularity(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
          <button type="button" class="st-icon-btn" :title="c('usercore.dash.refresh')" :disabled="loading" @click="$emit('refresh')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" :class="{ 'dash-charts__spin': loading }">
              <path d="M4 12a8 8 0 1 1 2.6 5.9M4 17v-4.4h4.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      <div class="dash-charts__summary">
        <p class="dash-charts__summary-value st-num">{{ formatTokens(trendTotalTokens) }}<span class="dash-charts__summary-unit">tokens</span></p>
        <p class="dash-charts__summary-meta">
          {{ c('usercore.dash.spendInWindow') }} <span class="st-num">${{ formatCost(trendTotalCost) }}</span>
          · {{ c('usercore.dash.callsInWindow') }} <span class="st-num">{{ formatNumber(trendTotalRequests) }}</span>
        </p>
      </div>

      <ul class="dash-charts__legend" aria-hidden="true">
        <li v-for="item in legend" :key="item.label">
          <span class="dash-charts__swatch" :style="{ background: item.color, opacity: item.dashed ? 0.9 : 1 }" :class="{ 'dash-charts__swatch--dash': item.dashed }"></span>
          {{ item.label }}
        </li>
      </ul>

      <div class="dash-charts__canvas">
        <div v-if="loading" class="dash-charts__skeleton">
          <div v-for="i in 6" :key="i" class="st-skeleton dash-charts__bar" :style="{ height: 22 + i * 8 + '%' }"></div>
        </div>
        <Line v-else-if="trend.length > 0 && chartData" :data="chartData" :options="lineOptions" />
        <p v-else class="dash-charts__empty">{{ c('usercore.dash.trendEmpty') }}</p>
      </div>
    </article>

    <!-- 模型用量 -->
    <article class="st-card st-card--pad dash-charts__models">
      <header class="dash-charts__head">
        <div class="dash-charts__head-copy">
          <p class="st-eyebrow">{{ t('dashboard.model') }}</p>
          <h2 class="st-display-3">{{ c('usercore.dash.modelsTitle') }}</h2>
          <p class="st-body dash-charts__lede">{{ c('usercore.dash.modelsLede') }}</p>
        </div>
      </header>

      <div v-if="loading" class="dash-charts__model-skeleton">
        <div v-for="i in 4" :key="i" class="st-skeleton dash-charts__model-line"></div>
      </div>
      <p v-else-if="!models.length" class="dash-charts__empty">{{ c('usercore.dash.modelEmpty') }}</p>
      <ul v-else class="dash-charts__model-list">
        <li v-for="model in models" :key="model.model" class="dash-charts__model">
          <div class="dash-charts__model-top">
            <span class="dash-charts__model-name" :title="model.model">{{ model.model }}</span>
            <span class="dash-charts__model-cost st-num">${{ formatCost(model.actual_cost) }}</span>
          </div>
          <div class="dash-charts__model-bar">
            <span :style="{ width: modelPercent(model) + '%' }"></span>
          </div>
          <div class="dash-charts__model-meta">
            <span><span class="st-num">{{ formatTokens(model.total_tokens) }}</span> tokens</span>
            <span><span class="st-num">{{ formatNumber(model.requests) }}</span> {{ t('dashboard.requests') }}</span>
            <span class="dash-charts__model-standard">{{ t('dashboard.standard') }} <span class="st-num">${{ formatCost(model.cost) }}</span></span>
          </div>
        </li>
      </ul>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import { Line } from 'vue-chartjs'
import type { TrendDataPoint, ModelStat } from '@/types'
import { formatCostFixed as formatCost, formatNumberLocaleString as formatNumber, formatTokensK as formatTokens } from '@/utils/format'
import { useUserCoreCopy } from '@/composables/copy/userCore'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

const props = defineProps<{ loading: boolean, startDate: string, endDate: string, granularity: string, trend: TrendDataPoint[], models: ModelStat[] }>()
const emit = defineEmits(['update:startDate', 'update:endDate', 'update:granularity', 'dateRangeChange', 'granularityChange', 'refresh'])
const { t } = useI18n()
const { c } = useUserCoreCopy()

const granularityOptions = computed(() => [
  { value: 'day', label: c('usercore.dash.day') },
  { value: 'hour', label: c('usercore.dash.hour') },
])

const pickGranularity = (value: string) => {
  if (value === props.granularity) return
  emit('update:granularity', value)
  emit('granularityChange', value)
}

/* ---------- 主题色：从 CSS 变量读出来喂给 chart.js ---------- */
const darkTick = ref(0)
let observer: MutationObserver | null = null
onMounted(() => {
  if (typeof MutationObserver === 'undefined' || !document?.documentElement) return
  observer = new MutationObserver(() => { darkTick.value += 1 })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})
onBeforeUnmount(() => observer?.disconnect())

const palette = computed(() => {
  void darkTick.value
  const fallback = { accent: '#0e9f7e', ink: '#55575e', inkFaint: '#8b8d93', line: 'rgba(20,21,26,0.1)' }
  if (typeof window === 'undefined' || !document?.documentElement) return fallback
  const style = getComputedStyle(document.documentElement)
  const read = (name: string, def: string) => style.getPropertyValue(name).trim() || def
  return {
    accent: read('--st-accent', fallback.accent),
    ink: read('--st-ink-soft', fallback.ink),
    inkFaint: read('--st-ink-faint', fallback.inkFaint),
    line: read('--st-line-strong', fallback.line),
  }
})

function withAlpha(color: string, alpha: number): string {
  const hex = color.trim()
  const six = /^#([0-9a-f]{6})$/i.exec(hex)
  if (six) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(six[1].slice(i, i + 2), 16))
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const three = /^#([0-9a-f]{3})$/i.exec(hex)
  if (three) {
    const [r, g, b] = three[1].split('').map((ch) => parseInt(ch + ch, 16))
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(hex)
  if (rgb) {
    const [r, g, b] = rgb[1].split(',').map((part) => Number.parseFloat(part))
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return hex
}

const legend = computed(() => {
  const accent = palette.value.accent
  return [
    { label: t('dashboard.input'), color: accent, dashed: false },
    { label: t('dashboard.output'), color: withAlpha(accent, 0.58), dashed: false },
    { label: t('dashboard.cache'), color: withAlpha(accent, 0.3), dashed: false },
    { label: c('usercore.dash.hitRate'), color: withAlpha(accent, 0.85), dashed: true },
  ]
})

const chartData = computed(() => {
  if (!props.trend?.length) return null
  const accent = palette.value.accent
  const points = props.trend
  return {
    labels: points.map((d) => d.date),
    datasets: [
      {
        label: t('dashboard.input'),
        data: points.map((d) => d.input_tokens),
        borderColor: accent,
        backgroundColor: withAlpha(accent, 0.16),
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: t('dashboard.output'),
        data: points.map((d) => d.output_tokens),
        borderColor: withAlpha(accent, 0.6),
        backgroundColor: withAlpha(accent, 0.08),
        fill: true,
        tension: 0.35,
        borderWidth: 1.6,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: t('dashboard.cache'),
        data: points.map((d) => d.cache_creation_tokens + d.cache_read_tokens),
        borderColor: withAlpha(accent, 0.32),
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.35,
        borderWidth: 1.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: c('usercore.dash.hitRate'),
        data: points.map((d) => {
          const totalPrompt = d.input_tokens + d.cache_read_tokens + d.cache_creation_tokens
          return totalPrompt > 0 ? (d.cache_read_tokens / totalPrompt) * 100 : 0
        }),
        borderColor: withAlpha(accent, 0.9),
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        tension: 0.35,
        borderWidth: 1.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        yAxisID: 'yPercent',
      },
    ],
  }
})

const lineOptions = computed(() => {
  const p = palette.value
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(8, 9, 11, 0.92)',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            if (context.dataset.yAxisID === 'yPercent') {
              return `${context.dataset.label}: ${context.raw.toFixed(1)}%`
            }
            return `${context.dataset.label}: ${formatTokens(context.raw)}`
          },
          footer: (items: any) => {
            const index = items[0]?.dataIndex
            const point = index === undefined ? null : props.trend[index]
            if (!point) return ''
            return `Actual: $${formatCost(point.actual_cost)} | Standard: $${formatCost(point.cost)}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: p.inkFaint, font: { size: 10 }, maxRotation: 0, autoSkipPadding: 12 },
      },
      y: {
        beginAtZero: true,
        grid: { color: p.line, drawTicks: false },
        border: { display: false },
        ticks: { color: p.inkFaint, font: { size: 10 }, padding: 6, callback: (value: string | number) => formatTokens(Number(value)) },
      },
      yPercent: {
        position: 'right' as const,
        min: 0,
        max: 100,
        grid: { drawOnChartArea: false },
        border: { display: false },
        ticks: { display: false },
      },
    },
  }
})

const trendTotalTokens = computed(() => props.trend.reduce((sum, d) => sum + (d.total_tokens ?? d.input_tokens + d.output_tokens + d.cache_read_tokens + d.cache_creation_tokens), 0))
const trendTotalCost = computed(() => props.trend.reduce((sum, d) => sum + (d.actual_cost ?? 0), 0))
const trendTotalRequests = computed(() => props.trend.reduce((sum, d) => sum + (d.requests ?? 0), 0))

const maxModelTokens = computed(() => Math.max(1, ...props.models.map((m) => m.total_tokens)))
const modelPercent = (model: ModelStat) => Math.max(2, Math.round((model.total_tokens / maxModelTokens.value) * 100))
</script>

<style scoped>
.dash-charts { display: flex; flex-direction: column; gap: 14px; }

.dash-charts__head { display: flex; flex-direction: column; gap: 14px; }
.dash-charts__head-copy { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.dash-charts__head-copy .st-display-3 { margin-top: 2px; }
.dash-charts__lede { font-size: 0.88rem; max-width: 52ch; }
.dash-charts__controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; max-width: 100%; }
.dash-charts__spin { animation: dash-charts-spin 900ms linear infinite; }
@keyframes dash-charts-spin { to { transform: rotate(360deg); } }

.dash-charts__summary { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; padding-top: 6px; }
.dash-charts__summary-value {
  font-family: var(--st-font-display);
  font-size: clamp(1.9rem, 3.4vw, 2.5rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--st-ink);
  line-height: 1;
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}
.dash-charts__summary-unit { font-size: 0.76rem; font-weight: 500; letter-spacing: 0.04em; color: var(--st-ink-3); }
.dash-charts__summary-meta { font-size: 0.8rem; color: var(--st-ink-3); }

.dash-charts__legend { display: flex; flex-wrap: wrap; gap: 6px 16px; padding-top: 4px; }
.dash-charts__legend li { display: inline-flex; align-items: center; gap: 7px; font-size: 0.76rem; color: var(--st-ink-2); }
.dash-charts__swatch { width: 14px; height: 2px; border-radius: 999px; display: inline-block; }
.dash-charts__swatch--dash {
  background: repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 7px) !important;
  color: var(--st-brand-text);
}

.dash-charts__canvas { position: relative; height: 220px; margin-top: 4px; }
.dash-charts__skeleton { display: flex; align-items: flex-end; gap: 10px; height: 100%; }
.dash-charts__bar { flex: 1; border-radius: 6px 6px 0 0; }

.dash-charts__empty {
  display: grid;
  place-items: center;
  height: 100%;
  font-size: 0.86rem;
  color: var(--st-ink-3);
  border-radius: var(--st-r-md);
  background: color-mix(in srgb, var(--st-bg-sink) 60%, transparent);
}

/* 模型 */
.dash-charts__models { display: flex; flex-direction: column; gap: 16px; }
.dash-charts__model-skeleton { display: flex; flex-direction: column; gap: 12px; }
.dash-charts__model-line { height: 18px; }
.dash-charts__model-list { display: flex; flex-direction: column; gap: 14px; }
.dash-charts__model { display: flex; flex-direction: column; gap: 6px; }
.dash-charts__model-top { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.dash-charts__model-name {
  font-family: var(--st-font-mono);
  font-size: 0.8rem;
  color: var(--st-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dash-charts__model-cost { font-size: 0.82rem; font-weight: 600; color: var(--st-brand-text); }
.dash-charts__model-bar { height: 4px; border-radius: 999px; background: var(--st-bg-sink); overflow: hidden; }
.dash-charts__model-bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--st-brand), color-mix(in srgb, var(--st-brand) 32%, transparent));
}
.dash-charts__model-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 0.72rem; color: var(--st-ink-3); }
.dash-charts__model-standard { margin-left: auto; }

@media (min-width: 900px) {
  .dash-charts__head { flex-direction: row; align-items: flex-end; justify-content: space-between; }
  .dash-charts__controls { justify-content: flex-end; }
  .dash-charts__canvas { height: 300px; }
}
</style>