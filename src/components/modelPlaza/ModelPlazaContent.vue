<template>
  <div class="plaza" :class="{ 'plaza--embedded': embedded }">
    <!-- 页头（独立形态） -->
    <header v-if="!embedded" class="plaza__hero">
      <div class="plaza__intro">
        <p class="st-eyebrow st-reveal">{{ c('plaza.eyebrow') }}</p>
        <h1 class="st-display-2 plaza__title st-reveal" style="--i: 1">{{ c('plaza.title') }}</h1>
        <p class="st-lede plaza__lede st-reveal" style="--i: 2">{{ c('plaza.lede') }}</p>
        <div class="plaza__cta st-reveal" style="--i: 3">
          <RouterLink v-if="isAuthenticated" :to="backTarget" class="st-btn st-btn--primary st-btn--lg">
            {{ c('plaza.backDashboard') }}
          </RouterLink>
          <RouterLink
            v-else
            :to="{ path: '/login', query: { redirect: '/model-plaza' } }"
            class="st-btn st-btn--primary st-btn--lg"
          >
            {{ c('plaza.login') }}
          </RouterLink>
        </div>
        <p v-if="!isAuthenticated" class="plaza__anon st-reveal" style="--i: 4">
          {{ c('plaza.anonymousHint') }}
        </p>
      </div>

      <dl v-if="response" class="plaza__stats st-reveal" style="--i: 2">
        <div class="plaza__stat st-stat">
          <dt class="st-stat__label">{{ c('plaza.statGroups') }}</dt>
          <dd class="st-stat__value st-num">{{ response.groups?.length ?? 0 }}</dd>
        </div>
        <div class="plaza__stat st-stat">
          <dt class="st-stat__label">{{ c('plaza.statModels') }}</dt>
          <dd class="st-stat__value st-num">{{ modelTotal }}</dd>
        </div>
        <div v-if="minRate != null" class="plaza__stat st-stat">
          <dt class="st-stat__label">{{ c('plaza.price.rate') }}</dt>
          <dd class="plaza__stat-inline">
            <span class="st-stat__value st-num">{{ minRate }}</span>
            <span class="st-stat__unit">x</span>
          </dd>
        </div>
      </dl>
    </header>

    <!-- 全局价格说明（管理员配置的 Markdown） -->
    <div v-if="descriptionHtml" class="plaza__note st-card st-card--pad">
      <p class="plaza__note-label">{{ c('plaza.note') }}</p>
      <div class="plaza__note-body" v-html="descriptionHtml"></div>
    </div>

    <!-- 加载：骨架 -->
    <div v-if="loading" class="plaza__skeleton" aria-busy="true" aria-live="polite">
      <div class="plaza__skeleton-stats">
        <div v-for="i in 3" :key="i" class="st-skeleton plaza__skeleton-stat"></div>
      </div>
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
      <button type="button" class="st-btn st-btn--primary st-btn--sm" @click="$emit('retry')">
        {{ c('action.retry') }}
      </button>
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
        @reset="resetFilters"
      />

      <div v-if="filteredGroups.length > 0" class="plaza__shelves">
        <PlazaGroupSection
          v-for="(g, idx) in filteredGroups"
          :key="g.id"
          :group="g"
          :index="idx"
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
        <button type="button" class="st-btn st-btn--quiet st-btn--sm" @click="resetFilters">
          {{ c('action.clearFilters') }}
        </button>
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

defineEmits<{ retry: [] }>()

/** 最低生效倍率：卡片区三个大数字中的第三个。 */
const minRate = computed(() => (rates.value.length > 0 ? rates.value[0] : null))

/** 空状态动作：一键回到「全部」。仅重置展示态筛选，不触发请求。 */
function resetFilters() {
  selectedPlatform.value = 'all'
  selectedGroupId.value = 'all'
  selectedRate.value = 'all'
  searchQuery.value = ''
}
</script>

<style scoped>
.plaza { display: flex; flex-direction: column; gap: clamp(28px, 4vw, 56px); }
.plaza--embedded { gap: 20px; }

.plaza__hero { display: grid; grid-template-columns: 1fr; gap: clamp(24px, 3.5vw, 44px); align-items: end; }
.plaza__intro { max-width: 58ch; }
.plaza__title { margin-top: 12px; }
.plaza__lede { margin-top: 14px; }
.plaza__cta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
.plaza__anon { margin-top: 12px; font-size: 0.8rem; line-height: 1.6; color: var(--st-ink-3); }

.plaza__stats {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(20px, 4vw, 52px);
  margin: 0;
  padding-top: 20px;
  border-top: 1px solid var(--st-line);
}
.plaza__stat { min-width: 84px; }
.plaza__stat dt { margin: 0; }
.plaza__stat dd { margin: 0; }
.plaza__stat-inline { display: flex; align-items: baseline; gap: 2px; }

@media (min-width: 880px) {
  .plaza__hero { grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); }
  .plaza__stats { justify-content: flex-end; padding-top: 0; border-top: 0; }
}

.plaza__note { display: flex; flex-direction: column; gap: 10px; }
.plaza__note-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--st-brand-text);
}
.plaza__note-body {
  font-size: 0.88rem;
  line-height: 1.75;
  color: var(--st-ink-2);
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
.plaza__note-body :deep(a) { color: var(--st-brand-text); text-underline-offset: 3px; }
.plaza__note-body :deep(ul),
.plaza__note-body :deep(ol) { margin: 0 0 8px; padding-left: 20px; }
.plaza__note-body :deep(li) { margin-bottom: 4px; }
.plaza__note-body :deep(code) {
  font-family: var(--st-font-mono);
  font-size: 0.8rem;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--st-bg-sink);
}

.plaza__shelves { display: flex; flex-direction: column; gap: clamp(32px, 4.5vw, 60px); }

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
  background: var(--st-bg-soft);
  color: var(--st-ink-3);
}
.plaza__state-title { font-size: 0.95rem; line-height: 1.6; color: var(--st-ink-2); max-width: 40ch; }

.plaza__skeleton { display: flex; flex-direction: column; gap: 18px; }
.plaza__skeleton-stats { display: flex; gap: 32px; }
.plaza__skeleton-stat { height: 54px; width: min(30%, 140px); border-radius: var(--st-r-sm); }
.plaza__skeleton-filters { height: 168px; border-radius: var(--st-r-lg); }
.plaza__skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 14px;
}
.plaza__skeleton-card { height: 172px; border-radius: var(--st-r-md); }

@media (max-width: 719px) and (max-height: 740px) {
  .plaza__hero { gap: 10px; }
  .plaza__hero .st-lede { display: none; }
  .plaza__cta { margin-top: 10px; }
  .plaza__stats { gap: 10px; padding-top: 10px; }
  .plaza__state { padding: 14px; }
  .plaza__state-title { font-size: 0.9rem; }
  .filters { padding: 12px; }
}
@media (max-width: 720px) {
  .plaza__cta .st-btn { width: 100%; }
  .plaza__skeleton-filters { height: 132px; }
}
</style>
