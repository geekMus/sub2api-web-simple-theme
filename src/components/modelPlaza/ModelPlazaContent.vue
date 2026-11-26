<template>
  <div class="plaza" :class="{ 'plaza--embedded': embedded }">
    <!-- 页头（独立形态） -->
    <header v-if="!embedded" class="plaza__hero">
      <p class="st-eyebrow st-reveal">{{ c('plaza.eyebrow') }}</p>
      <h1 class="st-display-2 plaza__title st-reveal" style="--i: 1">{{ c('plaza.title') }}</h1>
      <p class="st-lede plaza__lede st-reveal" style="--i: 2">{{ c('plaza.lede') }}</p>

      <div class="plaza__meta st-reveal" style="--i: 3">
        <span class="st-pill st-pill--dot st-pill--accent" v-if="response">
          {{ response.groups?.length ?? 0 }} {{ c('plaza.groupCount') }} ·
          {{ modelTotal }} {{ c('plaza.modelCount') }}
        </span>
        <span v-if="!isAuthenticated" class="st-pill">{{ c('plaza.anonymousHint') }}</span>
        <div class="plaza__cta">
          <RouterLink v-if="isAuthenticated" :to="backTarget" class="st-btn st-btn--primary st-btn--sm">
            {{ c('plaza.backDashboard') }}
          </RouterLink>
          <RouterLink
            v-else
            :to="{ path: '/login', query: { redirect: '/model-plaza' } }"
            class="st-btn st-btn--primary st-btn--sm"
          >
            {{ c('plaza.login') }}
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- 全局价格说明（管理员配置的 Markdown） -->
    <div v-if="descriptionHtml" class="plaza__note st-card st-card--pad">
      <p class="plaza__note-label">{{ c('plaza.note') }}</p>
      <div class="plaza__note-body" v-html="descriptionHtml"></div>
    </div>

    <!-- 加载：骨架 -->
    <div v-if="loading" class="plaza__skeleton" aria-busy="true" aria-live="polite">
      <div class="plaza__skeleton-filters st-skeleton"></div>
      <div class="plaza__skeleton-grid">
        <div v-for="i in 6" :key="i" class="st-skeleton plaza__skeleton-card"></div>
      </div>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="plaza__state st-card st-card--pad">
      <span class="plaza__state-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M12 8v5M12 16.5v.5" stroke-linecap="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>
      <p class="plaza__state-title">{{ c('plaza.loadFailed') }}</p>
      <RouterLink to="/home" class="st-btn st-btn--quiet st-btn--sm">{{ c('nf.toHome') }}</RouterLink>
    </div>

    <template v-else>
      <PlazaFilterBar
        :platforms="platforms"
        :groups="groupOptions"
        :rates="rates"
        :platform="selectedPlatform"
        :group-id="selectedGroupId"
        :rate="selectedRate"
        :search="searchQuery"
        @update:platform="selectedPlatform = $event"
        @update:group-id="selectedGroupId = $event"
        @update:rate="selectedRate = $event"
        @update:search="searchQuery = $event"
      />

      <div v-if="filteredGroups.length > 0" class="plaza__shelves">
        <PlazaGroupSection
          v-for="(g, idx) in filteredGroups"
          :key="g.id"
          :group="g"
          :style="{ '--i': Math.min(idx + 1, 6) }"
        />
      </div>

      <div v-else class="plaza__state st-card st-card--pad">
        <span class="plaza__state-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4 4" stroke-linecap="round" />
          </svg>
        </span>
        <p class="plaza__state-title">{{ searchActive ? c('plaza.emptySearch') : c('plaza.empty') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import PlazaFilterBar from './PlazaFilterBar.vue'
import PlazaGroupSection from './PlazaGroupSection.vue'
import type { ModelPlazaGroup, ModelPlazaResponse } from '@/api/modelPlaza'
import { useAuthStore } from '@/stores/auth'
import { useMiscCopy } from '@/composables/copy/misc'

const props = defineProps<{
  response: ModelPlazaResponse | null
  loading: boolean
  error?: boolean
  /** 后台内嵌形态（AppLayout 内）：隐藏页头。 */
  embedded?: boolean
}>()

const { c } = useMiscCopy()
const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const backTarget = computed(() => (authStore.isAdmin ? '/admin/dashboard' : '/dashboard'))

const selectedPlatform = ref<string>('all')
const selectedGroupId = ref<number | 'all'>('all')
const selectedRate = ref<number | 'all'>('all')
const searchQuery = ref('')

const searchActive = computed(() => searchQuery.value.trim() !== '')
const modelTotal = computed(() =>
  (props.response?.groups ?? []).reduce((sum, g) => sum + (g.models?.length ?? 0), 0)
)

const descriptionHtml = computed(() => {
  const md = props.response?.description?.trim()
  if (!md) return ''
  return DOMPurify.sanitize(marked.parse(md) as string)
})

/** 生效倍率 = 用户专属倍率 ?? 分组默认倍率。 */
function effectiveRate(g: ModelPlazaGroup): number {
  return g.user_rate_multiplier ?? g.rate_multiplier
}

const platforms = computed(() =>
  [...new Set((props.response?.groups ?? []).map((g) => g.platform).filter(Boolean))].sort()
)

const groupOptions = computed(() =>
  (props.response?.groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    platform: g.platform,
    rate: effectiveRate(g),
  }))
)

