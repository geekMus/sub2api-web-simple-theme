<template>
  <div v-if="hasHomeContent" class="st-root">
    <iframe v-if="isHomeContentUrl" :src="homeContent.trim()" class="h-screen w-full border-0" title="home" />
    <div v-else v-html="homeContent"></div>
  </div>

  <UserShell v-else-if="compactHomeEnabled">
    <section class="st-section">
      <div class="st-shell compact" data-testid="compact-home">
        <img v-if="siteLogo" :src="siteLogo" alt="" class="compact__logo" />
        <h1 class="st-display-1 compact__t">{{ siteName }}</h1>
        <div class="compact__a">
          <router-link :to="compactTarget" class="st-btn st-btn--primary st-btn--lg">
            {{ isAuthenticated ? '进入控制台' : '登录' }}
          </router-link>
          <router-link v-if="showModelPlazaEntry" to="/model-plaza" class="st-btn st-btn--quiet st-btn--lg">模型</router-link>
        </div>
      </div>
    </section>
  </UserShell>

  <UserShell v-else>
    <!-- ============ 1. HERO：只有标题 + 一句话 + 按钮 + 终端 ============ -->
    <section class="hero terminal-container">
      <div class="st-shell hero__grid">
        <div class="hero__copy">
          <h1 class="st-display-1 hero__title st-reveal">
            一个接口<br /><em>调用所有模型</em>
          </h1>
          <p class="hero__line st-reveal" style="--i: 1">换模型只改一行。</p>
          <div class="hero__cta st-reveal" style="--i: 2">
            <router-link :to="primaryTarget" class="st-btn st-btn--primary st-btn--lg">
              {{ isAuthenticated ? '进入控制台' : '免费开始' }}
            </router-link>
            <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="st-btn st-btn--quiet st-btn--lg">文档</a>
          </div>
        </div>
        <div class="hero__art st-reveal" style="--i: 1">
          <TerminalArt />
        </div>
      </div>
    </section>

    <!-- ============ 2. 服务带：全宽三栏，与首屏明确区隔 ============ -->
    <section class="strip">
      <div class="st-shell strip__grid">
        <article v-for="(s, i) in strip" :key="s.t" class="strip__cell">
          <div class="strip__art" aria-hidden="true">
            <svg v-if="i === 0" viewBox="0 0 72 40"><circle cx="12" cy="20" r="6" class="sa-d"/><circle cx="36" cy="20" r="6" class="sa-d"/><circle cx="60" cy="20" r="6" class="sa-d"/><path d="M18 20h12M42 20h12" class="sa-l"/></svg>
            <svg v-else-if="i === 1" viewBox="0 0 72 40"><rect x="6" y="8" width="24" height="24" rx="6" class="sa-b"/><rect x="38" y="8" width="28" height="10" rx="5" class="sa-b sa-b--on"/><rect x="38" y="22" width="18" height="10" rx="5" class="sa-b"/></svg>
            <svg v-else viewBox="0 0 72 40"><path d="M8 20h16" class="sa-l"/><circle cx="30" cy="20" r="6" class="sa-d sa-d--x"/><path d="M36 20h10" class="sa-l sa-l--d"/><circle cx="54" cy="20" r="6" class="sa-d sa-d--ok"/></svg>
          </div>
          <h2 class="strip__t">{{ s.t }}</h2>
          <p class="strip__b">{{ s.b }}</p>
        </article>
      </div>
    </section>

    <!-- ============ 3. 账单 ============ -->
    <section class="st-section">
      <div class="st-shell duo duo--rev">
        <div class="duo__copy">
          <h2 class="st-display-2">账单看得懂</h2>
          <p class="duo__b">按天、按模型、按通行证。</p>
        </div>
        <div class="duo__art"><MockUsage /></div>
      </div>
    </section>

    <!-- ============ 4. 通行证 ============ -->
    <section class="st-section">
      <div class="st-shell duo">
        <div class="duo__copy">
          <h2 class="st-display-2">一个项目一把钥匙</h2>
          <p class="duo__b">随时停用，互不影响。</p>
        </div>
        <div class="duo__art duo__art--keys"><MockKeys /></div>
      </div>
    </section>

    <!-- ============ 5. CTA ============ -->
    <section class="st-section--tight">
      <div class="st-shell">
        <div class="cta">
          <h2 class="st-display-2 cta__t">三十秒发出第一条请求</h2>
          <div class="cta__a">
            <router-link :to="primaryTarget" class="st-btn st-btn--primary st-btn--lg">{{ isAuthenticated ? '进入控制台' : '免费开始' }}</router-link>
          </div>
        </div>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAppStore, useAuthStore } from '@/stores'
import UserShell from '@/components/shell/UserShell.vue'
import TerminalArt from '@/components/shell/art/TerminalArt.vue'
import MockUsage from '@/components/shell/art/MockUsage.vue'
import MockKeys from '@/components/shell/art/MockKeys.vue'
import { sanitizeUrl } from '@/utils/url'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'

const appStore = useAppStore()
const authStore = useAuthStore()

