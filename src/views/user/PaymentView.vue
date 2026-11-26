<template>
  <UserShell>
    <section class="st-section--tight pay">
      <div class="st-shell pay__wrap">
        <header class="pay__hero">
          <p class="st-eyebrow st-reveal">{{ c('pay.eyebrow') }}</p>
          <h1 class="st-display-2 pay__title st-reveal" style="--i: 1">{{ pageTitle }}</h1>
          <p class="st-lede pay__lede st-reveal" style="--i: 2">{{ c('pay.ledeShort') }}</p>
        </header>

        <div v-if="loading" class="pay__loading" aria-busy="true">
          <div class="pay__grid">
            <div class="pay__col">
              <div class="st-card st-card--pad pay__card">
                <div class="st-skeleton pay__sk pay__sk--sm"></div>
                <div class="st-skeleton pay__sk pay__sk--lg"></div>
              </div>
            </div>
            <div class="pay__col">
              <div class="st-card st-card--pad pay__card">
                <div class="st-skeleton pay__sk pay__sk--sm"></div>
                <div class="st-skeleton pay__sk pay__sk--lg"></div>
              </div>
            </div>
          </div>
        </div>

        <template v-else>
          <div v-if="tabs.length > 1 && paymentPhase === 'select' && !selectedPlan" class="st-seg pay__tabs" role="tablist">
            <button v-for="tab in tabs" :key="tab.key" type="button" role="tab"
              :aria-selected="activeTab === tab.key"
              class="st-seg__item pay__tab"
              :class="{ 'st-seg__item--active': activeTab === tab.key }"
              @click="activeTab = tab.key">{{ tab.label }}</button>
          </div>

          <PaymentStatusPanel v-if="paymentPhase === 'paying'"
            :order-id="paymentState.orderId"
            :amount="paymentState.amount"
            :pay-amount="paymentState.payAmount"
            :qr-code="paymentState.qrCode"
            :expires-at="paymentState.expiresAt"
            :payment-type="paymentState.paymentType"
            :pay-url="paymentState.payUrl"
            :order-type="paymentState.orderType"
            :currency="paymentState.currency || selectedCurrency"
            :out-trade-no="paymentState.outTradeNo"
            :mobile-alipay-deep-link="paymentState.alipayMobilePrecreateDeepLink"
            @done="onPaymentDone"
            @success="onPaymentSuccess"
            @settled="onPaymentSettled"
          />

          <template v-else>
            <div v-if="tabs.length === 0" class="st-card st-card--pad pay__empty">
              <div class="pay__empty-icon">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9" /><path stroke-linecap="round" d="M12 8v5m0 3.5h.01" /></svg>
              </div>
              <p class="st-body">{{ t('payment.billingUnavailable') }}</p>
              <button class="st-btn st-btn--quiet pay__empty-btn" @click="router.push('/orders')">{{ c('result.orders') }}</button>
            </div>

            <template v-else-if="activeTab === 'recharge'">
              <div class="pay__grid">
                <div class="pay__col">
                  <div class="st-card st-card--pad pay__card pay__account">
                    <p class="st-eyebrow">{{ t('payment.rechargeAccount') }}</p>
                    <div class="pay__account-row">
                      <p class="st-display-3 pay__account-name">{{ user?.username || '' }}</p>
                      <span class="st-pill st-pill--ok st-num">{{ t('payment.currentBalance') }}: {{ user?.balance?.toFixed(2) || '0.00' }}</span>
                    </div>
                  </div>

                  <div v-if="enabledMethods.length === 0" class="st-card st-card--pad pay__empty">
                    <div class="pay__empty-icon">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="18" height="12" rx="2" /><path stroke-linecap="round" d="M3 10h18" /></svg>
                    </div>
                    <p class="st-body">{{ t('payment.notAvailable') }}</p>
                    <button class="st-btn st-btn--quiet pay__empty-btn" @click="reloadPage">{{ c('pay.reload') }}</button>
                  </div>
                  <template v-else>
                    <div class="st-card st-card--pad pay__card">
                      <div
                        v-if="renderedBonusNotice"
                        class="pay__notice"
                        data-testid="recharge-bonus-notice"
                        v-html="renderedBonusNotice"
                      ></div>
                      <AmountInput
                        v-model="amount"
                        :amounts="[10, 20, 50, 100, 200, 500, 1000, 2000, 5000]"
                        :min="globalMinAmount"
                        :max="globalMaxAmount"
                        :bonus-tiers="rechargeBonusTiers"
                        :bonus-mode="rechargeBonusMode"
                        :multiplier="balanceRechargeMultiplier"
                        :currency="selectedCurrency"
                      />
                      <p v-if="amountError" class="pay__hint pay__hint--warn">{{ amountError }}</p>
                    </div>

                    <div class="st-card st-card--pad pay__card">
                      <h2 class="st-display-4">{{ c('pay.summary') }}</h2>
                      <div class="pay__rows">
                        <div class="st-row pay__row">
                          <span class="st-row__meta">{{ t('payment.paymentAmount') }}</span>
                          <span class="pay__row-value" :class="{ 'pay__row-value--muted': discountAmount > 0 }">{{ formatSelectedPaymentAmount(validAmount) }}</span>
                        </div>
                        <div v-if="discountAmount > 0" class="st-row pay__row" data-testid="recharge-discount-row">
                          <span class="st-row__meta">{{ t('payment.rechargeBonus.discountLabelWithPercent', { percent: formatRechargeBonusNumber(bonusQuote.percent) }) }}</span>
                          <span class="pay__row-value pay__row-value--accent">-{{ formatSelectedPaymentAmount(discountAmount) }}</span>
                        </div>
                        <div v-if="feeRate > 0" class="st-row pay__row">
                          <span class="st-row__meta">{{ t('payment.fee') }} ({{ feeRate }}%)</span>
                          <span class="pay__row-value">{{ formatSelectedPaymentAmount(feeAmount) }}</span>
                        </div>
                        <div v-if="showActualPay" class="pay__total">
                          <span class="st-stat__label">{{ t('payment.actualPay') }}</span>
                          <span class="st-stat__value st-num">{{ formatSelectedPaymentAmount(totalAmount) }}<span class="pay__total-unit">{{ selectedCurrency }}</span></span>
                        </div>
                        <div v-if="showBonusRow" class="st-row pay__row" data-testid="recharge-bonus-row">
                          <span class="st-row__meta">{{ t('payment.rechargeBonus.amountLabelWithPercent', { percent: formatRechargeBonusNumber(bonusQuote.percent) }) }}</span>
                          <span class="pay__row-value pay__row-value--accent">+{{ '$' + bonusQuote.bonus.toFixed(2) }}</span>
                        </div>
                        <div v-if="showCreditedBalance" class="st-row pay__row" data-testid="recharge-credited-row">
                          <span class="st-row__meta">{{ t('payment.creditedBalance') }}</span>
                          <span class="pay__row-value">{{ '$' + creditedAmount.toFixed(2) }}</span>
                        </div>
                      </div>
                      <p v-if="balanceRechargeMultiplier !== 1" class="pay__hint">
                        {{ t('payment.rechargeRatePreview', { currency: selectedCurrency, usd: formatBalanceRechargeMultiplier(balanceRechargeMultiplier) }) }}
                      </p>
                    </div>
                  </template>
                </div>

                <div v-if="enabledMethods.length >= 1" class="pay__col">
                  <div class="st-card st-card--pad pay__card">
                    <div class="pay__card-head">
                      <h2 class="st-display-4">{{ c('pay.methods') }}</h2>
                      <p class="st-body pay__card-lede">{{ c('pay.methodsLede') }}</p>
                    </div>
                    <PaymentMethodSelector
                      :methods="methodOptions"
                      :selected="selectedMethod"
                      @select="selectedMethod = $event"
                    />
                  </div>

                  <div class="pay__submit-area">
                  <div v-if="errorMessage" class="pay__error" role="alert">
                    <div class="pay__error-icon">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9" /><path stroke-linecap="round" d="M12 8v5m0 3.5h.01" /></svg>
                    </div>
                    <div class="pay__error-copy">
                      <p class="pay__error-title">{{ errorMessage }}</p>
                      <p v-if="errorHintMessage" class="pay__error-hint">{{ errorHintMessage }}</p>
                    </div>
                    <button class="st-btn st-btn--quiet st-btn--sm pay__error-retry" @click="retryPayment">{{ c('pay.retry') }}</button>
                  </div>
                    <button class="st-btn st-btn--primary st-btn--lg pay__submit" :disabled="!canSubmit || submitting" @click="handleSubmitRecharge">
                      <span v-if="submitting" class="pay__spin-row">
                        <span class="pay__spin"></span>
                        {{ t('common.processing') }}
                      </span>
                      <span v-else>{{ t('payment.createOrder') }} {{ formatSelectedPaymentAmount(totalAmount) }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="activeTab === 'subscription'">
              <div v-if="selectedPlan" class="pay__grid">
                <div class="pay__col">
                  <div class="st-card st-card--pad pay__card">
                    <div class="pay__plan-head">
                      <span class="pay__badge" :class="planBadgeClass">{{ platformLabel(selectedPlan.group_platform || '') }}</span>
                      <h2 class="st-display-3 pay__plan-name">{{ selectedPlan.name }}</h2>
                    </div>
                    <div class="pay__price">
                      <span v-if="selectedPlan.original_price" class="pay__price-old">
                        {{ formatSelectedSubscriptionPaymentAmount(selectedPlan.original_price) }}
                      </span>
                      <span class="pay__price-now" :class="planTextClass">{{ formatSelectedSubscriptionPaymentAmount(selectedPlan.price) }}</span>
                      <span class="pay__price-unit">/ {{ planValiditySuffix }}</span>
                    </div>
                    <p v-if="selectedPlan.description" class="st-body pay__plan-desc">
                      {{ selectedPlan.description }}
                    </p>
                    <div class="pay__plan-grid">
                      <div>
                        <span class="st-row__meta">{{ t('payment.planCard.rate') }}</span>
                        <div class="pay__plan-value" :class="planTextClass">&times;{{ selectedPlan.rate_multiplier ?? 1 }}</div>
                      </div>
                      <div v-if="planHasPeakRate(selectedPlan)">
                        <span class="st-row__meta">{{ t('payment.planCard.peakRate') }}</span>
                        <div class="pay__plan-value pay__plan-value--warn">{{ planPeakRateLabel(selectedPlan) }}</div>
                      </div>
                      <div v-if="selectedPlan.daily_limit_usd != null">
                        <span class="st-row__meta">{{ t('payment.planCard.dailyLimit') }}</span>
                        <div class="pay__plan-value st-num">{{ '$' + selectedPlan.daily_limit_usd }}</div>
                      </div>
                      <div v-if="selectedPlan.weekly_limit_usd != null">
                        <span class="st-row__meta">{{ t('payment.planCard.weeklyLimit') }}</span>
                        <div class="pay__plan-value st-num">{{ '$' + selectedPlan.weekly_limit_usd }}</div>
                      </div>
                      <div v-if="selectedPlan.monthly_limit_usd != null">
                        <span class="st-row__meta">{{ t('payment.planCard.monthlyLimit') }}</span>
                        <div class="pay__plan-value st-num">{{ '$' + selectedPlan.monthly_limit_usd }}</div>
                      </div>
                      <div v-if="selectedPlan.daily_limit_usd == null && selectedPlan.weekly_limit_usd == null && selectedPlan.monthly_limit_usd == null">
                        <span class="st-row__meta">{{ t('payment.planCard.quota') }}</span>
                        <div class="pay__plan-value">{{ t('payment.planCard.unlimited') }}</div>
                      </div>
                    </div>
                  </div>

                  <div v-if="feeRate > 0 && selectedPlan.price > 0" class="st-card st-card--pad pay__card">
                    <div class="pay__rows">
                      <div class="st-row pay__row">
                        <span class="st-row__meta">{{ t('payment.amountLabel') }}</span>
                        <span class="pay__row-value">{{ formatSelectedPaymentAmount(subPaymentAmount) }}</span>
                      </div>
                      <div class="st-row pay__row">
                        <span class="st-row__meta">{{ t('payment.fee') }} ({{ feeRate }}%)</span>
                        <span class="pay__row-value">{{ formatSelectedPaymentAmount(subFeeAmount) }}</span>
                      </div>
                      <div class="pay__total">
                        <span class="st-stat__label">{{ t('payment.actualPay') }}</span>
                        <span class="st-stat__value st-num">{{ formatSelectedPaymentAmount(subTotalAmount) }}<span class="pay__total-unit">{{ selectedCurrency }}</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="pay__col">
                  <div v-if="enabledMethods.length >= 1" class="st-card st-card--pad pay__card">
                    <div class="pay__card-head">
                      <h2 class="st-display-4">{{ c('pay.methods') }}</h2>
                      <p class="st-body pay__card-lede">{{ c('pay.methodsLede') }}</p>
                    </div>
                    <PaymentMethodSelector
                      :methods="subMethodOptions"
                      :selected="selectedMethod"
                      @select="selectedMethod = $event"
                    />
                  </div>
                  <div class="pay__submit-area">
                  <div v-if="errorMessage" class="pay__error" role="alert">
                    <div class="pay__error-icon">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9" /><path stroke-linecap="round" d="M12 8v5m0 3.5h.01" /></svg>
                    </div>
                    <div class="pay__error-copy">
                      <p class="pay__error-title">{{ errorMessage }}</p>
                      <p v-if="errorHintMessage" class="pay__error-hint">{{ errorHintMessage }}</p>
                    </div>
                    <button class="st-btn st-btn--quiet st-btn--sm pay__error-retry" @click="retryPayment">{{ c('pay.retry') }}</button>
                  </div>
                    <button class="st-btn st-btn--primary st-btn--lg pay__submit" :disabled="!canSubmitSubscription || submitting" @click="confirmSubscribe">
                      <span v-if="submitting" class="pay__spin-row">
                        <span class="pay__spin"></span>
                        {{ t('common.processing') }}
                      </span>
                      <span v-else>{{ t('payment.createOrder') }} {{ formatSelectedPaymentAmount(subTotalAmount) }}</span>
                    </button>
                    <button class="st-btn st-btn--quiet st-btn--lg pay__back" @click="selectedPlan = null">{{ t('common.cancel') }}</button>
                  </div>
                </div>
              </div>

              <template v-else>
                <div v-if="checkout.plans.length === 0" class="st-card st-card--pad pay__empty">
                  <div class="pay__empty-icon">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6"><path d="M4 7h16M6 7v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" stroke-linecap="round" /><path d="M9 11h6" stroke-linecap="round" /></svg>
                  </div>
                  <p class="st-body">{{ t('payment.noPlans') }}</p>
                  <button v-if="tabs.length > 1" class="st-btn st-btn--quiet pay__empty-btn" @click="activeTab = 'recharge'">{{ t('payment.tabTopUp') }}</button>
                </div>
                <div v-else :class="planGridClass" class="pay__plans">
                  <SubscriptionPlanCard v-for="plan in checkout.plans" :key="plan.id" :plan="plan" :active-subscriptions="activeSubscriptions" @select="selectPlan" />
                </div>

                <div v-if="activeSubscriptions.length > 0" class="st-card st-card--pad pay__card pay__subs">
                  <h2 class="st-display-4">{{ t('payment.activeSubscription') }}</h2>
                  <div class="st-list">
                    <div v-for="sub in activeSubscriptions" :key="sub.id" class="st-row pay__sub">
                      <div class="pay__sub-main">
                        <div class="pay__sub-title">
                          <span class="pay__sub-name">{{ sub.group?.name || t('payment.groupFallback', { id: sub.group_id }) }}</span>
                          <span class="st-pill pay__sub-platform" :class="platformBadgeLightClass(sub.group?.platform || '')">{{ platformLabel(sub.group?.platform || '') }}</span>
                        </div>
                        <div class="pay__sub-meta">
                          <span>{{ t('payment.planCard.rate') }}: &times;{{ sub.group?.rate_multiplier ?? 1 }}</span>
                          <span v-if="subscriptionHasPeakRate(sub)">{{ t('payment.planCard.peakRate') }}: {{ subscriptionPeakRateLabel(sub) }}</span>
                          <span v-if="sub.group?.daily_limit_usd == null && sub.group?.weekly_limit_usd == null && sub.group?.monthly_limit_usd == null">{{ t('payment.planCard.quota') }}: {{ t('payment.planCard.unlimited') }}</span>
                          <span v-if="sub.expires_at">{{ t('userSubscriptions.daysRemaining', { days: getDaysRemaining(sub.expires_at) }) }}</span>
                          <span v-else>{{ t('userSubscriptions.noExpiration') }}</span>
                        </div>
                      </div>
                      <span class="st-pill st-pill--ok">{{ t('userSubscriptions.status.active') }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </template>

            <div v-if="(checkout.help_text || checkout.help_image_url) && paymentPhase === 'select' && !selectedPlan" class="st-card st-card--pad pay__card pay__help">
              <img v-if="checkout.help_image_url" :src="checkout.help_image_url" alt=""
                class="pay__help-img" @click="previewImage = checkout.help_image_url" />
              <div v-if="checkout.help_text" class="markdown-body pay__help-text" v-html="renderedHelpText"></div>
            </div>
          </template>
        </template>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showRenewalModal" class="pay__modal-mask" @click.self="closeRenewalModal">
          <div class="pay__modal st-card">
            <button class="st-icon-btn pay__modal-close" type="button" :aria-label="t('common.close')" @click="closeRenewalModal">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 class="st-display-3 pay__modal-title">{{ t('payment.selectPlan') }}</h3>
            <div class="pay__modal-body">
              <SubscriptionPlanCard v-for="plan in renewalPlans" :key="plan.id" :plan="plan" :active-subscriptions="activeSubscriptions" @select="selectPlanFromModal" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="previewImage" class="pay__preview-mask" @click="previewImage = ''">
          <img :src="previewImage" alt="" class="pay__preview-img" />
        </div>
      </Transition>
    </Teleport>
  </UserShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import '@/styles/announcement-markdown.css'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePaymentStore } from '@/stores/payment'
import { useSubscriptionStore } from '@/stores/subscriptions'
import { useAppStore } from '@/stores'
import { FeatureFlags, resolveFeatureFlag } from '@/utils/featureFlags'
import { paymentAPI } from '@/api/payment'
import { extractApiErrorMessage, extractI18nErrorMessage } from '@/utils/apiError'
import { isMobileDevice } from '@/utils/device'
import { hasPeakRate, formatPeakRateWindow, serverTimezoneLabel, type PeakRateFields } from '@/utils/peak-rate'
import type { SubscriptionPlan, CheckoutInfoResponse, CreateOrderResult, OrderType } from '@/types/payment'
import { formatBalanceRechargeMultiplier, formatRechargeBonusNumber, normalizeRechargeBonusMode, normalizeRechargeBonusTiers, quoteRechargeBonus } from '@/utils/rechargeBonus'
import UserShell from '@/components/shell/UserShell.vue'
import { useBillingCopy } from '@/composables/copy/billing'
import AmountInput from '@/components/payment/AmountInput.vue'
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector.vue'
import { METHOD_ORDER, getPaymentPopupFeatures } from '@/components/payment/providerConfig'
import {
  PAYMENT_RECOVERY_STORAGE_KEY,
  buildCreateOrderPayload,
  clearPaymentRecoverySnapshot,
  decidePaymentLaunch,
  getVisibleMethods,
  normalizeVisibleMethod,
  readPaymentRecoverySnapshot,
  type PaymentRecoverySnapshot,
  writePaymentRecoverySnapshot,
} from '@/components/payment/paymentFlow'
import { platformBadgeLightClass, platformBadgeClass, platformTextClass, platformLabel } from '@/utils/platformColors'
import SubscriptionPlanCard from '@/components/payment/SubscriptionPlanCard.vue'
import PaymentStatusPanel from '@/components/payment/PaymentStatusPanel.vue'
import { DEFAULT_PAYMENT_CURRENCY, formatPaymentAmount, normalizePaymentCurrency } from '@/components/payment/currency'
import { planValiditySuffix as validitySuffixOf } from '@/components/payment/validity'
import type { PaymentMethodOption } from '@/components/payment/PaymentMethodSelector.vue'
import { buildPaymentErrorToastMessage, describePaymentScenarioError } from './paymentUx'
import { hasWechatResumeQuery, parseWechatResumeRoute, stripWechatResumeQuery } from './paymentWechatResume'

const i18n = useI18n()
const { t } = i18n
const { c } = useBillingCopy()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const paymentStore = usePaymentStore()
const subscriptionStore = useSubscriptionStore()
const appStore = useAppStore()

const user = computed(() => authStore.user)
const activeSubscriptions = computed(() => subscriptionStore.activeSubscriptions)

function getDaysRemaining(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function subscriptionHasPeakRate(sub: { group?: PeakRateFields | null }): boolean {
  return hasPeakRate(sub.group)
}

function subscriptionPeakRateLabel(sub: { group?: PeakRateFields | null }): string {
  return formatPeakRateWindow(sub.group, serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset))
}

const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const errorHintMessage = ref('')
const activeTab = ref<'recharge' | 'subscription'>('recharge')
const amount = ref<number | null>(null)
const selectedMethod = ref('')
const selectedPlan = ref<SubscriptionPlan | null>(null)
const previewImage = ref('')

const paymentPhase = ref<'select' | 'paying'>('select')

interface CreateOrderOptions {
  openid?: string
  wechatResumeToken?: string
  paymentType?: string
  isResume?: boolean
  mobileQrFallbackAttempted?: boolean
}

interface WeixinJSBridgeLike {
  invoke(
    action: string,
    payload: Record<string, unknown>,
    callback: (result: Record<string, unknown>) => void,
  ): void
}

function emptyPaymentState(): PaymentRecoverySnapshot {
  return {
    orderId: 0,
    amount: 0,
    qrCode: '',
    expiresAt: '',
    paymentType: '',
    payUrl: '',
    outTradeNo: '',
    clientSecret: '',
    intentId: '',
    currency: '',
    countryCode: '',
    paymentEnv: '',
    payAmount: 0,
    orderType: '',
    paymentMode: '',
    resumeToken: '',
    alipayMobilePrecreateDeepLink: false,
    createdAt: 0,
  }
}

function getWeixinJSBridge(): WeixinJSBridgeLike | undefined {
  return (window as Window & { WeixinJSBridge?: WeixinJSBridgeLike }).WeixinJSBridge
}

function waitForWeixinJSBridge(timeoutMs = 4000): Promise<WeixinJSBridgeLike | null> {
  const existing = getWeixinJSBridge()
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve) => {
    let settled = false
    const finish = (bridge: WeixinJSBridgeLike | null) => {
      if (settled) return
      settled = true
      document.removeEventListener('WeixinJSBridgeReady', handleReady)
      document.removeEventListener('onWeixinJSBridgeReady', handleReady)
      window.clearTimeout(timer)
      resolve(bridge)
    }
    const handleReady = () => finish(getWeixinJSBridge() ?? null)
    const timer = window.setTimeout(() => finish(getWeixinJSBridge() ?? null), timeoutMs)
    document.addEventListener('WeixinJSBridgeReady', handleReady, false)
    document.addEventListener('onWeixinJSBridgeReady', handleReady, false)
  })
}

