<template>
  <div v-if="hasHomeContent" class="st-root">
    <iframe v-if="isHomeContentUrl" :src="homeContent.trim()" class="h-screen w-full border-0" title="home" />
    <div v-else v-html="homeContent"></div>
  </div>

  <UserShell v-else>
    <!-- ================= HERO ================= -->
    <section class="st-section hero">
      <div class="st-shell hero__grid">
        <div class="hero__copy">
          <p class="st-eyebrow st-reveal">{{ c('home.eyebrow') }}</p>
          <h1 class="st-display-1 hero__title st-reveal" style="--i: 1">
            {{ c('home.title1') }}<br /><span class="hero__title-accent">{{ c('home.title2') }}</span>
          </h1>
          <p class="st-lede hero__lede st-reveal" style="--i: 2">{{ c('home.lede') }}</p>
          <div class="hero__actions st-reveal" style="--i: 3">
            <router-link :to="primaryTarget" class="st-btn st-btn--primary st-btn--lg">
              {{ isAuthenticated ? c('nav.openApp') : c('home.ctaPrimary') }}
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M4 10h11M11 5.5L15.5 10 11 14.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </router-link>
            <router-link v-if="showModelPlazaEntry" to="/model-plaza" class="st-btn st-btn--quiet st-btn--lg">
              {{ c('home.ctaSecondary') }}
            </router-link>
          </div>
          <ul class="hero__trust st-reveal" style="--i: 4">
            <li v-for="t in trust" :key="t">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M3.5 8.5l3 3 6-7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ t }}
            </li>
          </ul>
        </div>
        <div class="hero__art st-reveal" style="--i: 2">
          <HeroArt />
        </div>
      </div>
    </section>

    <!-- ================= 模型跑马灯 ================= -->
    <section class="st-section--tight">
      <div class="st-shell models__head">
        <div>
          <p class="st-eyebrow">{{ c('home.sectionModelsEyebrow') }}</p>
          <h2 class="st-display-2 models__title">{{ c('home.sectionModelsTitle') }}</h2>
        </div>
        <p class="st-lede models__lede">{{ c('home.sectionModelsLede') }}</p>
      </div>
      <div class="st-marquee models" aria-hidden="true">
        <div class="st-marquee__track">
          <span v-for="m in marqueeModels" :key="m" class="models__chip">{{ m }}</span>
          <span v-for="m in marqueeModels" :key="'dup-' + m" class="models__chip">{{ m }}</span>
        </div>
      </div>
    </section>

    <!-- ================= 三步 ================= -->
    <section class="st-section">
      <div class="st-shell">
        <header class="sec-head">
          <p class="st-eyebrow">{{ c('home.sectionHowEyebrow') }}</p>
          <h2 class="st-display-2">{{ c('home.sectionHowTitle') }}</h2>
        </header>
        <div class="steps">
          <article v-for="(s, i) in steps" :key="s.title" class="st-card st-card--pad st-card--lift step">
            <span class="step__index st-num">0{{ i + 1 }}</span>
            <h3 class="st-display-3">{{ s.title }}</h3>
            <p class="st-body">{{ s.body }}</p>
            <div class="step__art" aria-hidden="true">
              <svg viewBox="0 0 200 64" preserveAspectRatio="none">
                <template v-if="i === 0">
                  <rect x="6" y="18" width="120" height="28" rx="14" class="sa-line" />
                  <circle cx="26" cy="32" r="5" class="sa-dot" />
                  <rect x="130" y="18" width="64" height="28" rx="14" class="sa-fill" />
                </template>
                <template v-else-if="i === 1">
                  <rect x="6" y="10" width="188" height="14" rx="7" class="sa-line" />
                  <rect x="6" y="30" width="120" height="14" rx="7" class="sa-line" />
                  <rect x="134" y="30" width="60" height="14" rx="7" class="sa-fill" />
                  <rect x="6" y="50" width="80" height="6" rx="3" class="sa-line" />
                </template>
                <template v-else>
                  <circle cx="26" cy="32" r="16" class="sa-line" />
                  <path d="M26 32 L104 32" class="sa-wire" />
                  <rect x="104" y="18" width="90" height="28" rx="14" class="sa-fill" />
                </template>
              </svg>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ================= Bento 特性 ================= -->
    <section class="st-section">
      <div class="st-shell">
        <header class="sec-head">
          <p class="st-eyebrow">{{ c('home.sectionFeatureEyebrow') }}</p>
          <h2 class="st-display-2">{{ c('home.featureTitle') }}</h2>
          <p class="st-lede">{{ c('home.featureLede') }}</p>
        </header>
        <div class="bento">
          <article class="st-card st-card--pad st-card--halo bento__main">
            <h3 class="st-display-3">{{ c('home.feature1Title') }}</h3>
            <p class="st-body">{{ c('home.feature1Body') }}</p>
            <div class="bento__code" aria-hidden="true">
              <div class="bento__code-bar"><i></i><i></i><i></i></div>
              <pre><code><span class="tok-k">const</span> res = <span class="tok-k">await</span> client.messages.create({
  model: <span class="tok-s">'claude-opus-4'</span>,   <span class="tok-c">// 改这一行就够了</span>
  messages: [{ role: <span class="tok-s">'user'</span>, content: <span class="tok-s">'你好'</span> }]
})</code></pre>
            </div>
          </article>

          <article class="st-card st-card--pad st-card--lift bento__side">
            <h3 class="st-display-3">{{ c('home.feature2Title') }}</h3>
            <p class="st-body">{{ c('home.feature2Body') }}</p>
            <div class="bento__bars" aria-hidden="true">
              <span v-for="(h, i) in [34, 52, 41, 68, 57, 82, 63]" :key="i" :style="{ height: h + '%' }"></span>
            </div>
          </article>

          <article class="st-card st-card--pad st-card--lift bento__side">
            <h3 class="st-display-3">{{ c('home.feature3Title') }}</h3>
            <p class="st-body">{{ c('home.feature3Body') }}</p>
            <div class="bento__flow" aria-hidden="true">
              <span class="bento__node">A</span>
              <span class="bento__link"></span>
              <span class="bento__node bento__node--warn">!</span>
              <span class="bento__link bento__link--dash"></span>
              <span class="bento__node bento__node--ok">B</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ================= FAQ ================= -->
    <section class="st-section">
      <div class="st-shell faq">
        <header class="sec-head">
          <p class="st-eyebrow">{{ c('home.sectionFaqEyebrow') }}</p>
          <h2 class="st-display-2">{{ c('home.sectionFaqTitle') }}</h2>
        </header>
        <div class="faq__list">
          <details v-for="item in faqs" :key="item.q" class="faq__item">
            <summary class="faq__q">
              <span>{{ item.q }}</span>
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M5 8l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </summary>
            <p class="faq__a">{{ item.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- ================= CTA ================= -->
    <section class="st-section--tight">
      <div class="st-shell">
        <div class="cta">
          <div class="cta__glow" aria-hidden="true"></div>
          <h2 class="st-display-2 cta__title">{{ c('home.sectionCtaTitle') }}</h2>
          <p class="st-lede cta__body">{{ c('home.sectionCtaBody') }}</p>
          <div class="cta__actions">
            <router-link :to="primaryTarget" class="st-btn st-btn--primary st-btn--lg">
              {{ isAuthenticated ? c('nav.openApp') : c('home.ctaPrimary') }}
            </router-link>
            <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="st-btn st-btn--quiet st-btn--lg">
              {{ c('nav.docs') }}
            </a>
          </div>
        </div>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore, useAuthStore } from '@/stores'
import UserShell from '@/components/shell/UserShell.vue'
import HeroArt from '@/components/shell/art/HeroArt.vue'
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
const dashboardPath = computed(() => (isAdmin.value ? '/admin/dashboard' : '/dashboard'))
const primaryTarget = computed(() => (isAuthenticated.value ? dashboardPath.value : '/register'))

const modelPlazaEnabled = computed(() => isFeatureFlagEnabled(FeatureFlags.modelPlaza))
const showModelPlazaEntry = computed(
  () => modelPlazaEnabled.value && (isAuthenticated.value || appStore.cachedPublicSettings?.model_plaza_require_auth !== true),
)

const marqueeModels = ['Claude Opus', 'GPT-5', 'Gemini 2.5', 'Grok', 'DeepSeek', 'Qwen', 'GLM', 'Kimi', 'Llama', 'Mistral']

const steps = computed(() => [
  { title: c('home.how1Title'), body: c('home.how1Body') },
  { title: c('home.how2Title'), body: c('home.how2Body') },
  { title: c('home.how3Title'), body: c('home.how3Body') },
])

const trust = computed(() => [c('home.trust1'), c('home.trust2'), c('home.trust3'), c('home.trust4')])

const faqs = computed(() => [
  { q: c('home.faq1Q'), a: c('home.faq1A') },
  { q: c('home.faq2Q'), a: c('home.faq2A') },
  { q: c('home.faq3Q'), a: c('home.faq3A') },
])
</script>

<style scoped>
.hero { padding-top: clamp(48px, 7vw, 96px); padding-bottom: clamp(40px, 6vw, 72px); }
.hero__grid { display: grid; grid-template-columns: 1fr; gap: clamp(32px, 5vw, 64px); align-items: center; }
.hero__title { margin-top: 18px; }
.hero__title-accent {
  background: linear-gradient(100deg, var(--st-accent), color-mix(in srgb, var(--st-accent) 42%, var(--st-ink-strong)));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero__lede { margin-top: 22px; }
.hero__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
.hero__trust { display: flex; flex-wrap: wrap; gap: 8px 10px; margin-top: 30px; }
.hero__trust li { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding-inline: 12px; border-radius: 999px; border: 1px solid var(--st-line); font-size: 0.78rem; color: var(--st-ink-soft); }
.hero__trust svg { color: var(--st-accent); }

.models__head { display: flex; flex-direction: column; gap: 12px; margin-bottom: 26px; }
.models__title { max-width: 20ch; }
.models__lede { max-width: 46ch; }
.models { padding-block: 22px; border-block: 1px solid var(--st-line); }
.models__chip {
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding-inline: 20px;
  border-radius: 999px;
  border: 1px solid var(--st-line);
  background: color-mix(in srgb, var(--st-bg-elev) 60%, transparent);
  font-family: var(--st-font-display);
  font-size: 0.95rem;
  font-weight: 550;
  letter-spacing: -0.01em;
  color: var(--st-ink-soft);
  white-space: nowrap;
}

.sec-head { max-width: 62ch; margin-bottom: clamp(28px, 4vw, 48px); }
.sec-head .st-display-2 { margin-top: 14px; }
.sec-head .st-lede { margin-top: 14px; }

.steps { display: grid; grid-template-columns: 1fr; gap: 16px; }
.step { display: flex; flex-direction: column; gap: 10px; min-height: 240px; }
.step__index { font-family: var(--st-font-display); font-size: 0.78rem; font-weight: 600; letter-spacing: 0.14em; color: var(--st-accent); }
.step__art { margin-top: auto; opacity: 0.9; }
.step__art svg { width: 100%; height: 64px; }
.sa-line { fill: none; stroke: var(--st-line-strong); stroke-width: 1.4; }
.sa-fill { fill: var(--st-accent-soft); stroke: var(--st-accent-line); stroke-width: 1.2; }
.sa-dot { fill: var(--st-accent); }
.sa-wire { stroke: var(--st-accent-line); stroke-width: 1.4; stroke-dasharray: 4 5; }

.bento { display: grid; grid-template-columns: 1fr; gap: 16px; }
.bento__main { display: flex; flex-direction: column; gap: 12px; }
.bento__side { display: flex; flex-direction: column; gap: 10px; }
.bento__code { margin-top: 8px; border-radius: var(--st-radius-md); border: 1px solid var(--st-line); background: var(--st-bg-sunk); overflow: hidden; }
.bento__code-bar { display: flex; gap: 6px; padding: 10px 12px; border-bottom: 1px solid var(--st-line); }
.bento__code-bar i { width: 8px; height: 8px; border-radius: 50%; background: var(--st-line-strong); }
.bento__code pre { margin: 0; padding: 14px 16px; overflow-x: auto; }
.bento__code code { font-family: var(--st-font-mono); font-size: 0.78rem; line-height: 1.75; color: var(--st-ink-soft); white-space: pre; }
.tok-k { color: var(--st-accent); }
.tok-s { color: color-mix(in srgb, var(--st-accent) 70%, #8f9bff); }
.tok-c { color: var(--st-ink-faint); }
.bento__bars { display: flex; align-items: flex-end; gap: 6px; height: 84px; margin-top: 6px; }
.bento__bars span { flex: 1; border-radius: 4px 4px 0 0; background: linear-gradient(180deg, var(--st-accent), color-mix(in srgb, var(--st-accent) 18%, transparent)); transform-origin: bottom; animation: bar-grow var(--st-dur-slow) var(--st-ease) both; }
@keyframes bar-grow { from { transform: scaleY(0.2); opacity: 0.3; } to { transform: scaleY(1); opacity: 1; } }
.bento__flow { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.bento__node { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--st-accent-line); color: var(--st-accent); font-size: 0.75rem; font-weight: 600; }
.bento__node--warn { border-color: rgba(224, 85, 77, 0.5); color: #e0554d; }
.bento__node--ok { border-color: var(--st-accent); background: var(--st-accent-soft); }
.bento__link { flex: 1; height: 1px; background: var(--st-line-strong); }
.bento__link--dash { background: repeating-linear-gradient(90deg, var(--st-accent-line) 0 4px, transparent 4px 9px); }

.faq { display: grid; grid-template-columns: 1fr; gap: 24px; }
.faq__list { display: flex; flex-direction: column; }
.faq__item { border-bottom: 1px solid var(--st-line); }
.faq__q { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 0; cursor: pointer; list-style: none; font-size: 1rem; font-weight: 550; color: var(--st-ink); }
.faq__q::-webkit-details-marker { display: none; }
.faq__q svg { flex-shrink: 0; color: var(--st-ink-faint); transition: transform var(--st-dur) var(--st-ease); }
.faq__item[open] .faq__q svg { transform: rotate(180deg); }
.faq__a { padding: 0 0 20px; font-size: 0.92rem; line-height: 1.75; color: var(--st-ink-soft); max-width: 68ch; }

.cta { position: relative; overflow: hidden; border-radius: var(--st-radius-xl); border: 1px solid var(--st-line); background: var(--st-bg-elev); padding: clamp(32px, 6vw, 72px); text-align: center; box-shadow: var(--st-shadow-md); }
.cta__glow { position: absolute; inset: -40% 20% auto; height: 320px; background: radial-gradient(circle, var(--st-glow), transparent 65%); filter: blur(40px); pointer-events: none; }
.cta__title { position: relative; }
.cta__body { position: relative; margin: 14px auto 0; }
.cta__actions { position: relative; display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 28px; }

@media (min-width: 900px) {
  .hero__grid { grid-template-columns: 1.05fr 0.95fr; }
  .steps { grid-template-columns: repeat(3, 1fr); }
  .bento { grid-template-columns: 1.4fr 1fr; grid-template-rows: auto auto; }
  .bento__main { grid-row: span 2; }
  .faq { grid-template-columns: 0.7fr 1.3fr; align-items: start; }
}
</style>
