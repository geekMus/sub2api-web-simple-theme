<template>
  <div v-if="hasHomeContent" class="st-root">
    <iframe v-if="isHomeContentUrl" :src="homeContent.trim()" class="h-screen w-full border-0" title="home" />
    <div v-else v-html="homeContent"></div>
  </div>

  <UserShell v-else-if="compactHomeEnabled">
    <section class="st-section">
      <div class="st-shell compact" data-testid="compact-home">
        <p class="st-eyebrow">{{ siteName }}</p>
        <h1 class="st-display-1 compact__t">{{ siteName }}</h1>
        <p class="st-lede compact__b">{{ siteSubtitle }}</p>
        <div class="compact__a">
          <router-link :to="compactTarget" class="st-btn st-btn--primary st-btn--lg">
            {{ isAuthenticated ? '进入控制台' : '登录' }}
          </router-link>
          <router-link v-if="showModelPlazaEntry" to="/model-plaza" class="st-btn st-btn--quiet st-btn--lg">看看模型</router-link>
        </div>
      </div>
    </section>
  </UserShell>

  <UserShell v-else>
    <!-- ============ HERO ============ -->
    <section class="hero terminal-container">
      <div class="st-shell">
        <div class="hero__copy">
          <p class="st-eyebrow st-reveal">AI 模型统一入口</p>
          <h1 class="st-display-1 hero__title st-reveal" style="--i: 1">
            一个接口<br /><em>调用所有模型</em>
          </h1>
          <p class="st-lede hero__lede st-reveal" style="--i: 2">
            Claude、GPT、Gemini、Grok 都在同一个地址后面。改一个参数就换模型，
            代码不用重写，账单只有一份。
          </p>
          <div class="hero__cta st-reveal" style="--i: 3">
            <router-link :to="primaryTarget" class="st-btn st-btn--primary st-btn--lg">
              {{ isAuthenticated ? '进入控制台' : '免费开始' }}
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </router-link>
            <router-link v-if="showModelPlazaEntry" to="/model-plaza" class="st-btn st-btn--quiet st-btn--lg">看看模型</router-link>
          </div>
          <p class="hero__note st-reveal" style="--i: 4">无需信用卡 · 注册即用 · 随时停用</p>
        </div>

        <div class="hero__shot st-reveal" style="--i: 2">
          <div class="hero__glow" aria-hidden="true"></div>
          <MockApp />
          <div class="hero__float hero__float--a">
            <span class="hero__float-k">首字延迟</span>
            <span class="hero__float-v">312<i>ms</i></span>
          </div>
          <div class="hero__float hero__float--b">
            <span class="hero__dot"></span>
            <span>4 个渠道在线</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 模型 ============ -->
    <section class="st-section--tight">
      <div class="st-shell">
        <div class="mk-head">
          <p class="st-eyebrow">已接入的主流模型</p>
          <router-link v-if="showModelPlazaEntry" to="/model-plaza" class="mk-more">全部模型 →</router-link>
        </div>
        <ModelGrid />
      </div>
    </section>

    <!-- ============ 特性 1：代码 ============ -->
    <section class="st-section">
      <div class="st-shell feat">
        <div class="feat__copy">
          <p class="st-eyebrow">接入成本</p>
          <h2 class="st-display-2 feat__t">换模型，<br />不换代码</h2>
          <p class="st-lede feat__b">
            协议与官方保持一致：OpenAI、Anthropic、Gemini 三套格式都能直连。
            迁移只是把 baseURL 指过来，请求体一个字都不用改。
          </p>
          <ul class="feat__list">
            <li><span>01</span>支持官方 SDK、curl、Claude Code、Cursor</li>
            <li><span>02</span>流式响应、工具调用、多模态原样透传</li>
            <li><span>03</span>失败自动切换上游，业务层无感</li>
          </ul>
        </div>
        <div class="feat__shot">
          <MockCode />
        </div>
      </div>
    </section>

    <!-- ============ 特性 2：用量 ============ -->
    <section class="st-section">
      <div class="st-shell feat feat--rev">
        <div class="feat__copy">
          <p class="st-eyebrow">账单</p>
          <h2 class="st-display-2 feat__t">每一分钱，<br />都查得到出处</h2>
          <p class="st-lede feat__b">
            按 token 计费，逐条可查。哪个模型吃了多少、哪天用得最多，
            打开页面就能看到，没有看不懂的套餐包。
          </p>
          <ul class="feat__list">
            <li><span>01</span>按天 / 按模型 / 按通行证三种视角</li>
            <li><span>02</span>输入输出分别计价，倍率透明</li>
            <li><span>03</span>余额不足自动拦截，不会突然扣爆</li>
          </ul>
        </div>
        <div class="feat__shot">
          <MockUsage />
        </div>
      </div>
    </section>

    <!-- ============ Bento ============ -->
    <section class="st-section">
      <div class="st-shell">
        <header class="sh">
          <p class="st-eyebrow">日常使用</p>
          <h2 class="st-display-2">该有的都有，<br />不该有的没有</h2>
        </header>

        <div class="bento">
          <article class="st-card st-card--pad bento__keys">
            <div class="bento__h">
              <h3 class="st-display-4">通行证</h3>
              <p class="st-body">按项目分开建，随时停用或轮换，一把泄露不影响其它。</p>
            </div>
            <MockKeys />
          </article>

          <article class="st-card st-card--pad bento__stat">
            <span class="bento__k">可用率</span>
            <span class="bento__v">99.9<i>%</i></span>
            <span class="bento__d">过去 30 天</span>
          </article>

          <article class="st-card st-card--pad bento__stat">
            <span class="bento__k">平均首字延迟</span>
            <span class="bento__v">312<i>ms</i></span>
            <span class="bento__d">全渠道加权</span>
          </article>

          <article class="st-card st-card--pad bento__wide">
            <div class="bento__h">
              <h3 class="st-display-4">上游抖动自动绕行</h3>
              <p class="st-body">一个渠道失败就换下一个，你基本感受不到它发生过。</p>
            </div>
            <div class="flow" aria-hidden="true">
              <span class="flow__n">请求</span>
              <span class="flow__l"></span>
              <span class="flow__n flow__n--x">A ×</span>
              <span class="flow__l flow__l--d"></span>
              <span class="flow__n flow__n--ok">B ✓</span>
              <span class="flow__l"></span>
              <span class="flow__n">200</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ============ 数字带 ============ -->
    <section class="st-section--tight">
      <div class="st-shell">
        <div class="nums">
          <div class="nums__i"><span class="nums__v">3</span><span class="nums__k">套官方协议<br />OpenAI / Anthropic / Gemini</span></div>
          <div class="nums__i"><span class="nums__v">0</span><span class="nums__k">行业务代码改动<br />换 baseURL 即用</span></div>
          <div class="nums__i"><span class="nums__v">1</span><span class="nums__k">份账单<br />所有模型合并结算</span></div>
        </div>
      </div>
    </section>

    <!-- ============ FAQ ============ -->
    <section class="st-section">
      <div class="st-shell faq">
        <header class="sh sh--sticky">
          <p class="st-eyebrow">常见问题</p>
          <h2 class="st-display-2">你可能想知道</h2>
        </header>
        <div class="faq__list">
          <details v-for="f in faqs" :key="f.q" class="faq__item">
            <summary class="faq__q">
              <span>{{ f.q }}</span>
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </summary>
            <p class="faq__a">{{ f.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- ============ CTA ============ -->
    <section class="st-section--tight">
      <div class="st-shell">
        <div class="cta">
          <div class="cta__copy">
            <h2 class="st-display-2 cta__t">第一条请求，<br />三十秒之后</h2>
            <p class="st-lede cta__b">注册后即可查看实时模型与价格，随时充值、随时停用。</p>
            <div class="cta__a">
              <router-link :to="primaryTarget" class="st-btn st-btn--primary st-btn--lg">{{ isAuthenticated ? '进入控制台' : '免费开始' }}</router-link>
              <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="st-btn st-btn--quiet st-btn--lg">看文档</a>
            </div>
          </div>
          <div class="cta__art" aria-hidden="true">
            <div class="cta__ring"></div>
            <div class="cta__ring cta__ring--2"></div>
            <span class="cta__pill">Claude</span>
            <span class="cta__pill cta__pill--2">GPT</span>
            <span class="cta__pill cta__pill--3">Gemini</span>
            <span class="cta__pill cta__pill--4">Grok</span>
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
import MockApp from '@/components/shell/art/MockApp.vue'
import MockCode from '@/components/shell/art/MockCode.vue'
import MockUsage from '@/components/shell/art/MockUsage.vue'
import MockKeys from '@/components/shell/art/MockKeys.vue'
import ModelGrid from '@/components/shell/art/ModelGrid.vue'
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
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || '')
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

const faqs = [
  { q: '和直接用官方 API 有什么区别？', a: '协议完全兼容，原来的代码一行都不用改。区别是额度、模型和渠道在一个账户里统一管理，付款也只有一份。' },
  { q: '计费怎么算？', a: '按实际消耗的 token 计费，不同模型倍率不同。用量页面上的数字就是对账依据，可以按天、按模型查看。' },
  { q: '上游不稳定怎么办？', a: '检测到失败会自动切换其它可用渠道重试，业务层通常感知不到。渠道状态页可以看到实时健康度。' },
  { q: '数据会经过你们吗？', a: '请求按需转发到上游，不做长期留存。具体范围和保留策略见使用政策与隐私说明。' },
]
</script>

<style scoped>
.compact { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; padding-block: clamp(48px, 10vw, 120px); }
.compact__t { margin: 0; }
.compact__b { margin: 0; }
.compact__a { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }

/* ---------- hero ---------- */
.hero { padding-block: clamp(40px, 5vw, 68px) clamp(20px, 2.4vw, 32px); }
.hero .st-shell { display: grid; grid-template-columns: 1fr; gap: clamp(32px, 4vw, 48px); align-items: center; }
.hero__title { margin-top: 14px; }
.hero__title em {
  font-style: normal;
  display: inline-block;
  white-space: nowrap;
  color: var(--st-brand-text);
}
.hero__lede { margin-top: 18px; max-width: 44ch; }
.hero__cta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px; }
.hero__note { margin-top: 14px; font-size: 0.78rem; color: var(--st-ink-3); }

