<template>
  <UserShell>
    <section class="st-section ku">
      <div class="st-shell ku__wrap">
        <header class="ku-head">
          <h1 class="st-display-2 st-reveal">{{ t('keyUsage.title') }}</h1>
          <p class="st-lede st-reveal" style="--i: 1">{{ t('keyUsage.subtitle') }}</p>
        </header>

        <div class="st-card st-card--pad st-card--halo ku-query st-reveal" style="--i: 2">
          <form class="ku-form" @submit.prevent="queryKey">
            <div class="ku-field">
              <span class="ku-field__icon"><Icon name="lock" size="md" /></span>
              <input
                v-model="apiKey"
                :type="keyVisible ? 'text' : 'password'"
                :placeholder="t('keyUsage.placeholder')"
                class="st-input ku-input"
                autocomplete="off"
                spellcheck="false"
                @keydown.enter="queryKey"
              />
              <button
                type="button"
                class="ku-eye"
                :aria-label="keyVisible ? 'Hide key' : 'Show key'"
                @click="keyVisible = !keyVisible"
              >
                <Icon :name="keyVisible ? 'eyeOff' : 'eye'" size="sm" />
              </button>
            </div>
            <button type="submit" :disabled="isQuerying" class="st-btn st-btn--primary st-btn--lg ku-submit">
              <span v-if="isQuerying" class="ku-spin"></span>
              <Icon v-else name="search" size="sm" />
              {{ isQuerying ? t('keyUsage.querying') : t('keyUsage.query') }}
            </button>
          </form>
          <p class="ku-hint">{{ t('keyUsage.privacyNote') }}</p>

          <div v-if="showDatePicker" class="ku-range">
            <div class="st-seg">
              <button
                v-for="range in dateRanges"
                :key="range.key"
                type="button"
                class="st-seg__item"
                :class="{ 'st-seg__item--active': currentRange === range.key }"
                @click="setDateRange(range.key)"
              >
                {{ range.label }}
              </button>
            </div>
            <div v-if="currentRange === 'custom'" class="ku-range__custom">
              <input v-model="customStartDate" type="date" class="st-input ku-date" />
              <span class="ku-range__sep">—</span>
              <input v-model="customEndDate" type="date" class="st-input ku-date" />
              <button type="button" class="st-btn st-btn--primary st-btn--sm" @click="queryKey">{{ t('keyUsage.apply') }}</button>
            </div>
          </div>
        </div>

        <div v-if="showResults" class="ku-results">
          <div v-if="showLoading" class="ku-skeleton">
            <div class="st-skeleton ku-sk-ring"></div>
            <div class="st-skeleton ku-sk-ring"></div>
            <div class="st-skeleton ku-sk-block"></div>
          </div>

          <template v-else-if="resultData">
            <div v-if="statusInfo" class="ku-status st-reveal">
              <span class="st-pill st-pill--dot" :class="statusInfo.isActive ? 'st-pill--ok' : 'st-pill--danger'">
                {{ statusInfo.label }}
              </span>
              <span class="st-pill">{{ statusInfo.statusText }}</span>
            </div>

            <div v-if="ringItems.length > 0" :class="ringGridClass">
              <article
                v-for="(ring, i) in ringItems"
                :key="i"
                class="st-card st-card--pad st-card--lift ku-ring-card st-reveal"
                :style="{ '--i': i + 1 }"
              >
                <header class="ku-ring-card__head">
                  <h2 class="st-eyebrow">{{ ring.title }}</h2>
                  <Icon
                    :name="ring.iconType === 'clock' ? 'clock' : ring.iconType === 'calendar' ? 'calendar' : 'dollar'"
                    size="sm"
                    class="st-muted"
                  />
                </header>
                <div class="ku-ring-wrap">
                  <svg class="ku-ring" viewBox="0 0 160 160" aria-hidden="true">
                    <circle cx="80" cy="80" r="68" fill="none" :stroke="ringTrackColor" stroke-width="10" />
                    <circle
                      class="progress-ring"
                      cx="80"
                      cy="80"
                      r="68"
                      fill="none"
                      :stroke="'url(#ring-grad-' + i + ')'"
                      stroke-width="10"
                      stroke-linecap="round"
                      :stroke-dasharray="CIRCUMFERENCE.toFixed(2)"
                      :stroke-dashoffset="getRingOffset(ring)"
                    />
                    <defs>
                      <linearGradient :id="'ring-grad-' + i" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" :stop-color="RING_GRADIENTS[i % 4].from" />
                        <stop offset="100%" :stop-color="RING_GRADIENTS[i % 4].to" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div class="ku-ring-center">
                    <template v-if="ring.isBalance">
                      <span class="st-stat__value ku-ring-amount" :style="{ color: RING_GRADIENTS[i % 4].from }">
                        {{ ring.amount }}
                      </span>
                    </template>
                    <template v-else>
                      <span class="st-stat__value ku-ring-pct">
                        {{ displayPcts[i] ?? 0 }}<span class="st-stat__unit">%</span>
                      </span>
                      <span class="ku-ring-caption">{{ t('keyUsage.used') }}</span>
                      <span class="ku-ring-amount-sm st-num" :style="{ color: RING_GRADIENTS[i % 4].from }">{{ ring.amount }}</span>
                      <span v-if="ring.resetAt && formatResetTime(ring.resetAt)" class="ku-ring-reset st-num">
                        ⟳ {{ formatResetTime(ring.resetAt) }}
                      </span>
                    </template>
                  </div>
                </div>
              </article>
            </div>

            <section v-if="detailRows.length > 0" class="st-card ku-card st-reveal">
              <header class="ku-card__head">
                <h2 class="st-display-4">{{ t('keyUsage.detailInfo') }}</h2>
              </header>
              <div class="st-list">
                <div v-for="(row, i) in detailRows" :key="i" class="st-row ku-row">
                  <span class="ku-row__label">{{ row.label }}</span>
                  <span class="ku-row__val st-num" :class="row.valueClass">{{ row.value }}</span>
                </div>
              </div>
            </section>

            <section v-if="usageStatCells.length > 0" class="st-card ku-card st-reveal">
              <header class="ku-card__head">
                <h2 class="st-display-4">{{ t('keyUsage.tokenStats') }}</h2>
              </header>
              <div class="ku-stats">
                <div v-for="(cell, i) in usageStatCells" :key="i" class="ku-stat st-stat">
                  <span class="st-stat__label">{{ cell.label }}</span>
                  <span class="st-stat__value ku-stat__value st-num">{{ cell.value }}</span>
                </div>
              </div>
            </section>

            <section v-if="showDailyUsage" class="st-card ku-card st-reveal">
              <header class="ku-card__head ku-card__head--row">
                <h2 class="st-display-4">{{ t('keyUsage.dailyDetail') }}</h2>
                <div class="st-seg">
                  <button
                    v-for="option in dailyUsageOptions"
                    :key="option.value"
                    type="button"
                    class="st-seg__item"
                    :class="{ 'st-seg__item--active': dailyUsageDays === option.value }"
                    @click="setDailyUsageDays(option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </header>
              <div v-if="dailyUsageRows.length > 0" class="st-list">
                <div class="st-row ku-day ku-day--head">
                  <span>{{ t('keyUsage.date') }}</span>
                  <span>{{ t('keyUsage.cost') }}</span>
                </div>
                <div v-for="row in dailyUsageRows" :key="row.date" class="st-row ku-day">
                  <div class="ku-day__top">
                    <span class="ku-day__date st-num">{{ row.date }}</span>
                    <span class="ku-day__cost st-num">{{ usd(row.actual_cost != null ? row.actual_cost : row.cost) }}</span>
                  </div>
                  <div class="ku-day__grid">
                    <span class="ku-cell"><i>{{ t('keyUsage.requests') }}</i><b class="st-num">{{ fmtNum(row.requests) }}</b></span>
                    <span class="ku-cell"><i>{{ t('keyUsage.inputTokens') }}</i><b class="st-num">{{ fmtNum(row.input_tokens) }}</b></span>
                    <span class="ku-cell"><i>{{ t('keyUsage.outputTokens') }}</i><b class="st-num">{{ fmtNum(row.output_tokens) }}</b></span>
                    <span class="ku-cell"><i>{{ t('keyUsage.cacheReadTokens') }}</i><b class="st-num">{{ fmtNum(row.cache_read_tokens) }}</b></span>
                    <span class="ku-cell"><i>{{ t('keyUsage.cacheWriteTokens') }}</i><b class="st-num">{{ fmtNum(row.cache_write_tokens) }}</b></span>
                    <span class="ku-cell"><i>{{ t('keyUsage.totalTokens') }}</i><b class="st-num">{{ fmtNum(row.total_tokens) }}</b></span>
                  </div>
                </div>
              </div>
              <p v-else class="ku-empty">{{ t('keyUsage.noDailyUsage') }}</p>
            </section>

            <section v-if="modelStats.length > 0" class="st-card ku-card st-reveal">
              <header class="ku-card__head">
                <h2 class="st-display-4">{{ t('keyUsage.modelStats') }}</h2>
              </header>
              <div class="st-list">
                <div v-for="(m, i) in modelStats" :key="i" class="st-row ku-day">
                  <div class="ku-day__top">
                    <span class="ku-day__date">{{ m.model || '-' }}</span>
                    <span class="ku-day__cost st-num">{{ usd(m.actual_cost != null ? m.actual_cost : m.cost) }}</span>
                  </div>
                  <div class="ku-day__grid ku-day__grid--model">
                    <span class="ku-cell"><i>{{ t('keyUsage.requests') }}</i><b class="st-num">{{ fmtNum(m.requests) }}</b></span>
                    <span class="ku-cell"><i>{{ t('keyUsage.inputTokens') }}</i><b class="st-num">{{ fmtNum(m.input_tokens) }}</b></span>
                    <span class="ku-cell"><i>{{ t('keyUsage.outputTokens') }}</i><b class="st-num">{{ fmtNum(m.output_tokens) }}</b></span>
                    <span class="ku-cell"><i>{{ t('keyUsage.cacheCreationTokens') }}</i><b class="st-num">{{ fmtNum(m.cache_creation_tokens) }}</b></span>
                    <span class="ku-cell"><i>{{ t('keyUsage.cacheReadTokens') }}</i><b class="st-num">{{ fmtNum(m.cache_read_tokens) }}</b></span>
                    <span class="ku-cell"><i>{{ t('keyUsage.totalTokens') }}</i><b class="st-num">{{ fmtNum(m.total_tokens) }}</b></span>
                  </div>
                </div>
              </div>
            </section>
          </template>
        </div>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'
