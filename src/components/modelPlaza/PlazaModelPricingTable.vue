<template>
  <div class="pz-store" :style="accentStyle">
    <article
      v-for="m in sortedModels"
      :key="`${m.platform}:${m.name}`"
      class="st-card st-card--lift pz-model"
      data-model-card
    >
      <header class="pz-model__head">
        <span class="pz-model__glyph" aria-hidden="true"><ModelIcon :model="m.name" size="20px" /></span>
        <div class="pz-model__id">
          <p class="pz-model__name" :title="m.name">{{ m.name }}</p>
          <p class="pz-model__vendor">{{ platformLabel(m.platform) }}</p>
        </div>
        <button
          type="button"
          class="pz-model__copy st-icon-btn"
          :title="t('modelPlaza.table.copyModelId', { model: m.name })"
          :aria-label="t('modelPlaza.table.copyModelId', { model: m.name })"
          @click="copyToClipboard(m.name)"
        >
          <Icon name="copy" size="sm" aria-hidden="true" />
        </button>
      </header>

      <div v-if="hasBadges(m)" class="pz-model__badges">
        <span v-if="platform && m.platform !== platform" class="pz-badge" :class="platformBadgeLightClass(m.platform)">
          {{ platformLabel(m.platform) }}
        </span>
        <span v-if="billingMode(m) !== BILLING_MODE_TOKEN" class="pz-badge">{{ billingModeLabel(m) }}</span>
        <span
          v-if="m.long_context_basis === 'marginal'"
          class="pz-badge"
          :title="t('modelPlaza.table.tierHintMarginal')"
        >{{ t('modelPlaza.table.marginalBadge') }}</span>
        <span
          v-for="([effort, multiplier]) in reasoningEffortMultipliers(m)"
          :key="effort"
          class="pz-badge pz-badge--effort"
          :title="t('modelPlaza.table.reasoningMultiplierHint', { effort, multiplier })"
          :data-reasoning-effort="effort"
        >{{ t('modelPlaza.table.reasoningMultiplierBadge', { effort, multiplier }) }}</span>
      </div>

      <div v-if="billingMode(m) === BILLING_MODE_TOKEN" class="pz-model__prices">
        <template v-if="tokenIntervals(m).length">
          <div
            v-for="(iv, idx) in tokenIntervals(m)"
            :key="idx"
            class="pz-tier"
            :title="tierHint(m)"
          >
            <span class="pz-tier__label">{{ tierLabel(iv) }}</span>
            <span class="pz-tier__pair">
              <span class="pz-tier__k">{{ t('modelPlaza.table.input') }}</span>
              <span class="pz-tier__v">{{ paidPerMillion(iv.input_price, null) }}</span>
            </span>
            <span class="pz-tier__pair">
              <span class="pz-tier__k">{{ t('modelPlaza.table.output') }}</span>
              <span class="pz-tier__v">{{ paidPerMillion(iv.output_price, null) }}</span>
            </span>
            <span class="pz-tier__cache">
              <template v-if="intervalHasCache(iv)">
                <span class="pz-faint">{{ t('modelPlaza.table.cacheWriteShort') }}</span>
                {{ paidPerMillion(iv.cache_write_price, null) }}
                <template v-if="iv.cache_write_1h_price != null"
                  ><span class="pz-faint"> (1h </span>{{ paidPerMillion(iv.cache_write_1h_price, null)
                  }}<span class="pz-faint">)</span></template
                ><template v-if="iv.cache_write_12h_price != null"
                  ><span class="pz-faint"> (12h </span>{{ paidPerMillion(iv.cache_write_12h_price, null)
                  }}<span class="pz-faint">)</span></template
                >
                <span class="pz-faint"> {{ t('modelPlaza.table.cacheReadShort') }}</span>
                {{ paidPerMillion(iv.cache_read_price, null) }}
              </template>
              <span v-else class="pz-faint">-</span>
            </span>
          </div>
        </template>

        <template v-else>
          <div class="pz-pair">
            <div class="pz-price">
              <span class="pz-price__k">{{ t('modelPlaza.table.input') }}</span>
              <span class="pz-price__v">{{ paidPerMillion(m.pricing?.input_price, null) }}</span>
            </div>
            <div class="pz-price">
              <span class="pz-price__k">{{ t('modelPlaza.table.output') }}</span>
              <span class="pz-price__v">{{ paidPerMillion(m.pricing?.output_price, null) }}</span>
            </div>
          </div>
          <p v-if="hasCachePricing(m)" class="pz-model__cache">
            <span class="pz-faint">{{ t('modelPlaza.table.cacheWrite') }}</span>
            {{ paidPerMillion(m.pricing?.cache_write_price, null)
            }}<template v-if="m.pricing?.cache_write_1h_price != null"
              ><span class="pz-faint"> (1h </span>{{ paidPerMillion(m.pricing.cache_write_1h_price, null)
              }}<span class="pz-faint">)</span></template
            ><template v-if="m.pricing?.cache_write_12h_price != null"
              ><span class="pz-faint"> (12h </span>{{ paidPerMillion(m.pricing.cache_write_12h_price, null)
              }}<span class="pz-faint">)</span></template
            >
            <span class="pz-model__cache-sep" aria-hidden="true">·</span>
            <span class="pz-faint">{{ t('modelPlaza.table.cacheRead') }}</span>
            {{ paidPerMillion(m.pricing?.cache_read_price, null) }}
          </p>
        </template>
      </div>

      <div v-else class="pz-model__prices pz-model__prices--unit">
        <div v-if="requestIntervals(m).length" class="pz-units">
          <span v-for="(iv, idx) in requestIntervals(m)" :key="idx" class="pz-unit">
            <span class="pz-faint">{{ tierLabel(iv) }}</span>
            <b>{{ paidRequestPrice(m, iv.per_request_price) }}</b>
            <span class="pz-faint">{{ perUnitSuffix(m) }}</span>
          </span>
        </div>
        <p v-else-if="m.pricing?.per_request_price != null" class="pz-price pz-price--solo">
          <span class="pz-price__v">{{ paidRequestPrice(m, m.pricing.per_request_price) }}</span>
          <span class="pz-price__k">{{ perUnitSuffix(m) }}</span>
        </p>
        <span v-else class="pz-faint">-</span>
      </div>

      <div v-if="timePeriods(m).length" class="pz-model__time">
        <p v-if="m.time_pricing?.weekdays_only" class="pz-model__time-title">
          <Icon name="clock" size="xs" aria-hidden="true" />
          <span>{{ t('modelPlaza.table.timePricingWeekdays') }}</span>
        </p>
        <div
          v-for="(p, idx) in timePeriods(m)"
          :key="idx"
          class="pz-time"
          :title="timePricingRowHint(m)"
        >
          <span class="pz-time__win">{{ formatTimeWindow(p) }}</span>
          <span class="pz-time__prices">
            {{ paidPerMillion(m.pricing?.input_price, p) }} / {{ paidPerMillion(m.pricing?.output_price, p) }}
          </span>
          <span class="pz-time__rate">{{ periodRate(p) }}x</span>
        </div>
      </div>

      <footer class="pz-model__foot">
        <div class="pz-official">
          <span class="pz-official__label">{{ t('modelPlaza.table.officialPrice') }}</span>
          <span class="pz-official__val">
            <template v-if="officialIntervals(m).length">
              <span v-for="(iv, idx) in officialIntervals(m)" :key="idx" class="pz-official__tier" :title="t('modelPlaza.table.tierHint')">
                <span class="pz-faint">{{ tierLabel(iv) }}</span>
                {{ official(iv.input_price) }} / {{ official(iv.output_price) }}
              </span>
            </template>
            <template v-else>{{ official(m.official_pricing?.input_price) }} / {{ official(m.official_pricing?.output_price) }}</template>
            <template v-if="officialHasCache(m)">
              <span class="pz-faint"> · {{ t('modelPlaza.table.cacheWriteShort') }}</span>
              {{ official(m.official_pricing?.cache_write_price)
              }}<template v-if="m.official_pricing?.cache_write_1h_price != null"
                ><span class="pz-faint"> (1h </span>{{ official(m.official_pricing.cache_write_1h_price)
                }}<span class="pz-faint">)</span></template
              ><template v-if="m.official_pricing?.cache_write_12h_price != null"
                ><span class="pz-faint"> (12h </span>{{ official(m.official_pricing.cache_write_12h_price)
                }}<span class="pz-faint">)</span></template
              >
              <span class="pz-faint"> {{ t('modelPlaza.table.cacheReadShort') }}</span>
              {{ official(m.official_pricing?.cache_read_price) }}
            </template>
          </span>
        </div>

        <span class="pz-model__ratebox" :title="t('modelPlaza.table.rate')">
          <span v-if="usesIndependentMediaRate(m)" class="pz-model__rate" data-rate>{{ requestRate(m) }}x</span>
          <template v-else-if="hasCustomRate">
            <span class="pz-model__rate-old">{{ rateMultiplier }}x</span>
            <span class="pz-model__rate" data-rate>{{ effectiveRate }}x</span>
          </template>
          <span v-else class="pz-model__rate" data-rate>{{ effectiveRate }}x</span>
        </span>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import ModelIcon from '@/components/common/ModelIcon.vue'