.hero__shot { position: relative; }
.hero__glow {
  position: absolute; inset: -8% -6% -12%; z-index: -1;
  background: radial-gradient(60% 60% at 50% 40%, var(--st-brand-soft), transparent 70%);
  filter: blur(30px);
}
.hero__float {
  position: absolute; display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 10px;
  border: 1px solid var(--st-line); background: var(--st-bg);
  box-shadow: var(--st-shadow-2);
  font-size: 0.76rem; color: var(--st-ink-2);
}
.hero__float--a { right: -14px; top: 12%; flex-direction: column; align-items: flex-start; gap: 2px; }
.hero__float--b { left: -18px; bottom: 14%; }
.hero__float-k { font-size: 0.68rem; color: var(--st-ink-3); }
.hero__float-v { font-family: var(--st-font-display); font-size: 1.1rem; font-weight: 600; letter-spacing: -0.02em; color: var(--st-ink); font-variant-numeric: tabular-nums; }
.hero__float-v i { font-style: normal; font-size: 0.7rem; color: var(--st-ink-3); margin-left: 1px; }
.hero__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--st-ok); box-shadow: 0 0 0 3px var(--st-ok-soft); }

/* ---------- 模型 ---------- */
.mk-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.mk-more { font-size: 0.8rem; color: var(--st-ink-2); text-decoration: none; transition: color var(--st-t) var(--st-ease); }
.mk-more:hover { color: var(--st-brand); }