import { FeatureFlags, resolveFeatureFlag } from '@/utils/featureFlags'
import Icon from '@/components/icons/Icon.vue'
import { buildGatewayUrl } from '@/api/client'
import { formatDateLocalInput } from '@/utils/format'

const { t, locale } = useI18n()
const appStore = useAppStore()
const subscriptionFeatureEnabled = computed(() => resolveFeatureFlag(appStore.cachedPublicSettings, FeatureFlags.subscription))

// ==================== Key Query State ====================

const apiKey = ref('')
const keyVisible = ref(false)
const isQuerying = ref(false)
const showResults = ref(false)
const showLoading = ref(false)
const showDatePicker = ref(false)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resultData = ref<any>(null)
const now = ref(new Date())
let resetTimer: ReturnType<typeof setInterval> | null = null

// ==================== Date Range State ====================

type DateRangeKey = 'today' | '7d' | '30d' | 'custom'
const currentRange = ref<DateRangeKey>('today')
const customStartDate = ref('')
const customEndDate = ref('')
const dailyUsageDays = ref<7 | 30 | 90>(30)

const dateRanges = computed(() => [
  { key: 'today' as const, label: t('keyUsage.dateRangeToday') },
  { key: '7d' as const, label: t('keyUsage.dateRange7d') },
  { key: '30d' as const, label: t('keyUsage.dateRange30d') },
  { key: 'custom' as const, label: t('keyUsage.dateRangeCustom') },
])

