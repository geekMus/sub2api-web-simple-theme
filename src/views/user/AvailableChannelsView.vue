<template>
  <UserShell>
    <section class="st-section--tight ch">
      <div class="st-shell">
        <header class="ch__hero">
          <div class="ch__intro">
            <p class="st-eyebrow st-reveal">{{ c('ch.eyebrow') }}</p>
            <h1 class="st-display-2 ch__title st-reveal" style="--i: 1">{{ c('ch.title') }}</h1>
            <p class="st-lede ch__lede st-reveal" style="--i: 2">{{ c('ch.lede') }}</p>

            <dl v-if="channels.length > 0" class="ch__stats st-reveal" style="--i: 3">
              <div class="ch__stat st-stat">
                <dt class="st-stat__label">{{ c('ch.statChannels') }}</dt>
                <dd class="st-stat__value st-num">{{ channels.length }}</dd>
              </div>
              <div class="ch__stat st-stat">
                <dt class="st-stat__label">{{ c('ch.statPlatforms') }}</dt>
                <dd class="st-stat__value st-num">{{ platformTotal }}</dd>
              </div>
              <div class="ch__stat st-stat">
                <dt class="st-stat__label">{{ c('ch.statModels') }}</dt>
                <dd class="st-stat__value st-num">{{ modelTotal }}</dd>
              </div>
            </dl>
          </div>

          <div v-if="channels.length > 0" class="ch__tools st-reveal" style="--i: 3">
            <label class="ch__search">
              <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="M13 13l4 4" stroke-linecap="round" />
              </svg>
              <input v-model="searchQuery" type="text" :placeholder="c('ch.search')" />
            </label>
            <button
              type="button"
              class="st-btn st-btn--quiet st-btn--sm ch__refresh"
              :disabled="loading"
              :title="c('ch.refresh')"
              @click="loadChannels"
            >
              <svg :class="{ 'ch__spin': loading }" viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <path d="M16 10a6 6 0 1 1-1.8-4.3M16 4v4h-4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ c('ch.refresh') }}
            </button>
          </div>
        </header>

        <!-- 错误 -->
        <div v-if="loadError" class="ch__state st-card st-card--pad" role="alert">
          <span class="ch__state-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M12 8v5M12 16.5v.5" stroke-linecap="round" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <p class="ch__state-title">{{ c('ch.loadFailed') }}</p>
          <button type="button" class="st-btn st-btn--primary st-btn--sm" @click="loadChannels">
            {{ c('action.retry') }}
          </button>
        </div>

        <!-- 加载骨架 -->
        <div v-else-if="loading && channels.length === 0" class="ch__list" aria-busy="true" aria-live="polite">
          <div v-for="i in 3" :key="i" class="st-card ch__skeleton">
            <span class="st-skeleton ch__sk-line ch__sk-line--title"></span>
            <span class="st-skeleton ch__sk-line ch__sk-line--wide"></span>
            <div class="ch__sk-pills">
              <span v-for="j in 4" :key="j" class="st-skeleton ch__sk-pill"></span>
            </div>
          </div>
        </div>

        <!-- 列表 -->
        <div v-else-if="filteredChannels.length > 0" class="ch__list">
          <article
            v-for="(channel, idx) in filteredChannels"
            :key="channel.name"
            class="st-card ch__item st-reveal"
            :style="{ '--i': Math.min(idx + 1, 6) }"
          >
            <header class="ch__item-head">
              <div class="ch__item-title">
                <h2 class="ch__name">{{ channel.name }}</h2>
                <p v-if="channel.description" class="ch__desc">{{ channel.description }}</p>
              </div>
              <span class="st-pill st-pill--dot st-pill--accent ch__badge">
                {{ channel.platforms.length }} {{ c('ch.platforms') }}
              </span>
            </header>

            <div class="ch__sections">
              <div v-for="section in channel.platforms" :key="section.platform" class="ch__section">
                <div class="ch__section-head">
                  <PlatformIcon :platform="section.platform as GroupPlatform" size="sm" />
                  <span class="ch__platform">{{ platformLabel(section.platform) }}</span>
                  <span class="ch__dot" aria-hidden="true"></span>
                  <span class="ch__meta">{{ section.groups.length }} {{ c('ch.groups') }} · {{ section.supported_models.length }} {{ c('ch.models') }}</span>
                </div>

                <div v-if="section.groups.length" class="ch__pills">
                  <span
                    v-for="g in section.groups"
                    :key="g.id"
                    class="st-pill"
                    :class="{ 'st-pill--accent': g.is_exclusive, 'ch__pill--sub': g.subscription_type === 'subscription' }"
                    :title="g.name"
                  >
                    {{ g.name }}
                    <b class="st-num ch__rate">{{ formatRate(rateOf(g.id, g.rate_multiplier)) }}x</b>
                  </span>
                </div>

                <div v-if="section.supported_models.length" class="ch__models">
                  <span v-for="m in section.supported_models" :key="m.name" class="ch__model">{{ m.name }}</span>
                </div>
                <p v-else class="ch__empty-line">{{ t('availableChannels.noModels') }}</p>
              </div>
            </div>
          </article>
        </div>

        <!-- 空状态 -->
        <div v-else class="ch__empty st-card st-card--pad">
          <div class="ch__empty-body">
            <h2 class="ch__empty-title">
              {{ searchQuery.trim() ? c('ch.empty') : t('availableChannels.empty') }}
            </h2>
            <p class="ch__empty-hint">
              <template v-if="searchQuery.trim()">
                {{ lc('换个关键词，或者清空搜索看全部渠道。', 'Try another keyword, or clear the search to see every channel.') }}
              </template>
              <template v-else>
                {{ lc(
                  '渠道由管理员按分组开通。开通后，这里会按平台列出你能走的模型和实际生效的倍率。',
                  'Channels are opened by an administrator per group. Once yours are on, this page lists the platforms, models and multipliers that apply to you.',
                ) }}
              </template>
            </p>
            <div class="ch__empty-actions">
              <button
                v-if="searchQuery.trim()"
                type="button"
                class="st-btn st-btn--quiet st-btn--sm"
                @click="searchQuery = ''"
              >
                {{ c('ch.clearSearch') }}
              </button>
              <button type="button" class="st-btn st-btn--primary st-btn--sm" @click="loadChannels">
                {{ c('ch.refresh') }}
              </button>
            </div>
            <p v-if="!searchQuery.trim()" class="ch__empty-foot">
              {{ lc('刚被加进新的分组？等几秒再刷新一次。', 'Just added to a new group? Give it a few seconds, then refresh.') }}
            </p>
          </div>
          <div class="ch__empty-art" aria-hidden="true">
            <span class="ch__empty-line"></span>
            <span class="ch__empty-line"></span>
            <span class="ch__empty-line"></span>
          </div>
        </div>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UserShell from '@/components/shell/UserShell.vue'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import userChannelsAPI, { type UserAvailableChannel } from '@/api/channels'