/* ---------- 特性 ---------- */
.feat { display: grid; grid-template-columns: 1fr; gap: clamp(28px, 4vw, 64px); align-items: center; }
.feat__t { margin-top: 12px; }
.feat__b { margin-top: 16px; }
.feat__list { margin: 24px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; }
.feat__list li { display: flex; gap: 12px; padding: 11px 0; border-top: 1px solid var(--st-line); font-size: 0.88rem; color: var(--st-ink-2); }
.feat__list li span { font-family: var(--st-font-mono); font-size: 0.72rem; color: var(--st-brand); padding-top: 2px; }
.feat__shot { min-width: 0; width: 100%; justify-self: stretch; }
.feat__shot > * { width: 100%; }

/* ---------- bento ---------- */
.sh { max-width: 56ch; margin-bottom: clamp(24px, 3vw, 36px); }
.sh .st-display-2 { margin-top: 12px; }
.bento { display: grid; grid-template-columns: 1fr; gap: 12px; }
.bento__keys { display: flex; flex-direction: column; gap: 14px; }
.bento__h { display: flex; flex-direction: column; gap: 6px; }
.bento__stat { display: flex; flex-direction: column; gap: 4px; justify-content: center; }
.bento__k { font-size: 0.76rem; color: var(--st-ink-3); }
.bento__v { font-family: var(--st-font-display); font-size: clamp(2rem, 3.4vw, 2.6rem); font-weight: 600; letter-spacing: -0.04em; color: var(--st-ink); line-height: 1; font-variant-numeric: tabular-nums; }
.bento__v i { font-style: normal; font-size: 0.9rem; font-weight: 500; color: var(--st-ink-3); margin-left: 2px; }
.bento__d { font-size: 0.72rem; color: var(--st-ink-3); }
.bento__wide { display: flex; flex-direction: column; gap: 16px; }

