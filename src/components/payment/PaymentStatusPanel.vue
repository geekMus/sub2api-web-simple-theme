<template>
  <div class="psp">
    <template v-if="outcome === 'success'">
      <div class="st-card st-card--pad psp__card">
        <div class="psp__state">
          <div class="psp__mark psp__mark--ok"><Icon name="check" size="lg" /></div>
          <p class="st-display-3 psp__title">{{ props.orderType === 'subscription' ? t('payment.result.subscriptionSuccess') : t('payment.result.success') }}</p>
          <p class="st-body">{{ c('result.successBody') }}</p>
          <div v-if="paidOrder" class="psp__receipt">
            <div class="psp__rows">
              <div class="st-row psp__row">
                <span class="st-row__meta">{{ t('payment.orders.orderId') }}</span>
                <span class="psp__value">#{{ paidOrder.id }}</span>
              </div>
              <div v-if="paidOrder.out_trade_no" class="st-row psp__row">
                <span class="st-row__meta">{{ t('payment.orders.orderNo') }}</span>
                <span class="psp__value psp__value--mono">{{ paidOrder.out_trade_no }}</span>
              </div>
              <div class="st-row psp__row">
                <span class="st-row__meta">{{ t('payment.orders.amount') }}</span>
                <span class="psp__value">
                  {{ creditedAmountSymbol }}{{ paidOrder.amount.toFixed(2) }}
                  <span v-if="(paidOrder.bonus_amount ?? 0) > 0" class="psp__bonus">
                    ({{ t('payment.orders.bonusIncluded', { amount: creditedAmountSymbol + (paidOrder.bonus_amount ?? 0).toFixed(2) }) }})
                  </span>
                </span>
              </div>
              <div class="st-row psp__row">
                <span class="st-row__meta">{{ t('payment.orders.payAmount') }}</span>
                <span class="psp__value">{{ formatGatewayAmount(paidOrder.pay_amount, paidOrder.currency) }}</span>
              </div>
            </div>
          </div>
          <button class="st-btn st-btn--primary psp__btn" @click="handleDone">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </template>

    <template v-else-if="outcome === 'cancelled'">
      <div class="st-card st-card--pad psp__card">
        <div class="psp__state">
          <div class="psp__mark">
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p class="st-display-3 psp__title">{{ t('payment.qr.cancelled') }}</p>
          <p class="st-body">{{ t('payment.qr.cancelledDesc') }}</p>
          <button class="st-btn st-btn--primary psp__btn" @click="handleDone">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </template>

    <template v-else-if="outcome === 'expired'">
      <div class="st-card st-card--pad psp__card">
        <div class="psp__state">
          <div class="psp__mark psp__mark--warn">
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="st-display-3 psp__title">{{ t('payment.qr.expired') }}</p>
          <p class="st-body">{{ t('payment.qr.expiredDesc') }}</p>
          <button class="st-btn st-btn--primary psp__btn" @click="handleDone">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </template>

    <template v-else-if="isMobileAlipayDeepLink">
      <template v-if="!deepLinkFallbackVisible">
        <div class="st-card st-card--pad psp__card">
          <div class="psp__state">
            <span v-if="deepLinkState === 'launching'" class="psp__spin"></span>
            <div v-else class="psp__mark psp__mark--accent"><Icon name="checkCircle" size="lg" /></div>
            <p class="st-display-3 psp__title">
              {{ deepLinkState === 'backgrounded' ? t('payment.qr.alipayContinueInApp') : t('payment.qr.alipayOpening') }}
            </p>
            <p class="st-body">{{ t('payment.qr.alipayWaitingHint') }}</p>
            <button
              v-if="deepLinkState === 'backgrounded'"
              data-test="reopen-alipay"
              class="st-btn st-btn--quiet psp__btn"
              @click="reopenAlipay"
            >
              <Icon name="externalLink" size="sm" />
              {{ t('payment.qr.reopenAlipay') }}
            </button>
          </div>
        </div>
        <div class="st-card st-card--pad psp__card psp__countdown">
          <p class="st-row__meta">{{ t('payment.qr.expiresIn') }}</p>
          <p class="st-display-2 psp__time st-num">{{ countdownDisplay }}</p>
          <p class="st-row__meta">{{ t('payment.qr.waitingPayment') }}</p>
        </div>
      </template>

      <template v-else>
        <div data-test="alipay-qr-fallback" class="st-card st-card--pad psp__card">
          <div class="psp__state">
            <div class="psp__fallback-head">
              <p class="st-display-3 psp__title">{{ t('payment.qr.alipayFallbackTitle') }}</p>
              <p class="st-body">{{ t('payment.qr.alipayFallbackHint') }}</p>
            </div>
            <div class="psp__rows psp__rows--boxed">
              <div class="st-row psp__row">
                <span class="st-row__meta">{{ t('payment.orders.payAmount') }}</span>
                <span class="psp__value">{{ displayPaymentAmount }}</span>
              </div>
              <div class="st-row psp__row">
                <span class="st-row__meta">{{ t('payment.orders.orderNo') }}</span>
                <span class="psp__value psp__value--mono">{{ displayOrderNumber }}</span>
              </div>
              <div class="st-row psp__row">
                <span class="st-row__meta">{{ t('payment.qr.expiresIn') }}</span>
                <span class="psp__value st-num">{{ countdownDisplay }}</span>
              </div>
            </div>
            <div class="psp__paper">
              <canvas ref="qrCanvas" class="psp__canvas"></canvas>
              <div class="psp__logo">
                <img :src="qrLogoIcon" alt="" class="psp__logo-img" />
              </div>
            </div>
            <p class="st-body">{{ t('payment.qr.alipaySaveAndScanHint') }}</p>
            <div class="psp__actions">
              <button data-test="reopen-alipay" class="st-btn st-btn--primary psp__btn" @click="reopenAlipay">
                <Icon name="externalLink" size="sm" />
                {{ t('payment.qr.reopenAlipay') }}
              </button>
              <button data-test="save-alipay-qr" class="st-btn st-btn--quiet psp__btn" @click="saveQRCode">
                <Icon name="download" size="sm" />
                {{ t('payment.qr.saveQRCode') }}
              </button>
            </div>
            <button class="st-btn st-btn--ghost psp__btn" @click="handleDone">{{ t('payment.result.backToRecharge') }}</button>
          </div>
        </div>
      </template>
    </template>

    <template v-else-if="showQRCode">
      <div class="st-card st-card--pad psp__card">
        <div class="psp__state">
          <p class="st-display-3 psp__title">{{ scanTitle }}</p>
          <div class="psp__paper">
            <canvas ref="qrCanvas" class="psp__canvas"></canvas>
            <div class="psp__logo">
              <img :src="qrLogoIcon" alt="" class="psp__logo-img" />
            </div>
          </div>
          <p v-if="scanHint" class="st-body">{{ scanHint }}</p>
          <button v-if="payUrl" class="btn btn-secondary text-sm psp__btn" @click="reopenPopup">
            {{ t('payment.qr.openPayWindow') }}
          </button>
        </div>
      </div>
      <div class="st-card st-card--pad psp__card psp__countdown">
        <p class="st-row__meta">{{ t('payment.qr.expiresIn') }}</p>
        <p class="st-display-2 psp__time st-num">{{ countdownDisplay }}</p>
        <p class="st-row__meta">{{ t('payment.qr.waitingPayment') }}</p>
      </div>
      <button class="st-btn st-btn--quiet psp__btn" :disabled="cancelling" @click="handleCancel">
        {{ cancelling ? t('common.processing') : t('payment.qr.cancelOrder') }}
      </button>
    </template>

    <template v-else>
      <div class="st-card st-card--pad psp__card">
        <div class="psp__state">
          <span class="psp__spin"></span>
          <p class="st-body">{{ t('payment.qr.payInNewWindowHint') }}</p>
          <button v-if="payUrl" class="btn btn-secondary text-sm psp__btn" @click="reopenPopup">
            {{ t('payment.qr.openPayWindow') }}
          </button>
        </div>
      </div>
      <div class="st-card st-card--pad psp__card psp__countdown">
        <p class="st-display-2 psp__time st-num">{{ countdownDisplay }}</p>
        <p class="st-row__meta">{{ t('payment.qr.waitingPayment') }}</p>
      </div>
      <button class="st-btn st-btn--quiet psp__btn" :disabled="cancelling" @click="handleCancel">
        {{ cancelling ? t('common.processing') : t('payment.qr.cancelOrder') }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBillingCopy } from '@/composables/copy/billing'
