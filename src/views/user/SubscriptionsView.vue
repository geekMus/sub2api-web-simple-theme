<template>
  <UserShell>
    <section class="st-section plans-sec">
      <div class="st-shell">
        <header class="plans-head">
          <p class="st-eyebrow st-reveal">{{ c('plans.eyebrow') }}</p>
          <h1 class="st-display-2 st-reveal" style="--i: 1">{{ c('plans.title') }}</h1>
          <p class="st-lede st-reveal" style="--i: 2">{{ c('plans.lede') }}</p>
        </header>

        <div v-if="loading" class="subs">
          <div v-for="i in 2" :key="i" class="st-skeleton sk-card"></div>
        </div>

        <div v-else-if="subscriptions.length === 0" class="st-card st-card--pad empty st-reveal" style="--i: 2">
          <span class="empty__mark"><Icon name="creditCard" size="xl" /></span>
          <h2 class="st-display-3">{{ c('plans.emptyTitle') }}</h2>
          <p class="st-body">{{ c('plans.emptyBody') }}</p>
          <RouterLink to="/purchase?tab=subscription" class="st-btn st-btn--primary st-btn--lg">{{ c('plans.emptyCta') }}</RouterLink>
        </div>

        <template v-else>
          <div class="subs">
            <article
              v-for="(subscription, index) in subscriptions"
              :key="subscription.id"
              class="st-card st-card--pad st-card--lift sub st-reveal"
              :class="{ 'st-card--halo': subscription.status === 'active' }"
              :style="{ '--i': index + 1 }"
            >
              <header class="sub__head">
                <div class="sub__id">
                  <h2 class="st-display-3 sub__name">
                    {{ subscription.group?.name || 'Group #' + subscription.group_id }}
                  </h2>
                  <div class="sub__tags">
                    <span class="st-pill">{{ platformLabel(subscription.group?.platform || '') }}</span>
                    <span
                      class="st-pill st-pill--dot"
                      :class="subscription.status === 'active' ? 'st-pill--accent' : 'sub__tag--muted'"
                    >{{ t('userSubscriptions.status.' + subscription.status) }}</span>
                  </div>
                  <p v-if="subscription.group?.description" class="sub__desc">{{ subscription.group.description }}</p>
                </div>
                <div class="sub__rate">
                  <span class="st-stat__label">{{ c('plans.rate') }}</span>
                  <span class="st-stat__value st-num sub__rate-value">×{{ subscription.group?.rate_multiplier ?? 1 }}</span>
                  <span v-if="subscriptionHasPeakRate(subscription)" class="sub__peak">{{ subscriptionPeakRateLabel(subscription) }}</span>
                </div>
              </header>

              <div class="st-list sub__rows">
                <div class="st-row sub__row">
                  <span class="st-row__title">{{ c('plans.expires') }}</span>
                  <span :class="['sub__val', getExpirationTone(subscription.expires_at)]">
                    {{ subscription.expires_at ? formatExpirationDate(subscription.expires_at) : t('userSubscriptions.noExpiration') }}
                  </span>
                </div>

                <div v-if="subscription.group?.daily_limit_usd" class="st-row sub__quota">
                  <span class="sub__quota-head">
                    <span class="st-row__title">{{ t('userSubscriptions.daily') }}</span>
                    <span class="st-row__meta">
                      ${{ (subscription.daily_usage_usd || 0).toFixed(2) }} / ${{ subscription.group.daily_limit_usd.toFixed(2) }}
                      <template v-if="subscription.daily_window_start"> · {{ formatDailyUsageWindow(subscription) }}</template>
                    </span>
                  </span>
                  <span class="bar">
                    <span
                      class="bar__fill"
                      :class="'bar--' + getProgressTone(subscription.daily_usage_usd, subscription.group.daily_limit_usd)"
                      :style="{ width: getProgressWidth(subscription.daily_usage_usd, subscription.group.daily_limit_usd) }"
                    ></span>
                  </span>
                </div>

                <div v-if="subscription.group?.weekly_limit_usd" class="st-row sub__quota">
                  <span class="sub__quota-head">
                    <span class="st-row__title">{{ t('userSubscriptions.weekly') }}</span>
                    <span class="st-row__meta">
                      ${{ (subscription.weekly_usage_usd || 0).toFixed(2) }} / ${{ subscription.group.weekly_limit_usd.toFixed(2) }}
                      <template v-if="subscription.weekly_window_start"> · {{ t('userSubscriptions.resetIn', { time: formatResetTime(subscription.weekly_window_start, 168) }) }}</template>
                    </span>
                  </span>
                  <span class="bar">
                    <span
                      class="bar__fill"
                      :class="'bar--' + getProgressTone(subscription.weekly_usage_usd, subscription.group.weekly_limit_usd)"
                      :style="{ width: getProgressWidth(subscription.weekly_usage_usd, subscription.group.weekly_limit_usd) }"
                    ></span>
                  </span>
                </div>

                <div v-if="subscription.group?.monthly_limit_usd" class="st-row sub__quota">
                  <span class="sub__quota-head">
                    <span class="st-row__title">{{ t('userSubscriptions.monthly') }}</span>
                    <span class="st-row__meta">
                      ${{ (subscription.monthly_usage_usd || 0).toFixed(2) }} / ${{ subscription.group.monthly_limit_usd.toFixed(2) }}
                      <template v-if="subscription.monthly_window_start"> · {{ t('userSubscriptions.resetIn', { time: formatResetTime(subscription.monthly_window_start, 720) }) }}</template>
                    </span>
                  </span>
                  <span class="bar">
                    <span
                      class="bar__fill"
                      :class="'bar--' + getProgressTone(subscription.monthly_usage_usd, subscription.group.monthly_limit_usd)"
                      :style="{ width: getProgressWidth(subscription.monthly_usage_usd, subscription.group.monthly_limit_usd) }"
                    ></span>
                  </span>
                </div>

                <div
                  v-if="!subscription.group?.daily_limit_usd && !subscription.group?.weekly_limit_usd && !subscription.group?.monthly_limit_usd"
                  class="sub__unlimited"
                >
                  <span class="sub__unlimited-mark">∞</span>
                  <span>
                    <span class="sub__unlimited-title">{{ t('userSubscriptions.unlimited') }}</span>
                    <span class="sub__unlimited-body">{{ c('plans.unlimitedHint') }}</span>
                  </span>
                </div>
              </div>

              <footer v-if="subscription.status === 'active'" class="sub__foot">
                <button
                  class="st-btn st-btn--primary st-btn--lg sub__cta"
                  @click="router.push({ path: '/purchase', query: { tab: 'subscription', group: String(subscription.group_id) } })"
                >{{ c('plans.renew') }}</button>
              </footer>
            </article>
          </div>
        </template>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import subscriptionsAPI from '@/api/subscriptions'
