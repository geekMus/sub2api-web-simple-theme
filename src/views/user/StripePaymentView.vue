<template>
  <component :is="isPopup ? 'div' : UserShell" :class="isPopup ? 'st-root stripe-pay stripe-pay--popup' : ''">
    <section class="st-section--tight stripe-pay__section">
      <div class="st-shell stripe-pay__wrap">
        <div v-if="loading" class="stripe-pay__skeleton" aria-busy="true">
          <div class="st-card st-card--pad stripe-pay__card">
            <div class="st-skeleton stripe-pay__sk stripe-pay__sk--head"></div>
            <div class="st-skeleton stripe-pay__sk stripe-pay__sk--money"></div>
          </div>
          <div class="st-card st-card--pad stripe-pay__card">
            <div class="st-skeleton stripe-pay__sk"></div>
            <div class="st-skeleton stripe-pay__sk stripe-pay__sk--wide"></div>
            <div class="st-skeleton stripe-pay__sk stripe-pay__sk--btn"></div>
          </div>
          <p class="st-row__meta stripe-pay__skeleton-hint">{{ c('stripe.loading') }} · {{ c('stripe.loadingHint') }}</p>
        </div>

        <div v-else-if="initError" class="st-card st-card--pad stripe-pay__card stripe-pay__state">
          <div class="stripe-pay__mark stripe-pay__mark--bad">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="9" />
              <path stroke-linecap="round" d="M12 8v5m0 3.5h.01" />
            </svg>
          </div>
          <h1 class="st-display-3">{{ c('stripe.failed') }}</h1>
          <p class="st-body">{{ initError }}</p>
          <p class="st-row__meta">{{ c('stripe.failedHint') }}</p>
          <button class="st-btn st-btn--primary stripe-pay__btn" @click="router.push('/purchase')">{{ c('stripe.back') }}</button>
        </div>

        <template v-else>
          <div v-if="order" class="st-card st-card--pad stripe-pay__card stripe-pay__amount">
            <p class="st-eyebrow">{{ t('payment.actualPay') }}</p>
            <p class="st-display-2 stripe-pay__amount-value st-num">{{ formatGatewayAmount(order.pay_amount) }}</p>
          </div>

          <template v-if="wechatQrUrl">
            <div class="st-card st-card--pad stripe-pay__card stripe-pay__state">
              <h2 class="st-display-3">{{ t('payment.qr.scanWxpay') }}</h2>
              <div class="stripe-pay__paper">
                <img :src="wechatQrUrl" alt="WeChat Pay QR" class="stripe-pay__qr" />
              </div>
              <p class="st-body">{{ t('payment.qr.scanWxpayHint') }}</p>
              <div class="stripe-pay__dotline">
                <span class="stripe-pay__dot"></span>
                {{ t('payment.qr.waitingPayment') }}
              </div>
            </div>
          </template>

          <template v-else-if="redirecting">
            <div class="st-card st-card--pad stripe-pay__card stripe-pay__state">
              <span class="stripe-pay__spin"></span>
              <p class="st-body">{{ t('payment.qr.payInNewWindowHint') }}</p>
            </div>
          </template>

          <template v-else-if="stripeSuccess">
            <div class="st-card st-card--pad stripe-pay__card stripe-pay__state">
              <div class="stripe-pay__mark stripe-pay__mark--ok">
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 class="st-display-3">{{ t('payment.result.success') }}</h2>
              <p class="st-body">{{ c('stripe.successHint') }}</p>
            </div>
          </template>

          <template v-else-if="showPaymentElement">
            <div class="st-card st-card--pad stripe-pay__card">
              <div id="stripe-payment-element" class="stripe-pay__element"></div>
              <p v-if="stripeError" class="stripe-pay__error">{{ stripeError }}</p>
              <button class="st-btn st-btn--primary st-btn--lg stripe-pay__btn" :disabled="stripeSubmitting || !stripeReady" @click="handleGenericPay">
                <span v-if="stripeSubmitting" class="stripe-pay__spin-row">
                  <span class="stripe-pay__spin stripe-pay__spin--sm"></span>
                  {{ t('common.processing') }}
                </span>
                <span v-else>{{ t('payment.stripePay') }}</span>
              </button>
            </div>
            <button class="st-btn st-btn--quiet stripe-pay__btn" @click="router.push('/purchase')">{{ c('stripe.back') }}</button>
          </template>

          <div v-if="stripeError && !showPaymentElement" class="st-card st-card--pad stripe-pay__card">
            <p class="stripe-pay__error">{{ stripeError }}</p>
            <button class="st-btn st-btn--quiet stripe-pay__btn" @click="router.push('/purchase')">{{ c('stripe.back') }}</button>
          </div>
        </template>
      </div>
    </section>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'
