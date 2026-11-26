<template>
  <UserShell>
    <section class="st-section--tight awx">
      <div class="st-shell awx__wrap">
        <div v-if="loading" class="st-card st-card--pad awx__card" aria-busy="true">
          <div class="st-skeleton awx__sk awx__sk--mark"></div>
          <div class="st-skeleton awx__sk awx__sk--wide"></div>
          <div class="st-skeleton awx__sk"></div>
          <p class="st-body">{{ c('stripe.loading') }}</p>
        </div>

        <div v-else-if="errorMessage" class="st-card st-card--pad awx__card">
          <div class="awx__mark">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="9" />
              <path stroke-linecap="round" d="M12 8v5m0 3.5h.01" />
            </svg>
          </div>
          <h1 class="st-display-3">{{ t('payment.airwallexLoadFailed') }}</h1>
          <p class="st-body">{{ errorMessage }}</p>
          <p class="st-row__meta">{{ c('stripe.failedHint') }}</p>
          <button class="st-btn st-btn--primary awx__btn" @click="router.push('/purchase')">{{ c('stripe.back') }}</button>
        </div>

        <div v-else class="st-card st-card--pad awx__card">
          <span class="awx__spin"></span>
          <p class="st-body">{{ t('payment.qr.payInNewWindowHint') }}</p>
        </div>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import UserShell from '@/components/shell/UserShell.vue'
import { useBillingCopy } from '@/composables/copy/billing'
import {
  PAYMENT_RECOVERY_STORAGE_KEY,
  readPaymentRecoverySnapshot,
  type PaymentRecoverySnapshot,
} from '@/components/payment/paymentFlow'

const { t, locale } = useI18n()
const { c } = useBillingCopy()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const errorMessage = ref('')
let disposed = false

onUnmounted(() => { disposed = true })

function queryString(key: string): string {
  const value = route.query[key]
  if (Array.isArray(value)) return value[0] || ''
  return typeof value === 'string' ? value : ''
}

function buildSuccessUrl(snapshot: PaymentRecoverySnapshot): string {
  const url = new URL('/payment/result', window.location.origin)
  const orderId = queryString('order_id')
  const outTradeNo = queryString('out_trade_no')
  const resumeToken = queryString('resume_token')

  if (orderId || snapshot.orderId > 0) url.searchParams.set('order_id', orderId || String(snapshot.orderId))
  if (outTradeNo || snapshot.outTradeNo) url.searchParams.set('out_trade_no', outTradeNo || snapshot.outTradeNo)
  if (resumeToken || snapshot.resumeToken) url.searchParams.set('resume_token', resumeToken || snapshot.resumeToken)
  return url.toString()
}

function restoreAirwallexSnapshot(): PaymentRecoverySnapshot | null {
  if (typeof window === 'undefined') {
    return null
  }

  const orderId = Number(queryString('order_id')) || 0
  const outTradeNo = queryString('out_trade_no')
  const resumeToken = queryString('resume_token')
  const snapshot = readPaymentRecoverySnapshot(
    window.localStorage.getItem(PAYMENT_RECOVERY_STORAGE_KEY),
    resumeToken ? { resumeToken } : {},
  )

  if (!snapshot || snapshot.paymentType !== 'airwallex') {
    return null
  }
  if (orderId > 0 && snapshot.orderId !== orderId) {
    return null
  }
  if (outTradeNo && snapshot.outTradeNo !== outTradeNo) {
    return null
  }
  if (!snapshot.intentId || !snapshot.clientSecret) {
    return null
  }
  return snapshot
}

onMounted(async () => {
  const snapshot = restoreAirwallexSnapshot()
  const checkoutLocale = locale.value.toLowerCase().startsWith('zh') ? 'zh' : 'en'

  if (!snapshot) {
    loading.value = false
    errorMessage.value = t('payment.airwallexMissingParams')
    return
  }

  try {
    const airwallex = await import('@airwallex/components-sdk')
    if (disposed) return
    const result = await airwallex.init({
      env: snapshot.paymentEnv === 'prod' ? 'prod' : 'demo',
      enabledElements: ['payments'],
      locale: checkoutLocale,
    })
    if (disposed) return

    loading.value = false
    const checkoutOptions = {
      intent_id: snapshot.intentId,
      client_secret: snapshot.clientSecret,
      currency: snapshot.currency || 'CNY',
      country_code: snapshot.countryCode || 'CN',
      successUrl: buildSuccessUrl(snapshot),
    }
    if (!result.payments) {
      throw new Error(t('payment.airwallexLoadFailed'))
    }
    const redirectResult = result.payments.redirectToCheckout(checkoutOptions)

    if (typeof redirectResult === 'string' && redirectResult) {
      window.location.assign(redirectResult)
    }
  } catch (err: unknown) {
    loading.value = false
    errorMessage.value = err instanceof Error && err.message
      ? err.message
      : t('payment.airwallexLoadFailed')
  }
})
</script>
<style scoped>
.awx .st-card { box-shadow: var(--st-shadow-2); }
.awx .st-btn { min-height: 44px; }
.awx__card { gap: 14px; padding-block: clamp(28px, 6vw, 44px); }
.awx__sk { height: 14px; border-radius: var(--st-r-xs); }
.awx__sk--mark { width: 48px; height: 48px; border-radius: 50%; }
.awx__sk--wide { width: 70%; }
.awx__mark { width: 56px; height: 56px; }
.awx__btn { min-height: 48px; }
</style>

<style scoped>
.awx { padding-bottom: clamp(56px, 8vw, 96px); }
.awx__wrap { max-width: 460px; }
.awx__card { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; min-width: 0; }
.awx__mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--st-danger-soft);
  color: var(--st-danger);
}
.awx__spin {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid var(--st-line-2);
  border-top-color: var(--st-brand);
  animation: awx-spin 0.9s linear infinite;
}
@keyframes awx-spin { to { transform: rotate(360deg); } }
.awx__btn { width: 100%; min-width: 0; white-space: normal; }
</style>

