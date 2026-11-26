<template>
  <section class="shelf st-reveal">
    <header class="shelf__head">
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

      <span class="shelf__count st-num">{{ group.models.length }}</span>
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

const props = defineProps<{
  group: ModelPlazaGroup
}>()

const { t } = useI18n()
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
.shelf { display: flex; flex-direction: column; gap: 14px; }

.shelf__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--st-line);
}
.shelf__headline { min-width: 0; display: flex; flex-direction: column; gap: 7px; }
.shelf__badges { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.shelf__desc {
  font-size: 0.88rem;
  line-height: 1.7;
  color: var(--st-ink-soft);
  max-width: 68ch;
  text-wrap: pretty;
}
.shelf__note {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.76rem;
  line-height: 1.6;
  color: var(--st-ink-faint);
}
.shelf__note svg { flex-shrink: 0; }
.shelf__note--peak { color: var(--st-accent); }

.shelf__count {
  flex-shrink: 0;
  font-family: var(--st-font-display);
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--st-ink-faint);
}

.shelf__body {
  border-radius: var(--st-radius-lg);
  border: 1px solid var(--st-line);
  background: color-mix(in srgb, var(--st-bg-elev) 55%, transparent);
  overflow: hidden;
}
.shelf__empty {
  padding: 32px 20px;
  text-align: center;
  font-size: 0.86rem;
  color: var(--st-ink-faint);
}

@media (max-width: 640px) {
  .shelf__body { border-radius: var(--st-radius-md); }
}
</style>
