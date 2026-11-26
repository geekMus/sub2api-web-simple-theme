<template>
  <UserShell>
    <section class="st-section--tight orders">
      <div class="st-shell orders__wrap">
        <header class="orders__hero">
          <p class="st-eyebrow st-reveal">{{ c('orders.eyebrow') }}</p>
          <h1 class="st-display-2 orders__title st-reveal" style="--i: 1">{{ c('orders.title') }}</h1>
          <p class="st-lede orders__lede st-reveal" style="--i: 2">{{ c('orders.lede') }}</p>
        </header>

        <div class="orders__bar st-reveal" style="--i: 2">
          <Select v-model="currentFilter" :options="statusFilters" class="orders__select" @change="handlePageChange(1)" />
          <div class="orders__actions">
            <button
              type="button"
              @click="fetchOrders"
              :disabled="loading"
              class="st-btn st-btn--quiet orders__refresh"
              :title="t('common.refresh')"
              :aria-label="t('common.refresh')"
            >
              <Icon name="refresh" size="md" :class="loading ? 'animate-spin' : ''" />
            </button>
            <button class="st-btn st-btn--primary orders__cta" @click="router.push('/purchase')">{{ t('payment.result.backToRecharge') }}</button>
          </div>
        </div>

        <div v-if="loading && orders.length === 0" class="orders__grid" aria-busy="true">
          <div v-for="i in 4" :key="i" class="st-card st-card--pad orders__card">
            <div class="st-skeleton orders__sk orders__sk--head"></div>
            <div class="st-skeleton orders__sk"></div>
            <div class="st-skeleton orders__sk orders__sk--wide"></div>
            <div class="st-skeleton orders__sk"></div>
          </div>
        </div>

        <div v-else-if="errorMessage" class="st-card st-card--pad orders__state" role="alert">
          <div class="orders__mark orders__mark--bad">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="9" />
              <path stroke-linecap="round" d="M12 8v5m0 3.5h.01" />
            </svg>
          </div>
          <p class="st-display-3 orders__state-title">{{ c('orders.errorTitle') }}</p>
          <p class="st-body">{{ errorMessage }}</p>
          <button class="st-btn st-btn--primary orders__state-btn" @click="fetchOrders">{{ c('orders.retry') }}</button>
        </div>

        <div v-else-if="orders.length === 0" class="st-card st-card--pad orders__state">
          <div class="orders__mark">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
              <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke-linejoin="round" />
              <path d="M14 3v5h5M9 13h6M9 17h4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <p class="st-display-3 orders__state-title">{{ c('orders.emptyTitle') }}</p>
          <p class="st-body">{{ c('orders.emptyBody') }}</p>
          <button class="st-btn st-btn--primary orders__state-btn" @click="router.push('/purchase')">{{ c('orders.emptyCta') }}</button>
        </div>

        <div v-else class="orders__grid" :aria-busy="loading">
          <article v-for="order in orders" :key="order.id" class="st-card st-card--lift st-card--pad orders__card">
            <header class="orders__card-head">
              <div class="orders__amount">
                <span class="orders__amount-sym">{{ paymentAmountSymbol(order) }}</span>
                <span class="orders__amount-val st-num">{{ order.pay_amount.toFixed(2) }}</span>
              </div>
              <OrderStatusBadge :status="order.status" />
            </header>

            <div class="orders__rows">
              <div class="st-row orders__row">
                <span class="st-row__meta">{{ t('payment.orders.orderNo') }}</span>
                <span class="orders__val orders__val--mono">{{ order.out_trade_no || '#' + order.id }}</span>
              </div>
              <div class="st-row orders__row">
                <span class="st-row__meta">{{ t('payment.orders.paymentMethod') }}</span>
                <span class="orders__val">{{ t('payment.methods.' + order.payment_type, order.payment_type) }}</span>
              </div>
              <div class="st-row orders__row">
                <span class="st-row__meta">{{ c('orders.creditedAmount') }}</span>
                <span class="orders__val">
                  {{ creditedAmountSymbol }}{{ order.amount.toFixed(2) }}
                  <span v-if="(order.bonus_amount ?? 0) > 0" class="orders__bonus">
                    ({{ t('payment.orders.bonusIncluded', { amount: creditedAmountSymbol + (order.bonus_amount ?? 0).toFixed(2) }) }})
                  </span>
                </span>
              </div>
              <div class="st-row orders__row">
                <span class="st-row__meta">{{ t('payment.orders.createdAt') }}</span>
                <span class="orders__val">{{ formatDate(order.created_at) }}</span>
              </div>
            </div>

            <div v-if="order.status === 'PENDING' || canRequestRefund(order)" class="orders__card-actions">
              <button v-if="order.status === 'PENDING'" class="st-btn st-btn--quiet st-btn--sm" @click="handleCancel(order.id)">
                <Icon name="x" size="sm" /> {{ t('payment.orders.cancel') }}
              </button>
              <button v-if="canRequestRefund(order)" class="st-btn st-btn--quiet st-btn--sm" @click="openRefundDialog(order)">
                <Icon name="dollar" size="sm" /> {{ t('payment.orders.requestRefund') }}
              </button>
            </div>
          </article>
        </div>

        <Pagination
          v-if="pagination.total > 0"
          :page="pagination.page"
          :total="pagination.total"
          :page-size="pagination.page_size"
          @update:page="handlePageChange"
          @update:pageSize="handlePageSizeChange"
        />
      </div>
    </section>

    <!-- Cancel Confirm Dialog -->
    <BaseDialog :show="!!cancelTargetId" :title="t('payment.orders.cancel')" width="narrow" @close="cancelTargetId = null">
      <p class="st-body">{{ t('payment.confirmCancel') }}</p>
      <template #footer>
        <div class="orders__dialog-actions">
          <button class="st-btn st-btn--quiet st-btn--sm" @click="cancelTargetId = null">{{ t('common.cancel') }}</button>
          <button class="st-btn st-btn--primary st-btn--sm" :disabled="actionLoading" @click="confirmCancel">
            {{ actionLoading ? t('common.processing') : t('payment.orders.cancel') }}
          </button>
        </div>
      </template>
    </BaseDialog>

    <!-- Refund Dialog -->
    <BaseDialog :show="!!refundTarget" :title="t('payment.orders.requestRefund')" @close="refundTarget = null">
      <div v-if="refundTarget" class="orders__refund">
        <div class="st-card st-card--soft st-card--pad orders__refund-sum">
          <div class="st-row orders__row">
            <span class="st-row__meta">{{ t('payment.orders.orderId') }}</span>
            <span class="orders__val orders__val--mono">#{{ refundTarget.id }}</span>
          </div>
          <div class="st-row orders__row">
            <span class="st-row__meta">{{ c('orders.payAmount') }}</span>
            <span class="orders__val">{{ '$' + refundTarget.amount.toFixed(2) }}</span>
          </div>
        </div>
        <div>
          <label class="st-label">{{ t('payment.refundReason') }}</label>
          <textarea v-model="refundReason" rows="3" class="st-input orders__textarea" :placeholder="t('payment.refundReasonPlaceholder')" />
        </div>
      </div>
      <template #footer>
        <div class="orders__dialog-actions">
          <button class="st-btn st-btn--quiet st-btn--sm" @click="refundTarget = null">{{ t('common.cancel') }}</button>
          <button class="st-btn st-btn--primary st-btn--sm" :disabled="actionLoading || !refundReason.trim()" @click="confirmRefund">
            {{ actionLoading ? t('common.processing') : t('payment.orders.requestRefund') }}
          </button>
        </div>
      </template>
    </BaseDialog>
  </UserShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import { paymentAPI } from '@/api/payment'