import { useClipboard } from '@/composables/useClipboard'
import { formatScaled, resolveIntervalPrices } from '@/utils/pricing'
import { platformAccentColor, platformBadgeLightClass, platformLabel } from '@/utils/platformColors'
import {
  BILLING_MODE_TOKEN,
  BILLING_MODE_IMAGE,
  BILLING_MODE_VIDEO,
  REASONING_EFFORT_LEVELS,
  type BillingMode,
} from '@/constants/channel'
import type { PlazaModel, PlazaTimePricingPeriod } from '@/api/modelPlaza'
import type { UserPricingInterval } from '@/api/channels'

function reasoningEffortMultipliers(model: PlazaModel): [string, number][] {
  const multipliers = model.pricing?.reasoning_effort_multipliers
  return REASONING_EFFORT_LEVELS.flatMap((effort) => {
    const multiplier = multipliers?.[effort]
    return typeof multiplier === 'number' && Number.isFinite(multiplier) && multiplier > 0
      ? [[effort, multiplier] as [string, number]]
      : []
  })
}

const props = defineProps<{
  models: PlazaModel[]
  platform?: string
  rateMultiplier: number
  userRateMultiplier?: number | null
  imageRateIndependent?: boolean
  imageRateMultiplier?: number | null
  videoRateIndependent?: boolean
  videoRateMultiplier?: number | null
  peakWindow?: string
  peakRateMultiplier?: number | null
}>()

