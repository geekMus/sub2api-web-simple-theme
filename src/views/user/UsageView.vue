<template>
  <UserShell>
    <section class="st-section usage">
      <div class="st-shell usage__wrap">
        <header class="usage-head">
          <div class="usage-head__copy">
            <p class="st-eyebrow st-reveal">{{ c('usage.eyebrow') }}</p>
            <h1 class="st-display-2 st-reveal" style="--i: 1">{{ c('usage.title') }}</h1>
            <p class="st-lede st-reveal" style="--i: 2">{{ c('usage.lede') }}</p>
          </div>
          <div class="usage-head__pills st-reveal" style="--i: 3">
            <span class="st-pill st-pill--accent st-pill--dot">{{ c('usage.range.' + usageRangePreset) }}</span>
            <span class="st-pill">{{ cf('usage.logs.count', { n: pagination.total }) }}</span>
          </div>
        </header>

        <!-- 区间 / 粒度 / 动作 -->
        <div class="usage-controls st-reveal" style="--i: 4">
          <div class="toolbar">
            <div class="st-seg" role="tablist">
              <button
                v-for="preset in usageRangePresets"
                :key="preset.key"
                type="button"
                class="st-seg__item"
                :class="{ 'st-seg__item--active': usageRangePreset === preset.key }"
                @click="applyUsageRangePreset(preset.key)"
              >
                {{ preset.label }}
              </button>
            </div>
            <div v-show="usageRangePreset === 'custom'" class="toolbar__range">
              <DateRangePicker v-model:start-date="startDate" v-model:end-date="endDate" @change="onDateRangeChange" />
            </div>
            <div class="toolbar__granularity">
              <div class="st-seg">
                <button
                  v-for="option in granularityOptions"
                  :key="String(option.value)"
                  type="button"
                  class="st-seg__item"
                  :class="{ 'st-seg__item--active': granularity === option.value }"
                  @click="setGranularity(String(option.value))"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
            <div class="toolbar__actions">
              <button type="button" class="st-btn st-btn--ghost st-btn--sm" @click="refreshData" :disabled="activeTab === 'errors' ? errorLoading : loading">
                {{ t('common.refresh') }}
              </button>
              <button type="button" class="st-btn st-btn--ghost st-btn--sm" @click="resetFilters">
                {{ t('common.reset') }}
              </button>
              <button
                v-if="activeTab !== 'errors'"
                type="button"
                class="st-btn st-btn--primary st-btn--sm"
                @click="exportToCSV"
                :disabled="exporting"
              >
                {{ exporting ? t('usage.exporting') : t('usage.exportCsv') }}
              </button>
            </div>
          </div>
        </div>

        <!-- 三个关键数字 + 次级指标 -->
        <div v-if="statsLoading && !usageStats" class="stats stats--skeleton">
          <div class="st-card st-card--pad stat-skeleton stat-skeleton--lead">
            <span class="st-skeleton sk-line sk-line--sm"></span>
            <span class="st-skeleton sk-line sk-line--xl"></span>
          </div>
          <div v-for="i in 2" :key="i" class="st-card st-card--pad stat-skeleton">
            <span class="st-skeleton sk-line sk-line--sm"></span>
            <span class="st-skeleton sk-line sk-line--lg"></span>
          </div>
        </div>

        <template v-else>
          <div class="stats st-reveal" style="--i: 5">
            <article
              v-for="(card, index) in summaryCards.slice(0, 3)"
              :key="card.label"
              class="st-card st-card--pad st-card--lift stat"
              :class="{ 'stat--lead': index === 0 }"
            >
              <span class="stat__top">
                <span class="st-stat__label">{{ card.label }}</span>
                <span v-if="index === 0" class="stat__tag">{{ c('usage.range.' + usageRangePreset) }}</span>
              </span>
              <span class="st-stat__value st-num">
                {{ card.value }}<span v-if="card.unit" class="st-stat__unit">{{ card.unit }}</span>
              </span>
              <span v-if="card.hint" class="stat__hint">{{ card.hint }}</span>
            </article>
          </div>

          <div class="stats-meta st-reveal" style="--i: 6">
            <div v-for="card in summaryCards.slice(3)" :key="card.label" class="stats-meta__item">
              <span class="st-stat__label">{{ card.label }}</span>
              <span class="stats-meta__value st-num">
                {{ card.value }}<span v-if="card.unit" class="st-stat__unit">{{ card.unit }}</span>
              </span>
              <span v-if="card.hint" class="stats-meta__hint">{{ card.hint }}</span>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- 趋势 / 分布 -->
    <section class="st-section--tight">
      <div class="st-shell">
        <div class="charts">
          <article class="st-card st-card--pad chart chart--trend">
            <header class="chart__head">
              <span class="chart__idx">01</span>
              <div class="chart__copy">
                <h2 class="st-display-4">{{ c('usage.trend.title') }}</h2>
                <p class="st-body">{{ c('usage.trend.lede') }}</p>
              </div>
            </header>
            <TokenUsageTrend :trend-data="trendData" :loading="chartsLoading" />
          </article>

          <article class="st-card st-card--pad chart chart--model">
            <header class="chart__head">
              <span class="chart__idx">02</span>
              <div class="chart__copy">
                <h2 class="st-display-4">{{ c('usage.models.title') }}</h2>
                <p class="st-body">{{ c('usage.models.lede') }}</p>
              </div>
            </header>
            <ModelDistributionChart
              v-model:metric="modelDistributionMetric"
              :model-stats="requestedModelStats"
              :loading="modelStatsLoading"
              :show-source-toggle="false"
              :show-metric-toggle="true"
              :enable-breakdown="false"
              :show-account-cost="false"
              :start-date="startDate"
              :end-date="endDate"
            />
          </article>

          <article class="st-card st-card--pad chart chart--group">
            <header class="chart__head">
              <span class="chart__idx">03</span>
              <div class="chart__copy">
                <h2 class="st-display-4">{{ c('usage.groups.title') }}</h2>
                <p class="st-body">{{ c('usage.groups.lede') }}</p>
              </div>
            </header>
            <GroupDistributionChart
              v-model:metric="groupDistributionMetric"
              :group-stats="groupStats"
              :loading="chartsLoading"
              :show-metric-toggle="true"
              :enable-breakdown="false"
              :show-account-cost="false"
              :start-date="startDate"
              :end-date="endDate"
            />
          </article>

          <article class="st-card st-card--pad chart chart--endpoint">
            <header class="chart__head">
              <span class="chart__idx">04</span>
              <div class="chart__copy">
                <h2 class="st-display-4">{{ c('usage.endpoints.title') }}</h2>
                <p class="st-body">{{ c('usage.endpoints.lede') }}</p>
              </div>
            </header>
            <EndpointDistributionChart
              v-model:source="endpointDistributionSource"
              v-model:metric="endpointDistributionMetric"
              :endpoint-stats="inboundEndpointStats"
              :upstream-endpoint-stats="upstreamEndpointStats"
              :endpoint-path-stats="endpointPathStats"
              :loading="endpointStatsLoading"
              :show-source-toggle="false"
              :show-metric-toggle="true"
              :enable-breakdown="false"
              :show-account-cost="false"
              :title="t('usage.endpointDistribution')"
              :start-date="startDate"
              :end-date="endDate"
            />
          </article>
        </div>
      </div>
    </section>

    <!-- 明细 -->
    <section class="st-section--tight logs-sec">
      <div class="st-shell">
        <header class="logs__head">
          <div>
            <h2 class="st-display-3">{{ c('usage.logs.title') }}</h2>
            <p class="st-body">{{ c('usage.logs.lede') }}</p>
          </div>
        </header>

        <div class="tabs">
          <div class="st-seg">
            <button type="button" class="st-seg__item" :class="{ 'st-seg__item--active': activeTab === 'usage' }" @click="activeTab = 'usage'">
              {{ t('usage.tabs.usage') }}
            </button>
            <button v-if="errorViewEnabled" type="button" class="st-seg__item" :class="{ 'st-seg__item--active': activeTab === 'errors' }" @click="switchToErrors">
              {{ t('usage.tabs.errors') }}
            </button>
          </div>
          <div class="tabs__tools">
            <div v-if="activeTab !== 'errors'" class="st-seg">
              <button type="button" class="st-seg__item" :class="{ 'st-seg__item--active': sortState.sort_order === 'desc' }" @click="handleSort('created_at', 'desc')">
                {{ c('usage.logs.newest') }}
              </button>
              <button type="button" class="st-seg__item" :class="{ 'st-seg__item--active': sortState.sort_order === 'asc' }" @click="handleSort('created_at', 'asc')">
                {{ c('usage.logs.oldest') }}
              </button>
            </div>
            <div class="st-colset" ref="columnDropdownRef">
              <button
                type="button"
                data-testid="usage-column-settings"
                class="st-btn st-btn--quiet st-btn--sm"
                :title="t('admin.users.columnSettings')"
                @click="showColumnDropdown = !showColumnDropdown"
              >
                <Icon name="grid" size="sm" />
                <span class="st-colset__label">{{ c('usage.logs.colSettings') }}</span>
              </button>
              <div v-if="showColumnDropdown" class="st-colset__menu">
                <button
                  v-for="col in currentToggleableColumns"
                  :key="col.key"
                  type="button"
                  :data-testid="'usage-column-toggle-' + col.key"
                  class="st-colset__item"
                  @click="toggleCurrentColumn(col.key)"
                >
                  <span>{{ col.label }}</span>
                  <Icon v-if="isCurrentColumnVisible(col.key)" name="check" size="sm" class="st-accent" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <details v-if="activeTab === 'usage'" class="st-card st-card--pad filters" open>
          <summary class="filters__summary">
            <span class="st-eyebrow">{{ c('usage.filters.title') }}</span>
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M5 8l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </summary>
          <div class="filters__grid">
            <div>
              <label class="st-label">{{ t('usage.apiKeyFilter') }}</label>
              <Select v-model="filters.api_key_id" :options="apiKeyOptions" @change="applyFilters" />
            </div>
            <div>
              <label class="st-label">{{ t('usage.model') }}</label>
              <Select v-model="filters.model" :options="modelOptions" searchable @change="applyFilters" />
            </div>
            <div>
              <label class="st-label">{{ t('admin.usage.group') }}</label>
              <Select v-model="filters.group_id" :options="groupOptions" searchable @change="applyFilters" />
            </div>
            <div>
              <label class="st-label">{{ t('usage.type') }}</label>
              <Select v-model="filters.request_type" :options="requestTypeOptions" @change="applyFilters" />
            </div>
            <div>
              <label class="st-label">{{ t('usage.compactionFilter') }}</label>
              <Select v-model="filters.native_compaction_v2" :options="compactionOptions" @change="applyFilters" />
            </div>
            <div v-if="subscriptionFeatureEnabled">
              <label class="st-label">{{ t('admin.usage.billingType') }}</label>
              <Select v-model="filters.billing_type" :options="billingTypeOptions" @change="applyFilters" />
            </div>
            <div>
              <label class="st-label">{{ t('admin.usage.billingMode') }}</label>
              <Select v-model="filters.billing_mode" :options="billingModeOptions" @change="applyFilters" />
            </div>
          </div>
        </details>

        <details v-if="activeTab === 'errors' && errorViewEnabled" class="st-card st-card--pad filters" open>
          <summary class="filters__summary">
            <span class="st-eyebrow">{{ c('usage.filters.title') }}</span>
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M5 8l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </summary>
          <div class="filters__grid">
            <div>
              <label class="st-label">{{ t('usage.errors.keyName') }}</label>
              <Select v-model="errorFilter.api_key_id" :options="errorKeyOptions" @change="applyErrorFilters" />
            </div>
            <div>
              <label class="st-label">{{ t('usage.errors.model') }}</label>
              <Select
                v-model="errorFilter.model"
                :options="errorModelOptions"
                searchable
                creatable
                clearable
                :placeholder="t('usage.errors.modelPlaceholder')"
                @change="applyErrorFilters"
              />
            </div>
            <div>
              <label class="st-label">{{ t('usage.errors.category') }}</label>
              <Select v-model="errorFilter.category" :options="errorCategoryOptions" @change="applyErrorFilters" />
            </div>
            <div>
              <label class="st-label">{{ t('usage.errors.status') }}</label>
              <Select v-model="errorFilter.status_code" :options="errorStatusOptions" @change="applyErrorFilters" />
            </div>
          </div>
        </details>

        <template v-if="activeTab === 'usage'">
          <div v-if="loading && usageLogs.length === 0" class="logs-skeleton" aria-busy="true">
            <div v-for="i in 4" :key="i" class="st-card st-card--pad logs-skeleton__row">
              <span class="st-skeleton sk-line sk-line--sm"></span>
              <span class="st-skeleton sk-line sk-line--md"></span>
              <span class="st-skeleton sk-line sk-line--xs"></span>
            </div>
          </div>

          <div v-else-if="loadError" class="st-card st-card--pad error-state">
            <span class="error-state__mark"><Icon name="exclamationCircle" size="lg" /></span>
            <div class="error-state__copy">
              <h2 class="st-display-3">{{ c('usage.errorTitle') }}</h2>
              <p class="st-body">{{ c('usage.errorBody') }}</p>
            </div>
            <button type="button" class="st-btn st-btn--primary st-btn--sm" @click="refreshData">{{ c('usage.retry') }}</button>
          </div>

          <div v-else-if="usageLogs.length === 0" class="st-card st-card--pad st-card--halo empty">
            <div class="empty__mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M4 7h16M4 12h10M4 17h7" stroke-linecap="round" />
                <circle cx="18" cy="16" r="3.2" />
              </svg>
            </div>
            <h2 class="st-display-3">{{ c('usage.logs.empty') }}</h2>
            <p class="st-body">{{ c('usage.logs.emptyHint') }}</p>
            <RouterLink to="/keys" class="st-btn st-btn--primary st-btn--sm">{{ c('usage.logs.emptyCta') }}</RouterLink>
          </div>

          <div v-else class="logs">
            <article v-for="(group, gi) in usageDayGroups" :key="group.key" class="day st-reveal" :style="{ '--i': gi + 1 }">
              <header class="day__head">
                <span class="day__date">{{ group.label }}</span>
                <span class="day__sum">
                  <span class="st-num">{{ group.count }}</span>
                  <span class="day__sum-unit">{{ c('usage.sum.requests') }}</span>
                  <span class="day__sum-cost st-num">{{ fmtMoney(group.spend, 4) }}</span>
                </span>
              </header>
              <div class="st-list day__list">
                <div v-for="log in group.rows" :key="log.id" class="st-row log">
                  <span class="log__time st-num">{{ logTime(log) }}</span>
                  <span class="log__main">
                    <span class="st-row__title">{{ log.model || '—' }}</span>
                    <span class="st-row__meta log__meta">
                      <span v-if="showField('api_key')">{{ log.api_key?.name || '—' }}</span>
                      <span v-if="showField('endpoint') && log.inbound_endpoint"> · {{ log.inbound_endpoint }}</span>
                      <span v-else-if="log.reasoning_effort"> · {{ formatReasoningEffort(log.reasoning_effort) }}</span>
                    </span>
                  </span>
                  <span class="log__tokens st-num">
                    <span class="log__tok">{{ fmtCompact(log.input_tokens) }}<i>{{ c('usage.logs.tokensIn') }}</i></span>
                    <span class="log__tok">{{ fmtCompact(log.output_tokens) }}<i>{{ c('usage.logs.tokensOut') }}</i></span>
                    <span v-if="showField('tokens') && (log.cache_read_tokens ?? 0) > 0" class="log__tok log__tok--cache">
                      {{ fmtCompact(log.cache_read_tokens) }}<i>{{ c('usage.logs.tokensCache') }}</i>
                    </span>
                  </span>
                  <span class="log__cost st-num">{{ fmtMoney(log.actual_cost, 4) }}</span>
                </div>
              </div>
            </article>
          </div>

          <div v-if="pagination.total > 0" class="logs__pager">
            <Pagination
              :page="pagination.page"
              :total="pagination.total"
              :page-size="pagination.page_size"
              @update:page="handlePageChange"
              @update:pageSize="handlePageSizeChange"
            />
          </div>
        </template>

        <div v-else-if="errorViewEnabled" class="st-card errors-card">
          <UserErrorRequestsTable
            :rows="errorRows"
            :total="errorTotal"
            :loading="errorLoading"
            :page="errorPage"
            :page-size="errorPageSize"
            :visible-column-keys="errVisibleColumnKeys"
            @sort="onErrorSort"
            @update:page="onErrorPage"
            @update:pageSize="onErrorPageSize"
            @ipGeoBatchFailed="handleIpGeoBatchFailed"
          />
        </div>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { FeatureFlags, resolveFeatureFlag } from '@/utils/featureFlags'
