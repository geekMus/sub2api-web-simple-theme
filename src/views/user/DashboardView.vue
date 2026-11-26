<template>
  <UserShell>
    <section class="st-section dash">
      <div class="st-shell dash__inner">
        <!-- 问候 -->
        <header class="dash__head">
          <p class="st-eyebrow st-reveal">{{ c('usercore.dash.eyebrow') }}</p>
          <h1 class="st-display-2 dash__title st-reveal" style="--i: 1">
            {{ greetingLine }}
          </h1>
          <p class="st-lede dash__lede st-reveal" style="--i: 2">{{ c('usercore.dash.lede') }}</p>
          <div class="dash__meta st-reveal" style="--i: 3">
            <span class="st-pill st-pill--dot">{{ c('usercore.dash.subtitle') }}</span>
            <button type="button" class="st-btn st-btn--ghost st-btn--sm dash__refresh" :disabled="loading" @click="refreshAll">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" :class="{ 'dash__spin': loading }">
                <path d="M4 12a8 8 0 1 1 2.6 5.9M4 17v-4.4h4.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ c('usercore.dash.refresh') }}
            </button>
          </div>
        </header>

        <!-- 首次加载：骨架 -->
        <div v-if="loading && !stats" class="dash__skeleton">
          <div class="dash__skeleton-grid">
            <div class="st-card st-card--pad dash__skeleton-hero st-skeleton"></div>
            <div v-for="i in 3" :key="i" class="st-card st-card--pad dash__skeleton-tile">
              <span class="st-skeleton dash__sk-line dash__sk-line--sm"></span>
              <span class="st-skeleton dash__sk-line dash__sk-line--lg"></span>
              <span class="st-skeleton dash__sk-line dash__sk-line--xs"></span>
            </div>
          </div>
          <div class="st-card st-card--pad">
            <div class="dash__skeleton-chart">
              <span v-for="i in 7" :key="i" class="st-skeleton" :style="{ height: 24 + ((i * 13) % 62) + '%' }"></span>
            </div>
          </div>
        </div>

        <!-- 加载失败 -->
        <div v-else-if="error && !stats" class="st-card st-card--pad dash__error">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" class="dash__error-icon">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5M12 16.2h.01" stroke-linecap="round" />
          </svg>
          <h2 class="st-display-3">{{ c('usercore.errorTitle') }}</h2>
          <p class="st-body">{{ c('usercore.errorBody') }}</p>
          <button type="button" class="st-btn st-btn--primary st-btn--sm" @click="refreshAll">{{ c('usercore.retry') }}</button>
        </div>

        <template v-else-if="stats">
          <UserDashboardStats
            class="st-reveal"
            style="--i: 4"
            :stats="stats"
            :balance="user?.balance || 0"
            :is-simple="authStore.isSimpleMode"
            :platform-quotas="platformQuotas"
          />

          <UserDashboardCharts
            v-model:startDate="startDate"
            v-model:endDate="endDate"
            v-model:granularity="granularity"
            class="st-reveal"
            style="--i: 5"
            :loading="loadingCharts"
            :trend="trendData"
            :models="modelStats"
            @dateRangeChange="loadCharts"
            @granularityChange="loadCharts"
            @refresh="refreshAll"
          />

          <div class="dash__bottom st-reveal" style="--i: 6">
            <UserDashboardRecentUsage :data="recentUsage" :loading="loadingUsage" />
            <UserDashboardQuickActions />
          </div>
        </template>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { usageAPI, type UserDashboardStats as UserStatsType } from '@/api/usage'
import UserShell from '@/components/shell/UserShell.vue';
import UserDashboardStats from '@/components/user/dashboard/UserDashboardStats.vue';
import UserDashboardCharts from '@/components/user/dashboard/UserDashboardCharts.vue';
import UserDashboardRecentUsage from '@/components/user/dashboard/UserDashboardRecentUsage.vue';
import UserDashboardQuickActions from '@/components/user/dashboard/UserDashboardQuickActions.vue';
import type { UsageLog, TrendDataPoint, ModelStat, PlatformQuotaItem } from '@/types'
import { getMyPlatformQuotas } from '@/api/user'
import { formatDateLocalInput } from '@/utils/format'
import { useUserCoreCopy } from '@/composables/copy/userCore'

