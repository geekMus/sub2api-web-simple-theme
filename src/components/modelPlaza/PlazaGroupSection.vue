<template>
  <section class="shelf st-reveal">
    <header class="shelf__head">
      <span v-if="index != null" class="shelf__idx st-num" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>

      <div class="shelf__headline">
        <div class="shelf__badges">
          <GroupBadge
            :name="group.name"
            :platform="group.platform as GroupPlatform"
            :subscription-type="(group.subscription_type || 'standard') as SubscriptionType"
            :rate-multiplier="group.rate_multiplier"
            :user-rate-multiplier="group.user_rate_multiplier ?? null"
            :peak-rate-enabled="group.peak_rate_enabled"
            :peak-start="group.peak_start"
            :peak-end="group.peak_end"
            :peak-rate-multiplier="group.peak_rate_multiplier"
            always-show-rate
          />
          <span v-if="group.is_exclusive" class="st-pill st-pill--accent">
            <Icon name="shield" size="xs" aria-hidden="true" />
            {{ t('modelPlaza.badges.exclusive') }}
          </span>
          <span v-if="group.subscription_type === 'subscription'" class="st-pill">
            {{ t('modelPlaza.badges.subscription') }}
          </span>
        </div>

        <p v-if="group.description" class="shelf__desc">{{ group.description }}</p>
        <p v-if="peakNote" class="shelf__note shelf__note--peak">
          <Icon name="clock" size="xs" aria-hidden="true" />
          {{ peakNote }}
        </p>
        <p v-if="longContextNote" class="shelf__note">
          <Icon name="infoCircle" size="xs" aria-hidden="true" />
          {{ longContextNote }}
        </p>
      </div>

      <span class="shelf__count">
        <b class="shelf__count-v st-num">{{ group.models.length }}</b>
        <span class="shelf__count-k">{{ c('plaza.modelCount') }}</span>
      </span>
    </header>

    <div class="shelf__body">
      <PlazaModelPricingTable
        v-if="group.models.length > 0"
        :models="group.models"
        :platform="group.platform"
        :rate-multiplier="group.rate_multiplier"
        :user-rate-multiplier="group.user_rate_multiplier ?? null"
        :image-rate-independent="group.image_rate_independent"
        :image-rate-multiplier="group.image_rate_multiplier"
        :video-rate-independent="group.video_rate_independent"
        :video-rate-multiplier="group.video_rate_multiplier"
        :peak-window="peakWindow"
        :peak-rate-multiplier="group.peak_rate_multiplier"
      />
      <p v-else class="shelf__empty">{{ t('modelPlaza.detail.noModels') }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import GroupBadge from '@/components/common/GroupBadge.vue'
import PlazaModelPricingTable from './PlazaModelPricingTable.vue'
import type { ModelPlazaGroup } from '@/api/modelPlaza'
import type { GroupPlatform, SubscriptionType } from '@/types'
import { hasPeakRate, formatPeakRateWindow, serverTimezoneLabel } from '@/utils/peak-rate'
import { useAppStore } from '@/stores/app'
import { useMiscCopy } from '@/composables/copy/misc'

const props = defineProps<{
  group: ModelPlazaGroup
  /** 第几个分组（0 基），用于「01 / 02」编辑感编号。 */
  index?: number
}>()

const { t } = useI18n()
const { c } = useMiscCopy()
const appStore = useAppStore()

/** 高峰窗口描述（含倍率与服务器时区标注）；分组未启用高峰为空串。 */
const peakWindow = computed(() => {
  if (!hasPeakRate(props.group)) return ''
  return formatPeakRateWindow(
    props.group,
    serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset)
  )
})

const peakNote = computed(() => {
  if (!peakWindow.value) return ''
  return t('modelPlaza.detail.peakNote', {
    window: peakWindow.value,
    multiplier: props.group.peak_rate_multiplier,
  })
})

/**
 * 分组关闭了长上下文阶梯、但组内有模型官方带阶梯时提示：
 * 实付只展示基础档，官方阶梯仅供参考。字段缺失（旧后端）不提示。
 */
const longContextNote = computed(() => {
  if (props.group.long_context_pricing_enabled !== false) return ''
  const hasOfficialLadder = props.group.models.some(
    (m) => (m.official_pricing?.intervals?.length ?? 0) > 1
  )
  return hasOfficialLadder ? t('modelPlaza.detail.longContextDisabledNote') : ''
})
</script>

<style scoped>
.shelf { display: flex; flex-direction: column; gap: clamp(14px, 2vw, 20px); }

.shelf__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: clamp(14px, 2.2vw, 26px);
  padding-bottom: 16px;
  border-bottom: 1px solid var(--st-line);
}
.shelf__idx {
  padding-top: 4px;
  font-family: var(--st-font-mono);
  font-size: 0.76rem;
  letter-spacing: 0.1em;
  color: var(--st-brand-text);
}
.shelf__headline { min-width: 0; display: flex; flex-direction: column; gap: 7px; }
.shelf__badges { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.shelf__desc {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.7;
  color: var(--st-ink-2);
  max-width: 68ch;
  text-wrap: pretty;
}
.shelf__note {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.6;
  color: var(--st-ink-3);
}
.shelf__note svg { flex-shrink: 0; }
.shelf__note--peak { color: var(--st-brand-text); }

.shelf__count { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.shelf__count-v {
  font-family: var(--st-font-display);
  font-size: clamp(1.6rem, 2.4vw, 2.1rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--st-ink);
  font-variant-numeric: tabular-nums;
}
.shelf__count-k { font-size: 0.72rem; color: var(--st-ink-3); white-space: nowrap; }

.shelf__body { min-width: 0; }
.shelf__empty {
  padding: 32px 20px;
  text-align: center;
  font-size: 0.86rem;
  color: var(--st-ink-3);
}

@media (max-width: 560px) {
  .shelf__head { grid-template-columns: minmax(0, 1fr) auto; }
  .shelf__idx { display: none; }
  .shelf__count-v { font-size: 1.5rem; }
}

@media (max-width: 560px) {
  .shelf__count-k,
  .shelf__note,
  .shelf__desc { font-size: 0.8rem; }
}
</style>