import { keysAPI, usageAPI, userGroupsAPI } from '@/api'
import UserShell from '@/components/shell/UserShell.vue'
import { useBillingCopy } from '@/composables/copy/billing'
import Pagination from '@/components/common/Pagination.vue'
import Select, { type SelectOption } from '@/components/common/Select.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import ModelDistributionChart from '@/components/charts/ModelDistributionChart.vue'
import GroupDistributionChart from '@/components/charts/GroupDistributionChart.vue'
import EndpointDistributionChart from '@/components/charts/EndpointDistributionChart.vue'
import TokenUsageTrend from '@/components/charts/TokenUsageTrend.vue'
import Icon from '@/components/icons/Icon.vue'
import UserErrorRequestsTable from '@/components/user/UserErrorRequestsTable.vue'
import { getPersistedPageSize } from '@/composables/usePersistedPageSize'
import { formatReasoningEffort } from '@/utils/format'
import { getBillingModeLabel, getDisplayBillingMode as resolveDisplayBillingMode } from '@/utils/billingMode'
import { resolveUsageRequestType, requestTypeToLegacyStream } from '@/utils/usageRequestType'
import type {
  ApiKey,
  EndpointStat,
  Group,
  GroupStat,
  ModelStat,
  TrendDataPoint,
  UsageLog,
  UsageQueryParams,
  UsageStatsResponse,
  UserErrorRequest,
} from '@/types'
import type { Column } from '@/components/common/types'
import { COMMON_ERROR_STATUS_CODES } from '@/utils/errorBadges'