const dailyUsageOptions = computed(() => [
  { value: 7 as const, label: t('keyUsage.dateRange7d') },
  { value: 30 as const, label: t('keyUsage.dateRange30d') },
  { value: 90 as const, label: t('keyUsage.dateRange90d') },
])

function setDateRange(key: DateRangeKey) {
  currentRange.value = key
  if (key !== 'custom') {
    queryKey()
  }
}

function getDateParams(): string {
  const now = new Date()
  const params = new URLSearchParams()

  if (currentRange.value === 'custom') {
    if (customStartDate.value && customEndDate.value) {
      params.set('start_date', customStartDate.value)
      params.set('end_date', customEndDate.value)
    }
  } else {
    const end = formatDateLocalInput(now)
    let start: string
    switch (currentRange.value) {
      case 'today': start = end; break
      case '7d': start = formatDateLocalInput(new Date(now.getTime() - 7 * 86400000)); break
      case '30d': start = formatDateLocalInput(new Date(now.getTime() - 30 * 86400000)); break
      default: start = formatDateLocalInput(new Date(now.getTime() - 30 * 86400000))
    }
    params.set('start_date', start)
    params.set('end_date', end)
  }
  params.set('days', String(dailyUsageDays.value))
  params.set('timezone', getBrowserTimezone())
  return params.toString()
}

