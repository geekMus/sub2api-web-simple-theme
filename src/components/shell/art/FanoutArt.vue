<template>
  <div class="fo" aria-hidden="true">
    <svg viewBox="0 0 700 420" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="fo-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--st-brand)" stop-opacity="0.20" />
          <stop offset="58%" stop-color="var(--st-brand)" stop-opacity="0.05" />
          <stop offset="100%" stop-color="var(--st-brand)" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="fo-wire" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="var(--st-brand)" stop-opacity="0.95" />
          <stop offset="55%" stop-color="var(--st-brand)" stop-opacity="0.55" />
          <stop offset="100%" stop-color="var(--st-line-2)" stop-opacity="0.85" />
        </linearGradient>
        <filter id="fo-card-shadow" x="-25%" y="-30%" width="150%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="11" flood-color="rgba(0,0,0,0.13)" />
        </filter>
        <filter id="fo-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      <!-- 用户节点：一枚「你」的头像 -->
      <g class="fo__user">
        <circle cx="62" cy="210" r="38" class="fo__user-tick" />
        <circle cx="62" cy="210" r="30" class="fo__user-avatar" />
        <clipPath id="fo-avatar-clip"><circle cx="62" cy="210" r="30" /></clipPath>
        <g clip-path="url(#fo-avatar-clip)">
          <circle cx="62" cy="199" r="9.5" class="fo__user-head" />
          <path d="M38 246c3.2-13.6 12.4-21 24-21s20.8 7.4 24 21z" class="fo__user-body" />
        </g>
        <circle cx="62" cy="210" r="30" class="fo__user-ring" />
        <circle cx="85" cy="187" r="5.4" class="fo__user-badge" />
        <path d="M82.6 187l1.7 1.8 3-3.4" class="fo__user-badge-mark" />
        <text x="62" y="270" text-anchor="middle" class="fo__micro">YOU</text>
      </g>

      <!-- 用户 → 网关 -->
      <path d="M92 210 H186" class="fo__wire fo__wire--main" />
      <circle cx="138" cy="210" r="3" class="fo__pulse" />

      <!-- 网关 -->
      <g class="fo__hub">
        <circle cx="250" cy="210" r="112" fill="url(#fo-halo)" />
        <circle cx="250" cy="210" r="86" class="fo__orbit" />
        <circle cx="250" cy="210" r="86" class="fo__orbit-sweep" />
        <circle cx="250" cy="210" r="62" class="fo__orbit fo__orbit--inner" />
        <rect x="204" y="164" width="92" height="92" rx="26" class="fo__hub-card" />
        <image v-if="siteLogo" :href="siteLogo" x="226" y="186" width="48" height="48" preserveAspectRatio="xMidYMid meet" class="fo__hub-logo" />
        <svg v-else x="226" y="186" width="48" height="48" viewBox="0 0 20 20" class="fo__hub-mark">
          <path d="M4 14.2c2.9 0 3.9-1.2 5.4-3.5C10.9 8 12.1 5.8 15 5.8" />
          <path d="M4 16.6c1.9 0 2.8-.8 3.8-2.2" opacity=".45" />
          <circle cx="15.4" cy="5.8" r="1.35" />
        </svg>
        <circle cx="283" cy="177" r="4.6" class="fo__hub-status" />
      </g>

      <!-- 网关 → 工具（渐变虚线 + 呼吸） -->
      <g class="fo__wires">
        <path v-for="item in tools" :key="'base' + item.name" :d="item.path" class="fo__wire fo__wire--base" />
        <path
          v-for="(item, i) in tools"
          :id="'fo-wire-' + i"
          :key="'w' + item.name"
          :d="item.path"
          class="fo__wire fo__wire--flow"
          :style="{ animationDelay: (i * 0.6) + 's' }"
        />
        <circle v-for="item in tools" :key="'port' + item.name" :cx="HUB_RIGHT" :cy="HUB_MID" r="3.4" class="fo__port" />
        <circle v-for="(item, i) in tools" :key="'p' + item.name" r="3" class="fo__packet">
          <animateMotion :dur="3.6 + i * 0.4 + 's'" :begin="i * 0.7 + 's'" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
            <mpath :href="'#fo-wire-' + i" />
          </animateMotion>
        </circle>
      </g>

      <!-- 工具卡片 -->
      <g v-for="(item, i) in tools" :key="item.name" :transform="'translate(' + CARD_X + ', ' + item.y + ')'" class="fo__cardgroup">
        <rect width="248" height="78" rx="17" class="fo__card" filter="url(#fo-card-shadow)" />
        <rect x="17" y="17" width="44" height="44" rx="12" class="fo__icon-tile" />
        <image :href="item.icon" x="23" y="23" width="32" height="32" preserveAspectRatio="xMidYMid meet" />
        <text x="73" y="34" class="fo__label">{{ item.name }}</text>
        <text x="73" y="53" class="fo__meta">{{ item.meta }}</text>
        <circle cx="226" cy="39" r="2.6" class="fo__status-dot" :style="{ animationDelay: (i * 0.5) + 's' }" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'
import codexIcon from '@/assets/icons/tools/codex.svg'
import workbuddyIcon from '@/assets/icons/tools/workbuddy.svg'
import deepseekHarnessIcon from '@/assets/icons/tools/deepseek-harness.svg'
import claudeCodeIcon from '@/assets/icons/tools/claude-code.svg'

const appStore = useAppStore()
const siteLogo = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))

const CARD_X = 432
const ROWS = [10, 116, 222, 328]
const HUB_RIGHT = 296
const HUB_MID = 210

