<template>
  <footer class="st-foot">
    <div class="st-shell st-foot__grid">
      <div class="st-foot__brand">
        <p class="st-foot__name">{{ siteName }}</p>
        <p class="st-foot__tag">{{ c('footer.tagline') }}</p>
      </div>
      <div class="st-foot__col">
        <p class="st-foot__head">{{ c('footer.product') }}</p>
        <router-link to="/dashboard" class="st-foot__link">{{ c('nav.overview') }}</router-link>
        <router-link to="/keys" class="st-foot__link">{{ c('nav.passes') }}</router-link>
        <router-link to="/usage" class="st-foot__link">{{ c('nav.usage') }}</router-link>
        <router-link v-if="modelPlaza" to="/model-plaza" class="st-foot__link">{{ c('nav.models') }}</router-link>
      </div>
      <div class="st-foot__col">
        <p class="st-foot__head">{{ c('footer.legal') }}</p>
        <router-link to="/legal/terms" class="st-foot__link">{{ c('footer.terms') }}</router-link>
        <router-link to="/legal/usage-policy" class="st-foot__link">{{ c('footer.usagePolicy') }}</router-link>
      </div>
      <div class="st-foot__col">
        <p class="st-foot__head">{{ c('footer.account') }}</p>
        <router-link to="/profile" class="st-foot__link">{{ c('account.profile') }}</router-link>
        <router-link to="/redeem" class="st-foot__link">{{ c('account.redeem') }}</router-link>
        <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="st-foot__link">{{ c('nav.docs') }}</a>
      </div>
    </div>
    <div class="st-shell st-foot__base">
      <p>© {{ year }} {{ siteName }}. {{ c('footer.rights') }}</p>
      <p class="st-muted">{{ version }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import { useSimpleCopy } from '@/composables/useSimpleCopy'

const appStore = useAppStore()
const { c } = useSimpleCopy()
const siteName = computed(() => appStore.siteName || 'Sub2API')
const docUrl = computed(() => appStore.cachedPublicSettings?.doc_url || '')
const modelPlaza = computed(() => !!appStore.cachedPublicSettings?.model_plaza_enabled)
const version = computed(() => appStore.cachedPublicSettings?.version || '')
const year = new Date().getFullYear()
</script>

<style scoped>
.st-foot { position: relative; z-index: 1; margin-top: clamp(64px, 8vw, 120px); border-top: 1px solid var(--st-line); padding-block: clamp(40px, 5vw, 64px) 28px; }
.st-foot__grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
.st-foot__brand { max-width: 30ch; }
.st-foot__name { font-family: var(--st-font-display); font-size: 1.05rem; font-weight: 600; letter-spacing: -0.02em; color: var(--st-ink-strong); }
.st-foot__tag { margin-top: 8px; font-size: 0.86rem; line-height: 1.6; color: var(--st-ink-faint); }
.st-foot__col { display: flex; flex-direction: column; gap: 10px; }
.st-foot__head { font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--st-ink-faint); }
.st-foot__link { font-size: 0.88rem; color: var(--st-ink-soft); text-decoration: none; transition: color var(--st-dur) var(--st-ease); width: fit-content; }
.st-foot__link:hover { color: var(--st-accent); }
.st-foot__base { display: flex; flex-wrap: wrap; gap: 8px 20px; justify-content: space-between; margin-top: 44px; padding-top: 20px; border-top: 1px solid var(--st-line); font-size: 0.78rem; color: var(--st-ink-faint); }
@media (min-width: 760px) { .st-foot__grid { grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 24px; } }
</style>