function setDailyUsageDays(days: 7 | 30 | 90) {
  if (dailyUsageDays.value === days) return
  dailyUsageDays.value = days
  if (resultData.value && apiKey.value.trim()) {
    queryKey()
  }
}

// ==================== Ring Animation ====================

const CIRCUMFERENCE = 2 * Math.PI * 68
const RING_GRADIENTS = [
  { from: 'var(--st-brand)', to: 'var(--st-brand-text)' },
  { from: 'var(--st-brand-text)', to: 'var(--st-brand)' },
  { from: 'var(--st-brand)', to: 'var(--st-ink-2)' },
  { from: 'var(--st-brand-text)', to: 'var(--st-ink-3)' },
]

const ringAnimated = ref(false)
const displayPcts = ref<number[]>([])

const ringTrackColor = 'var(--st-line)'

interface RingItem {
  title: string
  pct: number
  amount: string
  isBalance?: boolean
  iconType: 'clock' | 'calendar' | 'dollar'
  resetAt?: string | null
}

function getRingOffset(ring: RingItem): number {
  if (!ringAnimated.value) return CIRCUMFERENCE
  if (ring.isBalance) return 0
  return CIRCUMFERENCE - (Math.min(ring.pct, 100) / 100) * CIRCUMFERENCE
}

function triggerRingAnimation(items: RingItem[]) {
  ringAnimated.value = false
  displayPcts.value = items.map(() => 0)

  nextTick(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        ringAnimated.value = true

        // Animate percentage numbers
        const duration = 1000
        const startTime = performance.now()
        const targets = items.map(item => item.isBalance ? 0 : item.pct)

        function tick() {
          const elapsed = performance.now() - startTime
          const p = Math.min(elapsed / duration, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          displayPcts.value = targets.map(target => Math.round(ease * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }, 50)
    })
  })
}

// ==================== Computed Data ====================

const statusInfo = computed(() => {
  const data = resultData.value
  if (!data) return null

  if (data.mode === 'quota_limited') {
    const isValid = data.isValid !== false
    const statusMap: Record<string, string> = {
      active: 'Active',
      quota_exhausted: 'Quota Exhausted',
      expired: 'Expired',
    }
    return {
      label: t('keyUsage.quotaMode'),
      statusText: statusMap[data.status] || data.status || 'Unknown',
      isActive: isValid && data.status === 'active',
    }
  }

  return {
    label: data.planName || t('keyUsage.walletBalance'),
    statusText: 'Active',
    isActive: true,
  }
})