import userGroupsAPI from '@/api/groups'
import { useAppStore } from '@/stores/app'
import { extractApiErrorMessage } from '@/utils/apiError'
import { platformLabel } from '@/utils/platformColors'
import { useMiscCopy } from '@/composables/copy/misc'
import type { GroupPlatform } from '@/types'

const { t, locale } = useI18n()
const { c } = useMiscCopy()
const appStore = useAppStore()

/** 页面内小文案：中英各写一句，保持空态像人话。 */
const isZh = computed(() => {
  const raw = (locale as unknown as { value?: unknown })?.value ?? locale
  return String(raw ?? '').toLowerCase().startsWith('zh')
})
function lc(zh: string, en: string): string {
  return isZh.value ? zh : en
}

const channels = ref<UserAvailableChannel[]>([])
const userGroupRates = ref<Record<number, number>>({})
const loading = ref(false)
const loadError = ref(false)
const searchQuery = ref('')

/**
 * 搜索过滤：
 * - 命中渠道名/描述 → 整个渠道（所有 platforms）都保留
 * - 否则按 platform/group/model 维度在 sections 里过滤，保留有匹配的 section
 * - 所有 sections 都不匹配时，渠道本身被过滤掉
 */
/** 平台总数与模型总数：页头三个大数字的来源。 */
const platformTotal = computed(() => {
  const set = new Set<string>()
  for (const ch of channels.value) for (const p of ch.platforms) set.add(p.platform)
  return set.size
})
const modelTotal = computed(() => {
  const set = new Set<string>()
  for (const ch of channels.value) for (const p of ch.platforms) for (const m of p.supported_models) set.add(m.name)
  return set.size
})