import { usePaymentStore } from '@/stores/payment'
import { useAppStore } from '@/stores'
import { paymentAPI } from '@/api/payment'
import { extractI18nErrorMessage } from '@/utils/apiError'
import { getPaymentPopupFeatures, isBuiltInAlipayMethod, isBuiltInWxpayMethod } from '@/components/payment/providerConfig'
import { currencySymbol, formatPaymentAmount, normalizePaymentCurrency } from '@/components/payment/currency'
import type { PaymentOrder } from '@/types/payment'
import Icon from '@/components/icons/Icon.vue'
import QRCode from 'qrcode'
import alipayIcon from '@/assets/icons/alipay.svg'
import wxpayIcon from '@/assets/icons/wxpay.svg'
import paymentIcon from '@/assets/icons/payment.svg'
import {
  createAlipayDeepLinkLauncher,
  type AlipayDeepLinkLauncher,
  type AlipayDeepLinkState,
} from './alipayDeepLink'

const props = defineProps<{
  orderId: number
  amount?: number
  payAmount?: number
  qrCode: string
  expiresAt: string
  paymentType: string
  payUrl?: string
  orderType?: string
  currency?: string
  outTradeNo?: string
  mobileAlipayDeepLink?: boolean
}>()

type PaymentOutcome = 'success' | 'cancelled' | 'expired'