const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const hasHomeContent = computed(() => homeContent.value.trim().length > 0)
const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})
const docUrl = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || '', { allowRelative: true }))
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const compactHomeEnabled = computed(
  () => !hasHomeContent.value && appStore.cachedPublicSettings?.compact_home_enabled === true,
)
const primaryTarget = computed(() => (isAuthenticated.value ? (isAdmin.value ? '/admin/dashboard' : '/dashboard') : '/register'))
const compactTarget = computed(() => (isAuthenticated.value ? (isAdmin.value ? '/admin/dashboard' : '/dashboard') : '/login'))
const modelPlazaEnabled = computed(() => isFeatureFlagEnabled(FeatureFlags.modelPlaza))
const showModelPlazaEntry = computed(
  () => modelPlazaEnabled.value && (isAuthenticated.value || appStore.cachedPublicSettings?.model_plaza_require_auth !== true),
)

onMounted(() => {
  if (!authStore.isAuthenticated || authStore.isAdmin) authStore.checkAuth?.()
  if (!authStore.isAdmin) appStore.fetchPublicSettings?.()
})

const strip = [
  { t: '协议兼容', b: 'OpenAI · Anthropic · Gemini' },
  { t: '按量计费', b: 'token 级，逐条可查' },
  { t: '自动容灾', b: '上游失败自动换渠道' },
]
</script>

<style scoped>
/* ---------- 1. hero ---------- */
.hero { padding-block: clamp(56px, 7vw, 104px) clamp(40px, 5vw, 72px); }
.hero__grid { display: grid; grid-template-columns: 1fr; gap: clamp(36px, 4.5vw, 56px); align-items: center; }
.hero__title { margin: 0; }
.hero__title em { font-style: normal; display: inline-block; white-space: nowrap; color: var(--st-brand-text); }
.hero__line { margin: 20px 0 0; font-size: clamp(1rem, 1.2vw, 1.1rem); color: var(--st-ink-2); }
.hero__cta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
.hero__art { position: relative; min-width: 0; }

/* ---------- 2. 服务带：与首屏不同底色 + 三栏 ---------- */
.strip {
  border-block: 1px solid var(--st-line);
  background: var(--st-bg-soft);
  padding-block: clamp(28px, 3.2vw, 44px);
}
.strip__grid { display: grid; grid-template-columns: 1fr; gap: 26px; }
.strip__cell { display: flex; flex-direction: column; gap: 8px; }
.strip__art { height: 40px; color: var(--st-ink-3); }
.strip__art svg { height: 40px; width: auto; }
.sa-d { fill: none; stroke: currentColor; stroke-width: 1.4; }
.sa-d--x { color: var(--st-danger); stroke: var(--st-danger); }
.sa-d--ok { color: var(--st-ok); stroke: var(--st-ok); }
.sa-b { fill: currentColor; opacity: 0.18; }
.sa-b--on { opacity: 0.9; fill: var(--st-brand); }
.sa-l { stroke: currentColor; stroke-width: 1.2; }
.sa-l--d { stroke-dasharray: 3 4; }
.strip__t { margin: 0; font-family: var(--st-font-display); font-size: 1.02rem; font-weight: 600; letter-spacing: -0.02em; color: var(--st-ink); }
.strip__b { margin: 0; font-size: 0.85rem; color: var(--st-ink-3); }

/* ---------- 3/4. 双栏 ---------- */
.duo { display: grid; grid-template-columns: 1fr; gap: clamp(28px, 4vw, 56px); align-items: center; }
.duo__copy { max-width: 26ch; }
.duo__b { margin: 14px 0 0; font-size: 1rem; color: var(--st-ink-2); }
.duo__art { min-width: 0; }
.duo__art--keys { max-width: 420px; }
.duo__art > * { width: 100%; }

/* ---------- 5. cta ---------- */
.cta {
  border-radius: var(--st-r-xl);
  border: 1px solid var(--st-line);
  background: var(--st-bg-soft);
  padding: clamp(32px, 4.6vw, 64px);
  text-align: center;
}
.cta__t { max-width: 20ch; margin-inline: auto; }
.cta__a { display: flex; justify-content: center; margin-top: 26px; }

.compact { display: flex; flex-direction: column; align-items: flex-start; gap: 18px; padding-block: clamp(64px, 12vw, 140px); }
.compact__logo { width: 44px; height: 44px; object-fit: contain; }
.compact__t { margin: 0; }
.compact__a { display: flex; flex-wrap: wrap; gap: 10px; }

@media (min-width: 900px) {
  .hero__grid { grid-template-columns: 0.8fr 1.2fr; gap: clamp(28px, 3.4vw, 52px); }
  .strip__grid { grid-template-columns: repeat(3, 1fr); gap: 40px; }
  .duo { grid-template-columns: 0.62fr 1fr; }
  .duo--rev { grid-template-columns: 1fr 0.62fr; }
  .duo--rev .duo__copy { order: 2; }
  .duo--rev .duo__art { order: 1; }
}
</style>
