<template>
  <UserShell>
    <section class="st-section--tight ch">
      <div class="st-shell">
        <header class="ch__hero">
          <div>
            <p class="st-eyebrow st-reveal">{{ c('ch.eyebrow') }}</p>
            <h1 class="st-display-2 ch__title st-reveal" style="--i: 1">{{ c('ch.title') }}</h1>
            <p class="st-lede ch__lede st-reveal" style="--i: 2">{{ c('ch.lede') }}</p>
          </div>

          <div class="ch__tools st-reveal" style="--i: 3">
            <label class="ch__search">
              <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="M13 13l4 4" stroke-linecap="round" />
              </svg>
              <input v-model="searchQuery" type="text" :placeholder="c('ch.search')" />
            </label>
            <button
              type="button"
              class="st-btn st-btn--quiet st-btn--sm"
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

        <!-- 加载骨架 -->
        <div v-if="loading && channels.length === 0" class="ch__list" aria-busy="true">
          <div v-for="i in 3" :key="i" class="st-card st-skeleton ch__skeleton"></div>
        </div>

        <!-- 列表 -->
        <div v-else-if="filteredChannels.length > 0" class="ch__list">
          <article
            v-for="(channel, idx) in filteredChannels"
            :key="channel.name"
            class="st-card st-card--lift ch__item st-reveal"
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
        <div v-else class="st-card ch__empty">
          <span class="ch__empty-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M4 7h16M4 12h10M4 17h6" stroke-linecap="round" />
            </svg>
          </span>
          <p>{{ searchQuery.trim() ? c('ch.empty') : t('availableChannels.empty') }}</p>
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

const { t } = useI18n()
const { c } = useMiscCopy()
const appStore = useAppStore()

const channels = ref<UserAvailableChannel[]>([])
const userGroupRates = ref<Record<number, number>>({})
const loading = ref(false)
const searchQuery = ref('')

/**
 * 搜索过滤：
 * - 命中渠道名/描述 → 整个渠道（所有 platforms）都保留
 * - 否则按 platform/group/model 维度在 sections 里过滤，保留有匹配的 section
 * - 所有 sections 都不匹配时，渠道本身被过滤掉
 */
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
  gap: 20px;
  margin-bottom: clamp(24px, 3vw, 36px);
}
.ch__title { margin-top: 14px; }
.ch__lede { margin-top: 14px; max-width: 54ch; }
.ch__tools { display: flex; align-items: center; gap: 8px; }

.ch__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  width: min(300px, 60vw);
  padding-inline: 12px;
  border-radius: 999px;
  border: 1px solid var(--st-line-strong);
  background: var(--st-bg-elev);
  color: var(--st-ink-faint);
  transition: border-color var(--st-dur) var(--st-ease), box-shadow var(--st-dur) var(--st-ease);
}
.ch__search:focus-within { border-color: var(--st-accent); box-shadow: 0 0 0 4px var(--st-accent-soft); }
.ch__search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; color: var(--st-ink); font-size: 0.86rem; }
.ch__search input::placeholder { color: var(--st-ink-faint); }
.ch__spin { animation: ch-spin 900ms linear infinite; }
@keyframes ch-spin { to { transform: rotate(360deg); } }

.ch__list { display: flex; flex-direction: column; gap: 12px; }
.ch__skeleton { height: 168px; }

.ch__item { padding: clamp(18px, 2.2vw, 26px); display: flex; flex-direction: column; gap: 16px; }
.ch__item-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.ch__item-title { min-width: 0; }
.ch__name { font-family: var(--st-font-display); font-size: 1.12rem; font-weight: 600; letter-spacing: -0.02em; color: var(--st-ink); }
.ch__desc { margin-top: 5px; font-size: 0.84rem; line-height: 1.65; color: var(--st-ink-soft); max-width: 72ch; }
.ch__badge { flex-shrink: 0; }

.ch__sections { display: flex; flex-direction: column; gap: 14px; }
.ch__section { display: flex; flex-direction: column; gap: 9px; padding-top: 14px; border-top: 1px solid var(--st-line); }
.ch__section:first-child { padding-top: 0; border-top: 0; }
.ch__section-head { display: flex; align-items: center; gap: 8px; color: var(--st-ink-soft); }
.ch__platform { font-size: 0.82rem; font-weight: 600; color: var(--st-ink); letter-spacing: -0.01em; }
.ch__dot { width: 3px; height: 3px; border-radius: 50%; background: var(--st-line-strong); }
.ch__meta { font-size: 0.74rem; color: var(--st-ink-faint); font-variant-numeric: tabular-nums; }

.ch__pills { display: flex; flex-wrap: wrap; gap: 6px; }
.ch__rate { font-size: 11px; font-weight: 600; color: var(--st-accent); margin-left: 2px; }
.ch__pill--sub { border-style: dashed; }

.ch__models { display: flex; flex-wrap: wrap; gap: 6px; }
.ch__model {
  font-family: var(--st-font-mono);
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 7px;
  border: 1px solid var(--st-line);
  background: var(--st-bg-sunk);
  color: var(--st-ink-soft);
  overflow-wrap: anywhere;
}
.ch__empty-line { font-size: 0.76rem; color: var(--st-ink-faint); }

.ch__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-block: clamp(40px, 7vw, 72px);
  text-align: center;
  font-size: 0.9rem;
  color: var(--st-ink-soft);
}
.ch__empty-mark { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--st-line); background: var(--st-bg-sunk); color: var(--st-ink-faint); }

@media (max-width: 720px) {
  .ch__tools { width: 100%; }
  .ch__search { flex: 1; width: auto; }
}
</style>