const emit = defineEmits<{ done: []; success: []; settled: [outcome: PaymentOutcome] }>()

const i18n = useI18n()
const { t } = i18n
const { c } = useBillingCopy()
const paymentStore = usePaymentStore()
const appStore = useAppStore()

const qrCanvas = ref<HTMLCanvasElement | null>(null)
const qrUrl = ref('')
const remainingSeconds = ref(0)
const cancelling = ref(false)
const paidOrder = ref<PaymentOrder | null>(null)
const deepLinkState = ref<AlipayDeepLinkState>('idle')
const deepLinkFallbackVisible = ref(false)
const paymentCurrency = computed(() => normalizePaymentCurrency(props.currency))
const creditedAmountSymbol = currencySymbol('USD')
const localeCode = computed(() => {
  const raw = i18n.locale as unknown
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'value' in raw) {
    return String((raw as { value?: string }).value || '')
  }
  return undefined
})

// Terminal outcome: null = still active, 'success' | 'cancelled' | 'expired'
const outcome = ref<PaymentOutcome | null>(null)

let pollTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null
let verifyAttempts = 0
let lastVerifyAt = 0
let alipayLauncher: AlipayDeepLinkLauncher | null = null

const VERIFY_RETRY_INTERVAL_MS = 15000
const VERIFY_RETRY_MAX_ATTEMPTS = 6

const isAlipay = computed(() => isBuiltInAlipayMethod(props.paymentType))
const isWxpay = computed(() => isBuiltInWxpayMethod(props.paymentType))
const isMobileAlipayDeepLink = computed(() => props.mobileAlipayDeepLink === true && isAlipay.value && !!qrUrl.value)
const showQRCode = computed(() => !!qrUrl.value && (!isMobileAlipayDeepLink.value || deepLinkFallbackVisible.value))

const qrLogoIcon = computed(() => {
  if (isAlipay.value) return alipayIcon
  if (isWxpay.value) return wxpayIcon
  return paymentIcon
})

const scanTitle = computed(() => {
  if (isAlipay.value) return t('payment.qr.scanAlipay')
  if (isWxpay.value) return t('payment.qr.scanWxpay')
  return t('payment.qr.scanToPay')
})

