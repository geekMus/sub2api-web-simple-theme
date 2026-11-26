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
            {{ isAuthenticated ? c('home.ctaConsole') : c('home.signIn') }}
          </router-link>
          <router-link v-if="showModelPlazaEntry" to="/model-plaza" class="st-btn st-btn--quiet st-btn--lg">{{ c('home.models') }}</router-link>
        </div>
      </div>
    </section>
  </UserShell>

  <UserShell v-else>
    <!-- ============ HERO：自带顶部栏，占满一屏 ============ -->
    <section class="hero terminal-container">
      <div class="hero__bg" aria-hidden="true">
        <span class="hero__glow hero__glow--a"></span>
        <span class="hero__glow hero__glow--b"></span>
        <span class="hero__mesh"></span>
      </div>

      <div class="st-shell hero__inner">
        <div class="hero__grid">
          <div class="hero__copy">
            <p class="hero__kicker st-reveal">{{ siteSubtitle }}</p>
            <h1 class="hero__brand st-reveal" style="--i: 1">{{ siteName }}</h1>
            <p class="hero__value st-reveal" style="--i: 2">{{ c('home.valueLine') }}</p>
            <p class="hero__line st-reveal" style="--i: 3">{{ c('home.heroLine') }}</p>
            <div class="hero__cta st-reveal" style="--i: 4">
              <router-link :to="primaryTarget" class="st-btn st-btn--primary st-btn--lg">
                {{ isAuthenticated ? c('home.ctaConsole') : c('home.ctaStart') }}
              </router-link>
              <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="st-btn st-btn--quiet st-btn--lg">{{ c('home.ctaDocs') }}</a>
            </div>
            <dl class="hero__stats st-reveal" style="--i: 5">
              <div><dt>3</dt><dd>{{ c('home.statProtocols') }}</dd></div>
              <div><dt>0</dt><dd>{{ c('home.statCode') }}</dd></div>
              <div><dt>1</dt><dd>{{ c('home.statBill') }}</dd></div>
            </dl>
          </div>

          <div class="hero__art st-reveal" style="--i: 1">
            <TerminalArt />
          </div>
        </div>
      </div>

      <button class="hero__scroll" type="button" :aria-label="c('home.scrollHint')" @click="scrollDown">
        <span>{{ c('home.scrollHint') }}</span>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M8 3v9M4 8.5l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </section>

    <!-- ============ 路由：一条线扇出到各个工具 ============ -->
    <section class="st-section route">
      <div class="st-shell route__grid">
        <div class="route__copy">
          <h2 class="st-display-2">{{ c('home.routeTitle') }}</h2>
          <p class="st-lede route__desc">{{ c('home.routeDesc') }}</p>
          <router-link v-if="showModelPlazaEntry" to="/model-plaza" class="route__link">
            {{ c('home.routeLink') }}
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </router-link>
        </div>
        <div class="route__art"><FanoutArt /></div>
      </div>
    </section>

    <!-- ============ 账单 ============ -->
    <section class="st-section">
      <div class="st-shell duo duo--rev">
        <div class="duo__copy">
          <h2 class="st-display-2">{{ c('home.billTitle') }}</h2>
          <p class="duo__b">{{ c('home.billLine') }}</p>
        </div>
        <div class="duo__art"><MockUsage /></div>
      </div>
    </section>

    <!-- ============ 通行证 ============ -->
    <section class="st-section">
      <div class="st-shell duo">
        <div class="duo__copy">
          <h2 class="st-display-2">{{ c('home.keysTitle') }}</h2>
          <p class="duo__b">{{ c('home.keysLine') }}</p>
        </div>
        <div class="duo__art duo__art--keys"><MockKeys /></div>
      </div>
    </section>

    <!-- ============ CTA ============ -->
    <section class="st-section--tight">
      <div class="st-shell">
        <div class="cta">
          <div class="cta__copy">
            <h2 class="st-display-2 cta__t">{{ c('home.ctaTitle') }}</h2>
            <p class="st-lede cta__b">{{ c('home.ctaDesc') }}</p>
            <div class="cta__a">
              <router-link :to="primaryTarget" class="st-btn st-btn--primary st-btn--lg">
                {{ isAuthenticated ? c('home.ctaConsole') : c('home.ctaStart') }}
              </router-link>
              <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="st-btn st-btn--quiet st-btn--lg">{{ c('home.ctaDocs') }}</a>
            </div>
          </div>
          <div class="cta__art"><RingsArt /></div>
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
import FanoutArt from '@/components/shell/art/FanoutArt.vue'
import RingsArt from '@/components/shell/art/RingsArt.vue'
import { useSimpleCopy } from '@/composables/useSimpleCopy'
import { sanitizeUrl } from '@/utils/url'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'

const appStore = useAppStore()
const authStore = useAuthStore()
const { c } = useSimpleCopy()

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
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || '')
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