const { t } = useI18n()
const { copyToClipboard } = useClipboard()

const accentStyle = computed(() => ({ '--plaza-accent': platformAccentColor(props.platform ?? '') }))

const PER_MILLION = 1_000_000
const MIN_DECIMALS = 2

const sortedModels = computed(() => {
  return [...props.models].sort((a, b) => {
    const ta = billingMode(a) === BILLING_MODE_TOKEN
    const tb = billingMode(b) === BILLING_MODE_TOKEN
    if (ta !== tb) return ta ? -1 : 1
    const pa = a.official_pricing?.output_price ?? null
    const pb = b.official_pricing?.output_price ?? null
    if (pa != null && pb != null && pa !== pb) return pb - pa
    if (pa != null && pb == null) return -1
    if (pa == null && pb != null) return 1
    return b.name.localeCompare(a.name)
  })
})

const effectiveRate = computed(() => props.userRateMultiplier ?? props.rateMultiplier)
const hasCustomRate = computed(
  () => props.userRateMultiplier != null && props.userRateMultiplier !== props.rateMultiplier
)

function billingMode(m: PlazaModel): BillingMode {
  return (m.pricing?.billing_mode || BILLING_MODE_TOKEN) as BillingMode
}

function billingModeLabel(m: PlazaModel): string {
  return billingMode(m) === BILLING_MODE_IMAGE
    ? t('modelPlaza.table.perImage')
    : t('modelPlaza.table.perRequest')
}

function hasBadges(m: PlazaModel): boolean {
  return (
    (Boolean(props.platform) && m.platform !== props.platform) ||
    billingMode(m) !== BILLING_MODE_TOKEN ||
    m.long_context_basis === 'marginal' ||
    reasoningEffortMultipliers(m).length > 0
  )
}

function periodRate(period: PlazaTimePricingPeriod): number {
  return Math.round(effectiveRate.value * period.multiplier * 1000) / 1000
}

function paidPerMillion(value: number | null | undefined, period: PlazaTimePricingPeriod | null = null): string {
  if (value == null) return '-'
  const rate = period ? periodRate(period) : effectiveRate.value
  return formatScaled(value * rate, PER_MILLION, MIN_DECIMALS)
}

function usesIndependentMediaRate(m: PlazaModel): boolean {
  return (billingMode(m) === BILLING_MODE_IMAGE && props.imageRateIndependent === true) ||
    (billingMode(m) === BILLING_MODE_VIDEO && props.videoRateIndependent === true)
}