const ringItems = computed<RingItem[]>(() => {
  const data = resultData.value
  if (!data) return []

  const items: RingItem[] = []

  if (data.mode === 'quota_limited') {
    if (data.quota) {
      const pct = data.quota.limit > 0 ? Math.min(Math.round((data.quota.used / data.quota.limit) * 100), 100) : 0
      items.push({ title: t('keyUsage.totalQuota'), pct, amount: `${usd(data.quota.used)} / ${usd(data.quota.limit)}`, iconType: 'dollar' })
    }
    if (data.rate_limits) {
      const windowLabels: Record<string, string> = { '5h': t('keyUsage.limit5h'), '1d': t('keyUsage.limitDaily'), '7d': t('keyUsage.limit7d') }
      const windowIcons: Record<string, 'clock' | 'calendar'> = { '5h': 'clock', '1d': 'calendar', '7d': 'calendar' }
      for (const rl of data.rate_limits) {
        const pct = rl.limit > 0 ? Math.min(Math.round((rl.used / rl.limit) * 100), 100) : 0
        items.push({
          title: windowLabels[rl.window] || rl.window,
          pct,
          amount: `${usd(rl.used)} / ${usd(rl.limit)}`,
          iconType: windowIcons[rl.window] || 'clock',
          resetAt: rl.reset_at,
        })
      }
    }
  } else {
    if (data.subscription) {
      const sub = data.subscription
      const limits = [
        { label: t('keyUsage.limitDaily'), usage: sub.daily_usage_usd, limit: sub.daily_limit_usd },
        { label: t('keyUsage.limitWeekly'), usage: sub.weekly_usage_usd, limit: sub.weekly_limit_usd },
        { label: t('keyUsage.limitMonthly'), usage: sub.monthly_usage_usd, limit: sub.monthly_limit_usd },
      ]
      for (const l of limits) {
        if (l.limit != null && l.limit > 0) {
          const pct = Math.min(Math.round((l.usage / l.limit) * 100), 100)
          items.push({ title: l.label, pct, amount: `${usd(l.usage)} / ${usd(l.limit)}`, iconType: 'calendar' })
        }
      }
    }
    if (!data.subscription && data.balance != null) {
      items.push({ title: t('keyUsage.walletBalance'), pct: 0, amount: usd(data.balance), isBalance: true, iconType: 'dollar' })
    }
  }

  return items
})

const ringGridClass = computed(() => {
  const len = ringItems.value.length
  if (len === 1) return 'ku-rings ku-rings--one'
  if (len === 2) return 'ku-rings ku-rings--two'
  return 'ku-rings'
})

interface DetailRow {
  iconBg: string
  iconColor: string
  iconSvg: string
  label: string
  value: string
  valueClass: string
}

function getUsageColor(pct: number): string {
  if (pct > 90) return 'ku-tone-danger'
  if (pct > 70) return 'ku-tone-warn'
  return 'ku-tone-ok'
}

