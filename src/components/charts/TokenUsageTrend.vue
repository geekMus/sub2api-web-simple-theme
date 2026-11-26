<template>
  <div class="chart-box">
    <h3 class="chart-box__title chart-box__title--mb">
      {{ t('admin.dashboard.tokenUsageTrend') }}
    </h3>
    <div v-if="loading" class="chart-state">
      <LoadingSpinner />
    </div>
    <div v-else-if="trendData.length > 0 && chartData" class="chart-line">
      <Line :data="chartData" :options="lineOptions" />
    </div>
    <div
      v-else
      class="flex h-48 items-center justify-center text-sm chart-muted"
    >
      {{ t('admin.dashboard.noDataAvailable') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { TrendDataPoint } from '@/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const { t } = useI18n()

const themeTick = ref(0)
let themeObserver: MutationObserver | null = null
onMounted(() => {
  if (typeof MutationObserver === 'undefined') return
  themeObserver = new MutationObserver(() => { themeTick.value++ })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})
onUnmounted(() => { themeObserver?.disconnect() })

// 颜色全部来自 src/styles/simple-theme.css 的设计令牌，fallback 与令牌取值保持一致
const readToken = (name: string, fallback: string): string => {
  void themeTick.value
  if (typeof document === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}
const chartTokens = computed(() => ({
  text: readToken('--st-ink-2', '#55565c'),
  grid: readToken('--st-line', '#e6e6e8'),
  border: readToken('--st-line-2', '#d2d2d6'),
  ink: readToken('--st-ink', '#060607'),
  bg: readToken('--st-bg', '#ffffff'),
  brand: readToken('--st-brand', '#c9f24a'),
  brandText: readToken('--st-brand-text', '#5c7a00'),
  ok: readToken('--st-ok', '#16a34a'),
  warn: readToken('--st-warn', '#b45309'),
  danger: readToken('--st-danger', '#dc2626'),
  ink2: readToken('--st-ink-2', '#55565c'),
  ink3: readToken('--st-ink-3', '#8a8b92'),
}))

const withAlpha = (color: string, alpha: number): string => {
  const hex = color.trim().replace('#', '')
  const parse = (pair: string) => parseInt(pair, 16)
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return `rgba(${parse(hex[0] + hex[0])}, ${parse(hex[1] + hex[1])}, ${parse(hex[2] + hex[2])}, ${alpha})`
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return `rgba(${parse(hex.slice(0, 2))}, ${parse(hex.slice(2, 4))}, ${parse(hex.slice(4, 6))}, ${alpha})`
  }
  return color
}

const props = defineProps<{
  trendData: TrendDataPoint[]
  loading?: boolean
}>()

const chartColors = computed(() => ({
  text: chartTokens.value.ink2,
  grid: chartTokens.value.grid,
  input: chartTokens.value.brand,
  output: chartTokens.value.ok,
  cacheCreation: chartTokens.value.warn,
  cacheRead: chartTokens.value.ink2,
  cacheHitRate: chartTokens.value.ink3
}))

const chartData = computed(() => {
  if (!props.trendData?.length) return null

  return {
    labels: props.trendData.map((d) => d.date),
    datasets: [
      {
        label: 'Input',
        data: props.trendData.map((d) => d.input_tokens),
        borderColor: chartColors.value.input,
        backgroundColor: withAlpha(chartColors.value.input, 0.12),
        fill: true,
        tension: 0.3
      },
      {
        label: 'Output',
        data: props.trendData.map((d) => d.output_tokens),
        borderColor: chartColors.value.output,
        backgroundColor: withAlpha(chartColors.value.output, 0.12),
        fill: true,
        tension: 0.3
      },
      {
        label: 'Cache Creation',
        data: props.trendData.map((d) => d.cache_creation_tokens),
        borderColor: chartColors.value.cacheCreation,
        backgroundColor: withAlpha(chartColors.value.cacheCreation, 0.12),
        fill: true,
        tension: 0.3
      },
      {
        label: 'Cache Read',
        data: props.trendData.map((d) => d.cache_read_tokens),
        borderColor: chartColors.value.cacheRead,
        backgroundColor: withAlpha(chartColors.value.cacheRead, 0.12),
        fill: true,
        tension: 0.3
      },
      {
        label: 'Cache Hit Rate',
        data: props.trendData.map((d) => {
          const totalPromptTokens = d.input_tokens + d.cache_read_tokens + d.cache_creation_tokens
          return totalPromptTokens > 0 ? (d.cache_read_tokens / totalPromptTokens) * 100 : 0
        }),
        borderColor: chartColors.value.cacheHitRate,
        backgroundColor: withAlpha(chartColors.value.cacheHitRate, 0.12),
        borderDash: [5, 5],
        fill: false,
        tension: 0.3,
        yAxisID: 'yPercent'
      }
    ]
  }
})

const lineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: chartColors.value.text,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 15,
        font: {
          size: 11
        }
      }
    },
    tooltip: {
      backgroundColor: chartTokens.value.ink,
      titleColor: chartTokens.value.bg,
      bodyColor: chartTokens.value.bg,
      borderColor: chartTokens.value.border,
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (context: any) => {
          if (context.dataset.yAxisID === 'yPercent') {
            return `${context.dataset.label}: ${context.raw.toFixed(1)}%`
          }
          return `${context.dataset.label}: ${formatTokens(context.raw)}`
        },
        footer: (tooltipItems: any) => {
          const dataIndex = tooltipItems[0]?.dataIndex
          if (dataIndex !== undefined && props.trendData[dataIndex]) {
            const data = props.trendData[dataIndex]
            return `Actual: $${formatCost(data.actual_cost)} | Standard: $${formatCost(data.cost)}`
          }
          return ''
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: chartColors.value.grid
      },
      border: {
        color: chartColors.value.grid
      },
      ticks: {
        color: chartColors.value.text,
        maxTicksLimit: 8,
        maxRotation: 0,
        autoSkip: true,
        font: {
          size: 10
        }
      }
    },
    y: {
      grid: {
        color: chartColors.value.grid
      },
      border: {
        color: chartColors.value.grid
      },
      ticks: {
        color: chartColors.value.text,
        font: {
          size: 10
        },
        callback: (value: string | number) => formatTokens(Number(value))
      }
    },
    yPercent: {
      position: 'right' as const,
      min: 0,
      max: 100,
      grid: {
        drawOnChartArea: false
      },
      ticks: {
        color: chartColors.value.text,
        font: {
          size: 10
        },
        callback: (value: string | number) => `${value}%`
      }
    }
  }
}))

