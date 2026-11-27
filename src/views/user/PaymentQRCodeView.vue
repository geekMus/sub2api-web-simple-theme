<template>
  <UserShell>
    <section class="st-section--tight qrpay">
      <div class="st-shell qrpay__wrap">
        <header class="qrpay__hero">
          <p class="st-eyebrow">{{ c('pay.qr.title') }}</p>
          <h1 class="st-display-2 qrpay__title">{{ qrUrl ? scanTitle : (hasPayContext ? t('payment.qr.payInNewWindow') : c('pay.qr.title')) }}</h1>
          <p v-if="!expired && hasPayContext" class="st-lede">{{ c('qr.ledeShort') }}</p>
        </header>

        <div v-if="qrUrl && !expired" class="st-card st-card--pad qrpay__card">
          <div class="qrpay__paper">
            <canvas ref="qrCanvas" class="qrpay__canvas"></canvas>
          </div>
          <p v-if="scanHint" class="st-body qrpay__hint">{{ scanHint }}</p>
        </div>

        <div v-if="!hasPayContext" class="st-card st-card--pad qrpay__card qrpay__card--center">
          <div class="qrpay__mark">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="9" />
              <path stroke-linecap="round" d="M12 8v5m0 3.5h.01" />
            </svg>
          </div>
          <h2 class="st-display-3">{{ c('pay.qr.expiredTitle') }}</h2>
          <p class="st-body qrpay__fallback-copy">{{ c('pay.qr.expiredBody') }}</p>
          <button class="st-btn st-btn--primary qrpay__btn" @click="router.push('/purchase')">{{ t('payment.result.backToRecharge') }}</button>
        </div>

        <div v-else-if="expired" class="st-card st-card--pad qrpay__card qrpay__card--center">
          <div class="qrpay__mark qrpay__mark--bad">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v5m0 3.5h.01M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
          <h2 class="st-display-3">{{ t('payment.qr.expired') }}</h2>
          <p class="st-lede qrpay__expired-lede">{{ c('pay.qr.expiredBody') }}</p>
          <button class="st-btn st-btn--primary qrpay__btn" @click="router.push('/purchase')">{{ t('payment.result.backToRecharge') }}</button>
        </div>

        <div v-else class="st-card st-card--pad qrpay__card qrpay__card--center qrpay__countdown">
          <p class="st-stat__label">{{ qrUrl ? t('payment.qr.expiresIn') : t('payment.qr.payInNewWindowHint') }}</p>
          <p class="st-stat__value qrpay__time st-num">{{ countdownDisplay }}</p>
          <p class="qrpay__live"><span class="qrpay__dot"></span>{{ t('payment.qr.waitingPayment') }}</p>
          <a v-if="payUrl && !qrUrl" :href="payUrl" target="_blank" rel="noopener noreferrer"
            class="st-btn st-btn--primary qrpay__btn">{{ t('payment.qr.openPayWindow') }}</a>
        </div>

        <button v-if="!expired && orderId" class="st-btn st-btn--quiet qrpay__btn" :disabled="cancelling" @click="handleCancel">
          {{ cancelling ? t('common.processing') : t('payment.qr.cancelOrder') }}
        </button>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import UserShell from '@/components/shell/UserShell.vue'
import { useBillingCopy } from '@/composables/copy/billing'
import { usePaymentStore } from '@/stores/payment'
import { paymentAPI } from '@/api/payment'
import { extractI18nErrorMessage } from '@/utils/apiError'
import { useAppStore } from '@/stores'
import { isBuiltInAlipayMethod, isBuiltInWxpayMethod } from '@/components/payment/providerConfig'
import QRCode from 'qrcode'
import alipayIcon from '@/assets/icons/alipay.svg'
import wxpayIcon from '@/assets/icons/wxpay.svg'

const { t } = useI18n()
const { c } = useBillingCopy()
const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()
const appStore = useAppStore()

const qrCanvas = ref<HTMLCanvasElement | null>(null)
const qrUrl = ref('')
const payUrl = ref('')
const orderId = ref(0)
const remainingSeconds = ref(0)
const expired = ref(false)
const cancelling = ref(false)
const paymentType = ref('')

let pollTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

const countdownDisplay = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0')
})

const isAlipay = computed(() => isBuiltInAlipayMethod(paymentType.value))
const isWxpay = computed(() => isBuiltInWxpayMethod(paymentType.value))
const hasPayContext = computed(() => !!qrUrl.value || !!payUrl.value || orderId.value > 0)

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

function getLogoForType(): string | null {
  if (isAlipay.value) return alipayIcon
  if (isWxpay.value) return wxpayIcon
  return null
}