async function invokeWechatJsapiPayment(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const bridge = await waitForWeixinJSBridge()
  if (!bridge) {
    throw new Error('WECHAT_JSAPI_UNAVAILABLE')
  }
  return new Promise((resolve) => {
    bridge.invoke('getBrandWCPayRequest', payload, (result) => resolve(result || {}))
  })
}

const paymentState = ref<PaymentRecoverySnapshot>(emptyPaymentState())

function persistRecoverySnapshot(snapshot: PaymentRecoverySnapshot) {
  if (typeof window === 'undefined' || !snapshot.orderId) return
  writePaymentRecoverySnapshot(window.localStorage, snapshot, PAYMENT_RECOVERY_STORAGE_KEY)
}

function removeRecoverySnapshot() {
  if (typeof window === 'undefined') return
  clearPaymentRecoverySnapshot(window.localStorage, PAYMENT_RECOVERY_STORAGE_KEY)
}

function resetPayment() {
  paymentPhase.value = 'select'
  paymentState.value = emptyPaymentState()
  removeRecoverySnapshot()
}

async function redirectToPaymentResult(state: PaymentRecoverySnapshot): Promise<void> {
  const query: Record<string, string | undefined> = {}
  if (state.orderId > 0) {
    query.order_id = String(state.orderId)
  }
  if (state.outTradeNo) {
    query.out_trade_no = state.outTradeNo
  }
  if (state.resumeToken) {
    query.resume_token = state.resumeToken
  }
  await router.push({
    path: '/payment/result',
    query,
  })
}