function scrollDown() {
  const top = window.innerHeight - 60
  window.scrollTo({ top: top > 0 ? top : window.innerHeight, behavior: 'smooth' })
}

</script>

<style scoped>
/* ---------- hero ---------- */
.hero {
  position: relative;
  display: flex;
  align-items: center;
  min-height: calc(100vh - 60px);
  padding-block: clamp(24px, 3vw, 44px) clamp(64px, 7vw, 88px);
  /* 允许背景层向上覆盖到导航栏后面 */
  overflow: visible;
}
.hero__inner { width: 100%; display: flex; flex-direction: column; justify-content: center; }

/* 背景：冷光 + 网格 */
.hero__bg { position: absolute; inset: -60px 0 0 0; pointer-events: none; z-index: 0; }
.hero__glow { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.75; }
/* 顶部再多铺一点，避免导航栏背后出现断层 */
.hero__bg::after {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 220px;
  background: linear-gradient(to bottom, color-mix(in srgb, var(--st-bg) 0%, transparent), transparent);
}
.hero__glow--a { width: 900px; height: 620px; right: -160px; top: -260px; background: var(--st-brand-soft); }
.hero__glow--b { width: 760px; height: 520px; left: -220px; top: 30%; background: rgba(110, 130, 255, 0.1); }
.hero__mesh {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(to right, var(--st-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--st-line) 1px, transparent 1px);
  background-size: 88px 88px;
  mask-image: radial-gradient(ellipse 78% 62% at 50% 0%, #000 12%, transparent 72%);
  -webkit-mask-image: radial-gradient(ellipse 78% 62% at 50% 0%, #000 12%, transparent 72%);
  opacity: 0.7;
}

.hero__grid { position: relative; z-index: 1; flex: 1; display: grid; grid-template-columns: 1fr; gap: clamp(32px, 4vw, 52px); align-items: center; padding-block: clamp(20px, 3vw, 40px); }
/* 品牌为主：站点名即视觉主体 */
.hero__kicker { margin: 0 0 10px; font-size: 0.78rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--st-ink-3); }
.hero__brand {
  margin: 0;
  font-family: var(--st-font-display);
  font-size: clamp(3.1rem, 8.4vw, 6.6rem);
  font-weight: 600;
  line-height: 0.92;
  letter-spacing: -0.055em;
  color: var(--st-ink);
  word-break: break-word;
}
.hero__value { margin: 20px 0 0; font-family: var(--st-font-display); font-size: clamp(1.15rem, 1.9vw, 1.6rem); font-weight: 500; letter-spacing: -0.025em; color: var(--st-ink); }
.hero__line { margin: 10px 0 0; font-size: clamp(0.95rem, 1.1vw, 1.04rem); color: var(--st-ink-2); }
.hero__cta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px; }

/* 首屏数据条：补足信息密度 */
.hero__stats { display: flex; flex-wrap: wrap; gap: 28px; margin: 34px 0 0; padding-top: 22px; border-top: 1px solid var(--st-line); }
.hero__stats div { display: flex; align-items: baseline; gap: 8px; }
.hero__stats dt { font-family: var(--st-font-display); font-size: 1.5rem; font-weight: 600; letter-spacing: -0.04em; color: var(--st-ink); line-height: 1; }
.hero__stats dd { margin: 0; font-size: 0.8rem; color: var(--st-ink-3); }

.hero__art { position: relative; min-width: 0; }

.hero__scroll {
  position: absolute; left: 50%; bottom: clamp(14px, 2vw, 24px);
  transform: translateX(-50%);
  display: inline-flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 6px 10px; border: 0; background: none;
  color: var(--st-ink-3); font-family: inherit; font-size: 11px; letter-spacing: 0.06em;
  cursor: pointer; z-index: 2;
  animation: hero-bob 2.2s var(--st-ease) infinite;
}
.hero__scroll:hover { color: var(--st-ink); }
@keyframes hero-bob {
  0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.75; }
  50% { transform: translateX(-50%) translateY(6px); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) { .hero__scroll { animation: none; } }

/* ---------- 服务带 ---------- */
.strip { border-block: 1px solid var(--st-line); background: var(--st-bg-soft); padding-block: clamp(36px, 4.2vw, 60px); }
.strip__grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
.strip__cell { display: flex; flex-direction: column; gap: 14px; }
.strip__idx { font-family: var(--st-font-mono); font-size: 11px; letter-spacing: 0.08em; color: var(--st-brand-text); }