/** 全量生效倍率；当前组合下不可用的项由 FilterBar 置灰而非隐藏。 */
const rates = computed(() =>
  [...new Set((props.response?.groups ?? []).map(effectiveRate))].sort((a, b) => a - b)
)

/** 数据刷新后选中的倍率可能不复存在，重置为全部。 */
watch(rates, (list) => {
  if (selectedRate.value !== 'all' && !list.includes(selectedRate.value)) {
    selectedRate.value = 'all'
  }
})

const filteredGroups = computed(() => {
  let groups = props.response?.groups ?? []
  if (selectedPlatform.value !== 'all') {
    groups = groups.filter((g) => g.platform === selectedPlatform.value)
  }
  if (selectedGroupId.value !== 'all') {
    groups = groups.filter((g) => g.id === selectedGroupId.value)
  }
  if (selectedRate.value !== 'all') {
    groups = groups.filter((g) => effectiveRate(g) === selectedRate.value)
  }
  // 模型名搜索：分组内只留命中的模型，整组无命中则隐藏该分组。
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    groups = groups
      .map((g) => ({ ...g, models: g.models.filter((m) => m.name.toLowerCase().includes(q)) }))
      .filter((g) => g.models.length > 0)
  }
  // 专属倍率会改变生效值，不能只依赖后端按默认倍率的排序。
  return [...groups].sort(
    (a, b) => effectiveRate(a) - effectiveRate(b) || a.name.localeCompare(b.name)
  )
})
</script>

<style scoped>
.plaza { display: flex; flex-direction: column; gap: clamp(20px, 3vw, 32px); }
.plaza--embedded { gap: 16px; }

.plaza__hero { max-width: 62ch; }
.plaza__title { margin-top: 14px; }
.plaza__lede { margin-top: 16px; }
.plaza__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
}
.plaza__cta { margin-left: auto; display: flex; gap: 8px; }

.plaza__note { display: flex; flex-direction: column; gap: 10px; }
.plaza__note-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--st-accent);
}
.plaza__note-body {
  font-size: 0.88rem;
  line-height: 1.75;
  color: var(--st-ink-soft);
  overflow-wrap: anywhere;
}
.plaza__note-body :deep(h1),
.plaza__note-body :deep(h2),
.plaza__note-body :deep(h3) {
  margin: 14px 0 6px;
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--st-ink);
}
.plaza__note-body :deep(h1:first-child),
.plaza__note-body :deep(h2:first-child),
.plaza__note-body :deep(h3:first-child) { margin-top: 0; }
.plaza__note-body :deep(p) { margin-bottom: 8px; }
.plaza__note-body :deep(p:last-child) { margin-bottom: 0; }
.plaza__note-body :deep(a) { color: var(--st-accent); text-underline-offset: 3px; }
.plaza__note-body :deep(ul),
.plaza__note-body :deep(ol) { margin: 0 0 8px; padding-left: 20px; }
.plaza__note-body :deep(li) { margin-bottom: 4px; }
.plaza__note-body :deep(code) {
  font-family: var(--st-font-mono);
  font-size: 0.8rem;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--st-bg-sunk);
}

.plaza__shelves { display: flex; flex-direction: column; gap: clamp(28px, 4vw, 48px); }

.plaza__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding-block: clamp(36px, 6vw, 64px);
  text-align: center;
}
.plaza__state-mark {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid var(--st-line);
  background: var(--st-bg-sunk);
  color: var(--st-ink-faint);
}
.plaza__state-title { font-size: 0.95rem; color: var(--st-ink-soft); max-width: 40ch; }

.plaza__skeleton { display: flex; flex-direction: column; gap: 18px; }
.plaza__skeleton-filters { height: 168px; border-radius: var(--st-radius-lg); }
.plaza__skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: 12px;
}
.plaza__skeleton-card { height: 148px; border-radius: var(--st-radius-md); }

@media (max-width: 720px) {
  .plaza__cta { margin-left: 0; width: 100%; }
}
</style>
