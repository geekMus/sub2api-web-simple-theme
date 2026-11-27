<template>
  <div class="chart-box">
    <div class="chart-box__head">
      <h3 class="chart-box__title">
        {{ !enableRankingView || activeView === 'model_distribution'
          ? t('admin.dashboard.modelDistribution')
          : t('admin.dashboard.spendingRankingTitle') }}
      </h3>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <div
          v-if="showSourceToggle"
          class="chart-toggle"
        >
          <button
            type="button"
            class="chart-tab"
            :class="source === 'requested'
              ? 'chart-tab--active'
              : 'chart-tab--idle'"
            @click="emit('update:source', 'requested')"
          >
            {{ t('usage.requestedModel') }}
          </button>
          <button
            type="button"
            class="chart-tab"
            :class="source === 'upstream'
              ? 'chart-tab--active'
              : 'chart-tab--idle'"
            @click="emit('update:source', 'upstream')"
          >
            {{ t('usage.upstreamModel') }}
          </button>
          <button
            type="button"
            class="chart-tab"
            :class="source === 'mapping'
              ? 'chart-tab--active'
              : 'chart-tab--idle'"
            @click="emit('update:source', 'mapping')"
          >
            {{ t('usage.mapping') }}
          </button>
        </div>
        <div
          v-if="showMetricToggle"
          class="chart-toggle"
        >
          <button
            type="button"
            class="chart-tab"
            :class="metric === 'tokens'
              ? 'chart-tab--active'
              : 'chart-tab--idle'"
            @click="emit('update:metric', 'tokens')"
          >
            {{ t('admin.dashboard.metricTokens') }}
          </button>
          <button
            type="button"
            class="chart-tab"
            :class="metric === 'actual_cost'
              ? 'chart-tab--active'
              : 'chart-tab--idle'"
            @click="emit('update:metric', 'actual_cost')"
          >
            {{ t('admin.dashboard.metricActualCost') }}
          </button>
        </div>
        <div v-if="enableRankingView" class="chart-toggle">
          <button
            type="button"
            class="chart-tab"
            :class="
              activeView === 'model_distribution'
                ? 'chart-tab--active'
                : 'chart-tab--idle'
            "
            @click="activeView = 'model_distribution'"
          >
            {{ t('admin.dashboard.viewModelDistribution') }}
          </button>
          <button
            type="button"
            class="chart-tab"
            :class="
              activeView === 'spending_ranking'
                ? 'chart-tab--active'
                : 'chart-tab--idle'
            "
            @click="activeView = 'spending_ranking'"
          >
            {{ t('admin.dashboard.viewSpendingRanking') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="activeView === 'model_distribution' && loading" class="chart-skeleton">
      <span v-for="i in 4" :key="i" class="st-skeleton chart-skeleton__row"></span>
    </div>
    <div
      v-else-if="activeView === 'model_distribution' && displayModelStats.length > 0 && chartData"
      class="chart-body"
    >
      <div class="chart-doughnut">
        <Doughnut :data="chartData" :options="doughnutOptions" />
      </div>
      <div class="chart-tablewrap">
        <table class="chart-table">
          <thead>
            <tr class="chart-muted">
              <th class="pb-2 text-left">{{ t('admin.dashboard.model') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.requests') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.tokens') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.actual') }}</th>
              <th v-if="showAccountCost" class="pb-2 text-right">{{ t('admin.dashboard.accountCost') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.standard') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="model in displayModelStats" :key="model.model">
              <tr
                class="border-t chart-tr"
                :class="enableBreakdown ? 'cursor-pointer chart-tr--click' : ''"
                @click="enableBreakdown && toggleBreakdown('model', model.model)"
              >
                <td
                  class="max-w-[100px] truncate py-1.5 font-medium"
                  :class="enableBreakdown ? 'chart-link' : 'chart-strong'"
                  :title="model.model"
                >
                  <span class="inline-flex items-center gap-1">
                    <svg v-if="enableBreakdown && expandedKey === `model-${model.model}`" class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    <svg v-else-if="enableBreakdown" class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    {{ model.model }}
                  </span>
                </td>
                <td class="py-1.5 text-right chart-cell">
                  {{ formatNumber(model.requests) }}
                </td>
                <td class="py-1.5 text-right chart-cell">
                  {{ formatTokens(model.total_tokens) }}
                </td>
                <td :data-label="t('admin.dashboard.actual')" class="py-1.5 text-right chart-money">
                  ${{ formatCost(model.actual_cost) }}
                </td>
                <td v-if="showAccountCost" :data-label="t('admin.dashboard.accountCost')" class="py-1.5 text-right chart-account">
                  ${{ formatCost(model.account_cost) }}
                </td>
                <td :data-label="t('admin.dashboard.standard')" class="py-1.5 text-right chart-dim">
                  ${{ formatCost(model.cost) }}
                </td>
              </tr>
              <tr v-if="expandedKey === `model-${model.model}`">
                <td :colspan="distributionColspan" class="p-0">
                  <UserBreakdownSubTable
                    :items="breakdownItems"
                    :loading="breakdownLoading"
                    :show-account-cost="showAccountCost"
                  />
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
    <div
      v-else-if="activeView === 'model_distribution'"
      class="chart-empty"
    >
      {{ t('admin.dashboard.noDataAvailable') }}
    </div>

    <div v-else-if="rankingLoading" class="chart-skeleton">
      <span v-for="i in 4" :key="i" class="st-skeleton chart-skeleton__row"></span>
    </div>
    <div
      v-else-if="rankingError"
      class="chart-empty"
    >
      {{ t('admin.dashboard.failedToLoad') }}
    </div>
    <div v-else-if="rankingDisplayItems.length > 0 && rankingChartData" class="chart-body">
      <div class="chart-doughnut">
        <Doughnut :data="rankingChartData" :options="rankingDoughnutOptions" />
      </div>
      <div class="chart-tablewrap">
        <table class="chart-table">
          <thead>
            <tr class="chart-muted">
              <th class="pb-2 text-left">{{ t('admin.dashboard.spendingRankingUser') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.spendingRankingRequests') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.spendingRankingTokens') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.spendingRankingSpend') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in rankingDisplayItems"
              :key="item.isOther ? 'others' : `${item.user_id}-${index}`"
              class="border-t chart-tr"
              :class="item.isOther
                ? 'chart-tr--other'
                : 'cursor-pointer chart-tr--click'"
              @click="item.isOther ? undefined : emit('ranking-click', item)"
            >
              <td class="py-1.5">
                <div class="flex min-w-0 items-center gap-2">
                  <span class="shrink-0 text-[11px] font-semibold chart-muted">
                    {{ item.isOther ? 'Σ' : `#${index + 1}` }}
                  </span>
                  <span
                    class="block max-w-[140px] truncate font-medium chart-strong"
                    :title="getRankingRowLabel(item)"
                  >
                    {{ getRankingRowLabel(item) }}
                  </span>
                </div>
              </td>
              <td class="py-1.5 text-right chart-cell">
                {{ formatNumber(item.requests) }}
              </td>
              <td class="py-1.5 text-right chart-cell">
                {{ formatTokens(item.tokens) }}
              </td>
              <td :data-label="t('admin.dashboard.actual')" class="py-1.5 text-right chart-money">
                ${{ formatCost(item.actual_cost) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div
      v-else
      class="chart-empty"
    >
      {{ t('admin.dashboard.noDataAvailable') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import UserBreakdownSubTable from './UserBreakdownSubTable.vue'
import type { ModelStat, UserSpendingRankingItem, UserBreakdownItem } from '@/types'
import { getUserBreakdown } from '@/api/admin/dashboard'

ChartJS.register(ArcElement, Tooltip, Legend)

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
  brand: readToken('--st-chart-1', '#c9f24a'),
  brandText: readToken('--st-brand-text', '#5c7a00'),
  ok: readToken('--st-ok', '#16a34a'),
  warn: readToken('--st-warn', '#b45309'),
  danger: readToken('--st-danger', '#dc2626'),
  ink2: readToken('--st-ink-2', '#55565c'),
  ink3: readToken('--st-ink-3', '#8a8b92'),
}))


type DistributionMetric = 'tokens' | 'actual_cost'
type ModelSource = 'requested' | 'upstream' | 'mapping'
type RankingDisplayItem = UserSpendingRankingItem & { isOther?: boolean }
const props = withDefaults(defineProps<{
  modelStats: ModelStat[]
  upstreamModelStats?: ModelStat[]
  mappingModelStats?: ModelStat[]
  source?: ModelSource
  enableRankingView?: boolean
  rankingItems?: UserSpendingRankingItem[]
  rankingTotalActualCost?: number
  rankingTotalRequests?: number
  rankingTotalTokens?: number
  loading?: boolean
  metric?: DistributionMetric
  showSourceToggle?: boolean
  showMetricToggle?: boolean
  enableBreakdown?: boolean
  showAccountCost?: boolean
  rankingLoading?: boolean
  rankingError?: boolean
  startDate?: string
  endDate?: string
  filters?: Record<string, any>
}>(), {
  upstreamModelStats: () => [],
  mappingModelStats: () => [],
  source: 'requested',
  enableRankingView: false,
  rankingItems: () => [],
  rankingTotalActualCost: 0,
  rankingTotalRequests: 0,
  rankingTotalTokens: 0,
  loading: false,
  metric: 'tokens',
  showSourceToggle: false,
  showMetricToggle: false,
  enableBreakdown: true,
  showAccountCost: true,
  rankingLoading: false,
  rankingError: false
})

const expandedKey = ref<string | null>(null)
const breakdownItems = ref<UserBreakdownItem[]>([])
const breakdownLoading = ref(false)

const toggleBreakdown = async (type: string, id: string) => {
  const key = `${type}-${id}`
  if (expandedKey.value === key) {
    expandedKey.value = null
    return
  }
  expandedKey.value = key
  breakdownLoading.value = true
  breakdownItems.value = []
  try {
    const res = await getUserBreakdown({
      ...props.filters,
      start_date: props.startDate,
      end_date: props.endDate,
      model: id,
      model_source: props.source,
    })
    breakdownItems.value = res.users || []
  } catch {
    breakdownItems.value = []
  } finally {
    breakdownLoading.value = false
  }
}

const emit = defineEmits<{
  'update:metric': [value: DistributionMetric]
  'update:source': [value: ModelSource]
  'ranking-click': [item: UserSpendingRankingItem]
}>()

const enableRankingView = computed(() => props.enableRankingView)
const showAccountCost = computed(() => props.showAccountCost)
const distributionColspan = computed(() => showAccountCost.value ? 6 : 5)
const activeView = ref<'model_distribution' | 'spending_ranking'>('model_distribution')

const chartColors = computed(() => [
  chartTokens.value.brand,
  chartTokens.value.ok,
  chartTokens.value.warn,
  chartTokens.value.danger,
  chartTokens.value.ink2,
  chartTokens.value.ink3,
  chartTokens.value.brandText,
  chartTokens.value.brand,
  chartTokens.value.ok,
  chartTokens.value.warn,
  chartTokens.value.ink2,
  chartTokens.value.ink3
])

const displayModelStats = computed(() => {
  const sourceStats = props.source === 'upstream'
    ? props.upstreamModelStats
    : props.source === 'mapping'
      ? props.mappingModelStats
      : props.modelStats
  if (!sourceStats?.length) return []

  const metricKey = props.metric === 'actual_cost' ? 'actual_cost' : 'total_tokens'
  return [...sourceStats].sort((a, b) => toFiniteNumber(b[metricKey]) - toFiniteNumber(a[metricKey]))
})

const chartData = computed(() => {
  if (!displayModelStats.value.length) return null

  return {
    labels: displayModelStats.value.map((m) => m.model),
    datasets: [
      {
        data: displayModelStats.value.map((m) => toFiniteNumber(props.metric === 'actual_cost' ? m.actual_cost : m.total_tokens)),
        backgroundColor: chartColors.value.slice(0, displayModelStats.value.length),
        borderWidth: 0
      }
    ]
  }
})

const rankingChartData = computed(() => {
  if (!props.rankingItems?.length) return null

  const labels = props.rankingItems.map((item, index) => `#${index + 1} ${getRankingUserLabel(item)}`)
  const data = props.rankingItems.map((item) => toFiniteNumber(item.actual_cost))
  const backgroundColor = chartColors.value.slice(0, props.rankingItems.length)

  if (otherRankingItem.value) {
    labels.push(t('admin.dashboard.spendingRankingOther'))
    data.push(otherRankingItem.value.actual_cost)
    backgroundColor.push(chartTokens.value.ink3)
  }

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderWidth: 0
      }
    ]
  }
})

const otherRankingItem = computed<RankingDisplayItem | null>(() => {
  if (!props.rankingItems?.length) return null

  const rankedActualCost = props.rankingItems.reduce((sum, item) => sum + toFiniteNumber(item.actual_cost), 0)
  const rankedRequests = props.rankingItems.reduce((sum, item) => sum + toFiniteNumber(item.requests), 0)
  const rankedTokens = props.rankingItems.reduce((sum, item) => sum + toFiniteNumber(item.tokens), 0)

  const otherActualCost = Math.max((props.rankingTotalActualCost || 0) - rankedActualCost, 0)
  const otherRequests = Math.max((props.rankingTotalRequests || 0) - rankedRequests, 0)
  const otherTokens = Math.max((props.rankingTotalTokens || 0) - rankedTokens, 0)

  if (otherActualCost <= 0.000001 && otherRequests <= 0 && otherTokens <= 0) return null

  return {
    user_id: 0,
    email: '',
    username: '',
    actual_cost: otherActualCost,
    requests: otherRequests,
    tokens: otherTokens,
    isOther: true
  }
})

const rankingDisplayItems = computed<RankingDisplayItem[]>(() => {
  if (!props.rankingItems?.length) return []
  return otherRankingItem.value
    ? [...props.rankingItems, otherRankingItem.value]
    : [...props.rankingItems]
})

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
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
          const value = context.raw as number
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
          const formattedValue = props.metric === 'actual_cost'
            ? `$${formatCost(value)}`
            : formatTokens(value)
          return `${context.label}: ${formattedValue} (${percentage}%)`
        }
      }
    }
  }
}))

const rankingDoughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
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
          const value = context.raw as number
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
          return `${context.label}: $${formatCost(value)} (${percentage}%)`
        }
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

const formatNumber = (value: number): string => {
  return toFiniteNumber(value).toLocaleString()
}

const getRankingUserLabel = (item: UserSpendingRankingItem): string => {
  if (item.username?.trim()) return item.username.trim()
  if (item.email?.trim()) return item.email.trim()
  return t('admin.redeem.userPrefix', { id: item.user_id })
}

const getRankingRowLabel = (item: RankingDisplayItem): string => {
  if (item.isOther) return t('admin.dashboard.spendingRankingOther')
  return getRankingUserLabel(item)
}

const toFiniteNumber = (value: unknown): number => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const formatCost = (value: number | null | undefined): string => {
  const safeValue = toFiniteNumber(value)
  if (safeValue >= 1000) {
    return (safeValue / 1000).toFixed(2) + 'K'
  } else if (safeValue >= 1) {
    return safeValue.toFixed(2)
  } else if (safeValue >= 0.01) {
    return safeValue.toFixed(3)
  }
  return safeValue.toFixed(4)
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
@media (max-width: 720px) {
  .chart-table thead { display: none; }
  .chart-table, .chart-table tbody, .chart-table tr, .chart-table td { display: block; }
  .chart-table tr { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 12px; padding: 11px 0; border-top: 1px solid var(--st-line); }
  .chart-table td { padding: 0; text-align: left; white-space: normal; }
  .chart-table td:first-child { grid-column: 1 / -1; margin-bottom: 2px; font-weight: 600; color: var(--st-ink); }
  .chart-table td::before { content: attr(data-label); margin-right: 4px; font-size: 0.75rem; color: var(--st-ink-3); }
  .chart-table td:first-child::before { content: none; }
  .chart-tab { height: 44px; }
}
.chart-skeleton { display: flex; flex-direction: column; gap: 10px; justify-content: center; min-height: 190px; padding: 8px 0; }
.chart-skeleton__row { display: block; height: 14px; border-radius: 999px; }
.chart-skeleton__row:nth-child(1) { width: 62%; }
.chart-skeleton__row:nth-child(2) { width: 88%; }
.chart-skeleton__row:nth-child(3) { width: 74%; }
.chart-skeleton__row:nth-child(4) { width: 52%; }
.chart-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; height: 190px; font-size: 0.82rem; color: var(--st-ink-3); }
.chart-empty::before { content: ""; width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--st-line); background: var(--st-bg-soft); }
</style>