const filteredChannels = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return channels.value
  return channels.value
    .map((ch) => {
      const nameHit = ch.name.toLowerCase().includes(q)
      const descHit = (ch.description || '').toLowerCase().includes(q)
      if (nameHit || descHit) return ch
      const matchingSections = ch.platforms.filter(
        (p) =>
          p.platform.toLowerCase().includes(q) ||
          p.groups.some((g) => g.name.toLowerCase().includes(q)) ||
          p.supported_models.some((m) => m.name.toLowerCase().includes(q)),
      )
      if (matchingSections.length === 0) return null
      return { ...ch, platforms: matchingSections }
    })
    .filter((ch): ch is UserAvailableChannel => ch !== null)
})

/** 用户专属倍率优先，否则分组默认倍率。 */
function rateOf(groupId: number, fallback: number): number {
  const rate = userGroupRates.value[groupId]
  return typeof rate === 'number' ? rate : fallback
}

function formatRate(rate: number): string {
  return Number.isInteger(rate) ? String(rate) : String(Math.round(rate * 100) / 100)
}

async function loadChannels() {
  loading.value = true
  loadError.value = false
  try {
    // 渠道列表和用户专属倍率并发拉取。专属倍率失败不阻塞渠道展示——
    // 失败时只是无法渲染专属倍率角标，降级为仅显示默认倍率。
    const [list, rates] = await Promise.all([
      userChannelsAPI.getAvailable(),
      userGroupsAPI.getUserGroupRates().catch((err: unknown) => {
        console.error('Failed to load user group rates:', err)
        return {} as Record<number, number>
      }),
    ])
    channels.value = list
    userGroupRates.value = rates
  } catch (err: unknown) {
    loadError.value = true
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  } finally {
    loading.value = false
  }
}

onMounted(loadChannels)
</script>

<style scoped>
.ch { padding-bottom: clamp(56px, 8vw, 96px); }

.ch__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: clamp(20px, 3vw, 36px);
  margin-bottom: clamp(24px, 3vw, 36px);
}
.ch__intro { flex: 1 1 480px; min-width: 0; max-width: 62ch; }
.ch__title { margin-top: 12px; }
.ch__lede { margin-top: 14px; max-width: 54ch; }

.ch__stats {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(18px, 3.4vw, 44px);
  margin: 24px 0 0;
  padding-top: 18px;
  border-top: 1px solid var(--st-line);
}
.ch__stat { min-width: 72px; }
.ch__stat dt { margin: 0; }
.ch__stat dd { margin: 0; }

.ch__tools { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.ch__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  width: min(320px, 58vw);
  padding-inline: 14px;
  border-radius: 999px;
  border: 1px solid var(--st-line-2);
  background: var(--st-bg);
  color: var(--st-ink-3);
  transition: border-color var(--st-t) var(--st-ease), box-shadow var(--st-t) var(--st-ease);
}
.ch__search:focus-within { border-color: var(--st-brand-text); box-shadow: 0 0 0 4px var(--st-brand-soft); }
.ch__search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; color: var(--st-ink); font-size: 0.88rem; }
.ch__search input::placeholder { color: var(--st-ink-3); }
.ch__spin { animation: ch-spin 900ms linear infinite; }
@keyframes ch-spin { to { transform: rotate(360deg); } }

.ch__list { display: flex; flex-direction: column; gap: 14px; }

.ch__skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: clamp(18px, 2.2vw, 26px);
}
.ch__sk-line { height: 12px; border-radius: 6px; display: block; }
.ch__sk-line--title { width: 34%; height: 18px; }
.ch__sk-line--wide { width: 72%; }
.ch__sk-pills { display: flex; flex-wrap: wrap; gap: 8px; }
.ch__sk-pill { height: 24px; width: 88px; border-radius: 999px; }

.ch__item {
  padding: clamp(18px, 2.2vw, 26px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--st-shadow-2);
  transition: border-color var(--st-t) var(--st-ease), box-shadow var(--st-t) var(--st-ease);
}
.ch__item:hover { border-color: var(--st-line-2); box-shadow: var(--st-shadow-3); }
.ch__item-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.ch__item-title { min-width: 0; }
.ch__name {
  margin: 0;
  font-family: var(--st-font-display);
  font-size: 1.12rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--st-ink);
  overflow-wrap: anywhere;
}
.ch__desc { margin: 5px 0 0; font-size: 0.84rem; line-height: 1.65; color: var(--st-ink-2); max-width: 72ch; }
.ch__badge { flex-shrink: 0; }

