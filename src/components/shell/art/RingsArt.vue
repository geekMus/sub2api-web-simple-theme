<template>
  <div class="rg" aria-hidden="true">
    <svg viewBox="0 0 440 440" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="rg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--st-brand)" stop-opacity="0.22" />
          <stop offset="45%" stop-color="var(--st-brand)" stop-opacity="0.06" />
          <stop offset="100%" stop-color="var(--st-brand)" stop-opacity="0" />
        </radialGradient>
        <filter id="rg-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <clipPath v-for="(v, i) in vendors" :id="'rg-chip-clip-' + i" :key="'clip-' + v.name">
          <circle cx="0" cy="0" r="21" />
        </clipPath>
      </defs>

      <circle cx="220" cy="220" r="150" fill="url(#rg-glow)" />

      <g class="rg__rings">
        <circle cx="220" cy="220" r="72" class="rg__ring" />
        <circle cx="220" cy="220" r="116" class="rg__ring" />
        <circle cx="220" cy="220" r="160" class="rg__ring" />
        <circle cx="220" cy="220" r="204" class="rg__ring" />
      </g>

      <g class="rg__waves">
        <circle v-for="(d, i) in [0, 1.6, 3.2]" :key="i" cx="220" cy="220" r="72" class="rg__wave" :style="{ animationDelay: d + 's' }" />
      </g>

      <circle cx="220" cy="220" r="116" class="rg__sweep" />
      <circle cx="220" cy="220" r="160" class="rg__sweep rg__sweep--slow" />

      <circle cx="220" cy="220" r="44" class="rg__core-halo" filter="url(#rg-soft)" />
      <rect x="190" y="190" width="60" height="60" rx="18" class="rg__core" />
      <image v-if="siteLogo" :href="siteLogo" x="202" y="202" width="36" height="36" preserveAspectRatio="xMidYMid meet" class="rg__core-logo" />
      <svg v-else x="202" y="202" width="36" height="36" viewBox="0 0 20 20" class="rg__core-mark">
        <path d="M4 14.2c2.9 0 3.9-1.2 5.4-3.5C10.9 8 12.1 5.8 15 5.8" />
        <path d="M4 16.6c1.9 0 2.8-.8 3.8-2.2" opacity=".45" />
        <circle cx="15.4" cy="5.8" r="1.35" />
      </svg>

      <g v-for="(v, i) in vendors" :key="v.name" :transform="'translate(' + v.x + ',' + v.y + ')'" class="rg__chip" :style="{ animationDelay: (i * 0.7) + 's' }">
        <circle cx="0" cy="0" r="26" class="rg__chip-bg" />
        <image :href="v.icon" x="-17" y="-17" width="34" height="34" preserveAspectRatio="xMidYMid meet" :clip-path="'url(#rg-chip-clip-' + i + ')'" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'
import deepseekHarnessIcon from '@/assets/icons/tools/deepseek-harness.svg'
import geminiIcon from '@/assets/icons/tools/gemini.svg'
import claudeCodeIcon from '@/assets/icons/tools/claude-code.svg'
import codexIcon from '@/assets/icons/tools/codex.svg'

const appStore = useAppStore()
const siteLogo = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))

const vendors = [
  { name: 'DeepSeek Harness', x: 220 - 150, y: 220 - 96, icon: deepseekHarnessIcon },
  { name: 'Gemini', x: 220 + 128, y: 220 - 118, icon: geminiIcon },
  { name: 'Claude Code', x: 220 + 156, y: 220 + 92, icon: claudeCodeIcon },
  { name: 'Codex', x: 220 - 132, y: 220 + 118, icon: codexIcon },
]
</script>

<style scoped>
.rg { width: 100%; }
.rg svg { width: 100%; height: auto; overflow: visible; }

.rg__ring { fill: none; stroke: var(--st-line-2); stroke-width: 1; opacity: 0.55; }
.rg__ring:nth-child(2) { opacity: 0.42; }
.rg__ring:nth-child(3) { opacity: 0.3; }
.rg__ring:nth-child(4) { opacity: 0.18; }

.rg__wave {
  fill: none;
  stroke: var(--st-brand);
  stroke-width: 1.4;
  opacity: 0;
  transform-origin: 220px 220px;
  animation: rg-ripple 5.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
}
@keyframes rg-ripple {
  0% { transform: scale(0.55); opacity: 0.55; }
  70% { opacity: 0.06; }
  100% { transform: scale(2.4); opacity: 0; }
}

.rg__sweep {
  fill: none;
  stroke: var(--st-brand);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-dasharray: 62 668;
  opacity: 0.4;
  transform-origin: 220px 220px;
  animation: rg-sweep 9s linear infinite;
}
.rg__sweep--slow { stroke-dasharray: 84 922; opacity: 0.24; animation-duration: 14s; animation-direction: reverse; }
@keyframes rg-sweep { to { transform: rotate(360deg); } }

.rg__core-halo { fill: var(--st-brand-soft); }
.rg__core { fill: var(--st-bg); stroke: var(--st-line-2); stroke-width: 1; filter: drop-shadow(0 8px 18px rgba(0,0,0,0.10)); }
.rg__core-mark { fill: none; stroke: var(--st-ink); stroke-width: 2; stroke-linecap: round; }
.rg__core-logo { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.08)); }

.rg__chip {
  animation: rg-float 6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
  transform-box: fill-box;
  transform-origin: center;
}
.rg__chip-bg {
  fill: var(--st-bg);
  stroke: var(--st-line);
  stroke-width: 1;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.18));
}
@keyframes rg-float {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .rg__wave, .rg__chip, .rg__sweep { animation: none; }
  .rg__wave { opacity: 0; }
}
</style>
