<template>
  <UserShell>
    <section class="st-section--tight aff">
      <div class="st-shell">
        <header class="aff__hero">
          <p class="st-eyebrow st-reveal">{{ c('aff.eyebrow') }}</p>
          <h1 class="st-display-2 aff__title st-reveal" style="--i: 1">{{ c('aff.title') }}</h1>
          <p class="st-lede aff__lede st-reveal" style="--i: 2">{{ c('aff.ledeShort') }}</p>
        </header>

        <!-- 加载 -->
        <div v-if="loading" class="aff__loading" aria-busy="true">
          <div class="st-card aff__panel">
            <div class="aff__stats">
              <div v-for="i in 4" :key="i" class="aff__stat">
                <span class="st-skeleton aff__sk aff__sk--label"></span>
                <span class="st-skeleton aff__sk aff__sk--value"></span>
              </div>
            </div>
          </div>
          <div class="st-card st-card--pad aff__card">
            <div class="st-skeleton aff__sk aff__sk--wide"></div>
            <div class="st-skeleton aff__sk aff__sk--block"></div>
          </div>
        </div>

        <div v-else-if="errorMessage" class="st-card st-card--pad aff__state" role="alert">
          <div class="aff__state-mark">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="9" />
              <path stroke-linecap="round" d="M12 8v5m0 3.5h.01" />
            </svg>
          </div>
          <p class="st-display-3 aff__state-title">{{ c('aff.errorTitle') }}</p>
          <p class="st-body">{{ errorMessage }}</p>
          <button class="st-btn st-btn--primary aff__state-btn" @click="loadAffiliateDetail()">{{ c('aff.retry') }}</button>
        </div>

        <template v-else-if="detail">
          <!-- 数据 + 转余额：一条面板，数字和动作放在一起 -->
          <section class="st-card aff__panel st-reveal" style="--i: 3">
            <div class="aff__stats">
              <div class="aff__stat aff__stat--accent">
                <p class="st-stat__label">{{ t('affiliate.stats.rebateRate') }}</p>
                <p class="st-stat__value st-num">{{ formattedRebateRate }}<span class="st-stat__unit">%</span></p>
                <p class="aff__hint">{{ t('affiliate.stats.rebateRateHint') }}</p>
              </div>
              <div class="aff__stat">
                <p class="st-stat__label">{{ t('affiliate.stats.invitedUsers') }}</p>
                <p class="st-stat__value st-num">{{ formatCount(detail.aff_count) }}</p>
              </div>
              <div class="aff__stat">
                <p class="st-stat__label">{{ t('affiliate.stats.availableQuota') }}</p>
                <p class="st-stat__value st-num aff__value--accent">{{ formatCurrency(detail.aff_quota) }}</p>
              </div>
              <div class="aff__stat">
                <p class="st-stat__label">{{ t('affiliate.stats.totalQuota') }}</p>
                <p class="st-stat__value st-num">{{ formatCurrency(detail.aff_history_quota) }}</p>
                <p v-if="detail.aff_frozen_quota > 0" class="aff__hint aff__hint--warn">
                  {{ t('affiliate.stats.frozenQuota') }}: {{ formatCurrency(detail.aff_frozen_quota) }}
                </p>
              </div>
            </div>

            <div class="aff__transfer">
              <div class="aff__transfer-copy">
                <p class="aff__transfer-title">{{ c('aff.transferTitle') }}</p>
                <p class="aff__transfer-note">{{ t('affiliate.transfer.description') }}</p>
                <p v-if="detail.aff_quota <= 0" class="aff__hint aff__hint--warn">{{ t('affiliate.transfer.empty') }}</p>
              </div>
              <button
                class="st-btn st-btn--primary aff__transfer-btn"
                :disabled="transferring || detail.aff_quota <= 0"
                @click="transferQuota"
              >
                {{ transferring ? t('affiliate.transfer.transferring') : t('affiliate.transfer.button') }}
              </button>
            </div>
          </section>

          <!-- 邀请链接 -->
          <section class="st-card st-card--pad aff__card aff__card--invite st-reveal" style="--i: 4">
            <header class="aff__card-head">
              <h2 class="st-display-3">{{ c('aff.inviteTitle') }}</h2>
              <p class="st-body">{{ t('affiliate.description') }}</p>
            </header>

            <div class="aff__fields">
              <div class="aff__field">
                <p class="st-label">{{ t('affiliate.yourCode') }}</p>
                <div class="aff__valuebox">
                  <code class="aff__code">{{ detail.aff_code }}</code>
                  <button class="st-btn st-btn--quiet aff__copy" @click="copyCode">{{ t('affiliate.copyCode') }}</button>
                </div>
              </div>
              <div class="aff__field">
                <p class="st-label">{{ t('affiliate.inviteLink') }}</p>
                <div class="aff__valuebox">
                  <code class="aff__link">{{ inviteLink }}</code>
                  <button class="st-btn st-btn--primary aff__copy" @click="copyInviteLink">{{ t('affiliate.copyLink') }}</button>
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
              <button class="st-btn st-btn--primary aff__empty-btn" @click="copyInviteLink">{{ c('aff.emptyCta') }}</button>
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
const errorMessage = ref('')
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
  errorMessage.value = ''
  try {
    detail.value = await userAPI.getAffiliateDetail()
  } catch (error) {
    const message = extractApiErrorMessage(error, t('affiliate.loadFailed'))
    errorMessage.value = message
    appStore.showError(message)
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
.aff .st-card { box-shadow: var(--st-shadow-2); }
.aff .st-pill { font-size: 0.75rem; }
.aff .st-btn { min-height: 44px; }

/* ---- 数据面板：一条卡里排四格，数字之间用细线分隔 ---- */
.aff__panel { display: flex; flex-direction: column; margin-bottom: clamp(14px, 1.8vw, 20px); overflow: hidden; }
.aff__stats { display: grid; grid-template-columns: 1fr; }
.aff__stat { display: flex; flex-direction: column; gap: 6px; padding: clamp(18px, 2vw, 24px) clamp(18px, 2.4vw, 28px); min-width: 0; }
.aff__stat + .aff__stat { border-top: 1px solid var(--st-line); }
.aff__stat .st-stat__label { font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase; }
.aff__stat .st-stat__value { font-size: clamp(1.5rem, 2.4vw, 2.05rem); line-height: 1.08; }
.aff__stat--accent { position: relative; }
.aff__stat--accent::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  background: var(--st-brand);
}
.aff__value--accent { color: var(--st-brand-text); }
.aff__hint { font-size: 0.76rem; line-height: 1.6; color: var(--st-ink-3); }
.aff__hint--quiet { color: var(--st-ink-3); }
.aff__hint--warn { color: var(--st-warn); }

