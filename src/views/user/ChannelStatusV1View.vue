<template>
  <UserShell>
    <section class="st-section--tight board">
      <div class="st-shell">
        <header class="board__hero">
          <div class="board__intro">
            <p class="st-eyebrow st-reveal">{{ c('status.eyebrow') }}</p>
            <h1 class="st-display-2 board__title st-reveal" style="--i: 1">{{ c('status.title') }}</h1>
            <p class="st-lede board__lede st-reveal" style="--i: 2">{{ c('status.lede') }}</p>

            <div class="board__pills st-reveal" style="--i: 3">
              <span class="st-pill st-pill--dot" :class="overallStatus === 'operational' ? 'st-pill--accent' : 'board__pill--warn'">
                {{ overallStatus === 'operational' ? c('status.overallOk') : c('status.overallDegraded') }}
              </span>
              <span v-if="items.length" class="st-pill st-num">
                {{ items.length }} {{ c('status.channel') }}
              </span>
              <span v-if="countdown > 0" class="st-pill st-num board__countdown">
                {{ t('monitorCommon.nextUpdateIn', { n: countdown }) }}
              </span>
            </div>
          </div>

          <div class="board__controls st-reveal" style="--i: 3">
            <div class="st-seg board__seg" role="group" :aria-label="c('status.window')">
              <button
                v-for="option in windowOptions"
                :key="option.value"
                type="button"
                class="st-seg__item"
                :class="{ 'st-seg__item--active': currentWindow === option.value }"
                @click="handleWindowChange(option.value)"
              >
                {{ option.label }}
              </button>
            </div>

            <button
              type="button"
              class="st-btn st-btn--quiet st-btn--sm"
              :title="autoRefresh.enabled.value ? c('status.pause') : c('status.resume')"
              @click="toggleAutoRefresh"
            >
              <span class="board__autodot" :class="{ 'board__autodot--off': !autoRefresh.enabled.value }" aria-hidden="true"></span>
              {{ c('status.autoRefresh') }}
            </button>

            <button
              type="button"
              class="st-btn st-btn--sm"
              :disabled="loading"
              :title="t('common.refresh')"
              @click="refresh()"
            >
              <svg :class="{ 'board__spin': loading }" viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <path d="M16 10a6 6 0 1 1-1.8-4.3M16 4v4h-4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </header>

        <!-- 加载骨架 -->
        <div v-if="loading && items.length === 0" class="board__list" aria-busy="true">
          <div v-for="i in 4" :key="i" class="st-skeleton board__skeleton"></div>
        </div>

        <!-- 渠道行 -->
        <div v-else-if="items.length > 0" class="board__list">
          <button
            v-for="(item, idx) in items"
            :key="item.id"
            type="button"
            class="board__row st-reveal"
            :class="`board__row--${toneOf(item.primary_status)}`"
            :style="{ '--i': Math.min(idx + 1, 8) }"
            @click="openDetail(item)"
          >
            <span class="board__dot" aria-hidden="true"></span>

            <span class="board__id">
              <span class="board__name">{{ item.name }}</span>
              <span class="board__meta">
                {{ providerLabel(item.provider) }} · {{ formatMonitorModel(item.primary_model) }}
                <template v-if="item.group_name"> · {{ item.group_name }}</template>
              </span>
            </span>

            <span class="board__avail">
              <span class="board__avail-k">{{ c('status.availability') }}</span>
              <span class="board__avail-v st-num">{{ availabilityText(item) }}</span>
            </span>

            <span class="board__latency">
              <span class="board__latency-head">
                <span class="board__latency-k">{{ c('status.latency') }}</span>
                <span class="board__latency-v st-num">{{ latencyText(item) }}</span>
              </span>
              <span class="board__bar" aria-hidden="true">
                <i :style="{ width: latencyWidth(item) }"></i>
              </span>
            </span>

            <span class="board__checked">
              <span class="board__checked-k">{{ c('status.checkedAt') }}</span>
              <span class="board__checked-v st-num">{{ lastChecked(item) }}</span>
            </span>

            <span class="board__go" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M7.5 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </button>
        </div>

        <!-- 空状态 -->
        <div v-else class="st-card board__empty">
          <span class="board__empty-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M4 14l4-4 3 3 5-6 4 4" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M4 19h16" stroke-linecap="round" />
            </svg>
          </span>
          <p>{{ c('status.empty') }}</p>
        </div>

        <p class="board__legend">
          <span><i class="board__legend-dot board__legend-dot--ok"></i>{{ c('status.legendOk') }}</span>
          <span><i class="board__legend-dot board__legend-dot--warn"></i>{{ c('status.legendWarn') }}</span>
          <span><i class="board__legend-dot board__legend-dot--bad"></i>{{ c('status.legendFail') }}</span>
        </p>
      </div>
    </section>

    <MonitorDetailDialog
      :show="showDetail"
      :monitor-id="detailTarget?.id ?? null"
      :title="detailTitle"
      @close="closeDetail"
    />
  </UserShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { extractApiErrorMessage } from '@/utils/apiError'
