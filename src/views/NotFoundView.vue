<template>
  <UserShell>
    <section class="st-section nf">
      <div class="st-shell nf__grid">
        <div class="nf__copy">
          <p class="st-eyebrow st-reveal">{{ c('nf.eyebrow') }}</p>
          <h1 class="st-display-1 nf__code st-reveal" style="--i: 1">404</h1>
          <h2 class="st-display-2 nf__title st-reveal" style="--i: 2">{{ c('nf.title') }}</h2>
          <p class="st-lede nf__lede st-reveal" style="--i: 3">{{ c('nf.lede') }}</p>

          <p class="nf__path st-reveal" style="--i: 4">
            <span class="nf__path-k">{{ c('nf.path') }}</span>
            <code class="st-code">{{ route.fullPath }}</code>
          </p>

          <div class="nf__actions st-reveal" style="--i: 5">
            <router-link to="/dashboard" class="st-btn st-btn--primary st-btn--lg">
              {{ c('nf.toDashboard') }}
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <path d="M4 10h11M11 5.5L15.5 10 11 14.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </router-link>
            <router-link to="/home" class="st-btn st-btn--quiet st-btn--lg">{{ c('nf.toHome') }}</router-link>
            <button type="button" class="st-btn st-btn--ghost st-btn--lg" @click="goBack">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <path d="M15 10H5M9 5.5L4.5 10 9 14.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ c('nf.back') }}
            </button>
          </div>

          <p class="nf__help st-reveal" style="--i: 6">{{ c('nf.help') }}</p>
        </div>

        <!-- 插画：一条断掉的路线 -->
        <div class="nf__art st-reveal" style="--i: 2" aria-hidden="true">
          <svg viewBox="0 0 420 420" class="nf__svg">
            <defs>
              <linearGradient id="nf-glow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="var(--st-brand)" stop-opacity="0.35" />
                <stop offset="100%" stop-color="var(--st-brand)" stop-opacity="0" />
              </linearGradient>
            </defs>

            <circle cx="210" cy="210" r="150" fill="url(#nf-glow)" />
            <circle cx="210" cy="210" r="150" class="nf-ring" />
            <circle cx="210" cy="210" r="112" class="nf-ring nf-ring--faint" />

            <!-- 断掉的路径 -->
            <path class="nf-route" d="M62 320c46-18 64-58 96-64 34-6 34 34 62 34 24 0 34-26 58-46" />
            <path class="nf-route nf-route--dash" d="M278 244c26-20 44-44 82-52" />

            <!-- 路线上的点 -->
            <circle cx="62" cy="320" r="5" class="nf-node" />
            <circle cx="220" cy="290" r="5" class="nf-node" />

            <!-- 丢失的位置：悬浮图钉 -->
            <g class="nf-pin">
              <circle cx="360" cy="192" r="26" class="nf-pin__halo" />
              <path class="nf-pin__body" d="M360 158c-13.3 0-24 10.7-24 24 0 18 24 38 24 38s24-20 24-38c0-13.3-10.7-24-24-24z" />
              <circle cx="360" cy="182" r="8" class="nf-pin__hole" />
            </g>

            <!-- 散落的问号方块 -->
            <rect x="76" y="96" width="34" height="34" rx="10" class="nf-block" />
            <rect x="128" y="60" width="22" height="22" rx="7" class="nf-block nf-block--faint" />
            <rect x="316" y="66" width="28" height="28" rx="9" class="nf-block" />
            <rect x="58" y="212" width="20" height="20" rx="6" class="nf-block nf-block--faint" />
          </svg>
        </div>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import UserShell from '@/components/shell/UserShell.vue'
import { useMiscCopy } from '@/composables/copy/misc'

const router = useRouter()
const route = useRoute()
const { c } = useMiscCopy()

function goBack(): void {
  router.back()
}
</script>

<style scoped>
.nf { padding-top: clamp(56px, 8vw, 120px); padding-bottom: clamp(72px, 10vw, 150px); }
.nf__grid { display: grid; grid-template-columns: 1fr; gap: clamp(32px, 5vw, 72px); align-items: center; }
.nf__copy { max-width: 58ch; }
.nf__code {
  margin-top: 10px;
  background: linear-gradient(100deg, var(--st-brand), color-mix(in srgb, var(--st-brand) 34%, var(--st-ink)));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: -0.06em;
  line-height: 0.86;
}
.nf__title { margin-top: 18px; }
.nf__lede { margin-top: 16px; }

.nf__path {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 22px 0 0;
  min-width: 0;
}
.nf__path-k { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--st-ink-3); }
.nf__path .st-code { max-width: 100%; overflow-wrap: anywhere; }

.nf__actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
.nf__help {
  margin: 26px 0 0;
  font-size: 0.86rem;
  line-height: 1.7;
  color: var(--st-ink-3);
  max-width: 46ch;
}

.nf__art { justify-self: center; width: min(420px, 100%); }
.nf__svg { width: 100%; height: auto; overflow: visible; }

.nf-ring { fill: none; stroke: var(--st-line-2); stroke-width: 1; stroke-dasharray: 2 7; }
.nf-ring--faint { stroke: var(--st-line); }

.nf-route {
  fill: none;
  stroke: var(--st-brand);
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-dasharray: 340;
  stroke-dashoffset: 340;
  animation: nf-draw 1.8s var(--st-ease) 0.2s forwards;
}
.nf-route--dash {
  stroke: var(--st-ink-3);
  stroke-dasharray: 3 9;
  stroke-width: 1.6;
  animation: nf-fade 1.2s var(--st-ease) 1.4s forwards;
  opacity: 0;
}
@keyframes nf-draw { to { stroke-dashoffset: 0; } }
@keyframes nf-fade { to { opacity: 1; } }

.nf-node { fill: var(--st-bg); stroke: var(--st-brand); stroke-width: 2; }

.nf-pin__halo { fill: color-mix(in srgb, var(--st-brand) 14%, transparent); }
.nf-pin__body { fill: var(--st-brand); }
.nf-pin__hole { fill: var(--st-bg); }
.nf-pin { animation: nf-float 5.5s var(--st-ease) infinite alternate; }
@keyframes nf-float {
  from { transform: translateY(-3px); }
  to { transform: translateY(5px); }
}

.nf-block { fill: none; stroke: var(--st-line-2); stroke-width: 1.4; }
.nf-block--faint { stroke: var(--st-line); }

@media (prefers-reduced-motion: reduce) {
  .nf-route, .nf-route--dash, .nf-pin { animation: none; }
  .nf-route { stroke-dashoffset: 0; }
  .nf-route--dash { opacity: 1; }
}

@media (max-width: 640px) {
  .nf__actions { gap: 8px; }
  .nf__actions .st-btn { width: 100%; }
}

@media (max-width: 640px) {
  .nf__path-k { font-size: 12px; }
  .nf__help { font-size: 0.9rem; }
}

@media (min-width: 900px) {
  .nf__grid { grid-template-columns: 1.05fr 0.95fr; }
}
</style>