const { t } = useI18n()
const appStore = useAppStore()

const { c, cf } = useBillingCopy()

// ── 展示层：账单摘要 / 区间预设 / 行式明细（只影响渲染，不改变任何请求参数） ──
type UsageRangePreset = 'today' | '24h' | '7d' | '30d' | 'custom'
const usageRangePreset = ref<UsageRangePreset>('24h')

const usageRangePresets = computed(() => [
  { key: 'today' as const, label: c('usage.range.today') },
  { key: '24h' as const, label: c('usage.range.24h') },
  { key: '7d' as const, label: c('usage.range.7d') },
  { key: '30d' as const, label: c('usage.range.30d') },
  { key: 'custom' as const, label: c('usage.range.custom') },
])

function applyUsageRangePreset(key: UsageRangePreset) {
  usageRangePreset.value = key
  if (key === 'custom') return
  const end = new Date()
  const days = key === 'today' ? 0 : key === '24h' ? 1 : key === '7d' ? 7 : 30
  const start = new Date(end.getTime() - days * 86400000)
  onDateRangeChange({ startDate: formatLocalDate(start), endDate: formatLocalDate(end), preset: key })
}

function setGranularity(value: string) {
  const next: 'day' | 'hour' = value === 'hour' ? 'hour' : 'day'
  if (granularity.value === next) return
  granularity.value = next
  void loadChartData()
}

function fmtMoney(value: number | null | undefined, digits = 2): string {
  const amount = Number(value ?? 0)
  return '$' + (Number.isFinite(amount) ? amount : 0).toFixed(digits)
}

function fmtCompact(value: number | null | undefined): string {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount) || amount <= 0) return '0'
  if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (amount >= 1_000) return (amount / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(Math.round(amount))
}

const summaryCards = computed(() => {
  const stats = usageStats.value
  const spend = stats?.total_actual_cost ?? 0
  const standard = stats?.total_cost ?? 0
  const requests = stats?.total_requests ?? 0
  const tokens = stats?.total_tokens ?? 0
  const avgCost = requests > 0 ? spend / requests : 0
  const latency = stats?.average_duration_ms ?? 0
  return [
    {
      label: c('usage.sum.spend'),
      value: fmtMoney(spend),
      unit: '',
      hint: standard > spend ? c('usage.sum.standard') + ' ' + fmtMoney(standard) : '',
    },
    { label: c('usage.sum.requests'), value: fmtCompact(requests), unit: '', hint: '' },
    { label: c('usage.sum.tokens'), value: fmtCompact(tokens), unit: '', hint: '' },
    {
      label: c('usage.sum.avgCost'),
      value: fmtMoney(avgCost, 4),
      unit: '',
      hint: requests > 0 ? '/ ' + requests + ' ' + c('usage.sum.perCall') : '',
    },
    {
      label: c('usage.sum.avgLatency'),
      value: String(Math.max(0, Math.round(latency))),
      unit: 'ms',
      hint: '',
    },
  ]
})

