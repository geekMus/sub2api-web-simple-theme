<template>
  <span class="st-pill" :class="statusClass">
    {{ statusLabel }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { OrderStatus } from '@/types/payment'

const props = defineProps<{
  status: OrderStatus
}>()

const { t } = useI18n()

const statusMap: Record<OrderStatus, { key: string; tone: string }> = {
  PENDING: { key: 'payment.status.pending', tone: 'st-pill--warn' },
  PAID: { key: 'payment.status.paid', tone: 'st-pill--accent' },
  RECHARGING: { key: 'payment.status.recharging', tone: 'st-pill--accent' },
  COMPLETED: { key: 'payment.status.completed', tone: 'st-pill--ok' },
  EXPIRED: { key: 'payment.status.expired', tone: '' },
  CANCELLED: { key: 'payment.status.cancelled', tone: '' },
  FAILED: { key: 'payment.status.failed', tone: 'st-pill--danger' },
  REFUND_REQUESTED: { key: 'payment.status.refund_requested', tone: 'st-pill--warn' },
  REFUNDING: { key: 'payment.status.refunding', tone: 'st-pill--warn' },
  REFUND_PENDING: { key: 'payment.status.refund_pending', tone: 'st-pill--warn' },
  REFUNDED: { key: 'payment.status.refunded', tone: 'st-pill--accent' },
  PARTIALLY_REFUNDED: { key: 'payment.status.partially_refunded', tone: 'st-pill--accent' },
  REFUND_FAILED: { key: 'payment.status.refund_failed', tone: 'st-pill--danger' },
}

const statusLabel = computed(() => {
  const entry = statusMap[props.status]
  return entry ? t(entry.key) : props.status
})

const statusClass = computed(() => {
  const entry = statusMap[props.status]
  return entry?.tone ?? ''
})
</script>

