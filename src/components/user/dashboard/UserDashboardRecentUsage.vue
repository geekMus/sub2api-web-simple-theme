<template>
  <article class="dash-recent st-card">
    <header class="dash-recent__head">
      <div>
        <p class="st-eyebrow">{{ c('usercore.dash.recentTitle') }}</p>
        <h2 class="st-display-3 dash-recent__title">{{ c('usercore.dash.recentTitle') }}</h2>
        <p class="st-body dash-recent__lede">{{ c('usercore.dash.recentLede') }}</p>
      </div>
      <router-link to="/usage" class="st-btn st-btn--ghost st-btn--sm">
        {{ c('usercore.viewAll') }}
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7">
          <path d="M4 10h11M11 5.5L15.5 10 11 14.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </router-link>
    </header>

    <!-- 加载：骨架行 -->
    <div v-if="loading" class="dash-recent__skeleton">
      <div v-for="i in 4" :key="i" class="dash-recent__skeleton-row">
        <span class="st-skeleton dash-recent__skeleton-avatar"></span>
        <span class="st-skeleton dash-recent__skeleton-line"></span>
        <span class="st-skeleton dash-recent__skeleton-cost"></span>
      </div>
    </div>

    <!-- 空：一张小插画 + 一句引导 -->
    <div v-else-if="data.length === 0" class="dash-recent__empty">
      <svg viewBox="0 0 120 84" width="120" height="84" fill="none" aria-hidden="true">
        <rect x="10" y="20" width="100" height="52" rx="12" stroke="var(--st-line-strong)" stroke-width="1.4" />
        <path d="M10 34h100" stroke="var(--st-line-strong)" stroke-width="1.4" />
        <circle cx="21" cy="27" r="2.2" fill="var(--st-line-strong)" />
        <circle cx="29" cy="27" r="2.2" fill="var(--st-line-strong)" />
        <path d="M26 48h34M26 58h22" stroke="var(--st-line-strong)" stroke-width="1.6" stroke-linecap="round" />
        <path d="M82 46l10 8-10 8" stroke="var(--st-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M60 6l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="var(--st-accent-soft)" />
      </svg>
      <p class="dash-recent__empty-title">{{ c('usercore.dash.recentEmpty') }}</p>
      <p class="dash-recent__empty-body">{{ c('usercore.dash.recentEmptyHint') }}</p>
      <router-link to="/keys" class="st-btn st-btn--primary st-btn--sm">{{ c('usercore.dash.quickKeyTitle') }}</router-link>
    </div>

    <ul v-else class="dash-recent__list">
      <li v-for="log in data" :key="log.id" class="st-row dash-recent__row">
        <span class="dash-recent__dot" aria-hidden="true"></span>
        <span class="dash-recent__model" :title="log.model">{{ log.model }}</span>
        <span class="dash-recent__time">{{ formatDateTime(log.created_at) }}</span>
        <span class="dash-recent__tokens st-num">{{ (log.input_tokens + log.output_tokens).toLocaleString() }} tokens</span>
        <span class="dash-recent__cost st-num" :title="c('usercore.actual')">${{ formatCost(log.actual_cost) }}</span>
        <span class="dash-recent__cost-standard st-num" :title="c('usercore.standard')">${{ formatCost(log.total_cost) }}</span>
      </li>
    </ul>
  </article>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatDateTime } from '@/utils/format'
import type { UsageLog } from '@/types'
import { useUserCoreCopy } from '@/composables/copy/userCore'

defineProps<{
  data: UsageLog[]
  loading: boolean
}>()
useI18n()
const { c } = useUserCoreCopy()
const formatCost = (c: number) => c.toFixed(4)
</script>

<style scoped>
.dash-recent { display: flex; flex-direction: column; gap: 4px; padding: clamp(18px, 2.4vw, 28px); }
.dash-recent__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.dash-recent__title { margin-top: 8px; }
.dash-recent__lede { font-size: 0.86rem; margin-top: 6px; }

.dash-recent__list { display: flex; flex-direction: column; margin-top: 8px; }
.dash-recent__row {
  grid-template-columns: 8px minmax(0, 1.6fr) minmax(0, 1fr) auto auto;
  gap: 12px;
  padding: 13px 6px;
  border-radius: 0;
}
.dash-recent__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--st-accent-line); }
.dash-recent__model {
  font-family: var(--st-font-mono);
  font-size: 0.8rem;
  color: var(--st-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dash-recent__time { font-size: 0.76rem; color: var(--st-ink-faint); white-space: nowrap; }
.dash-recent__tokens { font-size: 0.76rem; color: var(--st-ink-faint); white-space: nowrap; text-align: right; }
.dash-recent__cost { font-size: 0.86rem; font-weight: 600; color: var(--st-ink); text-align: right; white-space: nowrap; }
.dash-recent__cost-standard { font-size: 0.74rem; color: var(--st-ink-faint); text-align: right; white-space: nowrap; display: none; }

.dash-recent__skeleton { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
.dash-recent__skeleton-row { display: flex; align-items: center; gap: 12px; }
.dash-recent__skeleton-avatar { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.dash-recent__skeleton-line { height: 12px; flex: 1; }
.dash-recent__skeleton-cost { height: 12px; width: 64px; flex: none; }

.dash-recent__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: clamp(18px, 3vw, 32px) 12px;
  margin-top: 8px;
  text-align: center;
  border-radius: var(--st-radius-lg);
  background: radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--st-accent) 7%, transparent), transparent 70%);
}
.dash-recent__empty-title { font-size: 0.96rem; font-weight: 600; color: var(--st-ink); }
.dash-recent__empty-body { font-size: 0.82rem; color: var(--st-ink-faint); max-width: 34ch; }

@media (min-width: 900px) {
  .dash-recent__row { grid-template-columns: 8px minmax(0, 1.6fr) minmax(0, 1fr) auto auto auto; }
  .dash-recent__cost-standard { display: inline; }
}
</style>

