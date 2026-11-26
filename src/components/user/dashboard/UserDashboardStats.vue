<template>
  <div class="dash-stats">
    <!-- 关键数字：余额是主角 -->
    <div class="dash-stats__grid">
      <article v-if="!isSimple" class="st-card st-card--pad st-card--halo dash-stats__hero">
        <header class="dash-stats__hero-head">
          <p class="st-eyebrow">{{ c('usercore.dash.balance') }}</p>
          <span class="st-pill st-pill--accent st-pill--dot">{{ c('usercore.available') }}</span>
        </header>
        <p class="dash-stats__balance st-num">
          ${{ formatBalance(balance) }}<span class="dash-stats__unit">{{ c('usercore.dash.balanceUnit') }}</span>
        </p>
        <p class="dash-stats__hero-note">{{ c('usercore.dash.balanceNote') }}</p>
        <span class="dash-stats__arc" aria-hidden="true"></span>
      </article>

      <article class="st-card st-card--pad st-card--lift dash-stats__tile">
        <p class="st-stat__label">{{ c('usercore.dash.todayCalls') }}</p>
        <p class="st-stat__value st-num">{{ formatNumber(stats?.today_requests || 0) }}</p>
        <p class="dash-stats__tile-meta">
          {{ c('usercore.total') }} <span class="st-num">{{ formatNumber(stats?.total_requests || 0) }}</span>
        </p>
      </article>

      <article class="st-card st-card--pad st-card--lift dash-stats__tile">
        <p class="st-stat__label">{{ c('usercore.dash.todayTokens') }}</p>
        <p class="st-stat__value st-num">{{ formatTokens(stats?.today_tokens || 0) }}</p>
        <p class="dash-stats__tile-meta">
          {{ c('usercore.dash.tokensInOut', { input: formatTokens(stats?.today_input_tokens || 0), output: formatTokens(stats?.today_output_tokens || 0) }) }}
        </p>
      </article>

      <article class="st-card st-card--pad st-card--lift dash-stats__tile">
        <p class="st-stat__label">{{ c('usercore.dash.totalSpend') }}</p>
        <p class="st-stat__value st-num">
          ${{ formatCost(stats?.total_actual_cost || 0) }}<span class="st-stat__unit">{{ c('usercore.dash.balanceUnit') }}</span>
        </p>
        <p class="dash-stats__tile-meta">
          {{ c('usercore.today') }} <span class="st-num">${{ formatCost(stats?.today_actual_cost || 0) }}</span>
        </p>
      </article>
    </div>

    <!-- 细节条：把剩余指标收进一行，不堆卡片 -->
    <div class="st-card st-card--pad dash-stats__strip">
      <p class="st-rule-title">{{ c('usercore.dash.more') }}</p>
      <dl class="dash-stats__strip-body">
        <div class="dash-stats__cell">
          <dt>{{ c('usercore.dash.keysTitle') }}</dt>
          <dd class="st-num">{{ stats?.active_api_keys || 0 }}<span class="dash-stats__cell-sub">/{{ stats?.total_api_keys || 0 }}</span></dd>
          <p class="dash-stats__cell-meta">
            {{ c('usercore.dash.keysMeta', { active: stats?.active_api_keys || 0, total: stats?.total_api_keys || 0 }) }}
          </p>
        </div>
        <div class="dash-stats__cell">
          <dt>{{ c('usercore.dash.totalTokens') }}</dt>
          <dd class="st-num">{{ formatTokens(stats?.total_tokens || 0) }}</dd>
          <p class="dash-stats__cell-meta">
            {{ c('usercore.dash.tokensInOut', { input: formatTokens(stats?.total_input_tokens || 0), output: formatTokens(stats?.total_output_tokens || 0) }) }}
          </p>
        </div>
        <div class="dash-stats__cell">
          <dt>{{ c('usercore.dash.speed') }}</dt>
          <dd class="st-num">{{ formatTokens(stats?.rpm || 0) }}<span class="dash-stats__cell-sub">RPM</span></dd>
          <p class="dash-stats__cell-meta">
            <span class="st-num">{{ formatTokens(stats?.tpm || 0) }}</span> TPM
          </p>
        </div>
        <div class="dash-stats__cell">
          <dt>{{ c('usercore.dash.latency') }}</dt>
          <dd class="st-num">{{ formatDuration(stats?.average_duration_ms || 0) }}</dd>
          <p class="dash-stats__cell-meta">
            {{ c('usercore.dash.tokensCache', { cache: formatTokens((stats?.total_cache_creation_tokens || 0) + (stats?.total_cache_read_tokens || 0)) }) }}
          </p>
        </div>
      </dl>
    </div>

    <!-- 按平台拆开 -->
    <section v-if="!isSimple && platformCards.length > 0" class="dash-stats__platform">
      <header class="dash-stats__section-head">
        <div>
          <p class="st-eyebrow">{{ t('dashboard.platformBreakdown') }}</p>
          <h2 class="st-display-3 dash-stats__section-title">{{ c('usercore.dash.platformTitle') }}</h2>
          <p class="st-body dash-stats__section-lede">{{ c('usercore.dash.platformLede') }}</p>
        </div>
        <span class="st-pill">{{ t('dashboard.platformCount', { count: platformCount }) }}</span>
      </header>

      <div class="dash-stats__platform-grid">
        <article
          v-for="item in platformCards"
          :key="item.platform"
          data-testid="platform-card"
          :data-platform="item.platform"
          class="st-card st-card--pad st-card--lift dash-stats__plat"
          :class="{ 'dash-stats__plat--other': item.isOther }"
        >
          <header class="dash-stats__plat-head">
            <span class="dash-stats__plat-name">
              {{ item.isOther ? c('usercore.dash.platformOther') : platformLabel(item.platform) }}
            </span>
            <span class="dash-stats__plat-cost st-num" :title="t('dashboard.actual')">
              ${{ formatCost(item.total_actual_cost) }}
            </span>
          </header>

          <dl class="dash-stats__plat-rows">
            <div>
              <dt>{{ t('dashboard.todayCost') }}</dt>
              <dd class="st-num">${{ formatCost(item.today_actual_cost) }}</dd>
            </div>
            <div>
              <dt>{{ t('dashboard.requests') }}</dt>
              <dd class="st-num">{{ item.total_requests > 0 ? formatNumber(item.total_requests) : '-' }}</dd>
            </div>
            <div>
              <dt>{{ t('dashboard.tokens') }}</dt>
              <dd class="st-num">{{ item.total_tokens > 0 ? formatTokens(item.total_tokens) : '-' }}</dd>
            </div>
          </dl>

          <!-- 配额：仅在配置了限额时出现 -->
          <div v-if="hasAnyLimit(item.quota) && !item.isOther" class="dash-stats__quota">
            <p class="dash-stats__quota-title">{{ t('dashboard.platformQuota.title') }}</p>
            <template v-for="w in (['daily', 'weekly', 'monthly'] as const)" :key="w">
              <div v-if="quotaVal(item.quota, `${w}_limit_usd`) != null" class="dash-stats__quota-row">
                <!-- limit=0：完全禁用 -->
                <template v-if="(quotaVal(item.quota, `${w}_limit_usd`) as number) === 0">
                  <div class="dash-stats__quota-line">
                    <span class="dash-stats__quota-label">{{ t(`dashboard.platformQuota.${w}`) }}</span>
                    <span class="dash-stats__quota-disabled">{{ t('dashboard.platformQuota.disabled') }}</span>
                  </div>
                  <div class="dash-stats__bar"><span class="dash-stats__bar-fill dash-stats__bar-fill--off"></span></div>
                </template>
                <template v-else>
                  <div class="dash-stats__quota-line">
                    <span class="dash-stats__quota-label">{{ t(`dashboard.platformQuota.${w}`) }}</span>
                    <span class="dash-stats__quota-value st-num">
                      ${{ formatUsd((quotaVal(item.quota, `${w}_usage_usd`) as number) ?? 0) }} / ${{ formatUsd(quotaVal(item.quota, `${w}_limit_usd`) as number) }}
                    </span>
                  </div>
                  <div class="dash-stats__bar">
                    <span
                      class="dash-stats__bar-fill"
                      :class="quotaBarClass(calcPercent((quotaVal(item.quota, `${w}_usage_usd`) as number) ?? 0, quotaVal(item.quota, `${w}_limit_usd`) as number))"
                      :style="{ width: calcPercent((quotaVal(item.quota, `${w}_usage_usd`) as number) ?? 0, quotaVal(item.quota, `${w}_limit_usd`) as number) + '%' }"
                    ></span>
                  </div>
                  <p v-if="quotaVal(item.quota, `${w}_window_resets_at`)" class="dash-stats__quota-reset">
                    {{ t('dashboard.platformQuota.resetsAt', { time: formatResetTime(quotaVal(item.quota, `${w}_window_resets_at`) as string) }) }}
                  </p>
                </template>
              </div>
            </template>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PlatformDashboardStats, UserDashboardStats as UserStatsType } from '@/api/usage'