function formatDayLabel(key: string): string {
  if (!key) return '—'
  const date = new Date(key + 'T00:00:00')
  if (Number.isNaN(date.getTime())) return key
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })
}

interface UsageDayGroup {
  key: string
  label: string
  rows: UsageLog[]
  spend: number
  count: number
}

const usageDayGroups = computed<UsageDayGroup[]>(() => {
  const groups: UsageDayGroup[] = []
  for (const log of usageLogs.value) {
    const key = String(log.created_at || '').slice(0, 10)
    let group = groups.find((item) => item.key === key)
    if (!group) {
      group = { key, label: formatDayLabel(key), rows: [], spend: 0, count: 0 }
      groups.push(group)
    }
    group.rows.push(log)
    group.spend += Number(log.actual_cost ?? 0)
    group.count += 1
  }
  return groups
})

function logTime(log: UsageLog): string {
  const raw = String(log.created_at || '')
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw.slice(11, 16) || '—'
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function showField(key: string): boolean {
  return visibleColumns.value.some((column) => column.key === key)
}

type DistributionMetric = 'tokens' | 'actual_cost'
type EndpointSource = 'inbound' | 'upstream' | 'path'

const usageStats = ref<UsageStatsResponse | null>(null)
const usageLogs = ref<UsageLog[]>([])
const trendData = ref<TrendDataPoint[]>([])
const requestedModelStats = ref<ModelStat[]>([])
const groupStats = ref<GroupStat[]>([])
const inboundEndpointStats = ref<EndpointStat[]>([])
const upstreamEndpointStats = ref<EndpointStat[]>([])
const endpointPathStats = ref<EndpointStat[]>([])

const loading = ref(false)
const statsLoading = ref(false)
const loadError = ref(false)
const chartsLoading = ref(false)
const modelStatsLoading = ref(false)
const endpointStatsLoading = ref(false)
const exporting = ref(false)
const errorRows = ref<UserErrorRequest[]>([])
const errorLoading = ref(false)
const errorPage = ref(1)
const errorPageSize = ref(20)
const errorSortBy = ref('created_at')
const errorSortOrder = ref<'asc' | 'desc'>('desc')
const errorTotal = ref(0)
const errorFilter = ref<{ model: string | null; category: string; api_key_id: number | null; status_code: number | null }>({
  model: '',
  category: '',
  api_key_id: null,
  status_code: null,
})

const errorKeyOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('usage.errors.allKeys') },
  ...apiKeys.value.map((k) => ({ value: k.id, label: k.name })),
])

// 模型候选取自当前已加载错误中出现过的模型；creatable 允许输入任意片段做后端模糊。
const errorModelOptions = computed<SelectOption[]>(() => {
  const seen = new Set<string>()
  const opts: SelectOption[] = []
  for (const r of errorRows.value) {
    if (r.model && !seen.has(r.model)) {
      seen.add(r.model)
      opts.push({ value: r.model, label: r.model })
    }
  }
  return opts
})

const errorCategoryCodes = ['auth', 'rate_limit', 'quota', 'invalid_request', 'service_unavailable', 'upstream', 'internal', 'cyber']

const errorCategoryOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('usage.errors.allCategories') },
  ...errorCategoryCodes.map((c) => ({ value: c, label: t('usage.errors.categories.' + c) })),
])

// 状态码候选用固定常用列表(与管理端 UsageFilters 共用常量),不受当前页数据限制:
// 后端 status_code 过滤对全量生效,若只列当前页出现过的码,用户就选不到仅在后续页的码。
const errorStatusOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('usage.errors.allStatuses') },
  ...COMMON_ERROR_STATUS_CODES.map((c) => ({ value: c, label: String(c) })),
])

const applyErrorFilters = () => {
  errorPage.value = 1
  void loadErrors()
}

let abortController: AbortController | null = null
let chartReqSeq = 0
let statsReqSeq = 0
let modelStatsReqSeq = 0

const formatLocalDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const getLast24HoursRangeDates = () => {
  const end = new Date()
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
  return { start: formatLocalDate(start), end: formatLocalDate(end) }
}

const getGranularityForRange = (start: string, end: string): 'day' | 'hour' => {
  const startTime = new Date(`${start}T00:00:00`).getTime()
  const endTime = new Date(`${end}T00:00:00`).getTime()
  return Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)) <= 1 ? 'hour' : 'day'
}

const defaultRange = getLast24HoursRangeDates()
const startDate = ref(defaultRange.start)
const endDate = ref(defaultRange.end)
const granularity = ref<'day' | 'hour'>(getGranularityForRange(startDate.value, endDate.value))

const modelDistributionMetric = ref<DistributionMetric>('tokens')
const groupDistributionMetric = ref<DistributionMetric>('tokens')
const endpointDistributionMetric = ref<DistributionMetric>('tokens')
const endpointDistributionSource = ref<EndpointSource>('inbound')
const activeTab = ref<'usage' | 'errors'>('usage')
const errorViewEnabled = computed(() => appStore.cachedPublicSettings?.allow_user_view_error_requests ?? false)

const filters = ref<UsageQueryParams>({
  start_date: startDate.value,
  end_date: endDate.value,
  request_type: undefined,
  native_compaction_v2: null,
  billing_type: null,
  billing_mode: null,
})

const pagination = reactive({
  page: 1,
  page_size: getPersistedPageSize(),
  total: 0,
})
const sortState = reactive({
  sort_by: 'created_at',
  sort_order: 'desc' as 'asc' | 'desc',
})

const granularityOptions = computed<SelectOption[]>(() => [
  { value: 'day', label: t('admin.dashboard.day') },
  { value: 'hour', label: t('admin.dashboard.hour') },
])
const requestTypeOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('admin.usage.allTypes') },
  { value: 'ws_v2', label: t('usage.ws') },
  { value: 'live', label: t('usage.live') },
  { value: 'stream', label: t('usage.stream') },
  { value: 'sync', label: t('usage.sync') },
])
const compactionOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('usage.allCompactionTypes') },
  { value: true, label: t('usage.compactionOnly') },
])
// 订阅功能关闭后只剩余额计费，「计费类型」筛选（余额/订阅）失去意义，整块隐藏。
const subscriptionFeatureEnabled = computed(() => resolveFeatureFlag(appStore.cachedPublicSettings, FeatureFlags.subscription))
const billingTypeOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('admin.usage.allBillingTypes') },
  { value: 0, label: t('admin.usage.billingTypeBalance') },
  { value: 1, label: t('admin.usage.billingTypeSubscription') },
])
const billingModeOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('admin.usage.allBillingModes') },
  { value: 'token', label: t('admin.usage.billingModeToken') },
  { value: 'per_request', label: t('admin.usage.billingModePerRequest') },
  { value: 'image', label: t('admin.usage.billingModeImage') },
  { value: 'video', label: t('admin.usage.billingModeVideo') },
])