.flow { display: flex; align-items: center; gap: 8px; }
.flow__n { padding: 6px 10px; border-radius: 7px; border: 1px solid var(--st-line-2); font-size: 0.74rem; color: var(--st-ink-2); white-space: nowrap; }
.flow__n--x { border-color: transparent; background: var(--st-danger-soft); color: var(--st-danger); }
.flow__n--ok { border-color: transparent; background: var(--st-ok-soft); color: var(--st-ok); }
.flow__l { flex: 1; height: 1px; background: var(--st-line-2); min-width: 12px; }
.flow__l--d { background: repeating-linear-gradient(90deg, var(--st-line-2) 0 3px, transparent 3px 7px); }

/* ---------- 数字带 ---------- */
.nums { display: grid; grid-template-columns: 1fr; gap: 1px; background: var(--st-line); border-block: 1px solid var(--st-line); }
.nums__i { display: flex; align-items: baseline; gap: 14px; padding: 22px 4px; background: var(--st-bg); }
.nums__v { font-family: var(--st-font-display); font-size: clamp(1.8rem, 2.8vw, 2.3rem); font-weight: 600; letter-spacing: -0.04em; color: var(--st-ink); line-height: 1; }
.nums__k { font-size: 0.82rem; line-height: 1.5; color: var(--st-ink-3); }

/* ---------- FAQ ---------- */
.faq { display: grid; grid-template-columns: 1fr; gap: 8px 56px; align-items: start; }
.faq__list { border-top: 1px solid var(--st-line); }
.faq__item { border-bottom: 1px solid var(--st-line); }
.faq__q { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 2px; cursor: pointer; list-style: none; font-size: 0.94rem; font-weight: 500; color: var(--st-ink); }
.faq__q::-webkit-details-marker { display: none; }
.faq__q svg { flex-shrink: 0; color: var(--st-ink-3); transition: transform var(--st-t) var(--st-ease); }
.faq__item[open] .faq__q svg { transform: rotate(180deg); }
.faq__a { padding: 0 40px 18px 2px; font-size: 0.9rem; line-height: 1.75; color: var(--st-ink-2); max-width: 66ch; }

/* ---------- CTA ---------- */
.cta { position: relative; overflow: hidden; border-radius: var(--st-r-xl); border: 1px solid var(--st-line); background: var(--st-bg-soft); padding: clamp(28px, 4vw, 52px); display: grid; grid-template-columns: 1fr; gap: 24px; align-items: center; }
.cta__t { max-width: 18ch; }
.cta__b { margin-top: 12px; }
.cta__a { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
.cta__art { position: relative; height: 180px; }
.cta__ring { position: absolute; left: 50%; top: 50%; width: 150px; height: 150px; margin: -75px 0 0 -75px; border-radius: 50%; border: 1px solid var(--st-line-2); }
.cta__ring--2 { width: 220px; height: 220px; margin: -110px 0 0 -110px; border-style: dashed; opacity: 0.6; }
.cta__pill { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) translate(-78px, -46px); padding: 5px 10px; border-radius: 7px; border: 1px solid var(--st-line); background: var(--st-bg); font-size: 0.74rem; color: var(--st-ink-2); box-shadow: var(--st-shadow-1); }
.cta__pill--2 { transform: translate(-50%, -50%) translate(64px, -58px); }
.cta__pill--3 { transform: translate(-50%, -50%) translate(-96px, 40px); }
.cta__pill--4 { transform: translate(-50%, -50%) translate(74px, 46px); }

@media (min-width: 900px) {
  .hero .st-shell { grid-template-columns: 0.92fr 1.08fr; }
  .feat { grid-template-columns: 0.85fr 1.15fr; }
  .feat--rev { grid-template-columns: 1.2fr 0.8fr; }
  .feat--rev .feat__copy { order: 2; }
  .feat--rev .feat__shot { order: 1; }
  .bento { grid-template-columns: 1.25fr 1fr 1fr; grid-template-rows: auto auto; }
  .bento__keys { grid-row: span 2; }
  .bento__wide { grid-column: 2 / span 2; }
  .nums { grid-template-columns: repeat(3, 1fr); }
  .nums__i { padding: 26px 18px; flex-direction: column; align-items: flex-start; gap: 8px; }
  .faq { grid-template-columns: 0.6fr 1.4fr; }
  .cta { grid-template-columns: 1.2fr 0.8fr; }
}
</style>