import type { PlatformQuotaItem } from '@/types'
import { useUserCoreCopy } from '@/composables/copy/userCore'

interface FusedPlatformCard {
  platform: string
  total_actual_cost: number
  today_actual_cost: number
  total_requests: number
  total_tokens: number
  isOther?: boolean
  quota?: PlatformQuotaItem
}

const props = defineProps<{
  stats: UserStatsType
  balance: number
  isSimple: boolean
  platformQuotas?: PlatformQuotaItem[] | null
}>()
const { t } = useI18n()
const { c } = useUserCoreCopy()

const PLATFORM_LABELS: Record<string, string> = {
  anthropic: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
  antigravity: 'Antigravity',
  grok: 'Grok',
  kimi: 'Kimi',
  zhipu: 'Zhipu GLM',
  deepseek: 'DeepSeek',
  minimax: 'MiniMax',
  typesafe: 'TypeSafe / Jev',
}

const platformLabel = (p: string) => PLATFORM_LABELS[p] ?? p

// 处理"各平台之和 < 总值"的差值：后端按平台聚合时过滤了无法归属平台的行
// （group 与 account 都缺 platform）。这里把差值作为"其他"卡片显式展示，
// 避免关键数字与平台拆分加总对不上、用户困惑。
const OTHER_THRESHOLD = 0.0001
const platformCards = computed<FusedPlatformCard[]>(() => {
  const byPlat = new Map<string, PlatformDashboardStats>()
  for (const item of props.stats?.by_platform ?? []) byPlat.set(item.platform, item)

  const byQuota = new Map<string, PlatformQuotaItem>()
  for (const q of props.platformQuotas ?? []) byQuota.set(q.platform, q)

  const platforms = new Set<string>(byPlat.keys())
  for (const [platform, q] of byQuota) {
    if (hasAnyLimit(q)) platforms.add(platform)
  }

  const PLATFORM_ORDER = ['anthropic', 'openai', 'gemini', 'antigravity', 'grok', 'typesafe']
  const cards: FusedPlatformCard[] = []

  for (const p of platforms) {
    const stat = byPlat.get(p)
    cards.push({
      platform: p,
      total_actual_cost: stat?.total_actual_cost ?? 0,
      today_actual_cost: stat?.today_actual_cost ?? 0,
      total_requests: stat?.total_requests ?? 0,
      total_tokens: stat?.total_tokens ?? 0,
      quota: byQuota.get(p),
    })
  }

  cards.sort((a, b) => {
    const ai = PLATFORM_ORDER.indexOf(a.platform)
    const bi = PLATFORM_ORDER.indexOf(b.platform)
    if (ai === -1 && bi === -1) return a.platform.localeCompare(b.platform)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  const total = props.stats?.total_actual_cost ?? 0
  const today = props.stats?.today_actual_cost ?? 0
  const sumTotal = cards.reduce((s, c) => s + c.total_actual_cost, 0)
  const sumToday = cards.reduce((s, c) => s + c.today_actual_cost, 0)
  const diffTotal = Math.max(0, total - sumTotal)
  const diffToday = Math.max(0, today - sumToday)

  if (diffTotal > OTHER_THRESHOLD || diffToday > OTHER_THRESHOLD) {
    cards.push({
      platform: '__other__',
      total_actual_cost: diffTotal,
      today_actual_cost: diffToday,
      total_requests: 0,
      total_tokens: 0,
      isOther: true,
    })
  }

  return cards
})

// 标题右侧的平台计数 = 实际渲染的平台卡片数，不含"其他"差额卡。
const platformCount = computed(() => platformCards.value.filter((c) => !c.isOther).length)

type QuotaWindow = 'daily' | 'weekly' | 'monthly'
type QuotaField = `${QuotaWindow}_limit_usd` | `${QuotaWindow}_usage_usd` | `${QuotaWindow}_window_resets_at`

function quotaVal(q: PlatformQuotaItem | undefined, key: QuotaField): PlatformQuotaItem[QuotaField] {
  return q?.[key]
}

function hasAnyLimit(q: PlatformQuotaItem | undefined): boolean {
  if (!q) return false
  return q.daily_limit_usd != null || q.weekly_limit_usd != null || q.monthly_limit_usd != null
}

function calcPercent(usage: number, limit: number): number {
  if (!limit || limit <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((usage / limit) * 100)))
}

function quotaBarClass(p: number): string {
  if (p >= 95) return 'dash-stats__bar-fill--danger'
  if (p >= 75) return 'dash-stats__bar-fill--warn'
  return 'dash-stats__bar-fill--ok'
}

// 与 formatBalance 一致使用 Intl.NumberFormat 做半偶舍入，避免 toFixed 在不同 JS 引擎
// 下偶发截断而非四舍五入（与后端展示精度不一致）。
const usdFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '0.00'
  return usdFormatter.format(n)
}

function formatResetTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const formatBalance = (b: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(b)

const formatNumber = (n: number) => n.toLocaleString()
const formatCost = (c: number) => c.toFixed(4)
const formatTokens = (t: number) => {
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)}M`
  if (t >= 1000) return `${(t / 1000).toFixed(1)}K`
  return t.toString()
}
const formatDuration = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(0)}ms`
</script>

<style scoped>
.dash-stats { display: flex; flex-direction: column; gap: clamp(18px, 2.4vw, 28px); }

/* 关键数字 -------------------------------------------------------------- */
.dash-stats__grid { display: grid; grid-template-columns: 1fr; gap: 14px; }

.dash-stats__hero {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 208px;
  background: linear-gradient(150deg, color-mix(in srgb, var(--st-brand) 8%, var(--st-bg)), var(--st-bg) 62%);
}

.dash-stats__hero-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

.dash-stats__balance {
  font-family: var(--st-font-display);
  font-size: clamp(2.9rem, 5.4vw, 4.2rem);
  line-height: 0.95;
  font-weight: 600;
  letter-spacing: -0.04em;
  color: var(--st-ink);
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 4px;
}

.dash-stats__unit {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--st-ink-3);
}

.dash-stats__hero-note {
  font-size: 0.84rem;
  line-height: 1.6;
  color: var(--st-ink-3);
  max-width: 32ch;
  margin-top: auto;
}