const scanHint = computed(() => {
  if (isAlipay.value) return t('payment.qr.scanAlipayHint')
  if (isWxpay.value) return t('payment.qr.scanWxpayHint')
  return ''
})

const countdownDisplay = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0')
})

const displayPaymentAmount = computed(() => formatGatewayAmount(props.payAmount || props.amount || 0))
const displayOrderNumber = computed(() => props.outTradeNo || `#${props.orderId}`)

function formatGatewayAmount(value: number, currency?: string | null): string {
  return formatPaymentAmount(value, currency || paymentCurrency.value, localeCode.value)
}

function isSuccessStatus(status: string | null | undefined): boolean {
  return status === 'COMPLETED' || status === 'PAID' || status === 'RECHARGING'
}

function reopenPopup() {
  if (props.payUrl) {
    const win = window.open(props.payUrl, 'paymentPopup', getPaymentPopupFeatures())
    if (!win || win.closed) {
      window.location.href = props.payUrl
    }
  }
}

function setOutcome(next: PaymentOutcome) {
  if (outcome.value === next) return
  outcome.value = next
  emit('settled', next)
}

async function renderQR() {
  await nextTick()
  if (!showQRCode.value || !qrCanvas.value || !qrUrl.value) return
  await QRCode.toCanvas(qrCanvas.value, qrUrl.value, {
    width: 220, margin: 2,
    errorCorrectionLevel: 'M',
  })
}

function updateDeepLinkState(state: AlipayDeepLinkState) {
  deepLinkState.value = state
  if (state === 'fallback') {
    deepLinkFallbackVisible.value = true
    renderQR()
  } else if (state === 'backgrounded') {
    deepLinkFallbackVisible.value = false
  }
}

function reopenAlipay() {
  alipayLauncher?.launch()
}

