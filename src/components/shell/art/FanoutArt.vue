<template>
  <div class="fo" aria-hidden="true">
    <svg viewBox="0 0 560 300" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="fo-wire" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="var(--st-line-2)" />
          <stop offset="55%" stop-color="var(--st-brand)" stop-opacity="0.55" />
          <stop offset="100%" stop-color="var(--st-line-2)" />
        </linearGradient>
      </defs>

      <!-- 左侧来源 -->
      <circle cx="26" cy="150" r="5" class="fo__src" />
      <path d="M31 150 H 118" class="fo__wire" />

      <!-- 中央节点 -->
      <circle cx="150" cy="150" r="30" class="fo__halo" />
      <rect x="132" y="132" width="36" height="36" rx="11" class="fo__hub" />
      <path d="M141 158c5 0 6.5-2.4 9.2-6.6 2.4-3.8 4.4-7.4 9.8-7.4" class="fo__hub-mark" />
      <circle cx="162" cy="144" r="2.1" class="fo__hub-dot" />

      <!-- 扇出线 -->
      <g class="fo__wires">
        <path v-for="(p, i) in paths" :key="i" :d="p" class="fo__wire fo__wire--out" :style="{ animationDelay: i * 0.25 + 's' }" />
      </g>

      <!-- 右端节点 -->
      <circle v-for="(p, i) in ends" :key="'e' + i" :cx="p.x" :cy="p.y" r="3.4" class="fo__end" />

      <!-- 标签 -->
      <g v-for="(item, i) in items" :key="item.name">
        <text :x="ends[i].x + 16" :y="ends[i].y + 4" class="fo__label">{{ item.name }}</text>
        <text :x="ends[i].x + 16" :y="ends[i].y + 20" class="fo__meta">{{ item.meta }}</text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
const items = [
  { name: 'Codex', meta: 'CLI' },
  { name: 'Work Buddy', meta: '桌面端' },
  { name: 'DeepSeek Harness', meta: 'Agent' },
  { name: 'Claude Code', meta: 'CLI' },
]

const ends = [
  { x: 372, y: 44 },
  { x: 372, y: 114 },
  { x: 372, y: 186 },
  { x: 372, y: 256 },
]

const paths = [
  'M180 150 C 250 150, 270 44, 368 44',
  'M180 150 C 250 150, 270 114, 368 114',
  'M180 150 C 250 150, 270 186, 368 186',
  'M180 150 C 250 150, 270 256, 368 256',
]
</script>

<style scoped>
.fo { width: 100%; }
.fo svg { width: 100%; height: auto; overflow: visible; }

.fo__src { fill: var(--st-ink); }
.fo__wire {
  fill: none;
  stroke: url(#fo-wire);
  stroke-width: 1.2;
}
.fo__wire--out {
  stroke-dasharray: 4 6;
  animation: fo-flow 7s linear infinite;
}
@keyframes fo-flow { to { stroke-dashoffset: -100; } }

.fo__halo { fill: var(--st-brand-soft); }
.fo__hub { fill: var(--st-bg); stroke: var(--st-line-2); stroke-width: 1; }
.fo__hub-mark { fill: none; stroke: var(--st-ink); stroke-width: 1.6; stroke-linecap: round; }
.fo__hub-dot { fill: var(--st-ink); }

.fo__end { fill: var(--st-ink); opacity: 0.55; }

.fo__label {
  font-family: var(--st-font-display);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  fill: var(--st-ink);
}
.fo__meta {
  font-family: var(--st-font-mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  fill: var(--st-ink-3);
}

@media (prefers-reduced-motion: reduce) { .fo__wire--out { animation: none; } }
</style>