.aff__transfer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: clamp(14px, 1.8vw, 18px) clamp(18px, 2.4vw, 28px);
  border-top: 1px solid var(--st-line);
  background: var(--st-bg-soft);
}
.aff__transfer-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.aff__transfer-title { font-size: 0.9rem; font-weight: 600; color: var(--st-ink); }
.aff__transfer-note { font-size: 0.8rem; line-height: 1.6; color: var(--st-ink-3); max-width: 62ch; }
.aff__transfer-btn { flex-shrink: 0; }

/* ---- 卡片通用 ---- */
.aff__card { display: flex; flex-direction: column; gap: clamp(14px, 1.8vw, 20px); margin-bottom: clamp(14px, 1.8vw, 20px); }
.aff__card:last-child { margin-bottom: 0; }
.aff__card-head { display: flex; flex-direction: column; gap: 6px; }
.aff__card-head .st-body { font-size: 0.85rem; }

/* ---- 邀请码 / 邀请链接 ---- */
.aff__fields { display: grid; grid-template-columns: 1fr; gap: 14px; }
.aff__field { min-width: 0; }
.aff__valuebox {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 16px;
  border-radius: var(--st-r-md);
  border: 1px solid var(--st-line-2);
  background: var(--st-bg-soft);
  transition: border-color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease);
}
.aff__valuebox:hover { border-color: var(--st-ink-3); }
.aff__valuebox:focus-within { border-color: var(--st-brand-text); box-shadow: 0 0 0 4px var(--st-brand-soft); }
.aff__code {
  flex: 1;
  min-width: 0;
  font-family: var(--st-font-mono);
  font-size: 1.02rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--st-ink);
  overflow-wrap: anywhere;
}
.aff__link {
  flex: 1;
  min-width: 0;
  font-family: var(--st-font-mono);
  font-size: 0.78rem;
  color: var(--st-ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.aff__valuebox .st-btn { flex-shrink: 0; }

.aff__tips {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--st-line);
}
.aff__tips li {
  padding: 9px 0;
  font-size: 0.82rem;
  line-height: 1.7;
  color: var(--st-ink-3);
  font-variant-numeric: tabular-nums;
}
.aff__tips li + li { border-top: 1px dashed var(--st-line); }

/* ---- 邀请人列表 ---- */
.aff__list-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.aff__invitees { margin-top: 2px; }
.aff__invitee { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding-inline: 8px; }
.aff__invitee-main { min-width: 0; }
.aff__invitee-main .st-row__meta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aff__rebate { font-size: 0.88rem; font-weight: 600; color: var(--st-brand-text); white-space: nowrap; }

.aff__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 16px;
  text-align: center;
  font-size: 0.86rem;
  color: var(--st-ink-3);
  border: 1px dashed var(--st-line-2);
  border-radius: var(--st-r-md);
}
.aff__empty-mark { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--st-line); color: var(--st-ink-3); }
.aff__empty-btn { min-height: 44px; min-width: 180px; margin-top: 4px; }