const apiKeys = ref<ApiKey[]>([])
const groups = ref<Group[]>([])
const modelOptionValues = ref<string[]>([])

const apiKeyOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('usage.allApiKeys') },
  ...apiKeys.value.map((key) => ({ value: key.id, label: key.name })),
])
const groupOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('admin.usage.allGroups') },
  ...groups.value.map((group) => ({ value: group.id, label: group.name })),
])
const modelOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('admin.usage.allModels') },
  ...modelOptionValues.value.map((model) => ({ value: model, label: model })),
])

const normalizedFilters = computed<UsageQueryParams>(() => {
  const requestType = filters.value.request_type
  const legacyStream = requestType ? requestTypeToLegacyStream(requestType) : filters.value.stream
  return {
    ...filters.value,
    start_date: startDate.value,
    end_date: endDate.value,
    stream: legacyStream === null ? undefined : legacyStream,
  }
})

const buildUsageListParams = (page: number, pageSize: number): UsageQueryParams => ({
  page,
  page_size: pageSize,
  ...normalizedFilters.value,
  sort_by: sortState.sort_by,
  sort_order: sortState.sort_order,
})

const loadLogs = async () => {
  abortController?.abort()
  const controller = new AbortController()
  abortController = controller
  loading.value = true
  loadError.value = false
  try {
    const res = await usageAPI.query(buildUsageListParams(pagination.page, pagination.page_size), {
      signal: controller.signal,
    })
    if (!controller.signal.aborted) {
      usageLogs.value = res.items
      pagination.total = res.total
    }
  } catch (error: any) {
    if (error?.name !== 'AbortError' && error?.code !== 'ERR_CANCELED') {
      loadError.value = true
      appStore.showError(t('usage.failedToLoad'))
    }
  } finally {
    if (abortController === controller) loading.value = false
  }
}

const loadStats = async () => {
  const seq = ++statsReqSeq
  statsLoading.value = true
  endpointStatsLoading.value = true
  try {
    const stats = await usageAPI.getStats(normalizedFilters.value)
    if (seq !== statsReqSeq) return
    usageStats.value = stats
    inboundEndpointStats.value = stats.endpoints || []
    upstreamEndpointStats.value = []
    endpointPathStats.value = []
  } catch (error) {
    if (seq !== statsReqSeq) return
    console.error('Failed to load usage stats:', error)
    inboundEndpointStats.value = []
    upstreamEndpointStats.value = []
    endpointPathStats.value = []
  } finally {
    if (seq === statsReqSeq) {
      statsLoading.value = false
      endpointStatsLoading.value = false
    }
  }
}

const loadModelStats = async () => {
  const seq = ++modelStatsReqSeq
  modelStatsLoading.value = true
  try {
    const response = await usageAPI.getDashboardModels({
      ...normalizedFilters.value,
      model_source: 'requested',
    })
    if (seq !== modelStatsReqSeq) return
    requestedModelStats.value = response.models || []
    refreshModelOptions(response.models || [])
  } catch (error) {
    if (seq !== modelStatsReqSeq) return
    console.error('Failed to load model stats:', error)
    requestedModelStats.value = []
  } finally {
    if (seq === modelStatsReqSeq) modelStatsLoading.value = false
  }
}

const loadChartData = async () => {
  const seq = ++chartReqSeq
  chartsLoading.value = true
  try {
    const snapshot = await usageAPI.getDashboardSnapshotV2({
      ...normalizedFilters.value,
      granularity: granularity.value,
      include_trend: true,
      include_model_stats: false,
      include_group_stats: true,
    })
    if (seq !== chartReqSeq) return
    trendData.value = snapshot.trend || []
    groupStats.value = snapshot.groups || []
  } catch (error) {
    if (seq !== chartReqSeq) return
    console.error('Failed to load chart data:', error)
    trendData.value = []
    groupStats.value = []
  } finally {
    if (seq === chartReqSeq) chartsLoading.value = false
  }
}

const refreshModelOptions = (models: ModelStat[]) => {
  const current = filters.value.model
  const set = new Set(modelOptionValues.value)
  models.forEach((item) => {
    if (item.model) set.add(item.model)
  })
  if (current) set.add(current)
  modelOptionValues.value = Array.from(set).sort()
}

const applyFilters = () => {
  pagination.page = 1
  void loadLogs()
  void loadStats()
  void loadModelStats()
  void loadChartData()
  resetErrorRows()
}

const refreshData = () => {
  void loadLogs()
  void loadStats()
  void loadModelStats()
  void loadChartData()
  if (activeTab.value === 'errors') void loadErrors()
}

const resetFilters = () => {
  const range = getLast24HoursRangeDates()
  startDate.value = range.start
  endDate.value = range.end
  filters.value = {
    start_date: range.start,
    end_date: range.end,
    request_type: undefined,
    native_compaction_v2: null,
    billing_type: null,
    billing_mode: null,
  }
  granularity.value = getGranularityForRange(range.start, range.end)
  applyFilters()
  if (activeTab.value === 'errors') {
    errorFilter.value = { model: '', category: '', api_key_id: null, status_code: null }
    applyErrorFilters()
  }
}

const onDateRangeChange = (range: { startDate: string; endDate: string; preset: string | null }) => {
  usageRangePreset.value = range.preset === 'today'
    ? 'today'
    : range.preset === '24h' || range.preset === 'last24Hours'
      ? '24h'
      : range.preset === '7days'
        ? '7d'
        : range.preset === '30days'
          ? '30d'
          : 'custom'
  startDate.value = range.startDate
  endDate.value = range.endDate
  filters.value.start_date = range.startDate
  filters.value.end_date = range.endDate
  granularity.value = getGranularityForRange(range.startDate, range.endDate)
  applyFilters()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  void loadLogs()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.page_size = pageSize
  pagination.page = 1
  void loadLogs()
}

const handleSort = (key: string, order: 'asc' | 'desc') => {
  sortState.sort_by = key
  sortState.sort_order = order
  pagination.page = 1
  void loadLogs()
}

const handleIpGeoBatchFailed = () => {
  appStore.showError(t('usage.ipGeo.batchFailed'))
}

const getRequestTypeExportText = (log: UsageLog): string => {
  const requestType = resolveUsageRequestType(log)
  if (requestType === 'cyber') return 'Cyber'
  if (requestType === 'live') return 'Live'
  if (requestType === 'ws_v2') return 'WS'
  if (requestType === 'stream') return 'Stream'
  if (requestType === 'sync') return 'Sync'
  return 'Unknown'
}

const getDisplayBillingMode = (
  row: Pick<UsageLog, 'billing_mode' | 'image_count'> | null | undefined
): string | null | undefined => resolveDisplayBillingMode(row)