function buildWechatOAuthAuthorizeUrl(
  authorizeUrl: string,
  context: { paymentType: string; orderType: OrderType; planId?: number; orderAmount: number },
): string {
  const normalizedUrl = authorizeUrl.trim()
  if (!normalizedUrl || typeof window === 'undefined') {
    return normalizedUrl
  }

  try {
    const targetUrl = new URL(normalizedUrl, window.location.origin)
    const redirectPath = targetUrl.searchParams.get('redirect') || '/purchase'
    const redirectUrl = new URL(redirectPath, window.location.origin)
    const paymentType = normalizeVisibleMethod(context.paymentType) || context.paymentType.trim() || 'wxpay'

    redirectUrl.searchParams.set('payment_type', paymentType)
    redirectUrl.searchParams.set('order_type', context.orderType)

    if (context.planId) {
      redirectUrl.searchParams.set('plan_id', String(context.planId))
    } else {
      redirectUrl.searchParams.delete('plan_id')
    }

    if (context.orderAmount > 0) {
      redirectUrl.searchParams.set('amount', String(context.orderAmount))
    } else {
      redirectUrl.searchParams.delete('amount')
    }

    targetUrl.searchParams.set('redirect', `${redirectUrl.pathname}${redirectUrl.search}`)
    return targetUrl.toString()
  } catch {
    return normalizedUrl
  }
}