import type { UserSubscription } from '@/types'
import Icon from '@/components/icons/Icon.vue'
import UserShell from '@/components/shell/UserShell.vue'
import { useBillingCopy } from '@/composables/copy/billing'
import { formatDateTimeToMinute } from '@/utils/format'
import { hasPeakRate, formatPeakRateWindow, serverTimezoneLabel } from '@/utils/peak-rate'
import { platformLabel } from '@/utils/platformColors'
import {
  getExpirationDateRelation,
  getRemainingDurationParts,
  isOneTimeDailyQuota,
  type RemainingDurationParts
} from '@/utils/subscriptionQuota'

const { t } = useI18n()
const { c } = useBillingCopy()
const router = useRouter()
const appStore = useAppStore()

const subscriptions = ref<UserSubscription[]>([])
const loading = ref(true)

function subscriptionHasPeakRate(subscription: UserSubscription): boolean {
  return hasPeakRate(subscription.group)
}

function subscriptionPeakRateLabel(subscription: UserSubscription): string {
  return formatPeakRateWindow(subscription.group, serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset))
}

async function loadSubscriptions() {
  try {
    loading.value = true
    subscriptions.value = await subscriptionsAPI.getMySubscriptions()
  } catch (error) {
    console.error('Failed to load subscriptions:', error)
    appStore.showError(t('userSubscriptions.failedToLoad'))
  } finally {
    loading.value = false
  }
}

function getExpirationTone(expiresAt: string | null | undefined): string {
  if (!expiresAt) return 'tone-muted'
  const diff = new Date(expiresAt).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (diff <= 0) return 'tone-danger'
  if (days <= 3) return 'tone-danger'
  if (days <= 7) return 'tone-warn'
  return 'tone-ok'
}

function getProgressTone(used: number | undefined, limit: number | null | undefined): string {
  if (!limit || limit === 0) return 'muted'
  const percentage = ((used || 0) / limit) * 100
  if (percentage >= 90) return 'danger'
  if (percentage >= 70) return 'warn'
  return 'ok'
}

function getProgressWidth(used: number | undefined, limit: number | null | undefined): string {
  if (!limit || limit === 0) return '0%'
  const percentage = Math.min(((used || 0) / limit) * 100, 100)
  return `${percentage}%`
}

function formatExpirationDate(expiresAt: string): string {
  const now = new Date()
  const expires = new Date(expiresAt)
  const diff = expires.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  const relation = getExpirationDateRelation(expires, now)

  if (relation === null) return ''

  if (relation === 'expired') {
    return t('userSubscriptions.status.expired')
  }

  const dateStr = formatDateTimeToMinute(expires)

  if (relation === 'today') {
    return `${dateStr} (${t('common.today')})`
  }
  if (relation === 'tomorrow') {
    return `${dateStr} (${t('common.tomorrow')})`
  }

  return t('userSubscriptions.daysRemaining', { days }) + ` (${dateStr})`
}

function formatDurationParts(parts: RemainingDurationParts): string {
  if (parts.days > 0) {
    return `${parts.days}d ${parts.hours}h`
  }

  if (parts.hours > 0) {
    return `${parts.hours}h ${parts.minutes}m`
  }

  return `${parts.minutes}m`
}