const escapeCSVValue = (value: unknown): string => {
  if (value == null) return ''
  const str = String(value)
  const escaped = str.replace(/"/g, '""')
  if (str === '-') return str
  if (/^[=+\-@\t\r]/.test(str)) return `"\'${escaped}"`
  if (/[,"\n\r]/.test(str)) return `"${escaped}"`
  return str
}

const EXPORT_PAGE_SIZE = 1000
const EXPORT_RATE_LIMIT_MAX_RETRIES = 3
const EXPORT_RATE_LIMIT_MAX_WAIT_SECONDS = 60

// 导出逐页请求计入按用户的重查询限流；429 时按 Retry-After 等待后重试同一页。
const queryExportPage = async (params: UsageQueryParams) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await usageAPI.query(params)
    } catch (error: any) {
      if (error?.status !== 429 || attempt >= EXPORT_RATE_LIMIT_MAX_RETRIES) throw error
      const waitSeconds = Math.min(
        Math.max(error.retry_after_seconds ?? EXPORT_RATE_LIMIT_MAX_WAIT_SECONDS, 1),
        EXPORT_RATE_LIMIT_MAX_WAIT_SECONDS
      )
      appStore.showInfo(t('usage.exportRateLimited', { seconds: waitSeconds }))
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000))
    }
  }
}

