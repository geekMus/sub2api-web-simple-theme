<template>
  <UserShell>
    <section class="st-section--tight aff">
      <div class="st-shell">
        <header class="aff__hero">
          <p class="st-eyebrow st-reveal">{{ c('aff.eyebrow') }}</p>
          <h1 class="st-display-2 aff__title st-reveal" style="--i: 1">{{ c('aff.title') }}</h1>
          <p class="st-lede aff__lede st-reveal" style="--i: 2">{{ c('aff.lede') }}</p>
        </header>

        <!-- 加载 -->
        <div v-if="loading" class="aff__stats" aria-busy="true">
          <div v-for="i in 4" :key="i" class="st-card st-skeleton aff__sk-stat"></div>
        </div>

        <template v-else-if="detail">
          <!-- 数字 -->
          <div class="aff__stats aff__stats--live st-reveal" style="--i: 2">
            <div class="st-card st-card--pad aff__stat aff__stat--accent">
              <p class="st-stat__label">{{ t('affiliate.stats.rebateRate') }}</p>
              <p class="st-stat__value st-num">{{ formattedRebateRate }}<span class="st-stat__unit">%</span></p>
              <p class="aff__hint">{{ t('affiliate.stats.rebateRateHint') }}</p>
            </div>
            <div class="st-card st-card--pad aff__stat">
              <p class="st-stat__label">{{ t('affiliate.stats.invitedUsers') }}</p>
              <p class="st-stat__value st-num">{{ formatCount(detail.aff_count) }}</p>
            </div>
            <div class="st-card st-card--pad aff__stat">
              <p class="st-stat__label">{{ t('affiliate.stats.availableQuota') }}</p>
              <p class="st-stat__value st-num aff__value--accent">{{ formatCurrency(detail.aff_quota) }}</p>
            </div>
            <div class="st-card st-card--pad aff__stat">
              <p class="st-stat__label">{{ t('affiliate.stats.totalQuota') }}</p>
              <p class="st-stat__value st-num">{{ formatCurrency(detail.aff_history_quota) }}</p>
              <p v-if="detail.aff_frozen_quota > 0" class="aff__hint aff__hint--warn">
                {{ t('affiliate.stats.frozenQuota') }}: {{ formatCurrency(detail.aff_frozen_quota) }}
              </p>
            </div>
          </div>

          <!-- 邀请链接 -->
          <section class="st-card st-card--pad aff__card st-reveal" style="--i: 3">
            <h2 class="st-display-3">{{ c('aff.inviteTitle') }}</h2>
            <p class="st-body">{{ t('affiliate.description') }}</p>

            <div class="aff__fields">
              <div class="aff__field">
                <p class="st-label">{{ t('affiliate.yourCode') }}</p>
                <div class="aff__valuebox">
                  <code class="aff__code">{{ detail.aff_code }}</code>
                  <button class="st-btn st-btn--quiet st-btn--sm" @click="copyCode">{{ t('affiliate.copyCode') }}</button>
                </div>
              </div>
              <div class="aff__field">
                <p class="st-label">{{ t('affiliate.inviteLink') }}</p>
                <div class="aff__valuebox">
                  <code class="aff__link">{{ inviteLink }}</code>
                  <button class="st-btn st-btn--quiet st-btn--sm" @click="copyInviteLink">{{ t('affiliate.copyLink') }}</button>
                </div>
              </div>
            </div>

            <ul class="aff__tips">
              <li>01 · {{ t('affiliate.tips.line1') }}</li>
              <li>02 · {{ t('affiliate.tips.line2', { rate: `${formattedRebateRate}%` }) }}</li>
              <li>03 · {{ t('affiliate.tips.line3') }}</li>
              <li v-if="detail.aff_frozen_quota > 0">04 · {{ t('affiliate.tips.line4') }}</li>
            </ul>
          </section>

          <!-- 转余额 -->
          <section class="st-card st-card--pad aff__card aff__transfer st-reveal" style="--i: 4">
            <div>
              <h2 class="st-display-3">{{ c('aff.transferTitle') }}</h2>
              <p class="st-body">{{ t('affiliate.transfer.description') }}</p>
              <p v-if="detail.aff_quota <= 0" class="aff__hint aff__hint--warn">{{ t('affiliate.transfer.empty') }}</p>
            </div>
            <button class="st-btn st-btn--primary" :disabled="transferring || detail.aff_quota <= 0" @click="transferQuota">
              {{ transferring ? t('affiliate.transfer.transferring') : t('affiliate.transfer.button') }}
            </button>
          </section>

          <!-- 邀请列表 -->
          <section class="st-card st-card--pad aff__card st-reveal" style="--i: 5">
            <div class="aff__list-head">
              <h2 class="st-display-3">{{ c('aff.inviteesTitle') }}</h2>
              <span class="st-pill st-num">{{ detail.invitees.length }}</span>
            </div>

            <div v-if="detail.invitees.length === 0" class="aff__empty">
              <span class="aff__empty-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" stroke-linecap="round" />
                  <circle cx="9.5" cy="8" r="3" />
                  <path d="M18 8v6M21 11h-6" stroke-linecap="round" />
                </svg>
              </span>
              <p>{{ c('aff.inviteesEmpty') }}</p>
            </div>

            <ul v-else class="st-list aff__invitees">
              <li v-for="item in detail.invitees" :key="item.user_id" class="st-row aff__invitee">
                <div class="aff__invitee-main">
                  <p class="st-row__title">{{ item.username || item.email || '-' }}</p>
                  <p class="st-row__meta">{{ item.email || '-' }} · {{ formatDateTime(item.created_at) || '-' }}</p>
                </div>
                <span class="aff__rebate st-num">+{{ formatCurrency(item.total_rebate) }}</span>
              </li>
            </ul>
          </section>
        </template>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UserShell from '@/components/shell/UserShell.vue'