function requestRate(m: PlazaModel): number {
  if (billingMode(m) === BILLING_MODE_VIDEO && props.videoRateIndependent === true) {
    return Math.max(0, props.videoRateMultiplier ?? 1)
  }
  return billingMode(m) === BILLING_MODE_IMAGE && props.imageRateIndependent === true
    ? (props.imageRateMultiplier ?? 1)
    : effectiveRate.value
}

function paidRequestPrice(m: PlazaModel, value: number | null | undefined): string {
  if (value == null) return '-'
  return formatScaled(value * requestRate(m), 1, MIN_DECIMALS)
}

function official(value: number | null | undefined): string {
  if (value == null) return '-'
  return formatScaled(value, PER_MILLION, MIN_DECIMALS)
}

function perUnitSuffix(m: PlazaModel): string {
  return billingMode(m) === BILLING_MODE_IMAGE
    ? t('modelPlaza.table.perUnitImage')
    : t('modelPlaza.table.perUnitRequest')
}

function hasCachePricing(m: PlazaModel): boolean {
  return m.pricing?.cache_write_price != null || m.pricing?.cache_write_1h_price != null ||
    m.pricing?.cache_write_12h_price != null || m.pricing?.cache_read_price != null
}

function officialHasCache(m: PlazaModel): boolean {
  const o = m.official_pricing
  return !!o && (o.cache_write_price != null || o.cache_read_price != null ||
    o.cache_write_1h_price != null || o.cache_write_12h_price != null)
}

function intervalHasCache(iv: UserPricingInterval): boolean {
  return iv.cache_write_price != null || iv.cache_write_1h_price != null ||
    iv.cache_write_12h_price != null || iv.cache_read_price != null
}

function timePeriods(m: PlazaModel): PlazaTimePricingPeriod[] {
  return m.time_pricing?.periods ?? []
}

function timePricingRowHint(m: PlazaModel): string {
  const key = m.time_pricing?.weekdays_only
    ? 'modelPlaza.table.timePricingRowHintWeekdays'
    : 'modelPlaza.table.timePricingRowHint'
  let hint = t(key, { timezone: m.time_pricing?.timezone })
  if (props.peakWindow) {
    hint += t('modelPlaza.table.timePricingRowHintPeak', {
      window: props.peakWindow,
      multiplier: props.peakRateMultiplier ?? 1,
    })
  }
  return hint
}

function formatTimeWindow(p: PlazaTimePricingPeriod): string {
  const clock = (v: string) => v.replace(/^(\d{2}:\d{2}):00$/, '$1')
  return `${clock(p.start_time)}–${clock(p.end_time)}`
}

function sortByContext(intervals: UserPricingInterval[]): UserPricingInterval[] {
  return [...intervals].sort((a, b) => a.min_tokens - b.min_tokens)
}

function tokenIntervals(m: PlazaModel): UserPricingInterval[] {
  return sortByContext(m.pricing?.intervals ?? []).map((iv) => resolveIntervalPrices(iv, m.pricing!))
}

function officialIntervals(m: PlazaModel): UserPricingInterval[] {
  return sortByContext(m.official_pricing?.intervals ?? [])
}

function tierHint(m: PlazaModel): string {
  return m.long_context_basis === 'marginal'
    ? t('modelPlaza.table.tierHintMarginal')
    : t('modelPlaza.table.tierHint')
}

function requestIntervals(m: PlazaModel): UserPricingInterval[] {
  return (m.pricing?.intervals ?? []).filter((iv) => iv.per_request_price != null)
}