import { paymentAPI } from '@/api/payment'
import { extractI18nErrorMessage } from '@/utils/apiError'
import { isMobileDevice } from '@/utils/device'
import { formatPaymentAmount, normalizePaymentCurrency } from '@/components/payment/currency'
import { PAYMENT_RECOVERY_STORAGE_KEY, readPaymentRecoverySnapshot } from '@/components/payment/paymentFlow'
import type { PaymentOrder } from '@/types/payment'
import type { Stripe, StripeElements } from '@stripe/stripe-js'
import UserShell from '@/components/shell/UserShell.vue'
import { useBillingCopy } from '@/composables/copy/billing'

const i18n = useI18n()
const { t } = i18n
const { c } = useBillingCopy()
const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()

// 弹窗模式：指定支付宝或微信方式时跳过页面外壳
const isPopup = computed(() => !!route.query.method)

const loading = ref(true)
const initError = ref('')
const stripeError = ref('')
const stripeSubmitting = ref(false)
const stripeSuccess = ref(false)
const stripeReady = ref(false)
const order = ref<PaymentOrder | null>(null)
const currency = ref('CNY')
const wechatQrUrl = ref('')
const redirecting = ref(false)
const showPaymentElement = ref(false)

let disposed = false
let stripeInstance: Stripe | null = null
let elementsInstance: StripeElements | null = null
let redirectTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  const orderId = Number(route.query.order_id)
  const method = String(route.query.method || '')
  const resumeToken = typeof route.query.resume_token === 'string' ? route.query.resume_token : undefined
  // client_secret 只从本浏览器下单时写入的恢复快照读取，且快照订单必须与 URL 订单一致：
  // 不信任 URL 中的 client_secret，避免页面展示的订单与实际收款的 PaymentIntent 被拼接错绑。
  const restored = typeof window !== 'undefined'
    ? readPaymentRecoverySnapshot(window.localStorage.getItem(PAYMENT_RECOVERY_STORAGE_KEY), { resumeToken })
    : null
  const clientSecret = orderId && restored?.orderId === orderId ? restored.clientSecret : ''

  if (!orderId || !clientSecret) {
    loading.value = false
    initError.value = t('payment.stripeMissingParams')
    return
  }

  try {
    currency.value = normalizePaymentCurrency(restored?.currency)
    const res = await paymentAPI.getOrder(orderId)
    order.value = res.data
    if (res.data.currency) {
      currency.value = normalizePaymentCurrency(res.data.currency)
    }

    await paymentStore.fetchConfig()
    const publishableKey = paymentStore.config?.stripe_publishable_key
    if (!publishableKey) { initError.value = t('payment.stripeNotConfigured'); return }

    const { loadStripe } = await import('@stripe/stripe-js/pure')
    const stripe = await loadStripe(publishableKey)
    if (disposed) return
    if (!stripe) { initError.value = t('payment.stripeLoadFailed'); return }

    stripeInstance = stripe
    loading.value = false

    // 指定方式直接确认，无需渲染完整 Payment Element
    if (method === 'alipay') {
      await confirmAlipay(stripe, clientSecret, orderId)
    } else if (method === 'wechat_pay') {
      await confirmWechatPay(stripe, clientSecret)
    } else {
      // 未指定方式时渲染完整 Payment Element
      showPaymentElement.value = true
      await nextTick()
      mountPaymentElement(stripe, clientSecret)
    }
  } catch (err: unknown) {
    initError.value = extractI18nErrorMessage(err, t, 'payment.errors', t('payment.stripeLoadFailed'))
  } finally {
    loading.value = false
  }
})