import { formatDateTime } from '@/utils/format'
import {
  list as listChannelMonitorViews,
  status as fetchChannelMonitorDetail,
  type UserMonitorView,
  type UserMonitorDetail,
} from '@/api/channelMonitor'
import UserShell from '@/components/shell/UserShell.vue'
import MonitorDetailDialog from '@/components/user/MonitorDetailDialog.vue'
import { DEFAULT_INTERVAL_SECONDS, STATUS_OPERATIONAL, STATUS_DEGRADED } from '@/constants/channelMonitor'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useChannelMonitorFormat } from '@/composables/useChannelMonitorFormat'
import { useMiscCopy } from '@/composables/copy/misc'

type MonitorWindow = '7d' | '15d' | '30d'

const { t } = useI18n()
const { c } = useMiscCopy()
const appStore = useAppStore()
const { providerLabel, formatMonitorModel } = useChannelMonitorFormat()

// ── State ──
const items = ref<UserMonitorView[]>([])
const loading = ref(false)
const currentWindow = ref<MonitorWindow>('7d')
const detailCache = reactive<Record<number, UserMonitorDetail>>({})
const showDetail = ref(false)
const detailTarget = ref<UserMonitorView | null>(null)

let abortController: AbortController | null = null

const autoRefresh = useAutoRefresh({
  storageKey: 'channel-status-auto-refresh',
  intervals: [30, 60, 120] as const,
  defaultInterval: DEFAULT_INTERVAL_SECONDS,
  defaultEnabled: true,
  onRefresh: () => refresh(true),
  shouldPause: () => document.hidden || loading.value,
})
const countdown = autoRefresh.countdown

// ── Computed ──
const windowOptions: { value: MonitorWindow; label: string }[] = [
  { value: '7d', label: c('status.win7d') },
  { value: '15d', label: c('status.win15d') },
  { value: '30d', label: c('status.win30d') },
]

const overallStatus = computed<'operational' | 'degraded'>(() => {
  if (items.value.length === 0) return 'operational'
  for (const it of items.value) {
    if (it.primary_status === 'failed' || it.primary_status === 'error') return 'degraded'
    if (it.primary_status !== STATUS_OPERATIONAL) return 'degraded'
  }
  return 'operational'
})

const detailTitle = computed(() => {
  return detailTarget.value?.name || t('channelStatus.detailTitle')
})

/** 延迟条按当前列表最大延迟归一，短延迟也给一点可见宽度。 */
const maxLatency = computed(() => {
  let max = 0
  for (const it of items.value) {
    const v = it.primary_latency_ms ?? 0
    if (v > max) max = v
  }
  return max || 1
})

function toneOf(status: string): 'ok' | 'warn' | 'bad' {
  if (status === STATUS_OPERATIONAL) return 'ok'
  if (status === STATUS_DEGRADED) return 'warn'
  return 'bad'
}

function resolveAvailability(item: UserMonitorView): number | null {
  if (currentWindow.value === '7d') return item.availability_7d ?? null
  const detail = detailCache[item.id]
  if (!detail) return null
  const primary = detail.models.find((m) => m.model === item.primary_model)
  if (!primary) return null
  return currentWindow.value === '15d' ? primary.availability_15d ?? null : primary.availability_30d ?? null
}