async function renderQR() {
  await nextTick()
  if (!qrCanvas.value || !qrUrl.value) return

  // Use medium error correction to support logo overlay while keeping QR code scannable
  const logoSrc = getLogoForType()
  await QRCode.toCanvas(qrCanvas.value, qrUrl.value, {
    width: 256,
    margin: 2,
    errorCorrectionLevel: logoSrc ? 'M' : 'L',
  })

  if (!logoSrc) return

  // Draw logo in center of QR code
  const canvas = qrCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new Image()
  img.src = logoSrc
  img.onload = () => {
    const logoSize = 48
    const x = (canvas.width - logoSize) / 2
    const y = (canvas.height - logoSize) / 2
    // White background with rounded corners
    const pad = 5
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    const r = 6
    ctx.moveTo(x - pad + r, y - pad)
    ctx.arcTo(x + logoSize + pad, y - pad, x + logoSize + pad, y + logoSize + pad, r)
    ctx.arcTo(x + logoSize + pad, y + logoSize + pad, x - pad, y + logoSize + pad, r)
    ctx.arcTo(x - pad, y + logoSize + pad, x - pad, y - pad, r)
    ctx.arcTo(x - pad, y - pad, x + logoSize + pad, y - pad, r)
    ctx.fill()
    // Draw logo
    ctx.drawImage(img, x, y, logoSize, logoSize)
  }
}

let pollInFlight = false
async function pollStatus() {
  if (!orderId.value) return
  // 防重入：接口响应慢于 3 秒轮询间隔时避免并发重叠请求与重复跳转。
  if (pollInFlight) return
  pollInFlight = true
  try {
    const order = await paymentStore.pollOrderStatus(orderId.value)
    if (!order) return
    // 定时器已被 cleanup 清除时不再执行终态跳转（响应可能在 cleanup 后才回来）。
    if (!pollTimer) return
    if (order.status === 'COMPLETED' || order.status === 'PAID') {
      cleanup()
      router.push({ path: '/payment/result', query: { order_id: String(orderId.value), status: 'success' } })
    } else if (order.status === 'EXPIRED' || order.status === 'CANCELLED' || order.status === 'FAILED') {
      cleanup()
      expired.value = true
    }
  } finally {
    pollInFlight = false
  }
}

function startCountdown(seconds: number) {
  remainingSeconds.value = Math.max(0, seconds)
  const deadline = Date.now() + remainingSeconds.value * 1000
  if (remainingSeconds.value <= 0) {
    expired.value = true
    return
  }
  countdownTimer = setInterval(() => {
    remainingSeconds.value = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
    if (remainingSeconds.value <= 0) {
      expired.value = true
      cleanup()
    }
  }, 1000)
}

async function handleCancel() {
  if (!orderId.value || cancelling.value) return
  cancelling.value = true
  try {
    await paymentAPI.cancelOrder(orderId.value)
    cleanup()
    router.push('/purchase')
  } catch (err: unknown) {
    appStore.showError(extractI18nErrorMessage(err, t, 'payment.errors', t('common.error')))
  } finally {
    cancelling.value = false
  }
}

function cleanup() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
}

watch(qrUrl, () => renderQR())

onMounted(() => {
  orderId.value = Number(route.query.order_id) || 0
  qrUrl.value = String(route.query.qr || '')
  payUrl.value = String(route.query.pay_url || '')
  paymentType.value = String(route.query.payment_type || '')

  // Calculate countdown from expiresAt
  const expiresAtStr = String(route.query.expires_at || '')
  let seconds = 30 * 60 // fallback: 30 minutes
  if (expiresAtStr) {
    const expiresAt = new Date(expiresAtStr)
    const now = new Date()
    seconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
  }
  startCountdown(seconds)
  pollTimer = setInterval(pollStatus, 3000)
  renderQR()
})

onUnmounted(() => cleanup())
</script>
<style scoped>
.qrpay__hero { gap: 10px; margin-bottom: clamp(26px, 4vw, 40px); }
.qrpay .st-card { box-shadow: var(--st-shadow-2); }
.qrpay__card { gap: 16px; }
.qrpay__paper {
  border-radius: var(--st-r-lg);
  padding: 16px;
  box-shadow: var(--st-shadow-2);
}
.qrpay__time { font-size: clamp(2.1rem, 8vw, 2.8rem); line-height: 1.05; }
.qrpay__live {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--st-ink-faint);
}
.qrpay__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--st-brand);
  animation: qrpay-pulse 1.6s var(--st-ease) infinite;
}
@keyframes qrpay-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.qrpay__mark { width: 56px; height: 56px; }
.qrpay__btn { min-height: 44px; }
@media (max-width: 480px) {
  .qrpay__wrap { max-width: none; }
  .qrpay__btn { min-height: 48px; }
}
</style>

<style scoped>
.qrpay { padding-bottom: clamp(56px, 8vw, 96px); }
.qrpay__wrap { max-width: 460px; }
.qrpay__hero { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.qrpay__title { margin-top: 6px; }

.qrpay__card { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-bottom: 12px; text-align: center; }
.qrpay__hint { font-size: 0.86rem; text-align: center; }
.qrpay__fallback-copy { max-width: 38ch; }

.qrpay__paper {
  display: grid;
  place-items: center;
  width: fit-content;
  max-width: 100%;
  padding: 14px;
  border-radius: var(--st-r-md);
  /* 二维码必须印在白色底上才能被相机识别，这是功能性例外 */
  background: white;
}
.qrpay__canvas { display: block; width: 256px; max-width: 100%; height: auto; }

.qrpay__mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--st-danger-soft);
  color: var(--st-danger);
}

.qrpay__time { font-size: clamp(1.8rem, 6vw, 2.4rem); letter-spacing: 0.02em; }
.qrpay__btn { width: 100%; min-width: 0; }
</style>