const formatTokens = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }
  return value.toLocaleString()
}

const formatCost = (value: number): string => {
  if (value >= 1000) {
    return (value / 1000).toFixed(2) + 'K'
  } else if (value >= 1) {
    return value.toFixed(2)
  } else if (value >= 0.01) {
    return value.toFixed(3)
  }
  return value.toFixed(4)
}
</script>

<style scoped>
.chart-box { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.chart-box__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
.chart-box__title { margin: 0; font-family: var(--st-font-display); font-size: 0.95rem; font-weight: 600; letter-spacing: -0.02em; color: var(--st-ink); }
.chart-box__title--mb { margin-bottom: 2px; }
.chart-toggle { display: inline-flex; gap: 2px; padding: 3px; border-radius: 999px; border: 1px solid var(--st-line); background: var(--st-bg-soft); }
.chart-tab { height: 26px; padding-inline: 10px; border: 0; border-radius: 999px; background: transparent; font-family: inherit; font-size: 0.75rem; color: var(--st-ink-2); cursor: pointer; transition: background-color var(--st-t) var(--st-ease), color var(--st-t) var(--st-ease); }
.chart-tab:hover { color: var(--st-ink); }
.chart-tab--active { background: var(--st-bg); color: var(--st-ink); box-shadow: var(--st-shadow-1); }
.chart-tab--idle { color: var(--st-ink-2); }
.chart-body { display: flex; flex-direction: column; align-items: center; gap: 16px; min-width: 0; }
.chart-doughnut { width: 100%; max-width: 190px; height: 190px; flex-shrink: 0; }
.chart-tablewrap { width: 100%; min-width: 0; max-height: 220px; overflow: auto; flex: 1; }
.chart-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
.chart-table th { padding-bottom: 8px; font-weight: 400; white-space: nowrap; color: var(--st-ink-3); }
.chart-table td { padding: 6px 6px; white-space: nowrap; }
.chart-tr { border-top: 1px solid var(--st-line); }
.chart-tr--click { cursor: pointer; }
.chart-tr--click:hover { background: var(--st-bg-soft); }
.chart-tr--other { background: var(--st-bg-soft); }
.chart-muted { color: var(--st-ink-3); }
.chart-cell { color: var(--st-ink-2); }
.chart-dim { color: var(--st-ink-3); }
.chart-strong { color: var(--st-ink); }
.chart-money { color: var(--st-ok); }
.chart-account { color: var(--st-warn); }
.chart-link { color: var(--st-brand-text); }
.chart-link:hover { text-decoration: underline; }
.chart-state, .chart-empty { display: flex; align-items: center; justify-content: center; height: 190px; font-size: 0.82rem; color: var(--st-ink-3); }
.chart-line { position: relative; height: 220px; min-width: 0; }
@media (min-width: 640px) {
  .chart-body { flex-direction: row; gap: 22px; }
  .chart-doughnut { width: 190px; }
}
@media (max-width: 520px) {
  .chart-tab { height: 24px; padding-inline: 8px; font-size: 0.7rem; }
  .chart-table { font-size: 0.7rem; }
}
</style>