function availabilityText(item: UserMonitorView): string {
  const v = resolveAvailability(item)
  return v == null ? '-' : `${(Math.round(v * 10) / 10).toFixed(1)}%`
}

function latencyText(item: UserMonitorView): string {
  const v = item.primary_latency_ms ?? item.primary_ping_latency_ms
  return v == null ? '-' : `${Math.round(v)} ms`
}

function latencyWidth(item: UserMonitorView): string {
  const v = item.primary_latency_ms ?? item.primary_ping_latency_ms
  if (v == null) return '4%'
  return `${Math.max(6, Math.min(100, Math.round((v / maxLatency.value) * 100)))}%`
}

function lastChecked(item: UserMonitorView): string {
  const last = item.timeline?.[item.timeline.length - 1]
  if (!last?.checked_at) return '-'
  return formatDateTime(last.checked_at) || '-'
}

// ── Loaders ──
async function reload(silent = false) {
  if (abortController) abortController.abort()
  const ctrl = new AbortController()
  abortController = ctrl
  if (!silent) loading.value = true
  try {
    const res = await listChannelMonitorViews({ signal: ctrl.signal })
    if (ctrl.signal.aborted || abortController !== ctrl) return
    items.value = res.items || []
  } catch (err: unknown) {
    const e = err as { name?: string; code?: string }
    if (e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return
    appStore.showError(extractApiErrorMessage(err, t('channelStatus.loadError')))
  } finally {
    if (abortController === ctrl) {
      if (!silent) loading.value = false
      autoRefresh.resetCountdown()
      abortController = null
    }
  }
}

async function refresh(silent = false) {
  await reload(silent)
  // After base reload, refresh any cached detail records so non-7d availability
  // values stay in sync without forcing the user to switch tabs again.
  if (currentWindow.value !== '7d') {
    await Promise.all(items.value.map(it => loadDetail(it.id, true)))
  }
}

async function loadDetail(id: number, force = false) {
  if (!force && detailCache[id]) return
  try {
    detailCache[id] = await fetchChannelMonitorDetail(id)
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('channelStatus.detailLoadError')))
  }
}

async function ensureDetailsForWindow() {
  if (currentWindow.value === '7d') return
  await Promise.all(items.value.map(it => loadDetail(it.id)))
}

// ── Handlers ──
async function handleWindowChange(value: MonitorWindow) {
  currentWindow.value = value
  await ensureDetailsForWindow()
}

function toggleAutoRefresh() {
  autoRefresh.setEnabled(!autoRefresh.enabled.value)
}

function openDetail(row: UserMonitorView) {
  detailTarget.value = row
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  detailTarget.value = null
}

watch(items, () => {
  void ensureDetailsForWindow()
})

watch(
  () => appStore.cachedPublicSettings?.channel_monitor_enabled,
  (enabled) => {
    if (enabled === false) autoRefresh.stop()
    else if (autoRefresh.enabled.value) autoRefresh.start()
  },
)

onMounted(() => {
  void reload(false)
  if (appStore.cachedPublicSettings?.channel_monitor_enabled !== false) {
    autoRefresh.setEnabled(autoRefresh.enabled.value)
  }
})

onBeforeUnmount(() => {
  if (abortController) abortController.abort()
})
</script>

<style scoped>
.board {
  padding-bottom: clamp(56px, 8vw, 96px);
  --tone-ok: var(--st-brand);
  --tone-warn: var(--st-warn);
  --tone-bad: var(--st-danger);
}

.board__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: clamp(22px, 3vw, 34px);
}
.board__intro { max-width: 58ch; }
.board__title { margin-top: 14px; }
.board__lede { margin-top: 14px; }
.board__pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
.board__pill--warn {
  color: var(--tone-warn);
  border-color: color-mix(in srgb, var(--tone-warn) 30%, transparent);
  background: color-mix(in srgb, var(--tone-warn) 12%, transparent);
}
.board__countdown { color: var(--st-ink-faint); }

