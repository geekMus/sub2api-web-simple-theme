<template>
  <footer v-if="ready" class="ft">
    <div class="st-shell ft__in">
      <div class="ft__brand">
        <p class="ft__name">{{ siteName }}</p>
        <p class="ft__tag">{{ c('footer.tagline') }}</p>
      </div>
      <div class="ft__cols">
        <div class="ft__col">
          <p class="ft__head">{{ c('footer.product') }}</p>
          <router-link to="/dashboard" class="ft__link">{{ c('nav.overview') }}</router-link>
          <router-link to="/keys" class="ft__link">{{ c('nav.passes') }}</router-link>
          <router-link to="/usage" class="ft__link">{{ c('nav.usage') }}</router-link>
          <router-link v-if="modelPlaza" to="/model-plaza" class="ft__link">{{ c('nav.models') }}</router-link>
        </div>
        <div class="ft__col">
          <p class="ft__head">{{ c('footer.account') }}</p>
          <router-link to="/profile" class="ft__link">{{ c('account.profile') }}</router-link>
          <router-link to="/redeem" class="ft__link">{{ c('account.redeem') }}</router-link>
          <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="ft__link">{{ c('nav.docs') }}</a>
        </div>
        <div class="ft__col">
          <p class="ft__head">{{ c('footer.legal') }}</p>
          <router-link to="/legal/terms" class="ft__link">{{ c('footer.terms') }}</router-link>
          <router-link to="/legal/usage-policy" class="ft__link">{{ c('footer.usagePolicy') }}</router-link>
        </div>
      </div>
    </div>
    <div class="st-shell ft__base">
      <p>© {{ year }} {{ siteName }}</p>
      <p v-if="version" class="ft__ver">v{{ version }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import { useSimpleCopy } from '@/composables/useSimpleCopy'

let appStore: ReturnType<typeof useAppStore> | null = null
try {
  appStore = useAppStore()
} catch {
  appStore = null
}
const ready = !!appStore
const { c } = useSimpleCopy()
const siteName = computed(() => appStore?.siteName || 'Sub2API')
const docUrl = computed(() => appStore?.cachedPublicSettings?.doc_url || '')
const modelPlaza = computed(() => !!appStore?.cachedPublicSettings?.model_plaza_enabled)
const version = computed(() => appStore?.cachedPublicSettings?.version || '')
const year = new Date().getFullYear()
</script>

<style scoped>
.ft { margin-top: clamp(56px, 8vw, 100px); border-top: 1px solid var(--st-line); }
.ft__in { display: flex; flex-direction: column; gap: 32px; padding-block: 40px 28px; }
.ft__brand { max-width: 26ch; }
.ft__name { font-family: var(--st-font-display); font-size: 0.92rem; font-weight: 600; letter-spacing: -0.02em; color: var(--st-ink); }
.ft__tag { margin-top: 6px; font-size: 0.83rem; line-height: 1.6; color: var(--st-ink-3); }
.ft__cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; }
.ft__col { display: flex; flex-direction: column; gap: 9px; }
.ft__head { font-size: 0.71rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--st-ink-3); }
.ft__link { font-size: 0.85rem; color: var(--st-ink-2); text-decoration: none; width: fit-content; transition: color var(--st-t) var(--st-ease); }
.ft__link:hover { color: var(--st-ink); }
.ft__base { display: flex; flex-wrap: wrap; gap: 8px 20px; justify-content: space-between; padding-block: 16px 24px; border-top: 1px solid var(--st-line); font-size: 0.76rem; color: var(--st-ink-3); }
.ft__ver { font-variant-numeric: tabular-nums; }
@media (min-width: 820px) {
  .ft__in { flex-direction: row; justify-content: space-between; gap: 48px; }
  .ft__cols { grid-template-columns: repeat(3, minmax(120px, 1fr)); gap: 56px; }
}
</style>