const detailRows = computed<DetailRow[]>(() => {
  const data = resultData.value
  if (!data) return []

  const rows: DetailRow[] = []
  const ICON_SHIELD = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
  const ICON_CALENDAR = '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'
  const ICON_DOLLAR = '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'
  const ICON_CHECK = '<polyline points="20 6 9 17 4 12"/>'

  if (data.mode === 'quota_limited') {
    if (data.quota) {
      const remainColor = data.quota.remaining <= 0 ? 'text-rose-500'
        : data.quota.remaining < data.quota.limit * 0.1 ? 'text-amber-500'
        : 'text-emerald-500'
      rows.push({
        iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', iconSvg: ICON_SHIELD,
        label: t('keyUsage.remainingQuota'), value: usd(data.quota.remaining), valueClass: remainColor,
      })
    }
    if (data.expires_at) {
      const daysLeft = data.days_until_expiry
      let expiryStr = formatDate(data.expires_at)
      if (daysLeft != null) {
        expiryStr += daysLeft > 0 ? ` ${t('keyUsage.daysLeft', { days: daysLeft })}` : daysLeft === 0 ? ` ${t('keyUsage.todayExpires')}` : ''
      }
      rows.push({
        iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500', iconSvg: ICON_CALENDAR,
        label: t('keyUsage.expiresAt'), value: expiryStr, valueClass: '',
      })
    }
    if (data.rate_limits) {
      const windowMap: Record<string, string> = { '5h': '5H', '1d': locale.value === 'zh' ? '日' : 'D', '7d': '7D' }
      for (const rl of data.rate_limits) {
        const pct = rl.limit > 0 ? (rl.used / rl.limit) * 100 : 0
        let valueStr = `${usd(rl.used)} / ${usd(rl.limit)}`
        const resetStr = formatResetTime(rl.reset_at)
        if (resetStr) {
          valueStr += ` (⟳ ${resetStr})`
        }
        rows.push({
          iconBg: 'bg-primary-500/10', iconColor: 'text-primary-500', iconSvg: ICON_DOLLAR,
          label: `${t('keyUsage.usedQuota')} (${windowMap[rl.window] || rl.window})`,
          value: valueStr,
          valueClass: getUsageColor(pct),
        })
      }
    }
  } else {
    rows.push({
      iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', iconSvg: ICON_CHECK,
      // 订阅功能关闭后这一行只会是「钱包余额」，标签改用不带「订阅」字样的「计费方式」。
      label: subscriptionFeatureEnabled.value ? t('keyUsage.subscriptionType') : t('keyUsage.billingType'),
      value: data.planName || t('keyUsage.walletBalance'), valueClass: '',
    })

    if (data.subscription) {
      const sub = data.subscription
      if (sub.daily_limit_usd > 0) {
        const pct = (sub.daily_usage_usd / sub.daily_limit_usd) * 100
        rows.push({
          iconBg: 'bg-primary-500/10', iconColor: 'text-primary-500', iconSvg: ICON_DOLLAR,
          label: `${t('keyUsage.usedQuota')} (${locale.value === 'zh' ? '日' : 'D'})`, value: `${usd(sub.daily_usage_usd)} / ${usd(sub.daily_limit_usd)}`, valueClass: getUsageColor(pct),
        })
      }
      if (sub.weekly_limit_usd > 0) {
        const pct = (sub.weekly_usage_usd / sub.weekly_limit_usd) * 100
        rows.push({
          iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-500', iconSvg: ICON_DOLLAR,
          label: `${t('keyUsage.usedQuota')} (${locale.value === 'zh' ? '周' : 'W'})`, value: `${usd(sub.weekly_usage_usd)} / ${usd(sub.weekly_limit_usd)}`, valueClass: getUsageColor(pct),
        })
      }
      if (sub.monthly_limit_usd > 0) {
        const pct = (sub.monthly_usage_usd / sub.monthly_limit_usd) * 100
        rows.push({
          iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', iconSvg: ICON_DOLLAR,
          label: `${t('keyUsage.usedQuota')} (${locale.value === 'zh' ? '月' : 'M'})`, value: `${usd(sub.monthly_usage_usd)} / ${usd(sub.monthly_limit_usd)}`, valueClass: getUsageColor(pct),
        })
      }
      if (sub.expires_at) {
        rows.push({
          iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500', iconSvg: ICON_CALENDAR,
          label: t('keyUsage.subscriptionExpires'), value: formatDate(sub.expires_at), valueClass: '',
        })
      }
    }

    const remainColor = data.remaining != null
      ? (data.remaining <= 0 ? 'text-rose-500' : data.remaining < 10 ? 'text-amber-500' : 'text-emerald-500')
      : ''
    rows.push({
      iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', iconSvg: ICON_SHIELD,
      label: t('keyUsage.remainingQuota'), value: data.remaining != null ? usd(data.remaining) : '-', valueClass: remainColor,
    })
  }

  return rows
})

interface StatCell {
  label: string
  value: string
}