function saveQRCode() {
  const canvas = qrCanvas.value
  if (!canvas) return
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = `alipay-${props.outTradeNo || props.orderId}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
}

async function tryRecoverPendingOrder(order: PaymentOrder): Promise<PaymentOrder> {
  if (!isWxpay.value && !isAlipay.value) return order
  const outTradeNo = String(order.out_trade_no || '').trim()
  if (!outTradeNo) return order
  const normalizedStatus = String(order.status || '').trim().toUpperCase()
  if (normalizedStatus !== 'PENDING') return order
  const now = Date.now()
  if (verifyAttempts >= VERIFY_RETRY_MAX_ATTEMPTS || now - lastVerifyAt < VERIFY_RETRY_INTERVAL_MS) {
    return order
  }

  lastVerifyAt = now
  verifyAttempts += 1
  try {
    const result = await paymentAPI.verifyOrder(outTradeNo)
    return result.data ?? order
  } catch {
    return order
  }
}

let pollInFlight = false
async function pollStatus() {
  if (!props.orderId || outcome.value) return
  // 防重入：接口（含 verifyOrder 二次确认）响应慢于 3 秒轮询间隔时避免并发重叠请求。
  if (pollInFlight) return
  pollInFlight = true
  try {
    let order = await paymentStore.pollOrderStatus(props.orderId)
    if (!order) return
    // 已进入终态则不再处理迟到的响应。
    if (outcome.value) return
    order = await tryRecoverPendingOrder(order)
    if (outcome.value) return
    if (isSuccessStatus(order.status)) {
      cleanup()
      paidOrder.value = order
      setOutcome('success')
      emit('success')
    } else if (order.status === 'CANCELLED') {
      cleanup()
      setOutcome('cancelled')
    } else if (order.status === 'EXPIRED' || order.status === 'FAILED') {
      cleanup()
      setOutcome('expired')
    }
  } finally {
    pollInFlight = false
  }
}

function startCountdown(seconds: number) {
  remainingSeconds.value = Math.max(0, seconds)
  const deadline = Date.now() + remainingSeconds.value * 1000
  if (remainingSeconds.value <= 0) { setOutcome('expired'); return }
  countdownTimer = setInterval(() => {
    remainingSeconds.value = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
    if (remainingSeconds.value <= 0) { setOutcome('expired'); cleanup() }
  }, 1000)
}

async function handleCancel() {
  if (!props.orderId || cancelling.value) return
  cancelling.value = true
  try {
    await paymentAPI.cancelOrder(props.orderId)
    cleanup()
    setOutcome('cancelled')
  } catch (err: unknown) {
    appStore.showError(extractI18nErrorMessage(err, t, 'payment.errors', t('common.error')))
  } finally {
    cancelling.value = false
  }
}

function handleDone() { cleanup(); emit('done') }

function cleanup() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  alipayLauncher?.dispose()
  alipayLauncher = null
}

// Initialize on mount
qrUrl.value = props.qrCode
verifyAttempts = 0
lastVerifyAt = 0
let seconds = 30 * 60
if (props.expiresAt) {
  seconds = Math.floor((new Date(props.expiresAt).getTime() - Date.now()) / 1000)
}
startCountdown(seconds)
pollTimer = setInterval(pollStatus, 3000)
renderQR()

watch([() => qrUrl.value, showQRCode], () => renderQR())
onMounted(() => {
  if (!isMobileAlipayDeepLink.value) return
  alipayLauncher = createAlipayDeepLinkLauncher({
    qrCode: qrUrl.value,
    document,
    lifecycleTarget: window,
    userAgent: window.navigator.userAgent,
    assignLocation: (url) => window.location.assign(url),
    onStateChange: updateDeepLinkState,
  })
  alipayLauncher.launch()
})
onUnmounted(() => cleanup())
</script>
<style scoped>
.psp { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 620px; margin-inline: auto; }
.psp__card { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.psp .st-btn { min-height: 44px; }
.psp__state { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; min-width: 0; }
.psp__title { margin-top: 2px; }
.psp__fallback-head { display: flex; flex-direction: column; gap: 6px; text-align: center; }

.psp__mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--st-bg-soft);
  color: var(--st-ink-2);
}
.psp__mark--ok { background: var(--st-ok-soft); color: var(--st-ok); }
.psp__mark--warn { background: var(--st-warn-soft); color: var(--st-warn); }
.psp__mark--accent { background: var(--st-brand-soft); color: var(--st-brand-ink); }

.psp__receipt { width: 100%; padding: 12px 14px; border-radius: var(--st-r-md); background: var(--st-bg-soft); text-align: left; }
.psp__rows { display: flex; flex-direction: column; width: 100%; }
.psp__rows--boxed { padding: 4px 14px; border-radius: var(--st-r-md); border: 1px solid var(--st-line); background: var(--st-bg-soft); }
.psp__row { grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 12px; padding: 9px 0; }
.psp__value { font-size: 0.88rem; color: var(--st-ink); text-align: right; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.psp__value--mono { font-family: var(--st-font-mono); font-size: 0.78rem; }
.psp__bonus { display: block; font-size: 0.78rem; color: var(--st-warn); }

.psp__paper {
  position: relative;
  display: grid;
  place-items: center;
  width: fit-content;
  max-width: 100%;
  padding: 12px;
  border-radius: var(--st-r-md);
  /* 二维码必须保持白底，否则相机识别率会下降 */
  background: white;
}
.psp__canvas { display: block; max-width: 100%; height: auto; }
.psp__logo { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.psp__logo-img { width: 26px; height: 26px; padding: 4px; border-radius: var(--st-r-xs); background: white; }

.psp__actions { display: flex; flex-wrap: wrap; gap: 8px; width: 100%; }
.psp__actions .psp__btn { flex: 1 1 150px; }
.psp__btn { width: 100%; min-width: 0; white-space: normal; text-align: center; }
.psp__countdown { align-items: center; text-align: center; gap: 4px; }
.psp__time { font-size: clamp(1.8rem, 6vw, 2.4rem); letter-spacing: 0.02em; }

.psp__spin {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid var(--st-line-2);
  border-top-color: var(--st-brand-text);
  animation: psp-spin 0.9s linear infinite;
}
@keyframes psp-spin { to { transform: rotate(360deg); } }
</style>