function tierLabel(iv: UserPricingInterval): string {
  if (iv.tier_label) return iv.tier_label
  const { min_tokens: min, max_tokens: max } = iv
  return max == null ? `>${formatTokenCount(min)}` : `≤${formatTokenCount(max)}`
}

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${trimZero(n / 1_000_000)}M`
  if (n >= 1_000) return `${trimZero(n / 1_000)}K`
  return String(n)
}

function trimZero(n: number): string {
  return String(Math.round(n * 100) / 100)
}
</script>

<style scoped>
.pz-store {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 272px), 1fr));
  gap: 14px;
  padding: clamp(16px, 2vw, 24px);
  --pz-accent-soft: color-mix(in srgb, var(--plaza-accent) 10%, transparent);
  --pz-accent-line: color-mix(in srgb, var(--plaza-accent) 30%, transparent);
}

.pz-model {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: var(--st-radius-md);
  background: var(--st-bg-elev);
  overflow: hidden;
}

.pz-model__head { display: flex; align-items: flex-start; gap: 10px; }
.pz-model__glyph {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  border: 1px solid var(--pz-accent-line);
  background: var(--pz-accent-soft);
  color: var(--plaza-accent);
}
.pz-model__id { min-width: 0; flex: 1; }
.pz-model__name {
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--st-ink);
  overflow-wrap: anywhere;
}
.pz-model__vendor {
  margin-top: 2px;
  font-size: 0.74rem;
  color: var(--st-ink-faint);
  letter-spacing: 0.02em;
}
.pz-model__copy { width: 32px; height: 32px; flex-shrink: 0; }

.pz-model__badges { display: flex; flex-wrap: wrap; gap: 5px; }
.pz-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding-inline: 7px;
  border-radius: 6px;
  border: 1px solid var(--st-line);
  font-size: 10px;
  font-weight: 550;
  letter-spacing: 0.02em;
  color: var(--st-ink-soft);
  white-space: nowrap;
}
.pz-badge--effort {
  border-color: color-mix(in srgb, var(--st-accent) 26%, transparent);
  background: var(--st-accent-soft);
  color: var(--st-accent);
}

.pz-model__prices { display: flex; flex-direction: column; gap: 6px; }
.pz-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pz-price { display: flex; flex-direction: column; gap: 1px; }
.pz-price--solo { flex-direction: row; align-items: baseline; gap: 5px; }
.pz-price__k { font-size: 0.7rem; color: var(--st-ink-faint); letter-spacing: 0.03em; }
.pz-price__v {
  font-family: var(--st-font-display);
  font-size: 1.12rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--st-ink-strong);
  font-variant-numeric: tabular-nums;
}
.pz-model__cache {
  font-size: 0.74rem;
  line-height: 1.7;
  color: var(--st-ink-soft);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.pz-model__cache-sep { margin-inline: 5px; color: var(--st-line-strong); }
.pz-faint { color: var(--st-ink-faint); }

.pz-tier {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas: 'label pair cache';
  align-items: baseline;
  gap: 8px;
  padding: 5px 0;
  border-top: 1px dashed var(--st-line);
  font-variant-numeric: tabular-nums;
}
.pz-tier:first-child { border-top: 0; }
.pz-tier__label {
  grid-area: label;
  font-size: 0.68rem;
  color: var(--st-ink-faint);
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.pz-tier__pair { grid-area: pair; display: inline-flex; align-items: baseline; gap: 4px; }
.pz-tier__k { font-size: 0.68rem; color: var(--st-ink-faint); }
.pz-tier__v { font-size: 0.86rem; font-weight: 600; color: var(--st-ink); }
.pz-tier__cache {
  grid-area: cache;
  font-size: 0.68rem;
  color: var(--st-ink-soft);
  text-align: right;
  max-width: 14ch;
}

.pz-units { display: flex; flex-wrap: wrap; gap: 6px; }
.pz-unit {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid var(--st-line);
  background: var(--st-bg-sunk);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}
.pz-unit b { color: var(--st-ink); font-weight: 600; }

.pz-model__time {
  padding: 8px 10px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--st-accent) 6%, transparent);
  border: 1px solid var(--st-accent-line);
}
.pz-model__time-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--st-accent);
  margin-bottom: 4px;
}
.pz-time {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  color: var(--st-ink-soft);
}
.pz-time__win { color: var(--st-ink); font-weight: 550; white-space: nowrap; }
.pz-time__prices { flex: 1; }
.pz-time__rate { color: var(--st-accent); font-weight: 600; }

.pz-model__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--st-line);
}
.pz-official { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pz-official__label { font-size: 0.66rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--st-ink-faint); }
.pz-official__val { font-size: 0.72rem; color: var(--st-ink-soft); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.pz-official__tier { display: block; }
.pz-model__ratebox { flex-shrink: 0; display: inline-flex; align-items: baseline; gap: 5px; }
.pz-model__rate {
  font-family: var(--st-font-display);
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--st-accent);
  font-variant-numeric: tabular-nums;
}
.pz-model__rate-old {
  font-size: 0.72rem;
  color: var(--st-ink-faint);
  text-decoration: line-through;
}

@media (max-width: 480px) {
  .pz-store { padding: 12px; gap: 10px; }
  .pz-tier { grid-template-columns: auto 1fr; grid-template-areas: 'label pair' 'cache cache'; }
  .pz-tier__cache { text-align: left; max-width: none; }
  .pz-model__foot { flex-direction: column; align-items: flex-start; }
  .pz-model__ratebox { align-self: flex-end; }
}
</style>