const usageStatCells = computed<StatCell[]>(() => {
  const usage = resultData.value?.usage
  if (!usage) return []

  const today = usage.today || {}
  const total = usage.total || {}

  return [
    { label: t('keyUsage.todayRequests'), value: fmtNum(today.requests) },
    { label: t('keyUsage.todayInputTokens'), value: fmtNum(today.input_tokens) },
    { label: t('keyUsage.todayOutputTokens'), value: fmtNum(today.output_tokens) },
    { label: t('keyUsage.todayTokens'), value: fmtNum(today.total_tokens) },
    { label: t('keyUsage.todayCacheCreation'), value: fmtNum(today.cache_creation_tokens) },
    { label: t('keyUsage.todayCacheRead'), value: fmtNum(today.cache_read_tokens) },
    { label: t('keyUsage.todayCost'), value: usd(today.actual_cost) },
    { label: t('keyUsage.rpmTpm'), value: `${usage.rpm || 0} / ${usage.tpm || 0}` },
    { label: t('keyUsage.totalRequests'), value: fmtNum(total.requests) },
    { label: t('keyUsage.totalInputTokens'), value: fmtNum(total.input_tokens) },
    { label: t('keyUsage.totalOutputTokens'), value: fmtNum(total.output_tokens) },
    { label: t('keyUsage.totalTokensLabel'), value: fmtNum(total.total_tokens) },
    { label: t('keyUsage.totalCacheCreation'), value: fmtNum(total.cache_creation_tokens) },
    { label: t('keyUsage.totalCacheRead'), value: fmtNum(total.cache_read_tokens) },
    { label: t('keyUsage.totalCost'), value: usd(total.actual_cost) },
    { label: t('keyUsage.avgDuration'), value: usage.average_duration_ms ? `${Math.round(usage.average_duration_ms)} ms` : '-' },
  ]
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const modelStats = computed<any[]>(() => resultData.value?.model_stats || [])

interface DailyUsageRow {
  date: string
  requests: number
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
  cost: number
  actual_cost?: number
}

const dailyUsageRows = computed<DailyUsageRow[]>(() => {
  const rows = resultData.value?.daily_usage
  return Array.isArray(rows) ? rows : []
})

const showDailyUsage = computed(() => Boolean(resultData.value && Array.isArray(resultData.value.daily_usage)))

// ==================== Utility Functions ====================

function usd(value: number | null | undefined): string {
  if (value == null || value < 0) return '-'
  return '$' + Number(value).toFixed(2)
}

function fmtNum(val: number | null | undefined): string {
  if (val == null) return '-'
  return val.toLocaleString()
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  const loc = locale.value === 'zh' ? 'zh-CN' : 'en-US'
  return d.toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' })
}

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

// ==================== API Query ====================

async function fetchUsage(key: string) {
  const dateParams = getDateParams()
  const url = buildGatewayUrl('/v1/usage') + (dateParams ? '?' + dateParams : '')
  const res = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + key },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const msg = body?.error?.message || body?.message || `${t('keyUsage.queryFailed')} (${res.status})`
    throw new Error(msg)
  }
  return await res.json()
}

async function queryKey() {
  if (isQuerying.value) return
  const key = apiKey.value.trim()
  if (!key) {
    appStore.showInfo(t('keyUsage.enterApiKey'))
    return
  }

  isQuerying.value = true
  showResults.value = true
  showLoading.value = true
  resultData.value = null

  try {
    const data = await fetchUsage(key)
    resultData.value = data
    showLoading.value = false
    showDatePicker.value = true

    // Trigger ring animations after DOM update
    nextTick(() => {
      triggerRingAnimation(ringItems.value)
    })

    appStore.showSuccess(t('keyUsage.querySuccess'))
  } catch (err) {
    showResults.value = false
    showLoading.value = false
    appStore.showError((err as Error).message || t('keyUsage.queryFailedRetry'))
  } finally {
    isQuerying.value = false
  }
}

// ==================== Lifecycle ====================

