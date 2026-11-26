<template>
  <div class="orb" aria-hidden="true">
    <svg viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="orb-fade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--st-bg)" stop-opacity="0" />
          <stop offset="72%" stop-color="var(--st-bg)" stop-opacity="0" />
          <stop offset="100%" stop-color="var(--st-bg)" stop-opacity="1" />
        </radialGradient>
        <filter id="orb-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <!-- 轨道 -->
      <g class="orb__rings">
        <ellipse v-for="(r, i) in rings" :key="'r' + i"
          cx="450" :cy="350" :rx="r.rx" :ry="r.ry"
          :transform="'rotate(' + r.rot + ' 450 350)'"
          class="orb__ring" :style="{ opacity: r.o }" />
      </g>

      <!-- 星点 -->
      <g class="orb__stars">
        <circle v-for="(s, i) in stars" :key="'s' + i" :cx="s.x" :cy="s.y" :r="s.r"
          class="orb__dot" :style="{ opacity: s.o }" />
      </g>

      <!-- 大颗粒簇（模拟模型聚集） -->
      <g class="orb__clusters">
        <g v-for="(c, i) in clusters" :key="'c' + i" :transform="'translate(' + c.x + ',' + c.y + ')'">
          <circle v-for="(p, j) in c.pts" :key="j" :cx="p.x" :cy="p.y" :r="p.r" class="orb__dot" :style="{ opacity: p.o }" />
        </g>
      </g>

      <!-- 模型徽标 -->
      <g class="orb__marks">
        <g v-for="(m, i) in marks" :key="'m' + i" :transform="'translate(' + m.x + ',' + m.y + ')'">
          <rect x="-15" y="-15" width="30" height="30" rx="9" class="orb__chip" />
          <g class="orb__glyph" v-html="m.svg" />
        </g>
      </g>

      <!-- 高亮脉冲 -->
      <g class="orb__pulse">
        <circle v-for="(p, i) in pulses" :key="'p' + i" :cx="p.x" :cy="p.y" r="4" class="orb__pulse-dot" :style="{ animationDelay: p.d + 's' }" />
      </g>

      <rect width="900" height="700" fill="url(#orb-fade)" />
    </svg>
  </div>
</template>

<script setup lang="ts">
/** 确定性伪随机：同一份数据每次渲染一致，避免闪动 */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const r = rng(20261126)

const rings = [
  { rx: 250, ry: 96, rot: -14, o: 0.5 },
  { rx: 330, ry: 128, rot: -14, o: 0.38 },
  { rx: 420, ry: 164, rot: -14, o: 0.26 },
  { rx: 500, ry: 196, rot: -14, o: 0.16 },
]

const stars = Array.from({ length: 190 }, () => {
  const x = r() * 900
  const y = r() * 700
  const big = r() > 0.9
  return { x, y, r: big ? 1.7 : 0.6 + r() * 0.9, o: 0.15 + r() * 0.55 }
})

const clusters = Array.from({ length: 7 }, () => {
  const cx = 120 + r() * 660
  const cy = 120 + r() * 460
  const n = 8 + Math.floor(r() * 12)
  const pts = Array.from({ length: n }, () => ({
    x: (r() - 0.5) * 96,
    y: (r() - 0.5) * 60,
    r: 0.5 + r() * 1.5,
    o: 0.12 + r() * 0.5,
  }))
  return { x: cx, y: cy, pts }
})

const glyphs = [
  '<circle cx="0" cy="0" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="0" cy="0" r="2" fill="currentColor"/>',
  '<path d="M0 -7 L6.5 5 L-6.5 5 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  '<rect x="-5.5" y="-5.5" width="11" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  '<path d="M-6 0h12M0 -6v12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  '<path d="M-6 4 Q0 -8 6 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  '<path d="M-6 -4 L0 6 L6 -4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>',
  '<path d="M-5 -5h10v10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  '<circle cx="-2" cy="0" r="3" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="4" cy="0" r="3" fill="none" stroke="currentColor" stroke-width="1.4"/>',
]

const marks = [
  { x: 236, y: 196 }, { x: 372, y: 132 }, { x: 520, y: 168 },
  { x: 664, y: 224 }, { x: 300, y: 344 }, { x: 452, y: 300 },
  { x: 610, y: 356 }, { x: 736, y: 432 }, { x: 204, y: 452 },
  { x: 388, y: 486 }, { x: 556, y: 512 }, { x: 690, y: 560 },
  { x: 128, y: 300 }, { x: 800, y: 320 },
].map((m, i) => ({ ...m, svg: glyphs[i % glyphs.length] }))

const pulses = [
  { x: 372, y: 132, d: 0 }, { x: 520, y: 168, d: 1.2 }, { x: 452, y: 300, d: 2.4 },
  { x: 664, y: 224, d: 3.6 }, { x: 556, y: 512, d: 4.8 },
]
</script>

<style scoped>
.orb { position: absolute; inset: 0; pointer-events: none; }
.orb svg { width: 100%; height: 100%; display: block; }

.orb__ring {
  fill: none;
  stroke: var(--st-ink);
  stroke-opacity: 0.16;
  stroke-width: 1;
}
.dark .orb__ring { stroke: #ffffff; stroke-opacity: 0.1; }

.orb__dot { fill: var(--st-ink); }
.dark .orb__dot { fill: #ffffff; }

.orb__chip {
  fill: var(--st-bg);
  stroke: var(--st-line-2);
  stroke-width: 1;
}
.dark .orb__chip { fill: #0d0d0f; stroke: #26262b; }

.orb__glyph { color: var(--st-ink-2); }
.dark .orb__glyph { color: #b9b9c0; }

.orb__pulse-dot {
  fill: var(--st-brand);
  animation: orb-pulse 4.8s var(--st-ease) infinite;
  transform-box: fill-box;
  transform-origin: center;
}
@keyframes orb-pulse {
  0%, 100% { opacity: 0.25; transform: scale(0.7); }
  50% { opacity: 1; transform: scale(1.15); }
}
@media (prefers-reduced-motion: reduce) { .orb__pulse-dot { animation: none; } }

/* 轨道缓慢漂移，让静态图有呼吸感 */
.orb__rings { animation: orb-drift 40s linear infinite; transform-origin: 450px 350px; }
@keyframes orb-drift { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .orb__rings { animation: none; } }
</style>