const exportToCSV = async () => {
  if (pagination.total === 0) {
    appStore.showWarning(t('usage.noDataToExport'))
    return
  }
  exporting.value = true
  appStore.showInfo(t('usage.preparingExport'))
  try {
    const allLogs: UsageLog[] = []
    const exportParams = buildUsageListParams(1, EXPORT_PAGE_SIZE)
    const totalPages = Math.ceil(pagination.total / EXPORT_PAGE_SIZE)
    for (let page = 1; page <= totalPages; page++) {
      const response = await queryExportPage({ ...exportParams, page })
      allLogs.push(...response.items)
    }
    if (allLogs.length === 0) {
      appStore.showWarning(t('usage.noDataToExport'))
      return
    }
    const headers = [
      'Time',
      'API Key Name',
      'Model',
      'Reasoning Effort',
      'Inbound Endpoint',
      'IP Address',
      'Type',
      'Billing Mode',
      'Input Tokens',
      'Output Tokens',
      'Cache Read Tokens',
      'Cache Creation Tokens',
      'Rate Multiplier',
      'Billed Cost',
      'Original Cost',
      'First Token (ms)',
      'Duration (ms)',
    ]
    const rows = allLogs.map((log) => [
      log.created_at,
      log.api_key?.name || '',
      log.model,
      formatReasoningEffort(log.reasoning_effort),
      log.inbound_endpoint || '',
      log.ip_address || '',
      getRequestTypeExportText(log),
      getBillingModeLabel(getDisplayBillingMode(log), t),
      log.input_tokens,
      log.output_tokens,
      log.cache_read_tokens,
      log.cache_creation_tokens,
      log.rate_multiplier,
      log.actual_cost.toFixed(8),
      log.total_cost.toFixed(8),
      log.first_token_ms ?? '',
      log.duration_ms ?? '',
    ].map(escapeCSVValue))
    const csvContent = [
      headers.map(escapeCSVValue).join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `usage_${exportParams.start_date}_to_${exportParams.end_date}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    appStore.showSuccess(t('usage.exportSuccess'))
  } catch (error) {
    console.error('CSV Export failed:', error)
    appStore.showError(t('usage.exportFailed'))
  } finally {
    exporting.value = false
  }
}

const ALWAYS_VISIBLE = ['created_at']
const DEFAULT_HIDDEN_COLUMNS = ['user_agent']
const HIDDEN_COLUMNS_KEY = 'user-usage-hidden-columns'

const allColumns = computed<Column[]>(() => [
  { key: 'api_key', label: t('usage.apiKeyFilter'), sortable: false },
  { key: 'model', label: t('usage.model'), sortable: true },
  { key: 'reasoning_effort', label: t('usage.reasoningEffort'), sortable: false },
  { key: 'endpoint', label: t('usage.endpoint'), sortable: false },
  { key: 'ip_address', label: 'IP', sortable: false },
  { key: 'group', label: t('admin.usage.group'), sortable: false },
  { key: 'stream', label: t('usage.type'), sortable: false },
  { key: 'billing_mode', label: t('admin.usage.billingMode'), sortable: false },
  { key: 'tokens', label: t('usage.tokens'), sortable: false },
  { key: 'cost', label: t('usage.cost'), sortable: false },
  { key: 'latency', label: t('usage.latency'), sortable: false },
  { key: 'created_at', label: t('usage.time'), sortable: true },
  { key: 'user_agent', label: t('usage.userAgent'), sortable: false },
])

const hiddenColumns = reactive<Set<string>>(new Set())
const toggleableColumns = computed(() => allColumns.value.filter((col) => !ALWAYS_VISIBLE.includes(col.key)))
const visibleColumns = computed(() =>
  allColumns.value.filter((col) => ALWAYS_VISIBLE.includes(col.key) || !hiddenColumns.has(col.key))
)
const isColumnVisible = (key: string) => !hiddenColumns.has(key)
const toggleColumn = (key: string) => {
  if (hiddenColumns.has(key)) hiddenColumns.delete(key)
  else hiddenColumns.add(key)
  localStorage.setItem(HIDDEN_COLUMNS_KEY, JSON.stringify([...hiddenColumns]))
}
const loadSavedColumns = () => {
  try {
    const saved = localStorage.getItem(HIDDEN_COLUMNS_KEY)
    const values = saved ? JSON.parse(saved) as string[] : DEFAULT_HIDDEN_COLUMNS
    values.forEach((key) => hiddenColumns.add(key))
  } catch {
    DEFAULT_HIDDEN_COLUMNS.forEach((key) => hiddenColumns.add(key))
  }
}

// 错误请求 tab 独立列设置(机制同用量列设置,存储互不影响)
const ERR_ALWAYS_VISIBLE = ['status', 'created_at']
const ERR_DEFAULT_HIDDEN_COLUMNS = ['user_agent']
const ERR_HIDDEN_COLUMNS_KEY = 'user-usage-error-hidden-columns'

// key 须与 UserErrorRequestsTable 的 allColumns 一致
const errAllColumns = computed<Column[]>(() => [
  { key: 'key_name', label: t('usage.errors.keyName') },
  { key: 'model', label: t('usage.errors.model') },
  { key: 'endpoint', label: t('usage.errors.endpoint') },
  { key: 'client_ip', label: 'IP' },
  { key: 'group', label: t('admin.usage.group') },
  { key: 'type', label: t('usage.type') },
  { key: 'platform', label: t('usage.errors.platform') },
  { key: 'category', label: t('usage.errors.category') },
  { key: 'status', label: t('usage.errors.status') },
  { key: 'message', label: t('usage.errors.message') },
  { key: 'created_at', label: t('usage.errors.time') },
  { key: 'user_agent', label: t('usage.userAgent') },
])

const errHiddenColumns = reactive<Set<string>>(new Set())
const errToggleableColumns = computed(() =>
  errAllColumns.value.filter((col) => !ERR_ALWAYS_VISIBLE.includes(col.key))
)
const errVisibleColumnKeys = computed(() =>
  errAllColumns.value
    .filter((col) => ERR_ALWAYS_VISIBLE.includes(col.key) || !errHiddenColumns.has(col.key))
    .map((col) => col.key)
)
const isErrColumnVisible = (key: string) => !errHiddenColumns.has(key)
const toggleErrColumn = (key: string) => {
  if (errHiddenColumns.has(key)) errHiddenColumns.delete(key)
  else errHiddenColumns.add(key)
  localStorage.setItem(ERR_HIDDEN_COLUMNS_KEY, JSON.stringify([...errHiddenColumns]))
}
const loadSavedErrColumns = () => {
  try {
    const saved = localStorage.getItem(ERR_HIDDEN_COLUMNS_KEY)
    const values = saved ? (JSON.parse(saved) as string[]) : ERR_DEFAULT_HIDDEN_COLUMNS
    values.forEach((key) => errHiddenColumns.add(key))
  } catch {
    ERR_DEFAULT_HIDDEN_COLUMNS.forEach((key) => errHiddenColumns.add(key))
  }
}

// 列设置下拉按当前 tab 分发
const currentToggleableColumns = computed(() =>
  activeTab.value === 'errors' ? errToggleableColumns.value : toggleableColumns.value
)
const isCurrentColumnVisible = (key: string) =>
  activeTab.value === 'errors' ? isErrColumnVisible(key) : isColumnVisible(key)
const toggleCurrentColumn = (key: string) => {
  if (activeTab.value === 'errors') toggleErrColumn(key)
  else toggleColumn(key)
}

const showColumnDropdown = ref(false)
const columnDropdownRef = ref<HTMLElement | null>(null)
const handleColumnClickOutside = (event: MouseEvent) => {
  if (columnDropdownRef.value && !columnDropdownRef.value.contains(event.target as HTMLElement)) {
    showColumnDropdown.value = false
  }
}

const loadApiKeys = async () => {
  const firstPage = await keysAPI.list(1, 100)
  const keys = [...firstPage.items]
  for (let page = 2; page <= firstPage.pages && keys.length > 0; page++) {
    const response = await keysAPI.list(page, 100)
    if (response.items.length === 0) break
    keys.push(...response.items)
  }
  return keys
}

const loadFilterOptions = async () => {
  try {
    const [keys, availableGroups] = await Promise.all([
      loadApiKeys(),
      userGroupsAPI.getAvailable(),
    ])
    apiKeys.value = keys
    groups.value = availableGroups
  } catch (error) {
    console.error('Failed to load usage filter options:', error)
  }
}

const resetErrorRows = () => {
  errorPage.value = 1
  if (activeTab.value === 'errors') {
    void loadErrors()
  } else {
    errorRows.value = []
    errorTotal.value = 0
  }
}

const loadErrors = async () => {
  errorLoading.value = true
  try {
    const resp = await usageAPI.listMyErrorRequests({
      page: errorPage.value,
      page_size: errorPageSize.value,
      start_date: startDate.value,
      end_date: endDate.value,
      model: (errorFilter.value.model ?? '').trim() || undefined,
      category: errorFilter.value.category || undefined,
      api_key_id: errorFilter.value.api_key_id ?? undefined,
      status_code: errorFilter.value.status_code ?? undefined,
      sort_by: errorSortBy.value,
      sort_order: errorSortOrder.value,
    })
    errorRows.value = resp.items
    errorTotal.value = resp.total
  } catch (error) {
    console.error('[UsageView] loadErrors failed:', error)
    appStore.showError(t('usage.errors.failedToLoad'))
  } finally {
    errorLoading.value = false
  }
}

const onErrorSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
  errorSortBy.value = sortBy
  errorSortOrder.value = sortOrder
  errorPage.value = 1
  void loadErrors()
}

const onErrorPage = (page: number) => {
  errorPage.value = page
  void loadErrors()
}

const onErrorPageSize = (pageSize: number) => {
  errorPageSize.value = pageSize
  errorPage.value = 1
  void loadErrors()
}

const switchToErrors = () => {
  activeTab.value = 'errors'
  if (errorRows.value.length === 0) void loadErrors()
}

onMounted(() => {
  loadSavedColumns()
  loadSavedErrColumns()
  document.addEventListener('click', handleColumnClickOutside)
  void loadFilterOptions()
  refreshData()
})

onUnmounted(() => {
  abortController?.abort()
  document.removeEventListener('click', handleColumnClickOutside)
})

watch(endpointDistributionSource, () => {
  // Endpoint source switching is handled by the chart component using already loaded stats.
})
</script>

<style scoped>
.usage { padding-top: clamp(32px, 5vw, 56px); }
.usage__wrap { display: flex; flex-direction: column; gap: clamp(28px, 4vw, 56px); }
.usage-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px 24px; }
.usage-head__copy { display: flex; flex-direction: column; gap: 10px; max-width: 62ch; }
.usage-head__copy .st-display-2 { margin-top: 2px; }
.usage-head__copy .st-lede { margin-top: 2px; }
.usage-head__pills { display: flex; flex-wrap: wrap; gap: 8px; padding-bottom: 5px; }

.usage-controls { display: flex; flex-direction: column; gap: 12px; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding-top: 18px; border-top: 1px solid var(--st-line); }
.toolbar__granularity { margin-left: auto; }
.toolbar__range { min-width: 0; }
.toolbar__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }

.stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.stat { display: flex; flex-direction: column; gap: 8px; min-width: 0; overflow: hidden; }
.stat--lead { grid-column: 1 / -1; border-color: var(--st-brand-line); background: linear-gradient(150deg, var(--st-brand-soft), transparent 62%), var(--st-bg); }
.stat--lead .st-stat__value { color: var(--st-brand-text); font-size: clamp(2.8rem, 5vw, 4.4rem); letter-spacing: -0.055em; }
.stat__top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.stat__tag { font-size: 0.75rem; color: var(--st-brand-text); white-space: nowrap; }
.stat__hint { font-size: 0.78rem; color: var(--st-ink-3); }
.stats-meta { display: flex; flex-wrap: wrap; gap: 10px 30px; padding-top: 14px; border-top: 1px solid var(--st-line); }
.stats-meta__item { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.stats-meta__value { font-family: var(--st-font-display); font-size: 1.25rem; font-weight: 600; color: var(--st-ink); letter-spacing: -0.02em; }
.stats-meta__hint { font-size: 0.76rem; color: var(--st-ink-3); }

.stats--skeleton { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.stat-skeleton { display: flex; flex-direction: column; gap: 12px; min-height: 120px; }
.stat-skeleton--lead { grid-column: 1 / -1; min-height: 168px; }
.sk-line { display: block; height: 12px; border-radius: 999px; }
.sk-line--sm { width: 38%; }
.sk-line--md { width: 66%; }
.sk-line--lg { width: 56%; height: 30px; }
.sk-line--xl { width: 44%; height: 48px; }

.charts { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px; }
.chart { display: flex; flex-direction: column; gap: 16px; min-width: 0; overflow: hidden; }
.chart--trend, .chart--model, .chart--group, .chart--endpoint { grid-column: span 6; }
.chart__head { display: flex; align-items: flex-start; gap: 12px; }
.chart__idx { padding-top: 3px; font-family: var(--st-font-display); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; color: var(--st-ink-3); }
.chart__copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.chart__copy .st-body { font-size: 0.83rem; }
.chart :deep(.chart-box) { padding: 0; border: 0; background: transparent; min-height: 0; }
.chart :deep(.chart-box__title) { display: none !important; }
.chart :deep(.chart-box__head) { justify-content: flex-end; }
.chart :deep(.chart-line) { height: 244px; }
.chart :deep(.chart-doughnut) { width: 168px; height: 168px; max-width: 168px; }

.logs-sec { padding-bottom: clamp(64px, 8vw, 120px); }
.logs__head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 8px 24px; margin-bottom: 16px; }
.logs__head h2 { margin: 0 0 4px; }
.logs__head .st-body { max-width: 52ch; }
.tabs { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 16px; }
.tabs__tools { display: flex; align-items: center; gap: 8px; margin-left: auto; }

.st-colset { position: relative; }
.st-colset__label { display: none; }
.st-colset__menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  z-index: 30;
  min-width: 190px;
  padding: 6px;
  border-radius: var(--st-r-md);
  border: 1px solid var(--st-line);
  background: var(--st-bg);
  box-shadow: var(--st-shadow-2);
}
.st-colset__item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 36px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: 0.84rem;
  color: var(--st-ink-2);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--st-t) var(--st-ease), color var(--st-t) var(--st-ease);
}
.st-colset__item:hover { background: var(--st-bg-soft); color: var(--st-ink); }

.filters { margin-bottom: 16px; }
.filters__summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 24px; cursor: pointer; list-style: none; }
.filters__summary::-webkit-details-marker { display: none; }
.filters__summary:hover { color: var(--st-ink); }
.filters__summary svg { color: var(--st-ink-3); transition: transform var(--st-t) var(--st-ease); }
.filters[open] .filters__summary svg { transform: rotate(180deg); }
.filters__grid { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 18px; }

.logs { display: flex; flex-direction: column; gap: 26px; }
.day { display: flex; flex-direction: column; gap: 8px; }
.day__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-inline: 4px; font-size: 0.78rem; color: var(--st-ink-3); }
.day__date { font-family: var(--st-font-display); font-weight: 600; font-size: 0.9rem; letter-spacing: -0.01em; color: var(--st-ink); }
.day__sum { display: inline-flex; align-items: baseline; gap: 6px; }
.day__sum-unit { font-size: 0.75rem; }
.day__sum-cost { margin-left: 8px; color: var(--st-ink-2); }
.day__list { border: 1px solid var(--st-line); border-radius: var(--st-r-lg); background: var(--st-bg); overflow: hidden; box-shadow: var(--st-shadow-1); }
.log { grid-template-columns: 62px minmax(0, 1fr) auto 88px; gap: 14px; padding: 14px 16px; transition: background-color var(--st-t) var(--st-ease); }
.log:hover { background: var(--st-bg-soft); }
.log__time { font-size: 0.8rem; color: var(--st-ink-3); }
.log__main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.log__meta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.log__tokens { display: inline-flex; align-items: baseline; gap: 12px; justify-content: flex-end; }
.log__tok { font-size: 0.82rem; color: var(--st-ink-2); }
.log__tok i { margin-left: 3px; font-style: normal; font-size: 0.75rem; color: var(--st-ink-3); }
.log__tok--cache { color: var(--st-ink-3); }
.log__cost { text-align: right; font-size: 0.92rem; font-weight: 600; color: var(--st-ink); }

.logs-skeleton { display: flex; flex-direction: column; gap: 10px; }
.logs-skeleton__row { display: flex; align-items: center; gap: 16px; }
.logs-skeleton__row .sk-line--sm { width: 88px; }
.logs-skeleton__row .sk-line--md { flex: 1; }
.logs-skeleton__row .sk-line--xs { width: 64px; }
.logs__pager { margin-top: 14px; }

.error-state { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
.error-state__mark { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; background: var(--st-danger-soft); color: var(--st-danger); }
.error-state__copy { display: flex; flex-direction: column; gap: 4px; }
.error-state .st-btn { margin-top: 4px; }

.empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; padding-block: clamp(40px, 6vw, 72px); }
.empty__mark { display: grid; place-items: center; width: 58px; height: 58px; margin-bottom: 4px; border-radius: 50%; border: 1px solid var(--st-brand-line); background: var(--st-brand-soft); color: var(--st-brand-text); }
.empty .st-body { max-width: 42ch; }
.empty .st-btn { margin-top: 8px; }
.errors-card { overflow: hidden; padding: 8px; }

.st-pill { font-size: 0.75rem; }

@media (min-width: 720px) {
  .stats { grid-template-columns: 1.35fr 1fr 1fr; }
  .stat--lead { grid-column: auto; }
  .filters__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .st-colset__label { display: inline; }
}
@media (min-width: 1024px) {
  .chart--trend { grid-column: span 6; }
  .chart--model { grid-column: span 6; }
  .chart--group, .chart--endpoint { grid-column: span 3; }
  .logs { gap: 30px; }
  .filters__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 639px) {
  .toolbar { align-items: stretch; }
  .toolbar > .st-seg { display: flex; width: 100%; }
  .toolbar > .st-seg .st-seg__item { flex: 1 1 0; padding-inline: 5px; font-size: 0.75rem; white-space: nowrap; }
  .toolbar__granularity { margin-left: 0; }
  .toolbar__granularity .st-seg { display: flex; }
  .toolbar__actions { width: 100%; }
  .toolbar__actions .st-btn { flex: 1 1 auto; }
  .log { grid-template-columns: 52px minmax(0, 1fr) auto; row-gap: 4px; padding: 14px; }
  .log__tokens { grid-column: 2 / 3; justify-content: flex-start; gap: 10px; }
  .log__cost { grid-column: 3 / 4; grid-row: 1 / 2; }
  .log__time { grid-row: 1 / 2; }
  .log__main { grid-column: 2 / 3; }
  .logs-skeleton__row .sk-line--sm { width: 60px; }
  .logs__head { align-items: flex-start; }
  .tabs__tools { width: 100%; margin-left: 0; justify-content: space-between; }
  .st-seg__item { min-height: 44px; }
  .st-btn { min-height: 44px; }
  .st-colset__item { min-height: 44px; }
  .filters__summary { min-height: 44px; }
  .toolbar__range :deep(.date-picker-trigger) { min-height: 44px; }
  .logs__pager :deep(button), .logs__pager :deep(select) { min-height: 44px; }
  .usage-head__pills { padding-bottom: 0; }
}
</style>