function onPaymentDone() {
  const wasSubscription = paymentState.value.orderType === 'subscription'
  resetPayment()
  selectedPlan.value = null
  if (wasSubscription) {
    subscriptionStore.fetchActiveSubscriptions(true).catch(() => {})
  }
}

async function onPaymentSuccess() {
  const completedPayment = { ...paymentState.value }
  removeRecoverySnapshot()
  authStore.refreshUser()
  if (paymentState.value.orderType === 'subscription') {
    subscriptionStore.fetchActiveSubscriptions(true).catch(() => {})
  }
  await redirectToPaymentResult(completedPayment)
}

function onPaymentSettled() {
  removeRecoverySnapshot()
}

// All checkout data from single API call
const checkout = ref<CheckoutInfoResponse>({
  methods: {}, global_min: 0, global_max: 0,
  plans: [], balance_disabled: false, balance_recharge_multiplier: 1, subscription_usd_to_cny_rate: 0, recharge_fee_rate: 0, help_text: '', help_image_url: '', stripe_publishable_key: '',
  recharge_bonus_tiers: [], recharge_bonus_mode: 'bonus', recharge_bonus_notice: '',
})

const renderedHelpText = computed(() => DOMPurify.sanitize(
  marked.parse(checkout.value.help_text || '', { async: false, gfm: true, breaks: false }),
))

// 充值赠送活动文案：后台 Markdown 配置，空字符串时金额卡顶部不渲染
const renderedBonusNotice = computed(() => {
  const raw = (checkout.value.recharge_bonus_notice || '').trim()
  if (!raw) return ''
  return DOMPurify.sanitize(marked.parse(raw, { async: false, gfm: true, breaks: true }))
})

// 订阅功能开关（public settings 的 subscription_enabled，opt-out）。关闭后购买页只保留充值：
// 不再渲染「订阅」tab，只剩单个 tab 时顶部切换器也随之隐藏。
const subscriptionEnabled = computed(() => resolveFeatureFlag(appStore.cachedPublicSettings, FeatureFlags.subscription))

const tabs = computed(() => {
  const result: { key: 'recharge' | 'subscription'; label: string }[] = []
  if (!checkout.value.balance_disabled) result.push({ key: 'recharge', label: t('payment.tabTopUp') })
  if (subscriptionEnabled.value) result.push({ key: 'subscription', label: t('payment.tabSubscribe') })
  return result
})

// tab 列表随 checkout（balance_disabled）与订阅开关变化。当前 tab 不在列表里时收敛到第一个可用 tab，
// 两个方向都覆盖：关闭订阅 → 回到充值；仅订阅站点重新打开订阅 → 进入订阅。列表为空时模板展示不可用提示。
watch(tabs, (available) => {
  if (available.some((tab) => tab.key === activeTab.value)) return
  const leavingSubscription = activeTab.value === 'subscription'
  activeTab.value = available[0]?.key ?? 'recharge'
  if (leavingSubscription) selectedPlan.value = null
})

const visibleMethods = computed(() => getVisibleMethods(checkout.value.methods))
const enabledMethods = computed(() => Object.keys(visibleMethods.value))
const validAmount = computed(() => amount.value ?? 0)
const balanceRechargeMultiplier = computed(() => {
  const multiplier = checkout.value.balance_recharge_multiplier
  return Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1
})
// 订阅 CNY 换算汇率（1 USD = X CNY）。0 = 未配置，订阅保持 price 直付（与后端 opt-in 条件严格镜像）。
const subscriptionUsdToCnyRate = computed(() => {
  const rate = checkout.value.subscription_usd_to_cny_rate
  return Number.isFinite(rate) && rate > 0 ? rate : 0
})
const rechargeBonusTiers = computed(() => normalizeRechargeBonusTiers(checkout.value.recharge_bonus_tiers))
const rechargeBonusMode = computed(() => normalizeRechargeBonusMode(checkout.value.recharge_bonus_mode))

// Adaptive grid: center single card, 2-col for 2 plans, 3-col for 3+
const planGridClass = computed(() => {
  const n = checkout.value.plans.length
  if (n <= 2) return 'grid grid-cols-1 gap-5 sm:grid-cols-2'
  return 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'
})

