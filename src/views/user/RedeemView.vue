<template>
  <UserShell>
    <section class="st-section redeem">
      <div class="st-shell redeem__wrap">
        <header class="redeem__head">
          <p class="st-eyebrow st-reveal">{{ c('redeem.eyebrow') }}</p>
          <h1 class="st-display-2 st-reveal" style="--i: 1">{{ c('redeem.title') }}</h1>
          <p class="st-lede st-reveal" style="--i: 2">{{ c('redeem.lede') }}</p>
        </header>

        <div class="redeem__stage">
          <div class="st-card st-card--halo st-card--lift redeem__card st-reveal" style="--i: 2">
            <div class="redeem__balance">
              <span class="st-stat__label">{{ t('redeem.currentBalance') }}</span>
              <span class="st-stat__value st-num">${{ user?.balance?.toFixed(2) || '0.00' }}</span>
              <span class="redeem__balance-meta">
                {{ t('redeem.concurrency') }} · {{ user?.concurrency || 0 }} {{ t('redeem.requests') }}
              </span>
            </div>

            <form class="redeem__form" @submit.prevent="handleRedeem">
              <div class="redeem__field">
                <Icon name="gift" size="md" class="redeem__icon" />
                <input
                  id="code"
                  ref="redeemInputRef"
                  v-model="redeemCode"
                  type="text"
                  required
                  :placeholder="t('redeem.redeemCodePlaceholder')"
                  :aria-label="t('redeem.redeemCodeLabel')"
                  :disabled="submitting"
                  class="st-input redeem__input"
                />
              </div>
              <p class="redeem__hint">{{ t('redeem.redeemCodeHint') }}</p>

              <button type="submit" :disabled="!redeemCode || submitting" class="st-btn st-btn--primary st-btn--lg redeem__submit">
                <span v-if="submitting" class="spin-row">
                  <span class="spin"></span>{{ t('redeem.redeeming') }}
                </span>
                <span v-else class="spin-row">
                  <Icon name="checkCircle" size="md" />
                  {{ t('redeem.redeemButton') }}
                </span>
              </button>
            </form>

            <div v-if="history.length > 0" class="redeem__latest">
              <span class="st-eyebrow">{{ c('redeem.latest') }}</span>
              <span class="redeem__latest-line">
                <span>{{ getHistoryItemTitle(history[0]) }}</span>
                <span class="st-num">{{ formatHistoryValue(history[0]) }}</span>
              </span>
            </div>
          </div>

          <transition name="fade">
            <div v-if="redeemResult" class="st-card st-card--pad notice notice--ok">
              <span class="notice__mark"><Icon name="checkCircle" size="lg" /></span>
              <div class="notice__body">
                <h2 class="st-display-3">{{ t('redeem.redeemSuccess') }}</h2>
                <p class="st-body">{{ redeemResult.message }}</p>
                <div class="st-list notice__list">
                  <div v-if="redeemResult.type === 'balance'" class="st-row notice__row">
                    <span class="st-row__title">{{ t('redeem.added') }}</span>
                    <span class="notice__val st-num">${{ redeemResult.value.toFixed(2) }}</span>
                  </div>
                  <div v-else-if="redeemResult.type === 'concurrency'" class="st-row notice__row">
                    <span class="st-row__title">{{ t('redeem.added') }}</span>
                    <span class="notice__val st-num">{{ redeemResult.value }} {{ t('redeem.concurrentRequests') }}</span>
                  </div>
                  <div v-else-if="redeemResult.type === 'subscription'" class="st-row notice__row">
                    <span class="st-row__title">{{ t('redeem.subscriptionAssigned') }}</span>
                    <span class="notice__val">
                      <template v-if="redeemResult.group_name">{{ redeemResult.group_name }}</template>
                      <template v-if="redeemResult.validity_days"> · {{ t('redeem.subscriptionDays', { days: redeemResult.validity_days }) }}</template>
                    </span>
                  </div>
                  <div v-if="redeemResult.new_balance !== undefined" class="st-row notice__row">
                    <span class="st-row__title">{{ t('redeem.newBalance') }}</span>
                    <span class="notice__val st-num">${{ redeemResult.new_balance.toFixed(2) }}</span>
                  </div>
                  <div v-if="redeemResult.new_concurrency !== undefined" class="st-row notice__row">
                    <span class="st-row__title">{{ t('redeem.newConcurrency') }}</span>
                    <span class="notice__val st-num">{{ redeemResult.new_concurrency }} {{ t('redeem.requests') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </transition>

          <transition name="fade">
            <div v-if="errorMessage" class="st-card st-card--pad notice notice--bad">
              <span class="notice__mark"><Icon name="exclamationCircle" size="lg" /></span>
              <div class="notice__body">
                <h2 class="st-display-3">{{ t('redeem.redeemFailed') }}</h2>
                <p class="st-body">{{ errorMessage }}</p>
                <button type="button" class="st-btn st-btn--quiet st-btn--sm" @click="focusRedeemInput">{{ c('redeem.errorRetry') }}</button>
              </div>
            </div>
          </transition>
        </div>

        <div class="st-card st-card--pad redeem__where st-reveal" style="--i: 3">
          <div class="redeem__where-copy">
            <p class="st-eyebrow">{{ t('redeem.aboutCodes') }}</p>
            <p class="st-body">{{ t('redeem.codeRule1') }}</p>
            <p class="st-body">{{ t('redeem.codeRule2') }}</p>
          </div>
          <span v-if="contactInfo" class="st-pill st-pill--accent">{{ contactInfo }}</span>
        </div>

        <section class="hist st-reveal" style="--i: 4">
          <div class="hist__head">
            <div>
              <h2 class="st-display-3">{{ c('redeem.history') }}</h2>
              <p class="st-body">{{ c('redeem.historyLede') }}</p>
            </div>
            <div class="hist__tools">
              <label class="hist__size">
                {{ t('pagination.perPage') }}
                <select v-model="historyPageSize" class="st-select hist__select" :disabled="loadingHistory || submitting" @change="fetchHistory(1)">
                  <option v-for="size in [20, 50, 100]" :key="size" :value="size">{{ size }}</option>
                </select>
              </label>
              <button class="st-btn st-btn--quiet st-btn--sm" :disabled="loadingHistory || submitting || historyPage <= 1" @click="fetchHistory(historyPage - 1)">
                {{ t('pagination.previous') }}
              </button>
              <button class="st-btn st-btn--quiet st-btn--sm" :disabled="loadingHistory || submitting || historyPage * historyPageSize >= historyTotal" @click="fetchHistory(historyPage + 1)">
                {{ t('pagination.next') }}
              </button>
            </div>
          </div>

          <div v-if="historyError" class="hist__error st-card st-card--pad">
            <Icon name="exclamationCircle" size="md" />
            <span>{{ c('redeem.historyErrorBody') }}</span>
            <button type="button" class="st-btn st-btn--quiet st-btn--sm" @click="fetchHistory(historyPage)">{{ c('redeem.retry') }}</button>
          </div>

          <div v-if="loadingHistory" class="hist__loading">
            <div v-for="i in 4" :key="i" class="st-skeleton sk-row"></div>
          </div>

          <div v-else-if="history.length === 0 && !historyError" class="st-card st-card--pad hist__empty">
            <p class="st-body">{{ c('redeem.historyEmpty') }}</p>
            <button type="button" class="st-btn st-btn--primary st-btn--sm" @click="focusRedeemInput">{{ c('redeem.historyEmptyCta') }}</button>
          </div>

          <div v-else-if="history.length > 0" class="st-list hist__list">
            <div v-for="item in history" :key="(item as any).id ?? (getHistoryItemTitle(item) + String(item.created_at))" class="st-row hist__row">
              <span class="hist__title">
                <span class="st-row__title">{{ getHistoryItemTitle(item) }}</span>
                <span class="st-row__meta">{{ formatDateTime(item.created_at) }}</span>
              </span>
              <span v-if="isAdminAdjustment(item.type)" class="st-pill hist__tag">admin</span>
              <span class="hist__val st-num" :class="{ 'hist__val--sub': isSubscriptionType(item.type) }">
                {{ formatHistoryValue(item) }}
              </span>
            </div>
          </div>
        </section>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useSubscriptionStore } from '@/stores/subscriptions'
import { redeemAPI, authAPI, type RedeemHistoryItem } from '@/api'
import UserShell from '@/components/shell/UserShell.vue'
import { useBillingCopy } from '@/composables/copy/billing'
import Icon from '@/components/icons/Icon.vue'
import { formatDateTime } from '@/utils/format'

const { t } = useI18n()
const { c } = useBillingCopy()
const authStore = useAuthStore()
const appStore = useAppStore()
const subscriptionStore = useSubscriptionStore()

const user = computed(() => authStore.user)

const redeemCode = ref('')
const submitting = ref(false)
const redeemResult = ref<{
  message: string
  type: string
  value: number
  new_balance?: number
  new_concurrency?: number
  group_name?: string
  validity_days?: number
} | null>(null)
const errorMessage = ref('')
const redeemInputRef = ref<HTMLInputElement | null>(null)
const historyError = ref(false)

// History data
const history = ref<RedeemHistoryItem[]>([])
const loadingHistory = ref(false)
const historyPage = ref(1)
const historyPageSize = ref(20)
const historyTotal = ref(0)
let historyRequest = 0
let loadedHistoryPageSize = 20
const contactInfo = ref('')

// Helper functions for history display
const isBalanceType = (type: string) => {
  return type === 'balance' || type === 'admin_balance'
}

const isSubscriptionType = (type: string) => {
  return type === 'subscription'
}

const isAdminAdjustment = (type: string) => {
  return type === 'admin_balance' || type === 'admin_concurrency'
}

const getHistoryItemTitle = (item: RedeemHistoryItem) => {
  if (item.type === 'balance') {
    return t('redeem.balanceAddedRedeem')
  } else if (item.type === 'admin_balance') {
    return item.value >= 0 ? t('redeem.balanceAddedAdmin') : t('redeem.balanceDeductedAdmin')
  } else if (item.type === 'concurrency') {
    return t('redeem.concurrencyAddedRedeem')
  } else if (item.type === 'admin_concurrency') {
    return item.value >= 0 ? t('redeem.concurrencyAddedAdmin') : t('redeem.concurrencyReducedAdmin')
  } else if (item.type === 'subscription') {
    return t('redeem.subscriptionAssigned')
  }
  return t('common.unknown')
}

const formatHistoryValue = (item: RedeemHistoryItem) => {
  if (isBalanceType(item.type)) {
    const sign = item.value >= 0 ? '+' : ''
    return `${sign}$${item.value.toFixed(2)}`
  } else if (isSubscriptionType(item.type)) {
    // 订阅类型显示有效天数和分组名称
    const days = item.validity_days || Math.round(item.value)
    const groupName = item.group?.name || ''
    return groupName ? `${days}${t('redeem.days')} - ${groupName}` : `${days}${t('redeem.days')}`
  } else {
    const sign = item.value >= 0 ? '+' : ''
    return `${sign}${item.value} ${t('redeem.requests')}`
  }
}

const fetchHistory = async (page = 1) => {
  const request = ++historyRequest
  const pageSize = historyPageSize.value
  loadingHistory.value = true
  historyError.value = false
  try {
    const result = await redeemAPI.getHistory(page, pageSize)
    if (request !== historyRequest) return
    history.value = result.items
    historyTotal.value = result.total
    historyPage.value = page
    historyPageSize.value = pageSize
    loadedHistoryPageSize = pageSize
  } catch (error) {
    if (request !== historyRequest) return
    historyError.value = true
    historyPageSize.value = loadedHistoryPageSize
    appStore.showError(t('redeem.historyLoadFailed'))
    console.error('Failed to fetch history:', error)
  } finally {
    if (request === historyRequest) loadingHistory.value = false
  }
}

function focusRedeemInput() {
  errorMessage.value = ''
  redeemInputRef.value?.focus()
}

const handleRedeem = async () => {
  if (!redeemCode.value.trim()) {
    appStore.showError(t('redeem.pleaseEnterCode'))
    return
  }

  submitting.value = true
  errorMessage.value = ''
  redeemResult.value = null

  try {
    const result = await redeemAPI.redeem(redeemCode.value.trim())

    redeemResult.value = result

    // Refresh user data to get updated balance/concurrency
    try {
      await authStore.refreshUser()
    } catch (error) {
      console.error('Failed to refresh user after redeem:', error)
      appStore.showWarning(t('redeem.userRefreshFailed'))
    }

    // If subscription type, immediately refresh subscription status
    if (result.type === 'subscription') {
      try {
        await subscriptionStore.fetchActiveSubscriptions(true) // force refresh
      } catch (error) {
        console.error('Failed to refresh subscriptions after redeem:', error)
        appStore.showWarning(t('redeem.subscriptionRefreshFailed'))
      }
    }

    // Clear the input
    redeemCode.value = ''

    // Refresh history
    await fetchHistory()

    // Show success toast
    appStore.showSuccess(t('redeem.codeRedeemSuccess'))
  } catch (error: any) {
    errorMessage.value = error.response?.data?.detail || t('redeem.failedToRedeem')

    appStore.showError(t('redeem.redeemFailed'))
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  fetchHistory()
  try {
    const settings = await authAPI.getPublicSettings()
    contactInfo.value = settings.contact_info || ''
  } catch (error) {
    console.error('Failed to load contact info:', error)
  }
})
</script>

<style scoped>
.redeem { padding-top: clamp(32px, 5vw, 56px); }
.redeem__wrap { display: flex; flex-direction: column; gap: clamp(28px, 4vw, 56px); max-width: 860px; margin-inline: auto; }
.redeem__head { display: flex; flex-direction: column; align-items: center; gap: 10px; max-width: 58ch; margin-inline: auto; text-align: center; }
.redeem__head .st-display-2 { margin-top: 2px; }
.redeem__head .st-lede { margin-top: 2px; }
.redeem__stage { display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 640px; margin-inline: auto; }
.redeem__card { display: flex; flex-direction: column; gap: 20px; padding: clamp(24px, 3.2vw, 40px); box-shadow: var(--st-shadow-2); }
.redeem__balance { display: flex; flex-direction: column; gap: 5px; padding-bottom: 18px; border-bottom: 1px solid var(--st-line); }
.redeem__balance-meta { font-size: 0.78rem; color: var(--st-ink-3); }
.redeem__form { display: flex; flex-direction: column; gap: 10px; }
.redeem__field { position: relative; display: flex; align-items: center; }
.redeem__icon { position: absolute; left: 17px; color: var(--st-ink-3); pointer-events: none; }
.redeem__input { height: 62px; padding-left: 50px; font-family: var(--st-font-mono); font-size: 1.04rem; letter-spacing: 0.04em; }
.redeem__hint { font-size: 0.78rem; color: var(--st-ink-3); }
.redeem__submit { width: 100%; height: 54px; margin-top: 6px; }
.redeem__latest { display: flex; flex-direction: column; gap: 4px; padding-top: 16px; border-top: 1px solid var(--st-line); }
.redeem__latest-line { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 0.86rem; color: var(--st-ink); }
.spin-row { display: inline-flex; align-items: center; gap: 8px; }
.spin { width: 15px; height: 15px; border-radius: 50%; border: 2px solid currentColor; border-top-color: transparent; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.redeem__where { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 16px; width: 100%; max-width: 640px; margin-inline: auto; }
.redeem__where-copy { display: flex; flex-direction: column; gap: 4px; }
.redeem__where-copy .st-body { font-size: 0.82rem; }
.notice { display: flex; gap: 16px; align-items: flex-start; }
.notice__mark { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; }
.notice--ok .notice__mark { background: var(--st-brand-soft); color: var(--st-brand-text); }
.notice--bad .notice__mark { background: var(--st-danger-soft); color: var(--st-danger); }
.notice__body { display: flex; flex-direction: column; gap: 8px; min-width: 0; align-items: flex-start; }
.notice__list { width: 100%; }
.notice__row { grid-template-columns: minmax(0, 1fr) auto; padding: 8px 0; }
.notice__val { font-size: 0.88rem; color: var(--st-ink); text-align: right; overflow-wrap: anywhere; }
.hist { display: flex; flex-direction: column; gap: 14px; width: 100%; }
.hist__head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 10px 20px; }
.hist__head h2 { margin: 0 0 2px; }
.hist__head .st-body { font-size: 0.82rem; }
.hist__tools { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.hist__size { display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--st-ink-3); }
.hist__select { width: auto; padding: 7px 10px; font-size: 0.8rem; }
.hist__error { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; color: var(--st-danger); }
.hist__error span { flex: 1; min-width: 180px; font-size: 0.84rem; color: var(--st-ink-2); }
.hist__loading { display: flex; flex-direction: column; gap: 8px; }
.sk-row { height: 58px; }
.hist__list { border: 1px solid var(--st-line); border-radius: var(--st-r-lg); background: var(--st-bg); box-shadow: var(--st-shadow-1); overflow: hidden; }
.hist__row { grid-template-columns: minmax(0, 1fr) auto auto; padding: 14px 18px; transition: background-color var(--st-t) var(--st-ease); }
.hist__row:hover { background: var(--st-bg-soft); }
.hist__title { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.hist__tag { font-size: 0.75rem; color: var(--st-ink-3); }
.hist__val { font-size: 0.92rem; font-weight: 600; color: var(--st-ink); text-align: right; overflow-wrap: anywhere; }
.hist__val--sub { font-weight: 550; font-size: 0.86rem; color: var(--st-ink-2); }
.hist__empty { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
.fade-enter-active, .fade-leave-active { transition: opacity var(--st-t) var(--st-ease), transform var(--st-t) var(--st-ease); }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }
@media (max-width: 640px) {
  .redeem__card { padding: 20px; }
  .redeem__input { height: 58px; }
  .notice { flex-direction: column; gap: 10px; }
  .notice__mark { width: 36px; height: 36px; }
  .hist__row { grid-template-columns: minmax(0, 1fr); row-gap: 2px; }
  .hist__val { text-align: left; }
  .hist__tag { display: none; }
  .hist__head { align-items: flex-start; }
  .hist__tools { width: 100%; }
  .hist__tools .st-btn { min-height: 44px; }
  .st-btn { min-height: 44px; }
  .redeem__where { padding: 18px; }
}
</style>

<style scoped>
.st-pill { font-size: 0.75rem; }
</style>