const authStore = useAuthStore();
const { c } = useUserCoreCopy()
const user = computed(() => authStore.user)
const displayName = computed(() => (user.value?.username || user.value?.email || '').trim())
const stats = ref<UserStatsType | null>(null); const loading = ref(false); const loadingUsage = ref(false); const loadingCharts = ref(false)
const error = ref(false)
const trendData = ref<TrendDataPoint[]>([]); const modelStats = ref<ModelStat[]>([]); const recentUsage = ref<UsageLog[]>([])
const platformQuotas = ref<PlatformQuotaItem[] | null>(null)

const startDate = ref(formatDateLocalInput(new Date(Date.now() - 6 * 86400000))); const endDate = ref(formatDateLocalInput(new Date())); const granularity = ref('day')

const greetingLine = computed(() => {
  const name = displayName.value
  if (!name) return greeting.value
  return c('usercore.dash.greetJoin')
    .replace('{greeting}', greeting.value)
    .replace('{name}', name)
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return c('usercore.dash.greetingNight')
  if (hour < 12) return c('usercore.dash.greetingMorning')
  if (hour < 18) return c('usercore.dash.greetingAfternoon')
  return c('usercore.dash.greetingEvening')
})

const loadStats = async () => { loading.value = true; error.value = false; try { await authStore.refreshUser(); stats.value = await usageAPI.getDashboardStats() } catch (err) { console.error('Failed to load dashboard stats:', err); error.value = true } finally { loading.value = false } }
const loadCharts = async () => { loadingCharts.value = true; try { const res = await Promise.all([usageAPI.getDashboardTrend({ start_date: startDate.value, end_date: endDate.value, granularity: granularity.value as any }), usageAPI.getDashboardModels({ start_date: startDate.value, end_date: endDate.value })]); trendData.value = res[0].trend || []; modelStats.value = res[1].models || [] } catch (err) { console.error('Failed to load charts:', err) } finally { loadingCharts.value = false } }
const loadRecent = async () => { loadingUsage.value = true; try { const res = await usageAPI.getByDateRange(startDate.value, endDate.value); recentUsage.value = res.items.slice(0, 5) } catch (err) { console.error('Failed to load recent usage:', err) } finally { loadingUsage.value = false } }
const loadPlatformQuotas = async () => { try { const data = await getMyPlatformQuotas(); platformQuotas.value = data.platform_quotas ?? [] } catch (err) { console.warn('Failed to load platform quotas:', err); platformQuotas.value = [] } }
const refreshAll = () => { loadStats(); loadCharts(); loadRecent(); loadPlatformQuotas() }

onMounted(() => { refreshAll() })
</script>

<style scoped>
.dash { padding-top: clamp(32px, 5vw, 56px); }
.dash__inner { display: flex; flex-direction: column; gap: clamp(26px, 3.6vw, 42px); }

.dash__head { display: flex; flex-direction: column; gap: 10px; max-width: 70ch; }
.dash__title { margin-top: 6px; }
.dash__lede { margin-top: 6px; }
.dash__meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 10px; }
.dash__refresh { gap: 6px; }
.dash__spin { animation: dash-spin 900ms linear infinite; }
@keyframes dash-spin { to { transform: rotate(360deg); } }

.dash__skeleton { display: flex; flex-direction: column; gap: 20px; }
.dash__skeleton-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
.dash__skeleton-hero { min-height: 208px; border: 0; }
.dash__skeleton-tile { display: flex; flex-direction: column; gap: 12px; }
.dash__sk-line { display: block; height: 12px; }
.dash__sk-line--sm { width: 40%; }
.dash__sk-line--lg { width: 68%; height: 26px; }
.dash__sk-line--xs { width: 52%; }
.dash__skeleton-chart { display: flex; align-items: flex-end; gap: 10px; height: 200px; }
.dash__skeleton-chart span { flex: 1; border-radius: 6px 6px 0 0; }

.dash__error { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
.dash__error-icon { color: var(--st-accent); }
.dash__error .st-btn { margin-top: 6px; }

.dash__bottom { display: grid; grid-template-columns: 1fr; gap: 18px; align-items: start; }

@media (min-width: 720px) {
  .dash__skeleton-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .dash__skeleton-grid { grid-template-columns: 1.35fr 1fr 1fr 1fr; }
  .dash__bottom { grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr); gap: 20px; }
}
</style>