// Check if an amount fits a method's [min, max]. 0 = no limit.
function amountFitsMethod(amt: number, methodType: string): boolean {
  if (amt <= 0) return true
  const ml = visibleMethods.value[methodType]
  if (!ml) return false
  if (ml.single_min > 0 && amt < ml.single_min) return false
  if (ml.single_max > 0 && amt > ml.single_max) return false
  return true
}

// Visible methods decide the amount range shown to users.
const globalMinAmount = computed(() => {
  const limits = Object.values(visibleMethods.value)
  if (limits.length === 0) return 0
  if (limits.some(limit => limit.single_min <= 0)) return 0
  return Math.min(...limits.map(limit => limit.single_min))
})
const globalMaxAmount = computed(() => {
  const limits = Object.values(visibleMethods.value)
  if (limits.length === 0) return 0
  if (limits.some(limit => limit.single_max <= 0)) return 0
  return Math.max(...limits.map(limit => limit.single_max))
})

// Selected method's limits (for validation and error messages)
const selectedLimit = computed(() => visibleMethods.value[selectedMethod.value])
const selectedCurrency = computed(() => normalizePaymentCurrency(selectedLimit.value?.currency))
const localeCode = computed(() => {
  const raw = i18n.locale as unknown
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'value' in raw) {
    return String((raw as { value?: string }).value || '')
  }
  return undefined
})

function currencyFractionDigits(currency: string): number {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

function roundPaymentAmount(value: number, currency: string): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** currencyFractionDigits(currency)
  return Math.round(value * factor) / factor
}

function ceilPaymentAmount(value: number, currency: string): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** currencyFractionDigits(currency)
  return Math.ceil(value * factor) / factor
}

function subscriptionPaymentAmountForCurrency(value: number, currency: string): number {
  const rate = subscriptionUsdToCnyRate.value
  if (rate <= 0 || currency !== DEFAULT_PAYMENT_CURRENCY) return roundPaymentAmount(value, currency)
  return roundPaymentAmount(value * rate, currency)
}

function formatSelectedPaymentAmount(value: number): string {
  return formatPaymentAmount(value, selectedCurrency.value, localeCode.value)
}

function formatSelectedSubscriptionPaymentAmount(value: number): string {
  return formatSelectedPaymentAmount(subscriptionPaymentAmountForCurrency(value, selectedCurrency.value))
}

// 充值优惠：阈值按输入金额命中；赠金模式按到账基数（输入 × 倍率）加赠送，折扣模式按百分比减实付。
// 与后端 quoteRechargeBonus 一致；渠道限额、手续费、实付都按折后基数（payBaseAmount）计算，提交仍发送输入金额。
const bonusQuote = computed(() => quoteRechargeBonus(rechargeBonusTiers.value, validAmount.value, {
  multiplier: balanceRechargeMultiplier.value,
  mode: rechargeBonusMode.value,
  currencyDigits: currencyFractionDigits(selectedCurrency.value),
}))
const payBaseAmount = computed(() => bonusQuote.value.payBase)
const discountAmount = computed(() => roundPaymentAmount(validAmount.value - payBaseAmount.value, selectedCurrency.value))
const creditedAmount = computed(() => bonusQuote.value.credited)
const showBonusRow = computed(() => bonusQuote.value.mode !== 'discount' && bonusQuote.value.bonus > 0)
const showCreditedBalance = computed(() => balanceRechargeMultiplier.value !== 1 || bonusQuote.value.percent > 0)

const methodOptions = computed<PaymentMethodOption[]>(() =>
  enabledMethods.value.map((type) => {
    const ml = visibleMethods.value[type]
    return {
      type,
      display_name: ml?.display_name,
      fee_rate: ml?.fee_rate ?? 0,
      available: ml?.available !== false && amountFitsMethod(payBaseAmount.value, type),
    }
  })
)

const feeRate = computed(() => checkout.value?.recharge_fee_rate ?? 0)
const feeAmount = computed(() =>
  feeRate.value > 0 && payBaseAmount.value > 0
    ? Math.ceil(((payBaseAmount.value * feeRate.value) / 100) * 100) / 100
    : 0
)
const totalAmount = computed(() =>
  feeRate.value > 0 && payBaseAmount.value > 0
    ? Math.round((payBaseAmount.value + feeAmount.value) * 100) / 100
    : payBaseAmount.value
)
const showActualPay = computed(() => feeRate.value > 0 || discountAmount.value > 0)

const amountError = computed(() => {
  if (validAmount.value <= 0) return ''
  // No method can handle this amount
  if (!enabledMethods.value.some((m) => amountFitsMethod(payBaseAmount.value, m))) {
    return t('payment.amountNoMethod')
  }
  // Selected method can't handle this amount (but others can)
  const ml = selectedLimit.value
  if (ml) {
    if (ml.single_min > 0 && payBaseAmount.value < ml.single_min) return t('payment.amountTooLow', { min: formatSelectedPaymentAmount(ml.single_min) })
    if (ml.single_max > 0 && payBaseAmount.value > ml.single_max) return t('payment.amountTooHigh', { max: formatSelectedPaymentAmount(ml.single_max) })
  }
  return ''
})

const canSubmit = computed(() =>
  validAmount.value > 0
    && amountFitsMethod(payBaseAmount.value, selectedMethod.value)
    && selectedLimit.value?.available !== false
)

const subPaymentAmount = computed(() => {
  const price = selectedPlan.value?.price ?? 0
  return subscriptionPaymentAmountForCurrency(price, selectedCurrency.value)
})

const subFeeAmount = computed(() => {
  if (feeRate.value <= 0 || subPaymentAmount.value <= 0) return 0
  return ceilPaymentAmount((subPaymentAmount.value * feeRate.value) / 100, selectedCurrency.value)
})

const subTotalAmount = computed(() => {
  if (feeRate.value <= 0 || subPaymentAmount.value <= 0) return subPaymentAmount.value
  return roundPaymentAmount(subPaymentAmount.value + subFeeAmount.value, selectedCurrency.value)
})

function subscriptionTotalAmountForCurrency(value: number, currency: string): number {
  const paymentAmount = subscriptionPaymentAmountForCurrency(value, currency)
  if (feeRate.value <= 0 || paymentAmount <= 0) return paymentAmount
  const fee = ceilPaymentAmount((paymentAmount * feeRate.value) / 100, currency)
  return roundPaymentAmount(paymentAmount + fee, currency)
}

// Subscription-specific: method options based on gateway pay amount
const subMethodOptions = computed<PaymentMethodOption[]>(() => {
  const price = selectedPlan.value?.price ?? 0
  return enabledMethods.value.map((type) => {
    const ml = visibleMethods.value[type]
    const currency = normalizePaymentCurrency(ml?.currency)
    return {
      type,
      display_name: ml?.display_name,
      fee_rate: ml?.fee_rate ?? 0,
      available: ml?.available !== false && amountFitsMethod(subscriptionTotalAmountForCurrency(price, currency), type),
    }
  })
})

const canSubmitSubscription = computed(() =>
  selectedPlan.value !== null
    && amountFitsMethod(subTotalAmount.value, selectedMethod.value)
    && selectedLimit.value?.available !== false
)

// Auto-switch to first available method when current selection can't handle the amount
watch(() => [payBaseAmount.value, selectedMethod.value] as const, ([amt, method]) => {
  if (amt <= 0 || amountFitsMethod(amt, method)) return
  const available = enabledMethods.value.find((m) => amountFitsMethod(amt, m))
  if (available) selectedMethod.value = available
})

const pageTitle = computed(() => {
  if (selectedPlan.value) return c('pay.titleSubscribe')
  if (activeTab.value === 'subscription') return c('pay.planList')
  return c('pay.title')
})