import userAPI from '@/api/user'
import type { UserAffiliateDetail } from '@/types'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useClipboard } from '@/composables/useClipboard'
import { useMiscCopy } from '@/composables/copy/misc'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { extractApiErrorMessage } from '@/utils/apiError'

const { t } = useI18n()
const { c } = useMiscCopy()
const appStore = useAppStore()
const authStore = useAuthStore()
const { copyToClipboard } = useClipboard()

const loading = ref(true)
const transferring = ref(false)
const detail = ref<UserAffiliateDetail | null>(null)

const inviteLink = computed(() => {
  if (!detail.value) return ''
  if (typeof window === 'undefined') return `/register?aff=${encodeURIComponent(detail.value.aff_code)}`
  return `${window.location.origin}/register?aff=${encodeURIComponent(detail.value.aff_code)}`
})

// Rebate rate is a percentage in the range [0, 100]; backend already clamps it.
// We trim trailing zeros (e.g. 20.00 → "20", 12.50 → "12.5") for a cleaner UI.
const formattedRebateRate = computed(() => {
  const v = detail.value?.effective_rebate_rate_percent ?? 0
  const rounded = Math.round(v * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : rounded.toString()
})

function formatCount(value: number): string {
  return value.toLocaleString()
}

async function loadAffiliateDetail(silent = false): Promise<void> {
  if (!silent) {
    loading.value = true
  }
  try {
    detail.value = await userAPI.getAffiliateDetail()
  } catch (error) {
    appStore.showError(extractApiErrorMessage(error, t('affiliate.loadFailed')))
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

async function copyCode(): Promise<void> {
  if (!detail.value?.aff_code) return
  await copyToClipboard(detail.value.aff_code, t('affiliate.codeCopied'))
}

async function copyInviteLink(): Promise<void> {
  if (!inviteLink.value) return
  await copyToClipboard(inviteLink.value, t('affiliate.linkCopied'))
}

async function transferQuota(): Promise<void> {
  if (!detail.value || detail.value.aff_quota <= 0 || transferring.value) return
  transferring.value = true
  try {
    const resp = await userAPI.transferAffiliateQuota()
    appStore.showSuccess(t('affiliate.transfer.success', { amount: formatCurrency(resp.transferred_quota) }))
    await Promise.all([
      loadAffiliateDetail(true),
      authStore.refreshUser().catch(() => undefined),
    ])
  } catch (error) {
    appStore.showError(extractApiErrorMessage(error, t('affiliate.transferFailed')))
  } finally {
    transferring.value = false
  }
}

onMounted(() => {
  void loadAffiliateDetail()
})
</script>

<style scoped>
.aff { padding-bottom: clamp(56px, 8vw, 96px); }
.aff__hero { max-width: 58ch; margin-bottom: clamp(24px, 3.4vw, 40px); }
.aff__title { margin-top: 14px; }
.aff__lede { margin-top: 14px; }

.aff__stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 14px;
}
.aff__sk-stat { height: 128px; }
.aff__stat { display: flex; flex-direction: column; gap: 6px; }
.aff__stat--accent { border-color: var(--st-accent-line); background: color-mix(in srgb, var(--st-accent) 6%, var(--st-bg-elev)); }
.aff__value--accent { color: var(--st-accent); }
.aff__hint { font-size: 0.76rem; line-height: 1.6; color: var(--st-ink-faint); }
.aff__hint--warn { color: hsl(36 88% 48%); }

.aff__card { display: flex; flex-direction: column; gap: 12px; margin-bottom: 14px; }

.aff__fields { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 4px; }
.aff__field { min-width: 0; }
.aff__valuebox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 8px 14px;
  border-radius: var(--st-radius-md);
  border: 1px solid var(--st-line-strong);
  background: var(--st-bg-sunk);
}
.aff__code {
  flex: 1;
  min-width: 0;
  font-family: var(--st-font-mono);
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--st-ink);
  overflow-wrap: anywhere;
}
.aff__link {
  flex: 1;
  min-width: 0;
  font-family: var(--st-font-mono);
  font-size: 0.76rem;
  color: var(--st-ink-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.aff__valuebox .st-btn { flex-shrink: 0; }

.aff__tips {
  display: flex;
  flex-direction: column;
  margin-top: 6px;
  border-top: 1px solid var(--st-line);
}
.aff__tips li {
  padding: 9px 0;
  font-size: 0.82rem;
  line-height: 1.7;
  color: var(--st-ink-soft);
  font-variant-numeric: tabular-nums;
}
.aff__tips li + li { border-top: 1px dashed var(--st-line); }

.aff__transfer { flex-direction: row; align-items: center; justify-content: space-between; gap: 18px; }
.aff__transfer .st-btn { flex-shrink: 0; }

.aff__list-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.aff__invitees { margin-top: 2px; }
.aff__invitee { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding-inline: 8px; }
.aff__invitee-main { min-width: 0; }
.aff__invitee-main .st-row__meta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aff__rebate { font-size: 0.88rem; font-weight: 600; color: var(--st-accent); white-space: nowrap; }

.aff__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 16px;
  text-align: center;
  font-size: 0.86rem;
  color: var(--st-ink-faint);
  border: 1px dashed var(--st-line-strong);
  border-radius: var(--st-radius-md);
}
.aff__empty-mark { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--st-line); color: var(--st-ink-faint); }

@media (min-width: 720px) {
  .aff__stats { grid-template-columns: repeat(2, 1fr); }
  .aff__fields { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 1080px) {
  .aff__stats { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 640px) {
  .aff__transfer { flex-direction: column; align-items: stretch; }
  .aff__transfer .st-btn { width: 100%; }
}
</style>