const tools = [
  { name: 'Codex', meta: 'OPENAI · CLI', icon: codexIcon, y: ROWS[0], path: wire(ROWS[0]) },
  { name: 'Work Buddy', meta: 'TENCENT · DESKTOP', icon: workbuddyIcon, y: ROWS[1], path: wire(ROWS[1]) },
  { name: 'DeepSeek Harness', meta: 'DEEPSEEK · AGENT', icon: deepseekHarnessIcon, y: ROWS[2], path: wire(ROWS[2]) },
  { name: 'Claude Code', meta: 'ANTHROPIC · CLI', icon: claudeCodeIcon, y: ROWS[3], path: wire(ROWS[3]) },
]

/** 每条线先水平离开网关，再弯向卡片中线：避免多条曲线在起点附近交叉。 */
function wire(cardY: number): string {
  const endY = cardY + 39
  const endX = CARD_X - 8
  const bend = HUB_RIGHT + 62
  return `M${HUB_RIGHT} ${HUB_MID} C ${bend} ${HUB_MID}, ${bend} ${endY}, ${endX} ${endY}`
}
</script>

<style scoped>
.fo { width: 100%; }
.fo svg { display: block; width: 100%; height: auto; overflow: visible; }

.fo__user-tick {
  fill: none;
  stroke: var(--st-line);
  stroke-width: 1;
  stroke-dasharray: 2 7;
  transform-origin: 62px 210px;
  animation: fo-spin-slow 26s linear infinite;
}
@keyframes fo-spin-slow { to { transform: rotate(360deg); } }
.fo__user-avatar { fill: var(--st-bg-soft); }
.fo__user-head { fill: var(--st-ink-2); }
.fo__user-body { fill: var(--st-ink-2); opacity: 0.85; }
.fo__user-ring { fill: none; stroke: var(--st-line-2); stroke-width: 1.2; }
.fo__user-badge { fill: var(--st-brand); stroke: var(--st-bg); stroke-width: 2; }
.fo__user-badge-mark { fill: none; stroke: var(--st-brand-ink); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.fo__micro { font-family: var(--st-font-mono); font-size: 9px; letter-spacing: 0.14em; fill: var(--st-ink-3); }

.fo__wire { fill: none; stroke-linecap: round; }
.fo__wire--main { stroke: var(--st-line-2); stroke-width: 1.4; }
.fo__wire--base {
  stroke: url(#fo-wire);
  stroke-width: 1.6;
  opacity: 0.55;
}
.fo__wire--flow {
  stroke: var(--st-brand);
  stroke-width: 1.6;
  stroke-dasharray: 2 26;
  stroke-linecap: round;
  opacity: 0.85;
  animation: fo-flow 3.4s linear infinite;
}
.fo__packet { fill: var(--st-brand); opacity: 0.9; }
.fo__port { fill: var(--st-brand); }
@keyframes fo-flow { to { stroke-dashoffset: -96; } }

.fo__pulse { fill: var(--st-brand); filter: drop-shadow(0 0 6px var(--st-brand)); animation: fo-travel 3.4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
@keyframes fo-travel {
  0% { transform: translateX(0); opacity: 0; }
  12% { opacity: 1; }
  88% { opacity: 1; }
  100% { transform: translateX(48px); opacity: 0; }
}

.fo__orbit { fill: none; stroke: var(--st-line-2); stroke-width: 1; opacity: 0.42; }
.fo__orbit--inner { opacity: 0.26; stroke-dasharray: 2 9; }
.fo__orbit-sweep {
  fill: none;
  stroke: var(--st-brand);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-dasharray: 46 494;
  opacity: 0.55;
  transform-origin: 250px 210px;
  animation: fo-sweep 6.5s linear infinite;
}
@keyframes fo-sweep { to { transform: rotate(360deg); } }
.fo__hub-card {
  fill: var(--st-bg);
  stroke: var(--st-line-2);
  stroke-width: 1;
  filter: drop-shadow(0 10px 24px rgba(0,0,0,0.12));
}
.fo__hub-mark { fill: none; stroke: var(--st-ink); stroke-width: 1.7; stroke-linecap: round; }
.fo__hub-logo { filter: drop-shadow(0 2px 5px rgba(0,0,0,0.10)); }
.fo__hub-status { fill: var(--st-brand); filter: drop-shadow(0 0 6px var(--st-brand)); }
.fo__hub-name { font-family: var(--st-font-mono); font-size: 9px; letter-spacing: 0.13em; fill: var(--st-ink-3); text-transform: uppercase; }

.fo__card { fill: var(--st-bg); stroke: var(--st-line); stroke-width: 1; transition: fill var(--st-t) var(--st-ease); }
.fo__cardgroup:hover .fo__card { fill: var(--st-bg-soft); }
.fo__icon-tile { fill: var(--st-bg-soft); stroke: var(--st-line); stroke-width: 1; }
.fo__label { font-family: var(--st-font-display); font-size: 14.5px; font-weight: 600; letter-spacing: -0.015em; fill: var(--st-ink); }
.fo__meta { font-family: var(--st-font-mono); font-size: 8.6px; letter-spacing: 0.09em; fill: var(--st-ink-3); }
.fo__status-dot { fill: var(--st-brand); animation: fo-pulse 2.8s ease-in-out infinite; }
@keyframes fo-pulse { 0%, 100% { opacity: 0.32; } 50% { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .fo__wire--flow, .fo__pulse, .fo__status-dot, .fo__orbit-sweep, .fo__user-tick { animation: none; }
  .fo__pulse { opacity: 1; }
}
</style>