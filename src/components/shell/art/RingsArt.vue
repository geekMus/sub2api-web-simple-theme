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
      </defs>

      <!-- 中心光晕 -->
      <circle cx="220" cy="220" r="150" fill="url(#rg-glow)" />

      <!-- 静态同心圆 -->
      <g class="rg__rings">
        <circle cx="220" cy="220" r="72" class="rg__ring" />
        <circle cx="220" cy="220" r="116" class="rg__ring" />
        <circle cx="220" cy="220" r="160" class="rg__ring" />
        <circle cx="220" cy="220" r="204" class="rg__ring" />
      </g>

      <!-- 向外扩散的波纹 -->
      <g class="rg__waves">
        <circle v-for="(d, i) in [0, 1.6, 3.2]" :key="i" cx="220" cy="220" r="72" class="rg__wave" :style="{ animationDelay: d + 's' }" />
      </g>

      <!-- 中心：站点标识 -->
      <circle cx="220" cy="220" r="44" class="rg__core-halo" filter="url(#rg-soft)" />
      <rect x="190" y="190" width="60" height="60" rx="18" class="rg__core" />
      <path d="M205 234c8.6 0 11.4-4 16-10.6 4.3-6 7.6-11.8 16.4-11.8" class="rg__core-mark" />
      <circle cx="241" cy="209" r="2.8" class="rg__core-dot" />

      <!-- 厂商图标（随机角度/半径） -->
      <g v-for="(v, i) in vendors" :key="v.name" :transform="'translate(' + v.x + ',' + v.y + ')'" class="rg__chip" :style="{ animationDelay: (i * 0.7) + 's' }">
        <circle cx="0" cy="0" r="22" class="rg__chip-bg" />
        <path :d="v.icon" class="rg__chip-icon" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
/** 厂商图标：抽象几何，不直接使用官方 logo 资源 */
const vendors = [
  // DeepSeek：波浪
  { name: 'DeepSeek', x: 220 - 150, y: 220 - 96, icon: 'M-9 3c4.5 0 5.6-3.4 9-3.4s4.5 3.4 9 3.4' },
  // Gemini：四角星
  { name: 'Gemini', x: 220 + 128, y: 220 - 118, icon: 'M0 -10L2.4 -2.4L10 0L2.4 2.4L0 10L-2.4 2.4L-10 0L-2.4 -2.4Z' },
  // Claude Code：星芒
  { name: 'Claude Code', x: 220 + 156, y: 220 + 92, icon: 'M0 -10V10M-8.6 -5L8.6 5M8.6 -5L-8.6 5' },
  // Codex：六边形
  { name: 'Codex', x: 220 - 132, y: 220 + 118, icon: 'M-8 -4.6L0 -9L8 -4.6V4.6L0 9L-8 4.6Z' },
]
</script>

<style scoped>
.rg { width: 100%; }
.rg svg { width: 100%; height: auto; overflow: visible; }

.rg__ring {
  fill: none;
  stroke: var(--st-line-2);
  stroke-width: 1;
  opacity: 0.55;
}
.rg__ring:nth-child(2) { opacity: 0.42; }
.rg__ring:nth-child(3) { opacity: 0.3; }
.rg__ring:nth-child(4) { opacity: 0.18; }

/* 波纹：从内向外扩散并淡出 */
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

.rg__core-halo { fill: var(--st-brand-soft); }
.rg__core { fill: var(--st-bg); stroke: var(--st-line-2); stroke-width: 1; }
.rg__core-mark { fill: none; stroke: var(--st-ink); stroke-width: 2.4; stroke-linecap: round; }
.rg__core-dot { fill: var(--st-ink); }

/* 厂商图标：玻璃小圆片 + 轻微浮动 */
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
.rg__chip-icon {
  fill: none;
  stroke: var(--st-ink-2);
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
@keyframes rg-float {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .rg__wave, .rg__chip { animation: none; }
  .rg__wave { opacity: 0; }
}
</style>