function formatDailyUsageWindow(subscription: UserSubscription): string {
  if (isOneTimeDailyQuota(subscription) && subscription.expires_at) {
    const parts = getRemainingDurationParts(subscription.expires_at)
    if (!parts) return t('userSubscriptions.windowNotActive')
    return t('userSubscriptions.quotaEndsIn', { time: formatDurationParts(parts) })
  }

  return t('userSubscriptions.resetIn', {
    time: formatResetTime(subscription.daily_window_start, 24)
  })
}

function formatResetTime(windowStart: string | null, windowHours: number): string {
  if (!windowStart) return t('userSubscriptions.windowNotActive')

  const start = new Date(windowStart)
  const end = new Date(start.getTime() + windowHours * 60 * 60 * 1000)
  const parts = getRemainingDurationParts(end)

  return parts ? formatDurationParts(parts) : t('userSubscriptions.windowNotActive')
}

onMounted(() => {
  loadSubscriptions()
})
</script>

<style scoped>
.plans-sec { padding-bottom: clamp(64px, 8vw, 120px); }
.plans-head { max-width: 62ch; margin-bottom: clamp(28px, 4vw, 48px); }
.plans-head .st-display-2 { margin-top: 0; }
.plans-head .st-lede { margin-top: 14px; }

.subs { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
.sk-card { height: 320px; border-radius: var(--st-r-lg); }

.sub { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.sub__head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 18px; }
.sub__id { display: flex; flex: 1 1 220px; flex-direction: column; gap: 8px; min-width: 0; }
.sub__name { margin: 0; overflow-wrap: anywhere; }
.sub__tags { display: flex; flex-wrap: wrap; gap: 6px; }
.sub__tag--muted { color: var(--st-ink-3); }
.sub__desc { font-size: 0.84rem; color: var(--st-ink-3); line-height: 1.6; }
.sub__rate { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.sub__rate-value { font-size: clamp(2rem, 3vw, 2.6rem); color: var(--st-brand-text); }
.sub__peak { font-size: 0.74rem; color: var(--st-ink-2); text-align: right; }

.sub__rows { border-top: 1px solid var(--st-line); }
.sub__row { grid-template-columns: minmax(0, 1fr) auto; padding: 12px 2px; }
.sub__val { font-size: 0.88rem; text-align: right; color: var(--st-ink); }
.sub__val.tone-danger { color: var(--st-danger); }
.sub__val.tone-warn { color: var(--st-warn); }
.sub__val.tone-ok { color: var(--st-ok); }
.sub__val.tone-muted { color: var(--st-ink-3); }

.sub__quota { display: flex; flex-direction: column; gap: 8px; align-items: stretch; padding: 12px 2px; }
.sub__quota-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px; }
.sub__quota-head .st-row__meta { min-width: 0; text-align: right; }
.bar { display: block; height: 6px; border-radius: 999px; background: var(--st-bg-soft); overflow: hidden; }
.bar__fill { display: block; height: 100%; border-radius: 999px; background: var(--st-brand); transition: width var(--st-t) var(--st-ease); }
.bar--ok { background: var(--st-brand); }
.bar--warn { background: var(--st-warn); }
.bar--danger { background: var(--st-danger); }
.bar--muted { background: var(--st-ink-3); }

.sub__unlimited { display: flex; align-items: flex-start; gap: 14px; padding: 16px 2px 4px; }
.sub__unlimited-mark { font-family: var(--st-font-display); font-size: 2rem; line-height: 1; color: var(--st-brand-text); }
.sub__unlimited-title { display: block; font-size: 0.92rem; font-weight: 600; color: var(--st-ink); }
.sub__unlimited-body { display: block; font-size: 0.8rem; color: var(--st-ink-3); line-height: 1.6; }

.sub__foot { display: flex; padding-top: 4px; }
.sub__cta { width: 100%; }

.empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; padding-block: clamp(48px, 6vw, 76px); }
.empty__mark { display: grid; place-items: center; width: 58px; height: 58px; border-radius: 50%; background: var(--st-brand-soft); color: var(--st-brand-text); }
.empty .st-body { max-width: 44ch; }
.empty .st-btn { margin-top: 8px; }

@media (max-width: 639px) {
  .sub__head { flex-direction: row; align-items: flex-start; gap: 12px; }
  .sub__id { flex: 1 1 0; }
  .sub__rate { flex: 0 0 auto; align-items: flex-end; }
  .sub__rate-value { font-size: 1.9rem; }
  .sub__peak { text-align: right; }
  .sub__row { grid-template-columns: minmax(0, 1fr); row-gap: 2px; }
  .sub__val { text-align: left; }
  .sub__quota-head { flex-direction: column; align-items: flex-start; }
  .sub__quota-head .st-row__meta { text-align: left; }
}
@media (min-width: 900px) {
  .subs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