const localeCode = computed(() => {
  const raw = i18n.locale as unknown
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'value' in raw) {
    return String((raw as { value?: string }).value || '')
  }
  return undefined
})

function formatGatewayAmount(value: number): string {
  return formatPaymentAmount(value, currency.value, localeCode.value)
}

async function confirmAlipay(stripe: Stripe, clientSecret: string, orderId: number) {
  redirecting.value = true
  const returnUrl = window.location.origin + '/payment/result?order_id=' + orderId + '&status=success'
  const { error } = await stripe.confirmAlipayPayment(clientSecret, { return_url: returnUrl })
  if (error) {
    redirecting.value = false
    stripeError.value = error.message || t('payment.result.failed')
  }
  // 无错误时 Stripe 会自动跳转
}

async function confirmWechatPay(stripe: Stripe, clientSecret: string) {
  const { paymentIntent, error } = await (stripe as Stripe & {
    confirmWechatPayPayment: (cs: string, opts: Record<string, unknown>) => Promise<{ paymentIntent?: { status: string; next_action?: { wechat_pay_display_qr_code?: { image_data_url?: string } } }; error?: { message?: string } }>
  }).confirmWechatPayPayment(clientSecret, {
    payment_method_options: { wechat_pay: { client: isMobileDevice() ? 'mobile_web' : 'web' } },
  })

  if (error) {
    stripeError.value = error.message || t('payment.result.failed')
    return
  }

  // 从 next_action 中提取二维码
  const qrData = paymentIntent?.next_action?.wechat_pay_display_qr_code?.image_data_url
  if (qrData) {
    wechatQrUrl.value = qrData
    // 轮询支付完成状态
    startPolling()
  } else if (paymentIntent?.status === 'succeeded') {
    stripeSuccess.value = true
    scheduleClose()
  } else {
    stripeError.value = t('payment.result.failed')
  }
}

function mountPaymentElement(stripe: Stripe, clientSecret: string) {
  if (disposed) return
  const isDark = document.documentElement.classList.contains('dark')
  const elements = stripe.elements({
    clientSecret,
    appearance: { theme: isDark ? 'night' : 'stripe', variables: { borderRadius: '8px' } },
  })
  elementsInstance = elements
  const paymentElement = elements.create('payment', {
    layout: 'tabs',
    paymentMethodOrder: ['alipay', 'wechat_pay', 'card', 'link'],
  } as Record<string, unknown>)
  paymentElement.mount('#stripe-payment-element')
  paymentElement.on('ready', () => { stripeReady.value = true })
}