.board__controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.board__seg { background: var(--st-bg-sunk); }
.board__autodot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tone-ok);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tone-ok) 22%, transparent);
}
.board__autodot--off { background: var(--st-ink-faint); box-shadow: none; }
.board__spin { animation: board-spin 900ms linear infinite; }
@keyframes board-spin { to { transform: rotate(360deg); } }

.board__list { display: flex; flex-direction: column; }
.board__skeleton { height: 68px; border-radius: var(--st-radius-md); }
.board__skeleton + .board__skeleton { margin-top: 8px; }

.board__row {
  --row-tone: var(--tone-ok);
  display: grid;
  grid-template-columns: 10px minmax(0, 1.4fr) 108px minmax(0, 1fr) 116px 24px;
  align-items: center;
  gap: clamp(10px, 1.6vw, 22px);
  width: 100%;
  padding: 15px 16px;
  border: 0;
  border-radius: var(--st-radius-md);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--st-dur) var(--st-ease), transform var(--st-dur-fast) var(--st-ease);
}
.board__row + .board__row { box-shadow: inset 0 1px 0 var(--st-line); }
.board__row:hover { background: color-mix(in srgb, var(--st-accent) 6%, transparent); }
.board__row:active { transform: scale(0.996); }
.board__row:focus-visible { outline: 2px solid var(--st-accent); outline-offset: -2px; }
.board__row--warn { --row-tone: var(--tone-warn); }
.board__row--bad { --row-tone: var(--tone-bad); }

.board__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--row-tone);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--row-tone) 18%, transparent);
}

.board__id { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.board__name {
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--st-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.board__meta {
  font-size: 0.74rem;
  color: var(--st-ink-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board__avail,
.board__checked { display: flex; flex-direction: column; gap: 3px; }
.board__avail-k,
.board__checked-k { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--st-ink-faint); }
.board__avail-v,
.board__checked-v {
  font-size: 0.82rem;
  font-weight: 550;
  color: var(--st-ink);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.board__latency { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.board__latency-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.board__latency-k { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--st-ink-faint); }
.board__latency-v { font-size: 0.78rem; color: var(--st-ink-soft); font-variant-numeric: tabular-nums; white-space: nowrap; }
.board__bar {
  display: block;
  height: 5px;
  border-radius: 999px;
  background: var(--st-bg-sunk);
  overflow: hidden;
}
.board__bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, color-mix(in srgb, var(--row-tone) 45%, transparent), var(--row-tone));
  transition: width var(--st-dur-slow) var(--st-ease);
}

.board__go { color: var(--st-ink-faint); display: grid; place-items: center; }
.board__row:hover .board__go { color: var(--st-accent); }

.board__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-block: clamp(40px, 7vw, 72px);
  text-align: center;
  font-size: 0.9rem;
  color: var(--st-ink-soft);
}
.board__empty-mark { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--st-line); background: var(--st-bg-sunk); color: var(--st-ink-faint); }

.board__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 18px;
  padding-left: 4px;
  font-size: 0.74rem;
  color: var(--st-ink-faint);
}
.board__legend span { display: inline-flex; align-items: center; gap: 6px; }
.board__legend-dot { width: 7px; height: 7px; border-radius: 50%; }
.board__legend-dot--ok { background: var(--tone-ok); }
.board__legend-dot--warn { background: var(--tone-warn); }
.board__legend-dot--bad { background: var(--tone-bad); }

@media (max-width: 860px) {
  .board__row {
    grid-template-columns: 10px minmax(0, 1fr) 24px;
    grid-template-areas:
      'dot id go'
      'dot latency latency'
      'dot meta meta';
    row-gap: 8px;
    padding: 14px;
  }
  .board__dot { grid-area: dot; align-self: start; margin-top: 5px; }
  .board__id { grid-area: id; }
  .board__latency { grid-area: latency; }
  .board__avail { grid-area: meta; flex-direction: row; align-items: baseline; gap: 6px; }
  .board__checked { display: none; }
  .board__go { grid-area: go; align-self: start; }
}
</style>