function formatResetTime(resetAt: string | null | undefined): string {
  if (!resetAt) return ''
  const diff = new Date(resetAt).getTime() - now.value.getTime()
  if (diff <= 0) return t('keyUsage.resetNow')
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

onMounted(() => {
  if (!appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }
  resetTimer = setInterval(() => { now.value = new Date() }, 60000)
})

onUnmounted(() => {
  if (resetTimer) clearInterval(resetTimer)
})
</script>

<style scoped>
.ku__wrap { display: flex; flex-direction: column; gap: clamp(20px, 3vw, 32px); }
.ku-head { max-width: 60ch; }
.ku-head .st-lede { margin-top: 14px; }

.ku-query { display: flex; flex-direction: column; gap: 14px; max-width: 780px; }
.ku-form { display: flex; align-items: stretch; gap: 10px; }
.ku-field { position: relative; flex: 1; min-width: 0; display: flex; align-items: center; }
.ku-field__icon { position: absolute; left: 15px; display: grid; place-items: center; color: var(--st-ink-3); pointer-events: none; }
.ku-input {
  height: 54px;
  padding-left: 46px;
  padding-right: 48px;
  font-family: var(--st-font-mono);
  font-size: 0.94rem;
  letter-spacing: 0.02em;
}
.ku-eye {
  position: absolute;
  right: 8px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--st-ink-3);
  cursor: pointer;
  transition: background-color var(--st-t) var(--st-ease), color var(--st-t) var(--st-ease);
}
.ku-eye:hover { background: var(--st-bg-soft); color: var(--st-ink); }
.ku-submit { height: 54px; flex-shrink: 0; }
.ku-spin { width: 15px; height: 15px; border-radius: 50%; border: 2px solid currentColor; border-top-color: transparent; animation: ku-spin 0.8s linear infinite; }
@keyframes ku-spin { to { transform: rotate(360deg); } }
.ku-hint { font-size: 0.78rem; line-height: 1.6; color: var(--st-ink-3); }
.ku-range { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding-top: 14px; border-top: 1px solid var(--st-line); }
.ku-range__custom { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.ku-range__sep { color: var(--st-ink-3); }
.ku-date { width: auto; min-width: 138px; padding: 7px 10px; font-size: 0.82rem; }

.ku-results { display: flex; flex-direction: column; gap: 16px; }
.ku-skeleton { display: grid; grid-template-columns: 1fr; gap: 16px; }
.ku-sk-ring { height: 240px; border-radius: var(--st-r-md); }
.ku-sk-block { height: 180px; border-radius: var(--st-r-md); }
.ku-status { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }

.ku-rings { display: grid; grid-template-columns: 1fr; gap: 16px; }
.ku-rings--one, .ku-rings--two { width: 100%; max-width: 620px; margin-inline: auto; }
.ku-ring-card { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.ku-ring-card__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.ku-ring-wrap { position: relative; display: grid; place-items: center; }
.ku-ring { width: min(190px, 72vw); height: auto; }
.progress-ring { transition: stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1); transform: rotate(-90deg); transform-origin: 50% 50%; }
.ku-ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 34px;
  text-align: center;
}
.ku-ring-pct { font-size: clamp(1.7rem, 3vw, 2.2rem); }
.ku-ring-caption { font-size: 0.72rem; color: var(--st-ink-3); }
.ku-ring-amount-sm { font-size: 0.82rem; font-weight: 600; }
.ku-ring-amount { font-size: 1.35rem; }
.ku-ring-reset { font-size: 0.7rem; color: var(--st-ink-3); }

.ku-card { overflow: hidden; }
.ku-card__head { padding: 16px 20px; border-bottom: 1px solid var(--st-line); }
.ku-card__head--row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
.ku-card .st-list { padding-inline: 20px; }
.ku-row { grid-template-columns: minmax(0, 1fr) auto; }
.ku-row__label { min-width: 0; font-size: 0.86rem; color: var(--st-ink-2); }
.ku-row__val { font-size: 0.9rem; font-weight: 600; color: var(--st-ink); text-align: right; }
.ku-tone-danger { color: var(--st-danger); }
.ku-tone-warn { color: var(--st-warn); }
.ku-tone-ok { color: var(--st-ok); }

.ku-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: var(--st-line); }
.ku-stat { gap: 4px; padding: 14px 16px; background: var(--st-bg); }
.ku-stat__value { font-size: 1.15rem; }

.ku-day { display: flex; flex-direction: column; align-items: stretch; gap: 8px; }
.ku-day--head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  padding-block: 9px;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--st-ink-3);
}
.ku-day__top { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.ku-day__date { font-size: 0.88rem; font-weight: 600; color: var(--st-ink); }
.ku-day__cost { font-size: 0.9rem; font-weight: 600; color: var(--st-ink); text-align: right; }
.ku-day__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 16px; }
.ku-cell { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-width: 0; font-size: 0.78rem; }
.ku-cell i { font-style: normal; color: var(--st-ink-3); }
.ku-cell b { font-weight: 500; color: var(--st-ink); }
.ku-empty { padding: 22px 20px; font-size: 0.86rem; color: var(--st-ink-3); }

@media (min-width: 720px) {
  .ku-skeleton { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ku-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .ku-day__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (min-width: 900px) {
  .ku-rings { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ku-rings--one { grid-template-columns: minmax(0, 430px); }
}
@media (max-width: 640px) {
  .ku-form { flex-direction: column; }
  .ku-submit { width: 100%; }
  .ku-day--head { display: none; }
  .ku-query { padding: 18px; }
  .ku-card .st-list { padding-inline: 16px; }
  .ku-card__head { padding: 14px 16px; }
  .ku-date { flex: 1 1 120px; min-width: 0; }
}
</style>
