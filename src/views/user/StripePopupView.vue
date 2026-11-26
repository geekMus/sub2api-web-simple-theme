<template>
  <div class="st-root stripe-pop">
    <div class="stripe-pop__wrap">
      <div class="stripe-pop__panel st-card st-card--pad">
        <div v-if="amount" class="stripe-pop__amount">
          <p class="st-eyebrow">{{ t('payment.actualPay') }}</p>
          <p class="st-display-2 stripe-pop__money st-num" :style="{ color: methodColor }">¥{{ amount }}</p>
          <p v-if="orderId" class="st-row__meta">{{ t('payment.orders.orderId') }}: {{ orderId }}</p>
        </div>

        <div v-if="error" class="stripe-pop__state">
          <div class="stripe-pop__error">{{ error }}</div>
          <button class="st-btn st-btn--quiet stripe-pop__btn" @click="closeWindow">{{ t('common.close') }}</button>
        </div>

        <div v-else-if="success" class="stripe-pop__state">
          <div class="stripe-pop__mark">
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p class="st-display-3">{{ t('payment.result.success') }}</p>
          <button class="st-btn st-btn--primary stripe-pop__btn" @click="closeWindow">{{ t('common.close') }}</button>
        </div>

        <div v-else class="stripe-pop__state stripe-pop__state--loading">
          <span class="stripe-pop__spin" :style="{ borderColor: methodColor }"></span>
          <p class="st-body stripe-pop__hint">{{ hint }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { extractI18nErrorMessage } from '@/utils/apiError'
import { isMobileDevice } from '@/utils/device'
import { buildApiUrl } from '@/api/client'

interface StripeWithWechatPay {
  confirmWechatPayPayment(clientSecret: string, options: Record<string, unknown>): Promise<{ error?: { message?: string }; paymentIntent?: { status: string } }>
}

const METHOD_COLORS: Record<string, string> = {
  alipay: '#00AEEF',
  wechat_pay: '#07C160',
}
const DEFAULT_METHOD_COLOR = '#635bff'

const { t } = useI18n()
const route = useRoute()

const orderId = String(route.query.order_id || '')
const method = String(route.query.method || 'alipay')
const amount = String(route.query.amount || '')

const methodColor = computed(() => METHOD_COLORS[method] || DEFAULT_METHOD_COLOR)

const error = ref('')
const success = ref(false)
const hint = ref(t('payment.stripePopup.redirecting'))

let pollTimer: ReturnType<typeof setInterval> | null = null
let initTimeoutTimer: ReturnType<typeof setTimeout> | null = null
let messageHandler: ((event: MessageEvent) => void) | null = null

function closeWindow() { window.close() }

function clearInitTimeout() {
  if (initTimeoutTimer) {
    clearTimeout(initTimeoutTimer)
    initTimeoutTimer = null
  }
}

onMounted(() => {
  messageHandler = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    if (event.data?.type !== 'STRIPE_POPUP_INIT') return
    // INIT 已到达，取消兜底超时，避免长时间的扫码支付被误判为超时。
    clearInitTimeout()
    if (messageHandler) {
      window.removeEventListener('message', messageHandler)
      messageHandler = null
    }
    initStripe(event.data.clientSecret, event.data.publishableKey)
  }
  window.addEventListener('message', messageHandler)

  if (window.opener) {
    window.opener.postMessage({ type: 'STRIPE_POPUP_READY' }, window.location.origin)
  }

  // 仅兜底“父窗口始终未发 STRIPE_POPUP_INIT”的场景。
  initTimeoutTimer = setTimeout(() => {
    if (!error.value && !success.value) {
      error.value = t('payment.stripePopup.timeout')
    }
  }, 15000)
})

onUnmounted(() => {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  clearInitTimeout()
  if (messageHandler) {
    window.removeEventListener('message', messageHandler)
    messageHandler = null
  }
})

async function initStripe(clientSecret: string, publishableKey: string) {
  if (!clientSecret || !publishableKey) {
    error.value = t('payment.stripeMissingParams')
    return
  }
  try {
    const { loadStripe } = await import('@stripe/stripe-js/pure')
    const stripe = await loadStripe(publishableKey)
    if (!stripe) { error.value = t('payment.stripeLoadFailed'); return }

    const returnUrl = window.location.origin + '/payment/result?order_id=' + orderId + '&status=success'

    if (method === 'alipay') {
      // Alipay: redirect this popup to Alipay payment page
      const { error: err } = await stripe.confirmAlipayPayment(clientSecret, { return_url: returnUrl })
      if (err) error.value = err.message || t('payment.result.failed')
    } else if (method === 'wechat_pay') {
      // WeChat: Stripe shows its built-in QR dialog, user scans, promise resolves
      hint.value = t('payment.stripePopup.loadingQr')
      const result = await (stripe as unknown as StripeWithWechatPay).confirmWechatPayPayment(clientSecret, {
        payment_method_options: { wechat_pay: { client: isMobileDevice() ? 'mobile_web' : 'web' } },
      })
      if (result.error) {
        error.value = result.error.message || t('payment.result.failed')
      } else if (result.paymentIntent?.status === 'succeeded') {
        success.value = true
        setTimeout(closeWindow, 2000)
      } else {
        // Payment not completed (user closed QR dialog)
        startPolling()
      }
    }
  } catch (err: unknown) {
    error.value = extractI18nErrorMessage(err, t, 'payment.errors', t('payment.stripeLoadFailed'))
  }
}

function startPolling() {
  let inFlight = false
  pollTimer = setInterval(async () => {
    // 防重入：接口响应慢于轮询间隔时避免并发重叠请求。
    if (inFlight) return
    inFlight = true
    try {
      // access token 存储在 localStorage 的 'auth_token' 键下（见 api/client.ts），
      // 之前误读 'token' 导致轮询请求不带认证、永远 401，支付成功无法被检测到。
      const token = localStorage.getItem('auth_token') || ''
      const res = await fetch(buildApiUrl(`/payment/orders/${orderId}`), {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
        credentials: 'include',
      })
      if (!res.ok) return
      const data = await res.json()
      const status = data?.data?.status
      if (status === 'COMPLETED' || status === 'PAID') {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
        success.value = true
        setTimeout(closeWindow, 2000)
      }
    } catch { /* ignore */ } finally {
      inFlight = false
    }
  }, 3000)
}
</script>
<style scoped>
.stripe-pop { display: flex; align-items: center; justify-content: center; padding: 16px; }
.stripe-pop__wrap { width: 100%; max-width: 420px; }
.stripe-pop__panel { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.stripe-pop__amount { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
.stripe-pop__money { font-size: clamp(1.9rem, 6vw, 2.5rem); }
.stripe-pop__state { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
.stripe-pop__state--loading { padding-block: 20px; }

.stripe-pop__mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--st-ok-soft);
  color: var(--st-ok);
}
.stripe-pop__error {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--st-r-sm);
  background: var(--st-danger-soft);
  color: var(--st-danger);
  font-size: 0.85rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.stripe-pop__hint { overflow-wrap: anywhere; }
.stripe-pop__spin {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border-style: solid;
  border-width: 3px;
  border-top-color: transparent !important;
  animation: stripe-pop-spin 0.9s linear infinite;
}
@keyframes stripe-pop-spin { to { transform: rotate(360deg); } }
.stripe-pop__btn { width: 100%; min-width: 0; white-space: normal; }
</style>

