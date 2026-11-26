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
          <!-- 1. 协议：三枚真实厂商标签 -->
          <div v-if="i === 0" class="mini" aria-hidden="true">
            <span class="mini__chip"><i class="mini__dot mini__dot--a"></i>Anthropic</span>
            <span class="mini__chip"><i class="mini__dot mini__dot--o"></i>OpenAI</span>
            <span class="mini__chip"><i class="mini__dot mini__dot--g"></i>Gemini</span>
          </div>

          <!-- 2. 计费：迷你柱状 + 单价 -->
          <div v-else-if="i === 1" class="mini mini--chart" aria-hidden="true">
            <span v-for="(h, j) in [30, 52, 40, 68, 58, 84, 64]" :key="j" :style="{ height: h + '%' }" :class="{ 'is-on': j === 5 }"></span>
            <em>$0.0432</em>
          </div>

          <!-- 3. 容灾：请求 → 失败 → 切换 -->
          <div v-else class="mini mini--flow" aria-hidden="true">
            <span class="mini__req">请求</span>
            <span class="mini__line"></span>
            <span class="mini__node mini__node--bad">A</span>
            <span class="mini__line mini__line--dash"></span>
            <span class="mini__node mini__node--ok">B</span>
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

/* ---------- 2. 服务带：浅底全宽 + 三格迷你界面 ---------- */
.strip {
  border-block: 1px solid var(--st-line);
  background: var(--st-bg-soft);
  padding-block: clamp(32px, 3.6vw, 52px);
}
.strip__grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
.strip__cell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 18px 20px;
  border: 1px solid var(--st-line);
  border-radius: var(--st-r-md);
  background: var(--st-bg);
  transition: border-color var(--st-t) var(--st-ease), transform var(--st-t) var(--st-ease);
}
.strip__cell:hover { border-color: var(--st-line-2); transform: translateY(-1px); }

/* 迷你界面通用容器 */
.mini {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 62px;
  padding: 0 12px;
  border-radius: var(--st-r-sm);
  border: 1px solid var(--st-line);
  background: var(--st-bg-soft);
  overflow: hidden;
}
.mini__chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding-inline: 8px;
  border-radius: 6px;
  border: 1px solid var(--st-line);
  background: var(--st-bg);
  font-size: 10.5px;
  font-weight: 500;
  color: var(--st-ink-2);
  white-space: nowrap;
}
.mini__dot { width: 5px; height: 5px; border-radius: 50%; }
.mini__dot--a { background: #d97757; }
.mini__dot--o { background: #10a37f; }
.mini__dot--g { background: #4285f4; }

.mini--chart { align-items: flex-end; gap: 4px; padding: 10px 12px 10px 12px; }
.mini--chart span {
  flex: 1 1 0;
  min-width: 0;
  border-radius: 3px 3px 1px 1px;
  background: color-mix(in srgb, var(--st-ink) 14%, transparent);
}
.mini--chart span.is-on { background: var(--st-brand); }
.mini--chart em {
  align-self: center;
  margin-left: 8px;
  flex: 0 0 auto;
  font-style: normal;
  font-family: var(--st-font-mono);
  font-size: 10px;
  color: var(--st-ink-3);
  white-space: nowrap;
}

.mini--flow { gap: 6px; }
.mini__req { font-size: 10.5px; color: var(--st-ink-3); white-space: nowrap; }
.mini__line { flex: 1; height: 1px; background: var(--st-line-2); min-width: 10px; }
.mini__line--dash { background: repeating-linear-gradient(90deg, var(--st-line-2) 0 3px, transparent 3px 6px); }
.mini__node {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  font-family: var(--st-font-mono);
}
.mini__node--bad { background: var(--st-danger-soft); color: var(--st-danger); }
.mini__node--ok { background: var(--st-brand); color: var(--st-brand-ink); }

.strip__t { margin: 0; font-family: var(--st-font-display); font-size: 1rem; font-weight: 600; letter-spacing: -0.02em; color: var(--st-ink); }
.strip__b { margin: 0; font-size: 0.84rem; line-height: 1.5; color: var(--st-ink-3); }

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
  .strip__grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .duo { grid-template-columns: 0.62fr 1fr; }
  .duo--rev { grid-template-columns: 1fr 0.62fr; }
  .duo--rev .duo__copy { order: 2; }
  .duo--rev .duo__art { order: 1; }
}
</style>