async function handleGenericPay() {
  if (!stripeInstance || !elementsInstance || stripeSubmitting.value) return
  stripeSubmitting.value = true
  stripeError.value = ''
  try {
    const { error } = await stripeInstance.confirmPayment({
      elements: elementsInstance,
      confirmParams: {
        return_url: window.location.origin + '/payment/result?order_id=' + route.query.order_id + '&status=success',
      },
      redirect: 'if_required',
    })
    if (error) {
      stripeError.value = error.message || t('payment.result.failed')
    } else {
      stripeSuccess.value = true
      scheduleClose()
    }
  } catch (err: unknown) {
    stripeError.value = extractI18nErrorMessage(err, t, 'payment.errors', t('payment.result.failed'))
  } finally {
    stripeSubmitting.value = false
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null

function startPolling() {
  const orderId = Number(route.query.order_id)
  if (!orderId || disposed) return
  pollTimer = setInterval(async () => {
    const o = await paymentStore.pollOrderStatus(orderId)
    if (!o) return
    if (o.status === 'COMPLETED' || o.status === 'PAID') {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
      stripeSuccess.value = true
      wechatQrUrl.value = ''
      scheduleClose()
    }
  }, 3000)
}

function scheduleClose() {
  if (disposed) return
  if (window.opener) {
    redirectTimer = setTimeout(() => { window.close() }, 2000)
  } else {
    redirectTimer = setTimeout(() => {
      router.push({ path: '/payment/result', query: { order_id: String(route.query.order_id || ''), status: 'success' } })
    }, 2000)
  }
}

onUnmounted(() => {
  disposed = true
  if (redirectTimer) clearTimeout(redirectTimer)
  if (pollTimer) clearInterval(pollTimer)
})
</script>
<style scoped>
.stripe-pay .st-card { box-shadow: var(--st-shadow-2); }
.stripe-pay .st-btn { min-height: 44px; }
.stripe-pay__skeleton { display: flex; flex-direction: column; gap: 12px; }
.stripe-pay__skeleton-hint { text-align: center; padding-top: 4px; }
.stripe-pay__sk { height: 14px; border-radius: var(--st-r-xs); }
.stripe-pay__sk--head { height: 16px; width: 34%; }
.stripe-pay__sk--money { height: 40px; width: 58%; }
.stripe-pay__sk--wide { width: 82%; }
.stripe-pay__sk--btn { height: 46px; border-radius: var(--st-r-sm); }
.stripe-pay__mark { width: 56px; height: 56px; }
.stripe-pay__state { gap: 14px; }
.stripe-pay__btn { min-height: 46px; }
@media (max-width: 480px) { .stripe-pay__btn { min-height: 50px; } }
</style>

<style scoped>
.stripe-pay__section { padding-bottom: clamp(56px, 8vw, 96px); }
.stripe-pay--popup .stripe-pay__section { min-height: 100vh; display: flex; align-items: center; }
.stripe-pay__wrap { display: flex; flex-direction: column; gap: 12px; max-width: 480px; }
.stripe-pay--popup .stripe-pay__wrap { padding-block: 24px; }

.stripe-pay__loading { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 56px 16px; text-align: center; }
.stripe-pay__card { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.stripe-pay__state { align-items: center; text-align: center; }

.stripe-pay__mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
}
.stripe-pay__mark--ok { background: var(--st-ok-soft); color: var(--st-ok); }
.stripe-pay__mark--bad { background: var(--st-danger-soft); color: var(--st-danger); }

.stripe-pay__amount { align-items: flex-start; gap: 4px; }
.stripe-pay__amount-value { font-size: clamp(1.9rem, 5vw, 2.5rem); }

.stripe-pay__paper {
  display: grid;
  place-items: center;
  width: fit-content;
  max-width: 100%;
  padding: 12px;
  border-radius: var(--st-r-md);
  background: white;
}
.stripe-pay__qr { display: block; width: 224px; max-width: 100%; height: auto; border-radius: var(--st-r-xs); }

.stripe-pay__dotline { display: inline-flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--st-ink-faint); }
.stripe-pay__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--st-brand); animation: stripe-pulse 1.6s var(--st-ease) infinite; }
@keyframes stripe-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

.stripe-pay__spin {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid var(--st-line-2);
  border-top-color: var(--st-brand-text);
  animation: stripe-spin 0.9s linear infinite;
}
.stripe-pay__spin--sm { width: 15px; height: 15px; border-width: 2px; }
.stripe-pay__spin-row { display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
@keyframes stripe-spin { to { transform: rotate(360deg); } }

.stripe-pay__element { min-height: 200px; }
.stripe-pay__error { font-size: 0.86rem; line-height: 1.6; color: var(--st-danger); }
.stripe-pay__btn { width: 100%; min-width: 0; white-space: normal; }
</style>