/* ---- 状态 ---- */
.aff__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-block: clamp(40px, 7vw, 72px);
  text-align: center;
}
.aff__state-mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--st-danger-soft);
  color: var(--st-danger);
}
.aff__state-title { margin: 2px 0 0; }
.aff__state-btn { min-width: 180px; min-height: 44px; }

.aff__loading { display: flex; flex-direction: column; gap: 14px; }
.aff__sk { height: 12px; border-radius: var(--st-r-xs); display: block; }
.aff__sk--label { width: 45%; }
.aff__sk--value { width: 62%; height: 26px; margin-top: 8px; }
.aff__sk--wide { width: 70%; }
.aff__sk--block { height: 120px; border-radius: var(--st-r-md); }

@media (min-width: 720px) {
  .aff__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .aff__stat:nth-child(3) { border-top: 1px solid var(--st-line); }
  .aff__stat:nth-child(odd) + .aff__stat { border-left: 1px solid var(--st-line); }
  .aff__stat:nth-child(2) { border-top: 0; }
  .aff__fields { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 1080px) {
  .aff__stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .aff__stat + .aff__stat { border-top: 0; border-left: 1px solid var(--st-line); }
}
@media (max-width: 640px) {
  .aff__transfer { flex-direction: column; align-items: stretch; }
  .aff__transfer .st-btn { width: 100%; }
  .aff__empty-btn { width: 100%; }

  /* 窄屏：复制按钮换到下一行，避免和长链接互相挤压 */
  .aff__valuebox { flex-wrap: wrap; }
  .aff__code,
  .aff__link { flex: 1 1 100%; white-space: normal; overflow-wrap: anywhere; }
  .aff__valuebox .st-btn { width: 100%; }

  .aff__invitee { align-items: flex-start; }
  .aff__invitee-main .st-row__meta { white-space: normal; }
}
</style>