import { extractI18nErrorMessage } from '@/utils/apiError'
import type { PaymentOrder } from '@/types/payment'
import UserShell from '@/components/shell/UserShell.vue'
import { useBillingCopy } from '@/composables/copy/billing'
import Pagination from '@/components/common/Pagination.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import Select from '@/components/common/Select.vue'
import Icon from '@/components/icons/Icon.vue'
import OrderStatusBadge from '@/components/payment/OrderStatusBadge.vue'
import { currencySymbol } from '@/components/payment/currency'

const { t } = useI18n()
const { c } = useBillingCopy()
const router = useRouter()
const appStore = useAppStore()

const errorMessage = ref('')
const creditedAmountSymbol = currencySymbol('USD')

function paymentAmountSymbol(order: PaymentOrder): string {
  return currencySymbol(order.currency)
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
const loading = ref(false)
const actionLoading = ref(false)
const orders = ref<PaymentOrder[]>([])
const refundEligibleProviders = ref<Set<string>>(new Set())
const currentFilter = ref('')
const cancelTargetId = ref<number | null>(null)
const refundTarget = ref<PaymentOrder | null>(null)
const refundReason = ref('')
const pagination = reactive({ page: 1, page_size: 20, total: 0 })

const statusFilters = computed(() => [
  { value: '', label: t('common.all') },
  { value: 'PENDING', label: t('payment.status.pending') },
  { value: 'COMPLETED', label: t('payment.status.completed') },
  { value: 'FAILED', label: t('payment.status.failed') },
  { value: 'REFUNDED', label: t('payment.status.refunded') },
])

async function fetchOrders() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await paymentAPI.getMyOrders({
      page: pagination.page,
      page_size: pagination.page_size,
      status: currentFilter.value || undefined,
    })
    orders.value = res.data.items || []
    pagination.total = res.data.total || 0
  } catch (err: unknown) {
    const message = extractI18nErrorMessage(err, t, 'payment.errors', t('common.error'))
    errorMessage.value = message
    appStore.showError(message)
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) { pagination.page = page; fetchOrders() }
function handlePageSizeChange(size: number) { pagination.page_size = size; pagination.page = 1; fetchOrders() }