.ch__sections { display: flex; flex-direction: column; gap: 14px; }
.ch__section { display: flex; flex-direction: column; gap: 9px; padding-top: 14px; border-top: 1px solid var(--st-line); }
.ch__section:first-child { padding-top: 0; border-top: 0; }
.ch__section-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; color: var(--st-ink-2); }
.ch__platform { font-size: 0.82rem; font-weight: 600; color: var(--st-ink); letter-spacing: -0.01em; }
.ch__dot { width: 3px; height: 3px; border-radius: 50%; background: var(--st-line-2); }
.ch__meta { font-size: 0.74rem; color: var(--st-ink-3); font-variant-numeric: tabular-nums; }

.ch__pills { display: flex; flex-wrap: wrap; gap: 6px; }
.ch__rate { font-size: 11px; font-weight: 600; color: var(--st-brand-text); margin-left: 2px; }
.ch__pill--sub { border-style: dashed; }

.ch__models { display: flex; flex-wrap: wrap; gap: 6px; }
.ch__model {
  font-family: var(--st-font-mono);
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 7px;
  border: 1px solid var(--st-line);
  background: var(--st-bg-soft);
  color: var(--st-ink-2);
  overflow-wrap: anywhere;
}
.ch__empty-line { margin: 0; font-size: 0.76rem; color: var(--st-ink-3); }

.ch__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding-block: clamp(40px, 7vw, 72px);
  text-align: center;
}

/* ---- 空态：左文右线稿，像一页说明而不是一块空白 ---- */
.ch__empty {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(18px, 3vw, 40px);
  padding: clamp(26px, 3.4vw, 44px);
  overflow: hidden;
}
.ch__empty-body { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; min-width: 0; }
.ch__empty-title { margin: 0; font-family: var(--st-font-display); font-size: clamp(1.35rem, 2.1vw, 1.7rem); font-weight: 600; letter-spacing: -0.03em; line-height: 1.2; color: var(--st-ink); }
.ch__empty-hint { margin: 0; font-size: 0.9rem; line-height: 1.7; color: var(--st-ink-2); max-width: 56ch; }
.ch__empty-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.ch__empty-foot { margin: 2px 0 0; font-size: 0.78rem; line-height: 1.6; color: var(--st-ink-3); }
.ch__empty-art { display: none; position: relative; align-self: stretch; min-height: 150px; }
.ch__empty-art::before,
.ch__empty-art::after { content: ""; position: absolute; border-radius: 50%; }
.ch__empty-art::before { inset: 8% 18% 12% 10%; border: 1px solid var(--st-line); }
.ch__empty-art::after { inset: 26% 4% 26% 30%; border: 1px solid var(--st-line); }
.ch__empty-line { position: absolute; left: 0; right: 12%; height: 1px; background: var(--st-line); }
.ch__empty-line:nth-child(1) { top: 22%; }
.ch__empty-line:nth-child(2) { top: 50%; right: 26%; }
.ch__empty-line:nth-child(3) { top: 78%; right: 4%; }
@media (min-width: 860px) {
  .ch__empty { grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); align-items: center; }
  .ch__empty-art { display: block; }
}
.ch__state-mark {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid var(--st-line);
  background: var(--st-bg-soft);
  color: var(--st-ink-3);
}
.ch__state-title { margin: 0; font-size: 0.92rem; line-height: 1.6; color: var(--st-ink-2); max-width: 42ch; }

@media (max-width: 720px) {
  .ch__intro { flex: 1 1 100%; }
  .ch__tools { width: 100%; }
  .ch__search { flex: 1; width: auto; height: 46px; }
  .ch__refresh { min-height: 46px; }
  .ch__stats { gap: 20px; }
  .ch__stat { flex: 1 1 0; }
  .ch__name { font-size: 1.04rem; }
}

@media (max-width: 560px) {
  .ch__meta,
  .ch__model,
  .ch__empty-line,
  .ch__desc { font-size: 0.8rem; }
  .ch__rate { font-size: 12px; }
  .ch__search input { font-size: 0.92rem; }
}
</style>