.mini { display: flex; align-items: center; gap: 8px; height: 68px; padding: 0 14px; border-radius: var(--st-r-sm); border: 1px solid var(--st-line); background: var(--st-bg); overflow: hidden; }
.mini__chip { display: inline-flex; align-items: center; gap: 5px; height: 22px; padding-inline: 8px; border-radius: 6px; border: 1px solid var(--st-line); background: var(--st-bg); font-size: 10.5px; font-weight: 500; color: var(--st-ink-2); white-space: nowrap; }
.mini__dot { width: 5px; height: 5px; border-radius: 50%; }
.mini__dot--a { background: #d97757; }
.mini__dot--o { background: #10a37f; }
.mini__dot--g { background: #4285f4; }

.mini--chart { align-items: flex-end; gap: 4px; padding: 10px 14px; }
.mini--chart span { flex: 1 1 0; min-width: 0; border-radius: 3px 3px 1px 1px; background: color-mix(in srgb, var(--st-ink) 14%, transparent); }
.mini--chart span.is-on { background: var(--st-brand); }

.mini--flow { gap: 6px; }
.mini__req { font-size: 10.5px; color: var(--st-ink-3); white-space: nowrap; }
.mini__line { flex: 1; height: 1px; background: var(--st-line-2); min-width: 10px; }
.mini__line--dash { background: repeating-linear-gradient(90deg, var(--st-line-2) 0 3px, transparent 3px 6px); }
.mini__node { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 6px; font-size: 10px; font-weight: 600; font-family: var(--st-font-mono); }
.mini__node--bad { background: var(--st-danger-soft); color: var(--st-danger); }
.mini__node--ok { background: var(--st-brand); color: var(--st-brand-ink); }

.strip__t { margin: 0; font-family: var(--st-font-display); font-size: 1.08rem; font-weight: 600; letter-spacing: -0.025em; color: var(--st-ink); }
.strip__b { margin: 0; font-size: 0.86rem; line-height: 1.55; color: var(--st-ink-2); }

/* ---------- 双栏 ---------- */
.duo { display: grid; grid-template-columns: 1fr; gap: clamp(28px, 4vw, 56px); align-items: center; }
.duo__copy { max-width: 26ch; }
.duo__b { margin: 14px 0 0; font-size: 1rem; color: var(--st-ink-2); }
.duo__art { min-width: 0; }
.duo__art--keys { max-width: 420px; }
.duo__art > * { width: 100%; }

/* ---------- CTA ---------- */
.cta { border-radius: var(--st-r-xl); border: 1px solid var(--st-line); background: var(--st-bg-soft); padding: clamp(32px, 4.6vw, 64px); text-align: center; }
.cta__t { max-width: 20ch; margin-inline: auto; }
.cta__a { display: flex; justify-content: center; margin-top: 26px; }

.compact { display: flex; flex-direction: column; align-items: flex-start; gap: 18px; padding-block: clamp(64px, 12vw, 140px); }
.compact__logo { width: 44px; height: 44px; object-fit: contain; }
.compact__t { margin: 0; }
.compact__a { display: flex; flex-wrap: wrap; gap: 10px; }

/* ---------- 路由扇出（覆盖旧的 strip 样式） ---------- */
.route { border-block: 1px solid var(--st-line); background: var(--st-bg-soft); }
.route__grid { display: grid; grid-template-columns: 1fr; gap: clamp(24px, 3vw, 48px); align-items: center; }
.route__copy { max-width: min(520px, 100%); }
.route__desc { margin-top: 14px; }
.route__link {
  display: inline-flex; align-items: center; gap: 6px; margin-top: 20px;
  font-size: 0.86rem; color: var(--st-ink-2); text-decoration: none;
  transition: color var(--st-t) var(--st-ease), gap var(--st-t) var(--st-ease);
}
.route__link:hover { color: var(--st-brand-text); gap: 9px; }
.route__art { min-width: 0; }

/* ---------- CTA 覆盖：左文右图 ---------- */
.cta { display: grid; grid-template-columns: 1fr; gap: clamp(20px, 3vw, 40px); text-align: left; align-items: center; }
.cta__copy { max-width: min(440px, 100%); }
.cta__t { max-width: none; }
.cta__b { margin-top: 12px; }
.cta__a { justify-content: flex-start; margin-top: 22px; }
.cta__art { display: none; }

@media (min-width: 900px) {
  .cta { grid-template-columns: 1fr 0.85fr; }
  .cta__art { display: block; }
  .route__grid { grid-template-columns: 0.85fr 1.15fr; }
}

@media (min-width: 900px) {
  .hero__grid { grid-template-columns: 0.82fr 1.18fr; }
  .strip__grid { grid-template-columns: repeat(3, 1fr); gap: 0; }
  .strip__cell + .strip__cell { border-left: 1px solid var(--st-line); padding-left: clamp(20px, 2.4vw, 36px); }
  .strip__cell:not(:last-child) { padding-right: clamp(20px, 2.4vw, 36px); }
  .duo { grid-template-columns: 0.62fr 1fr; }
  .duo--rev { grid-template-columns: 1fr 0.62fr; }
  .duo--rev .duo__copy { order: 2; }
  .duo--rev .duo__art { order: 1; }
}
</style>