function handleCancel(orderId: number) { cancelTargetId.value = orderId }

async function confirmCancel() {
  if (!cancelTargetId.value) return
  actionLoading.value = true
  try {
    await paymentAPI.cancelOrder(cancelTargetId.value)
    appStore.showSuccess(t('common.success'))
    cancelTargetId.value = null
    await fetchOrders()
  } catch (err: unknown) {
    appStore.showError(extractI18nErrorMessage(err, t, 'payment.errors', t('common.error')))
  } finally {
    actionLoading.value = false
  }
}

function openRefundDialog(order: PaymentOrder) { refundTarget.value = order; refundReason.value = '' }

async function confirmRefund() {
  if (!refundTarget.value || !refundReason.value.trim()) return
  actionLoading.value = true
  try {
    await paymentAPI.requestRefund(refundTarget.value.id, { reason: refundReason.value.trim() })
    appStore.showSuccess(t('common.success'))
    refundTarget.value = null
    refundReason.value = ''
    await fetchOrders()
  } catch (err: unknown) {
    appStore.showError(extractI18nErrorMessage(err, t, 'payment.errors', t('common.error')))
  } finally {
    actionLoading.value = false
  }
}

function canRequestRefund(order: PaymentOrder): boolean {
  if (order.status !== 'COMPLETED') return false
  if (!order.provider_instance_id) return false
  return refundEligibleProviders.value.has(order.provider_instance_id)
}

async function loadRefundEligibility() {
  try {
    const res = await paymentAPI.getRefundEligibleProviders()
    refundEligibleProviders.value = new Set(res.data.provider_instance_ids || [])
  } catch { /* ignore — default to hiding refund button */ }
}

onMounted(() => { fetchOrders(); loadRefundEligibility() })
</script>
<style scoped>
.orders { padding-bottom: clamp(56px, 8vw, 96px); }
.orders__wrap { max-width: 1040px; }
.orders__hero { max-width: 56ch; margin-bottom: clamp(22px, 3vw, 34px); }
.orders__title { margin-top: 14px; }
.orders__lede { margin-top: 12px; }

.orders__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: clamp(20px, 3vw, 32px);
}
.orders__select { width: 100%; max-width: 240px; }
.orders__actions { display: flex; align-items: center; gap: 8px; min-width: 0; }
.orders__refresh { width: 44px; min-width: 44px; height: 44px; padding: 0; }
.orders__cta { min-height: 44px; }

.orders__grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
.orders__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  box-shadow: var(--st-shadow-2);
}
.orders__card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.orders__amount { display: flex; align-items: baseline; gap: 4px; min-width: 0; }
.orders__amount-sym { font-size: 0.82rem; color: var(--st-ink-faint); }
.orders__amount-val {
  font-family: var(--st-font-display);
  font-size: clamp(1.5rem, 3vw, 1.9rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.orders__rows { display: flex; flex-direction: column; }
.orders__row { grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 12px; padding: 8px 0; }
.orders__val { font-size: 0.82rem; color: var(--st-ink); text-align: right; overflow-wrap: anywhere; }
.orders :deep(.st-pill) { font-size: 0.75rem; }
.orders .st-btn { min-height: 44px; }
.orders__val--mono { font-family: var(--st-font-mono); font-size: 0.75rem; color: var(--st-ink-2); }
.orders__bonus { font-size: 0.78rem; color: var(--st-warn); }

.orders__card-actions { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 8px; border-top: 1px solid var(--st-line); }
.orders__card-actions .st-btn { flex: 1 1 auto; min-height: 44px; }

.orders__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-block: clamp(40px, 8vw, 80px);
  text-align: center;
  box-shadow: var(--st-shadow-2);
}
.orders__state-title { margin: 2px 0 0; }
.orders__state-btn { min-width: 180px; min-height: 44px; }
.orders__mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--st-bg-soft);
  color: var(--st-ink-2);
}
.orders__mark--bad { background: var(--st-danger-soft); color: var(--st-danger); }

.orders__sk { height: 14px; border-radius: var(--st-r-xs); }
.orders__sk--head { height: 30px; width: 40%; }
.orders__sk--wide { width: 80%; }

.orders__dialog-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.orders__dialog-actions .st-btn { min-height: 44px; }
.orders__refund { display: flex; flex-direction: column; gap: 14px; }
.orders__refund-sum { display: flex; flex-direction: column; }
.orders__textarea { width: 100%; min-height: 96px; resize: vertical; }

@media (min-width: 720px) {
  .orders__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .orders__bar { flex-direction: column; align-items: stretch; }
  .orders__select { max-width: none; }
  .orders__actions { justify-content: space-between; }
  .orders__cta { flex: 1 1 auto; min-width: 0; }
}
</style>