.dash-stats__arc {
  position: absolute;
  right: -70px;
  bottom: -110px;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  border: 1px solid var(--st-brand-line);
  box-shadow: inset 0 0 0 26px color-mix(in srgb, var(--st-brand) 6%, transparent);
  pointer-events: none;
}

.dash-stats__tile { display: flex; flex-direction: column; gap: 8px; justify-content: flex-start; }
.dash-stats__tile .st-stat__value { font-size: clamp(1.7rem, 2.4vw, 2.1rem); }
.dash-stats__tile-meta { font-size: 0.78rem; color: var(--st-ink-3); margin-top: auto; }

/* 细节条 -------------------------------------------------------------- */
.dash-stats__strip { display: flex; flex-direction: column; gap: 14px; }
.dash-stats__strip-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}
.dash-stats__cell { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.dash-stats__cell dt { font-size: 0.76rem; color: var(--st-ink-3); letter-spacing: 0.02em; }
.dash-stats__cell dd {
  font-family: var(--st-font-display);
  font-size: 1.18rem;
  font-weight: 600;
  color: var(--st-ink);
  letter-spacing: -0.02em;
}
.dash-stats__cell-sub { font-size: 0.72rem; font-weight: 500; color: var(--st-ink-3); margin-left: 3px; }
.dash-stats__cell-meta { font-size: 0.72rem; color: var(--st-ink-3); }

/* 平台 -------------------------------------------------------------- */
.dash-stats__platform { display: flex; flex-direction: column; gap: 18px; }
.dash-stats__section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.dash-stats__section-title { margin-top: 10px; }
.dash-stats__section-lede { margin-top: 8px; font-size: 0.9rem; max-width: 46ch; }
.dash-stats__platform-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }

.dash-stats__plat { display: flex; flex-direction: column; gap: 12px; }
.dash-stats__plat--other { border-style: dashed; background: color-mix(in srgb, var(--st-bg) 70%, var(--st-bg-sink)); }
.dash-stats__plat-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.dash-stats__plat-name { font-size: 0.98rem; font-weight: 600; color: var(--st-ink); letter-spacing: -0.01em; }
.dash-stats__plat-cost { font-size: 0.98rem; font-weight: 600; color: var(--st-brand-text); }

.dash-stats__plat-rows { display: flex; flex-direction: column; gap: 6px; }
.dash-stats__plat-rows > div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.dash-stats__plat-rows dt { font-size: 0.76rem; color: var(--st-ink-3); }
.dash-stats__plat-rows dd { font-size: 0.84rem; color: var(--st-ink-2); }

.dash-stats__quota { display: flex; flex-direction: column; gap: 8px; padding-top: 10px; border-top: 1px solid var(--st-line); }
.dash-stats__quota-title { font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--st-ink-3); }
.dash-stats__quota-row { display: flex; flex-direction: column; gap: 4px; }
.dash-stats__quota-line { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.dash-stats__quota-label { font-size: 0.76rem; color: var(--st-ink-2); }
.dash-stats__quota-value { font-size: 0.76rem; color: var(--st-ink); }
.dash-stats__quota-disabled { font-size: 0.76rem; color: var(--st-danger); }
.dash-stats__quota-reset { font-size: 0.68rem; color: var(--st-ink-3); }
.dash-stats__bar { height: 4px; border-radius: 999px; background: var(--st-bg-sink); overflow: hidden; }
.dash-stats__bar-fill { display: block; height: 100%; border-radius: 999px; background: var(--st-brand); transition: width var(--st-t) var(--st-ease); }
.dash-stats__bar-fill--ok { background: var(--st-brand); }
.dash-stats__bar-fill--warn { background: var(--st-warn); }
.dash-stats__bar-fill--danger, .dash-stats__bar-fill--off { background: var(--st-danger); }

@media (min-width: 720px) {
  .dash-stats__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dash-stats__strip-body { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .dash-stats__platform-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .dash-stats__grid { grid-template-columns: 1.35fr 1fr 1fr 1fr; }
  .dash-stats__platform-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>