// Subscription confirm: platform accent colors (clean card, no gradient)
const planBadgeClass = computed(() => platformBadgeClass(selectedPlan.value?.group_platform || ''))
const planTextClass = computed(() => platformTextClass(selectedPlan.value?.group_platform || ''))

// Renewal modal state
const showRenewalModal = ref(false)
const renewGroupId = ref<number | null>(null)
const renewalPlans = computed(() => {
  if (renewGroupId.value == null) return []
  return checkout.value.plans.filter(p => p.group_id === renewGroupId.value)
})

const planValiditySuffix = computed(() => {
  if (!selectedPlan.value) return ''
  return validitySuffixOf(selectedPlan.value, t)
})

function planHasPeakRate(plan: SubscriptionPlan): boolean {
  return hasPeakRate(plan)
}

function planPeakRateLabel(plan: SubscriptionPlan): string {
  return formatPeakRateWindow(plan, serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset))
}

function selectPlan(plan: SubscriptionPlan) {
  selectedPlan.value = plan
  errorMessage.value = ''
}

function selectPlanFromModal(plan: SubscriptionPlan) {
  showRenewalModal.value = false
  renewGroupId.value = null
  selectedPlan.value = plan
  errorMessage.value = ''
}

function closeRenewalModal() {
  showRenewalModal.value = false
  renewGroupId.value = null
}

async function handleSubmitRecharge() {
  if (!canSubmit.value || submitting.value) return
  await createOrder(validAmount.value, 'balance')
}

async function confirmSubscribe() {
  if (!selectedPlan.value || submitting.value) return
  await createOrder(selectedPlan.value.price, 'subscription', selectedPlan.value.id)
}

function reloadPage() {
  if (typeof window !== 'undefined') window.location.reload()
}

function retryPayment() {
  if (activeTab.value === 'recharge') {
    void handleSubmitRecharge()
    return
  }
  if (selectedPlan.value) void confirmSubscribe()
}

async function createOrder(orderAmount: number, orderType: OrderType, planId?: number, options: CreateOrderOptions = {}) {
  submitting.value = true
  errorMessage.value = ''
  errorHintMessage.value = ''
  const requestType = normalizeVisibleMethod(options.paymentType || selectedMethod.value) || options.paymentType || selectedMethod.value
  try {
    const payload = buildCreateOrderPayload({
      amount: orderAmount,
      paymentType: requestType,
      orderType,
      planId,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      isMobile: isMobileDevice(),
      isWechatBrowser: typeof window !== 'undefined' && /MicroMessenger/i.test(window.navigator.userAgent),
      forceQRCode: !!(checkout.value.alipay_force_qrcode && normalizeVisibleMethod(requestType) === 'alipay'),
      mobilePrecreateDeepLink: checkout.value.alipay_mobile_precreate_deep_link === true,
    })
    if (options.openid) {
      payload.openid = options.openid
    }
    if (options.wechatResumeToken) {
      payload.wechat_resume_token = options.wechatResumeToken
    }

    const result = await paymentStore.createOrder(payload) as CreateOrderResult & { resume_token?: string }
    const openWindow = (url: string) => {
      const win = window.open(url, 'paymentPopup', getPaymentPopupFeatures())
      if (!win || win.closed) {
        window.location.href = url
      }
    }
    const visibleMethod = normalizeVisibleMethod(requestType) || requestType
    // When user clicks the dedicated Stripe button, leave method blank so the
    // landing page renders Stripe's full Payment Element (card/link/alipay/wxpay).
    const stripeMethod = visibleMethod === 'stripe'
      ? ''
      : visibleMethod === 'wxpay' ? 'wechat_pay' : 'alipay'
    const stripeRouteUrl = result.client_secret && visibleMethod !== 'airwallex'
      ? router.resolve({
        path: '/payment/stripe',
        query: {
          order_id: String(result.order_id),
          method: stripeMethod || undefined,
          resume_token: result.resume_token || undefined,
        },
      }).href
      : ''
    const airwallexRouteUrl = result.client_secret && result.intent_id
      ? router.resolve({
        path: '/payment/airwallex',
        query: {
          order_id: String(result.order_id),
          out_trade_no: result.out_trade_no || undefined,
          resume_token: result.resume_token || undefined,
        },
      }).href
      : ''
    const decision = decidePaymentLaunch(result, {
      visibleMethod,
      orderType,
      isMobile: isMobileDevice(),
      isWechatBrowser: typeof window !== 'undefined' && /MicroMessenger/i.test(window.navigator.userAgent),
      forceQRCode: !!(checkout.value.alipay_force_qrcode && visibleMethod === 'alipay'),
      mobilePrecreateDeepLink: checkout.value.alipay_mobile_precreate_deep_link === true,
      stripePopupUrl: stripeRouteUrl,
      stripeRouteUrl,
      airwallexRouteUrl,
    })

    if (decision.kind === 'wechat_oauth' && decision.oauth?.authorize_url) {
      window.location.href = buildWechatOAuthAuthorizeUrl(decision.oauth.authorize_url, {
        paymentType: visibleMethod,
        orderType,
        planId,
        orderAmount,
      })
      return
    }

    if (decision.kind === 'unhandled') {
      applyScenarioError({ reason: 'UNHANDLED_PAYMENT_SCENARIO' }, visibleMethod)
      return
    }

    paymentState.value = decision.paymentState
    paymentPhase.value = 'paying'
    persistRecoverySnapshot(decision.recovery)

    if (decision.kind === 'stripe_popup') {
      openWindow(decision.paymentState.payUrl)
      return
    }
    if (decision.kind === 'stripe_route') {
      window.location.href = decision.paymentState.payUrl
      return
    }
    if (decision.kind === 'airwallex_route') {
      window.location.href = decision.paymentState.payUrl
      return
    }
    if (decision.kind === 'wechat_jsapi' && decision.jsapi) {
      try {
        const jsapiResult = await invokeWechatJsapiPayment(decision.jsapi as Record<string, unknown>)
        const errMsg = String(jsapiResult.err_msg || '').toLowerCase()
        if (errMsg.includes('cancel')) {
          appStore.showInfo(t('payment.qr.cancelled'))
          resetPayment()
        } else if (errMsg && !errMsg.includes('ok')) {
          resetPayment()
          const fallbackApplied = await attemptMobileQrFallback(
            { reason: 'WECHAT_JSAPI_FAILED', message: errMsg },
            {
              orderAmount,
              orderType,
              planId,
              paymentType: visibleMethod,
              attempted: options.mobileQrFallbackAttempted === true,
            },
          )
          if (!fallbackApplied) {
            applyScenarioError({ reason: 'WECHAT_JSAPI_FAILED', message: errMsg }, visibleMethod)
          }
        } else {
          const resultState = { ...decision.paymentState }
          resetPayment()
          await redirectToPaymentResult(resultState)
        }
      } catch (err: unknown) {
        resetPayment()
        const fallbackApplied = await attemptMobileQrFallback(err, {
          orderAmount,
          orderType,
          planId,
          paymentType: visibleMethod,
          attempted: options.mobileQrFallbackAttempted === true,
        })
        if (!fallbackApplied) {
          throw err
        }
      }
      return
    }
    if (decision.kind === 'redirect_waiting' && decision.paymentState.payUrl) {
      if (isMobileDevice()) {
        window.location.href = decision.paymentState.payUrl
        return
      }
      openWindow(decision.paymentState.payUrl)
    }
  } catch (err: unknown) {
    const apiErr = err as Record<string, unknown>
    if (apiErr.reason === 'TOO_MANY_PENDING') {
      const metadata = apiErr.metadata as Record<string, unknown> | undefined
      errorMessage.value = t('payment.errors.tooManyPending', { max: metadata?.max || '' })
      errorHintMessage.value = ''
    } else if (apiErr.reason === 'CANCEL_RATE_LIMITED') {
      errorMessage.value = t('payment.errors.cancelRateLimited')
      errorHintMessage.value = ''
    } else if (await attemptMobileQrFallback(err, {
      orderAmount,
      orderType,
      planId,
      paymentType: requestType,
      attempted: options.mobileQrFallbackAttempted === true,
    })) {
      return
    } else {
      const handled = applyScenarioError(
        err,
        normalizeVisibleMethod(options.paymentType || selectedMethod.value) || selectedMethod.value,
      )
      if (!handled) {
        errorMessage.value = extractI18nErrorMessage(err, t, 'payment.errors', extractApiErrorMessage(err, t('payment.result.failed')))
        errorHintMessage.value = ''
      }
      if (handled) {
        return
      }
    }
    appStore.showError(buildPaymentErrorToastMessage(errorMessage.value, errorHintMessage.value))
  } finally {
    submitting.value = false
  }
}

