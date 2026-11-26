<template>
  <div class="pm">
    <label class="st-label">{{ t('payment.paymentMethod') }}</label>
    <div
      data-testid="payment-method-grid"
      class="pm__grid grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      <button
        v-for="method in sortedMethods"
        :key="method.type"
        type="button"
        :title="methodLabel(method)"
        :disabled="!method.available"
        class="pm__btn min-w-0"
        :class="method.available ? (selected === method.type ? methodSelectedClass(method.type) : '') : 'pm__btn--off'"
        @click="method.available && emit('select', method.type)"
      >
        <img :src="methodIcon(method.type)" :alt="methodLabel(method)" class="pm__icon" />
        <span class="pm__copy">
          <span data-testid="payment-method-label" class="pm__label truncate">{{ methodLabel(method) }}</span>
          <span v-if="method.fee_rate > 0" class="pm__fee">{{ t('payment.fee') }} {{ method.fee_rate }}%</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { METHOD_ORDER, isBuiltInAlipayMethod, isBuiltInWxpayMethod } from './providerConfig'
import alipayIcon from '@/assets/icons/alipay.svg'
import wxpayIcon from '@/assets/icons/wxpay.svg'
import stripeIcon from '@/assets/icons/stripe.svg'
import airwallexIcon from '@/assets/icons/airwallex.svg'
import paymentIcon from '@/assets/icons/payment.svg'

export interface PaymentMethodOption {
  type: string
  display_name?: string
  fee_rate: number
  available: boolean
}

const props = defineProps<{
  methods: PaymentMethodOption[]
  selected: string
}>()

const emit = defineEmits<{
  select: [type: string]
}>()

const { t } = useI18n()

const METHOD_ICONS: Record<string, string> = {
  alipay: alipayIcon,
  wxpay: wxpayIcon,
  stripe: stripeIcon,
  airwallex: airwallexIcon,
  credit_card: paymentIcon,
}

const sortedMethods = computed(() => {
  const order: readonly string[] = METHOD_ORDER
  return [...props.methods].sort((a, b) => {
    const ai = order.indexOf(a.type)
    const bi = order.indexOf(b.type)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
})

function methodIcon(type: string): string {
  if (isBuiltInAlipayMethod(type)) return METHOD_ICONS.alipay
  if (isBuiltInWxpayMethod(type)) return METHOD_ICONS.wxpay
  if (type === 'airwallex') return METHOD_ICONS.airwallex
  return METHOD_ICONS[type] || paymentIcon
}

function methodLabel(method: PaymentMethodOption): string {
  return method.display_name || t(`payment.methods.${method.type}`, method.type)
}

function methodSelectedClass(_type: string): string {
  return 'pm__btn--on border-primary-500'
}
</script>
<style scoped>
.pm { min-width: 0; }
.pm__grid { min-width: 0; }
.pm__btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 62px;
  padding: 8px 12px;
  border-radius: var(--st-r-sm);
  border: 1px solid var(--st-line-2);
  background: var(--st-bg);
  color: var(--st-ink);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease);
}
.pm__btn:hover:not(:disabled) { border-color: var(--st-ink-2); }
.pm__btn--on { border-color: var(--st-brand-text); background: var(--st-brand-soft); }
.pm__btn--off { opacity: 0.45; cursor: not-allowed; }
.pm__btn:focus-visible { outline: 2px solid var(--st-brand); outline-offset: 2px; }
.pm__icon { width: 26px; height: 26px; flex-shrink: 0; object-fit: contain; }
.pm__copy { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-width: 0; }
.pm__label { width: 100%; font-size: 0.86rem; font-weight: 500; line-height: 1.3; }
.pm__fee { font-size: 0.75rem; color: var(--st-ink-faint); white-space: nowrap; }

@media (max-width: 400px) {
  .pm__btn { height: auto; min-height: 58px; gap: 6px; padding: 8px; }
  .pm__icon { width: 22px; height: 22px; }
  .pm__label { font-size: 0.8rem; }
}
</style>

