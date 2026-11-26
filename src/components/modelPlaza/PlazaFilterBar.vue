<template>
  <div class="filters">
    <div class="filters__row">
      <span class="filters__label">{{ c('plaza.filter.platform') }}</span>
      <div class="filters__rail" role="group" aria-label="platform">
        <div class="st-seg filters__seg">
          <button
            v-for="p in ['all', ...platforms]"
            :key="`platform-${p}`"
            type="button"
            class="st-seg__item filters__item"
            :class="{ 'st-seg__item--active': platform === p }"
            :disabled="p !== 'all' && !platformEnabled(p)"
            @click="$emit('update:platform', p)"
          >
            <PlatformIcon v-if="p !== 'all'" :platform="p as GroupPlatform" size="xs" />
            {{ p === 'all' ? t('modelPlaza.filters.all') : p }}
          </button>
        </div>
      </div>
    </div>

    <div class="filters__row">
      <span class="filters__label">{{ c('plaza.filter.group') }}</span>
      <div class="filters__rail" role="group" aria-label="group">
        <div class="st-seg filters__seg">
          <button
            type="button"
            class="st-seg__item filters__item"
            :class="{ 'st-seg__item--active': groupId === 'all' }"
            @click="$emit('update:groupId', 'all')"
          >
            {{ t('modelPlaza.filters.all') }}
          </button>
          <button
            v-for="g in groups"
            :key="`group-${g.id}`"
            type="button"
            class="st-seg__item filters__item"
            :class="{ 'st-seg__item--active': groupId === g.id }"
            :disabled="!groupEnabled(g)"
            :style="{ '--chip-accent': platformAccentColor(g.platform) }"
            @click="$emit('update:groupId', g.id)"
          >
            {{ g.name }}
          </button>
        </div>
      </div>
    </div>

    <div class="filters__row">
      <span class="filters__label">{{ c('plaza.filter.rate') }}</span>
      <div class="filters__rail" role="group" aria-label="rate">
        <div class="st-seg filters__seg">
          <button
            type="button"
            class="st-seg__item filters__item"
            :class="{ 'st-seg__item--active': rate === 'all' }"
            @click="$emit('update:rate', 'all')"
          >
            {{ t('modelPlaza.filters.all') }}
          </button>
          <button
            v-for="r in rates"
            :key="`rate-${r}`"
            type="button"
            class="st-seg__item filters__item filters__item--num"
            :class="{ 'st-seg__item--active': rate === r }"
            :disabled="!rateEnabled(r)"
            @click="$emit('update:rate', r)"
          >
            {{ r }}x
          </button>
        </div>
      </div>
    </div>

    <div class="filters__row filters__row--search">
      <span class="filters__label">{{ c('plaza.filter.search') }}</span>
      <div class="filters__search">
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="M13 13l4 4" stroke-linecap="round" />
        </svg>
        <input
          :value="search"
          type="text"
          class="filters__input"
          :placeholder="c('plaza.searchPlaceholder')"
          @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
        />
        <button v-if="search" type="button" class="filters__clear" @click="$emit('update:search', '')">
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import { platformAccentColor } from '@/utils/platformColors'
import { useMiscCopy } from '@/composables/copy/misc'
import type { GroupPlatform } from '@/types'

const props = defineProps<{
  /** 数据中出现的平台（去重排序后）。 */
  platforms: string[]
  /** 全量分组（含平台与生效倍率），三个维度的置灰联动由此推导。 */
  groups: Array<{ id: number; name: string; platform: string; rate: number }>
  /** 全量生效倍率去重升序。 */
  rates: number[]
  platform: string
  groupId: number | 'all'
  rate: number | 'all'
  /** 模型名搜索词（纯前端过滤）。 */
  search: string
}>()

defineEmits<{
  'update:platform': [value: string]
  'update:groupId': [value: number | 'all']
  'update:rate': [value: number | 'all']
  'update:search': [value: string]
}>()

const { t } = useI18n()
const { c } = useMiscCopy()

/**
 * 三个维度互为约束（faceted）：某选项可点 ⟺ 在「其他两维」当前选择下仍有分组命中。
 * 「全部」永远可点，作为解除本维约束的出口；可点项组合恒有结果，无需选择修正。
 */
function platformEnabled(p: string): boolean {
  return props.groups.some(
    (g) =>
      g.platform === p &&
      (props.groupId === 'all' || g.id === props.groupId) &&
      (props.rate === 'all' || g.rate === props.rate)
  )
}

function groupEnabled(g: { platform: string; rate: number }): boolean {
  return (
    (props.platform === 'all' || g.platform === props.platform) &&
    (props.rate === 'all' || g.rate === props.rate)
  )
}

function rateEnabled(r: number): boolean {
  return props.groups.some(
    (g) =>
      g.rate === r &&
      (props.platform === 'all' || g.platform === props.platform) &&
      (props.groupId === 'all' || g.id === props.groupId)
  )
}
</script>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  border-radius: var(--st-radius-lg);
  border: 1px solid var(--st-line);
  background: color-mix(in srgb, var(--st-bg-elev) 62%, transparent);
  backdrop-filter: blur(14px);
}

.filters__row {
  display: grid;
  grid-template-columns: 62px 1fr;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.filters__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--st-ink-faint);
}
.filters__rail { min-width: 0; overflow-x: auto; scrollbar-width: none; }
.filters__rail::-webkit-scrollbar { display: none; }

.filters__seg {
  display: inline-flex;
  flex-wrap: nowrap;
  max-width: 100%;
  background: var(--st-bg-sunk);
}
.filters__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  flex-shrink: 0;
  border: 0;
  background: transparent;
}
.filters__item:disabled { opacity: 0.34; cursor: not-allowed; }
.filters__item:disabled:hover { color: var(--st-ink-soft); }
.filters__item--num { font-variant-numeric: tabular-nums; }

.filters__row--search { margin-top: 2px; }
.filters__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding-inline: 12px;
  border-radius: 999px;
  border: 1px solid var(--st-line-strong);
  background: var(--st-bg-elev);
  color: var(--st-ink-faint);
  transition: border-color var(--st-dur) var(--st-ease), box-shadow var(--st-dur) var(--st-ease);
}
.filters__search:focus-within {
  border-color: var(--st-accent);
  box-shadow: 0 0 0 4px var(--st-accent-soft);
}
.filters__input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--st-ink);
  font-size: 0.86rem;
}
.filters__input::placeholder { color: var(--st-ink-faint); }
.filters__clear {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 50%;
  background: var(--st-bg-sunk);
  color: var(--st-ink-soft);
  cursor: pointer;
  transition: background-color var(--st-dur-fast) var(--st-ease);
}
.filters__clear:hover { background: var(--st-accent-soft); color: var(--st-ink); }

@media (max-width: 720px) {
  .filters { padding: 14px; border-radius: var(--st-radius-md); }
  .filters__row { grid-template-columns: 1fr; gap: 6px; }
  .filters__label { letter-spacing: 0.1em; }
}
</style>