interface MobileQrFallbackContext {
  orderAmount: number
  orderType: OrderType
  planId?: number
  paymentType: string
  attempted: boolean
}

function shouldFallbackToDesktopQr(err: unknown, paymentMethod: string, attempted: boolean): boolean {
  if (attempted || !isMobileDevice()) {
    return false
  }

  const normalizedMethod = normalizeVisibleMethod(paymentMethod) || paymentMethod
  const reason = typeof err === 'object' && err && 'reason' in err && typeof err.reason === 'string'
    ? err.reason
    : ''
  const message = err instanceof Error
    ? err.message
    : (typeof err === 'object' && err && 'message' in err && typeof err.message === 'string'
      ? err.message
      : '')
  const normalizedMessage = message.toLowerCase()

  if (normalizedMethod === 'wxpay') {
    return reason === 'WECHAT_H5_NOT_AUTHORIZED'
      || reason === 'WECHAT_PAYMENT_MP_NOT_CONFIGURED'
      || reason === 'WECHAT_JSAPI_FAILED'
      || reason === 'PAYMENT_GATEWAY_ERROR'
      || reason === 'UNHANDLED_PAYMENT_SCENARIO'
      || normalizedMessage.includes('weixinjsbridge is unavailable')
      || normalizedMessage.includes('wechat_jsapi_unavailable')
  }

  if (normalizedMethod === 'alipay') {
    return reason === 'PAYMENT_GATEWAY_ERROR' || reason === 'UNHANDLED_PAYMENT_SCENARIO'
  }

  return false
}

async function attemptMobileQrFallback(err: unknown, context: MobileQrFallbackContext): Promise<boolean> {
  if (!shouldFallbackToDesktopQr(err, context.paymentType, context.attempted)) {
    return false
  }

  try {
    const visibleMethod = normalizeVisibleMethod(context.paymentType) || context.paymentType
    const payload = buildCreateOrderPayload({
      amount: context.orderAmount,
      paymentType: visibleMethod,
      orderType: context.orderType,
      planId: context.planId,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      isMobile: false,
      isWechatBrowser: false,
    })
    const result = await paymentStore.createOrder(payload) as CreateOrderResult & { resume_token?: string }
    const stripeMethod = visibleMethod === 'wxpay' ? 'wechat_pay' : 'alipay'
    const stripeRouteUrl = result.client_secret
      ? router.resolve({
        path: '/payment/stripe',
        query: {
          order_id: String(result.order_id),
          method: stripeMethod,
          resume_token: result.resume_token || undefined,
        },
      }).href
      : ''
    const decision = decidePaymentLaunch(result, {
      visibleMethod,
      orderType: context.orderType,
      isMobile: false,
      isWechatBrowser: false,
      stripePopupUrl: stripeRouteUrl,
      stripeRouteUrl,
    })

    if (decision.kind !== 'qr_waiting' || !decision.paymentState.qrCode) {
      return false
    }

    errorMessage.value = ''
    errorHintMessage.value = ''
    paymentState.value = decision.paymentState
    paymentPhase.value = 'paying'
    persistRecoverySnapshot(decision.recovery)
    appStore.showWarning(t('payment.errors.mobilePaymentFallbackToQr'))
    return true
  } catch {
    return false
  }
}

function applyScenarioError(err: unknown, paymentMethod: string): boolean {
  const descriptor = describePaymentScenarioError(err, {
    paymentMethod,
    isMobile: isMobileDevice(),
    isWechatBrowser: typeof window !== 'undefined' && /MicroMessenger/i.test(window.navigator.userAgent),
  })
  if (!descriptor) {
    errorMessage.value = ''
    errorHintMessage.value = ''
    return false
  }
  errorMessage.value = t(descriptor.messageKey)
  errorHintMessage.value = descriptor.hintKey ? t(descriptor.hintKey) : ''
  appStore.showError(buildPaymentErrorToastMessage(errorMessage.value, errorHintMessage.value))
  return true
}

async function resumeWechatPaymentFromQuery() {
  const resume = parseWechatResumeRoute(route.query, checkout.value.plans, validAmount.value)
  if (!resume) {
    return
  }

  selectedMethod.value = resume.paymentType
  if (resume.orderType === 'balance' && resume.orderAmount > 0) {
    amount.value = resume.orderAmount
  }
  if (resume.orderType === 'subscription' && resume.planId) {
    selectedPlan.value = checkout.value.plans.find(plan => plan.id === resume.planId) ?? null
  }

  await router.replace({ path: route.path, query: stripWechatResumeQuery(route.query) })

  if (resume.wechatResumeToken) {
    await createOrder(0, resume.orderType, resume.planId, {
      wechatResumeToken: resume.wechatResumeToken,
      paymentType: resume.paymentType,
      isResume: true,
    })
    return
  }

  if (resume.orderAmount > 0 && resume.openid) {
    await createOrder(resume.orderAmount, resume.orderType, resume.planId, {
      openid: resume.openid,
      paymentType: resume.paymentType,
      isResume: true,
    })
  }
}

onMounted(async () => {
  try {
    const res = await paymentAPI.getCheckoutInfo()
    checkout.value = res.data
    if (enabledMethods.value.length) {
      const order: readonly string[] = METHOD_ORDER
      const sorted = [...enabledMethods.value].sort((a, b) => {
        const ai = order.indexOf(a)
        const bi = order.indexOf(b)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      })
      selectedMethod.value = sorted[0]
    }
    if (typeof window !== 'undefined') {
      if (hasWechatResumeQuery(route.query)) {
        removeRecoverySnapshot()
      }
      const routeResumeToken = typeof route.query.resume_token === 'string'
        ? route.query.resume_token
        : typeof route.query.wechat_resume_token === 'string'
          ? route.query.wechat_resume_token
          : undefined
      const restored = readPaymentRecoverySnapshot(
        window.localStorage.getItem(PAYMENT_RECOVERY_STORAGE_KEY),
        { resumeToken: routeResumeToken },
      )
      if (restored) {
        paymentState.value = restored
        paymentPhase.value = 'paying'
        const restoredMethod = normalizeVisibleMethod(restored.paymentType)
          || (visibleMethods.value[restored.paymentType] ? restored.paymentType : '')
        if (restoredMethod) {
          selectedMethod.value = restoredMethod
        }
      } else {
        removeRecoverySnapshot()
      }
    }
    await resumeWechatPaymentFromQuery()
    // balance_disabled → the tabs watcher above moves activeTab to the subscription tab (when enabled).
    // Handle renewal navigation: ?tab=subscription&group=123 (ignored when subscriptions are disabled)
    if (route.query.tab === 'subscription' && subscriptionEnabled.value) {
      activeTab.value = 'subscription'
      if (route.query.group) {
        const groupId = Number(route.query.group)
        const groupPlans = checkout.value.plans.filter(p => p.group_id === groupId)
        if (groupPlans.length === 1) {
          selectedPlan.value = groupPlans[0]
        } else if (groupPlans.length > 1) {
          renewGroupId.value = groupId
          showRenewalModal.value = true
        }
      }
    }
  } catch (err: unknown) { appStore.showError(extractI18nErrorMessage(err, t, 'payment.errors', t('common.error'))) }
  finally { loading.value = false }
  // Fetch active subscriptions (uses cache, non-blocking); skipped when the subscription feature is off
  if (subscriptionEnabled.value) {
    subscriptionStore.fetchActiveSubscriptions().catch(() => {})
  }
})
</script>
<style scoped>
.pay__hero { margin-bottom: clamp(28px, 4vw, 48px); }
.pay__grid { gap: clamp(12px, 1.6vw, 18px); }
.pay__col { gap: clamp(12px, 1.6vw, 18px); }
.pay .st-card { box-shadow: var(--st-shadow-2); }
.pay__badge { font-size: 0.75rem; }
.pay .st-pill { font-size: 0.75rem; }
.pay .st-btn { min-height: 44px; }
.pay__modal-close { width: 44px; height: 44px; }

