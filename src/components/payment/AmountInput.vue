<template>
  <div class="amount">
    <div class="amount__block">
      <label class="st-label">{{ t('payment.quickAmounts') }}</label>
      <div class="amount__grid">
        <button
          v-for="amt in filteredAmounts"
          :key="amt"
          type="button"
          class="amount__btn"
          :class="{ 'amount__btn--on': modelValue === amt }"
          :data-testid="`quick-amount-${amt}`"
          @click="selectAmount(amt)"
        >
          <span
            v-if="quoteFor(amt).percent > 0"
            data-testid="quick-amount-bonus-badge"
            class="amount__tag"
          >
            <span class="amount__tag-inner">
              <span>{{ badgeText(amt) }}</span>
              <span class="amount__tag-dot"></span>
            </span>
          </span>
          <span class="amount__value st-num">{{ amt }}</span>
          <span
            v-if="showSecondLine"
            data-testid="quick-amount-credited"
            class="amount__second"
            :class="{ 'amount__second--promo': quoteFor(amt).percent > 0 }"
          >{{ secondLine(amt) }}</span>
        </button>
      </div>
    </div>

    <div class="amount__block">
      <label class="st-label" for="amount-custom">{{ t('payment.customAmount') }}</label>
      <div class="amount__field">
        <span class="amount__prefix" aria-hidden="true">$</span>
        <input
          id="amount-custom"
          type="text"
          inputmode="decimal"
          :value="customText"
          :placeholder="placeholderText"
          class="st-input amount__input"
          @input="handleInput"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RechargeBonusTier } from '@/types/payment'
import { formatRechargeBonusNumber, quoteRechargeBonus, type RechargeBonusMode } from '@/utils/rechargeBonus'
import { formatPaymentAmount } from './currency'

const props = withDefaults(defineProps<{
  amounts?: number[]
  modelValue: number | null
  min?: number
  max?: number
  /** 充值优惠阶梯（按 min_amount 升序）；为空时不显示价签与第二行 */
  bonusTiers?: RechargeBonusTier[]
  /** 阶梯模式：bonus 赠金 / discount 折扣 */
  bonusMode?: RechargeBonusMode
  /** 充值倍率（1 支付币种 = multiplier USD），用于计算到账金额 */
  multiplier?: number
  /** 支付币种（折扣模式第二行实付金额的币种与精度） */
  currency?: string
}>(), {
  amounts: () => [10, 20, 50, 100, 200, 500, 1000, 2000, 5000],
  min: 0,
  max: 0,
  bonusTiers: () => [],
  bonusMode: 'bonus',
  multiplier: 1,
  currency: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { t } = useI18n()

const customText = ref('')

// 0 = no limit
const filteredAmounts = computed(() =>
  props.amounts.filter((a) => (props.min <= 0 || a >= props.min) && (props.max <= 0 || a <= props.max))
)

const showSecondLine = computed(() => props.bonusTiers.length > 0)

function currencyDigits(): number {
  if (!props.currency) return 2
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: props.currency }).resolvedOptions().maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

function quoteFor(amt: number) {
  return quoteRechargeBonus(props.bonusTiers, amt, {
    multiplier: props.multiplier,
    mode: props.bonusMode,
    currencyDigits: currencyDigits(),
  })
}

// 价签文案：赠金「+20%」，折扣「20% OFF」
function badgeText(amt: number): string {
  const percent = formatRechargeBonusNumber(quoteFor(amt).percent)
  return props.bonusMode === 'discount' ? `${percent}% OFF` : `+${percent}%`
}

function secondLine(amt: number): string {
  const quote = quoteFor(amt)
  if (props.bonusMode === 'discount') {
    return t('payment.rechargeBonus.payShort', { amount: formatPaymentAmount(quote.payBase, props.currency) })
  }
  return t('payment.rechargeBonus.creditedShort', { amount: '$' + quote.credited.toFixed(2) })
}

const placeholderText = computed(() => {
  if (props.min > 0 && props.max > 0) return `${props.min} - ${props.max}`
  if (props.min > 0) return `≥ ${props.min}`
  if (props.max > 0) return `≤ ${props.max}`
  return t('payment.enterAmount')
})

const AMOUNT_PATTERN = /^\d*(\.\d{0,2})?$/

function selectAmount(amt: number) {
  customText.value = String(amt)
  emit('update:modelValue', amt)
}

function handleInput(e: Event) {
  const input = e.target as HTMLInputElement
  const val = input.value
  if (!AMOUNT_PATTERN.test(val)) {
    input.value = customText.value
    return
  }
  customText.value = val
  if (val === '') {
    emit('update:modelValue', null)
    return
  }
  const num = parseFloat(val)
  if (!isNaN(num) && num > 0) {
    emit('update:modelValue', num)
  } else {
    emit('update:modelValue', null)
  }
}

watch(() => props.modelValue, (v) => {
  if (v !== null && String(v) !== customText.value) {
    customText.value = String(v)
  }
}, { immediate: true })
</script>
<style scoped>
.amount { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.amount__block { min-width: 0; }
.amount__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 10px;
  padding-top: 2px;
}
.amount__btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  min-height: 56px;
  padding: 10px 8px;
  border-radius: var(--st-r-sm);
  border: 1px solid var(--st-line-2);
  background: var(--st-bg);
  color: var(--st-ink);
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease);
}
.amount__btn:hover { border-color: var(--st-ink-2); }
.amount__btn--on { border-color: var(--st-brand); background: var(--st-brand-soft); }
.amount__btn:focus-visible { outline: 2px solid var(--st-brand); outline-offset: 2px; }
.amount__value { line-height: 1.2; font-variant-numeric: tabular-nums; }
.amount__second { font-size: 0.75rem; line-height: 1.35; color: var(--st-ink-faint); }
.amount__second--promo { color: var(--st-brand-text); }

.amount__tag { position: absolute; right: -6px; top: -10px; transform: rotate(10deg); pointer-events: none; }
.amount__tag-inner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: var(--st-r-xs);
  border: 1px solid var(--st-brand-line);
  background: var(--st-brand);
  color: var(--st-brand-ink);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.5;
  white-space: nowrap;
}
.amount__tag-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--st-brand-ink); }

.amount__field { position: relative; min-width: 0; }
.amount__prefix {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  color: var(--st-ink-faint);
  pointer-events: none;
}
.amount__input { padding-left: 28px; }
</style>