.pay__total {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 12px;
  border-top: 1px solid var(--st-line);
}
.pay__total .st-stat__value { font-size: clamp(1.7rem, 3.4vw, 2.1rem); }
.pay__total-unit {
  margin-left: 6px;
  font-family: var(--st-font-body);
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--st-ink-faint);
}

.pay__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-block: clamp(32px, 6vw, 56px);
  text-align: center;
}
.pay__empty-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--st-bg-soft);
  color: var(--st-ink-2);
}
.pay__empty-btn { min-width: 160px; min-height: 44px; margin-top: 4px; }

.pay__error {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--st-r-md);
  border: 1px solid var(--st-danger-soft);
  background: var(--st-danger-soft);
}
.pay__error-icon { flex-shrink: 0; padding-top: 2px; color: var(--st-danger); }
.pay__error-copy { display: flex; flex: 1 1 200px; flex-direction: column; gap: 2px; min-width: 0; }
.pay__error-title { font-size: 0.85rem; line-height: 1.6; color: var(--st-ink); overflow-wrap: anywhere; }
.pay__error-hint { font-size: 0.78rem; line-height: 1.5; color: var(--st-ink-2); }
.pay__error-retry { flex-shrink: 0; min-height: 44px; }

@media (max-width: 520px) {
  .pay__error { flex-direction: column; align-items: stretch; }
  .pay__error-retry { width: 100%; }
  .pay__tabs .st-seg__item { min-height: 44px; }
  .pay__empty-btn { width: 100%; }
}
</style>

<style scoped>
.pay { padding-bottom: clamp(56px, 8vw, 96px); }
.pay__wrap { max-width: 980px; }
.pay__hero { max-width: 60ch; margin-bottom: clamp(22px, 3vw, 36px); }
.pay__title { margin-top: 14px; }
.pay__lede { margin-top: 12px; }

.pay__loading { display: flex; flex-direction: column; gap: 12px; }
.pay__sk { border-radius: var(--st-r-md); }
.pay__sk--sm { height: 44px; max-width: 320px; }
.pay__sk--lg { height: 280px; max-width: none; }

.pay__tabs { display: flex; width: 100%; margin-bottom: 16px; }
.pay__tab { flex: 1 1 0; min-width: 0; }

.pay__grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; align-items: start; }
.pay__col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.pay__card { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.pay__card-head { display: flex; flex-direction: column; gap: 4px; }
.pay__card-lede { font-size: 0.84rem; }
.pay__empty { text-align: center; }

.pay__account-row { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 12px; }
.pay__account-name { font-size: 1.3rem; min-width: 0; overflow-wrap: anywhere; }

.pay__notice {
  border-radius: var(--st-r-sm);
  border: 1px solid var(--st-brand-line);
  background: var(--st-brand-soft);
  padding: 12px 14px;
  font-size: 0.86rem;
  line-height: 1.7;
  color: var(--st-ink-2);
}

.pay__hint { font-size: 0.8rem; line-height: 1.6; color: var(--st-ink-faint); }
.pay__hint--warn { color: var(--st-warn); }

.pay__rows { display: flex; flex-direction: column; }
.pay__row { grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 12px; padding: 10px 0; }
.pay__row-label { font-size: 0.9rem; font-weight: 500; color: var(--st-ink); }
.pay__row-value {
  font-size: 0.9rem;
  color: var(--st-ink);
  text-align: right;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.pay__row-value--muted { color: var(--st-ink-faint); text-decoration: line-through; }
.pay__row-value--accent { color: var(--st-brand-text); font-weight: 500; }
.pay__row-value--strong {
  font-family: var(--st-font-display);
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.pay__row--total { border-top: 1px solid var(--st-line); margin-top: 4px; }

.pay__plan-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.pay__badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.75rem;
  line-height: 1.7;
}
.pay__plan-name { min-width: 0; overflow-wrap: anywhere; }
.pay__price { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; }
.pay__price-old { font-size: 0.85rem; color: var(--st-ink-faint); text-decoration: line-through; }
.pay__price-now {
  font-family: var(--st-font-display);
  font-size: clamp(1.7rem, 4vw, 2.2rem);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}
.pay__price-unit { font-size: 0.84rem; color: var(--st-ink-faint); }
.pay__plan-desc { font-size: 0.86rem; }
.pay__plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px 16px;
  padding-top: 14px;
  border-top: 1px solid var(--st-line);
}
.pay__plan-value {
  font-family: var(--st-font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--st-ink);
  overflow-wrap: anywhere;
}
.pay__plan-value--warn { color: var(--st-warn); }

.pay__submit-area { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.pay__submit { width: 100%; min-width: 0; white-space: normal; text-align: center; }
.pay__back { width: 100%; }
.pay__spin-row { display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.pay__spin {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2px solid var(--st-brand-ink);
  border-top-color: transparent;
  animation: pay-spin 0.8s linear infinite;
}
@keyframes pay-spin { to { transform: rotate(360deg); } }

.pay__plans { margin-bottom: 4px; }
.pay__subs { margin-top: 12px; }
.pay__sub { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-inline: 4px; }
.pay__sub-main { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.pay__sub-title { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.pay__sub-name { font-size: 0.88rem; font-weight: 500; color: var(--st-ink); overflow-wrap: anywhere; }
.pay__sub-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 0.75rem; color: var(--st-ink-faint); }

.pay__help { margin-top: 12px; }
.pay__help-img { max-width: 100%; max-height: 220px; border-radius: var(--st-r-sm); cursor: pointer; object-fit: contain; }
.pay__help-text { font-size: 0.88rem; line-height: 1.7; color: var(--st-ink-2); overflow-x: auto; }

.pay__modal-mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--st-overlay);
  backdrop-filter: blur(4px);
}
.pay__modal {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - 32px);
  padding: clamp(16px, 3vw, 24px);
  overflow: hidden;
}
.pay__modal-close { position: absolute; top: 10px; right: 10px; }
.pay__modal-title { padding-right: 36px; }
.pay__modal-body { display: flex; flex-direction: column; gap: 16px; min-height: 0; overflow-y: auto; }
.pay__preview-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--st-overlay);
}
.pay__preview-img { max-height: 85vh; max-width: 90vw; border-radius: var(--st-r-md); object-fit: contain; }

@media (min-width: 900px) {
  .pay__grid { grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: 16px; }
}
@media (max-width: 520px) {
  .pay__sub { flex-direction: column; align-items: flex-start; }
  .pay__submit { font-size: 0.9rem; }
}
</style>

