<template>
  <div class="hero-art" aria-hidden="true">
    <svg viewBox="0 0 640 520" role="presentation">
      <defs>
        <linearGradient id="ha-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="var(--st-line-strong)" />
          <stop offset="60%" stop-color="var(--st-accent)" />
          <stop offset="100%" stop-color="var(--st-line-strong)" />
        </linearGradient>
        <radialGradient id="ha-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--st-accent)" stop-opacity="0.95" />
          <stop offset="55%" stop-color="var(--st-accent)" stop-opacity="0.28" />
          <stop offset="100%" stop-color="var(--st-accent)" stop-opacity="0" />
        </radialGradient>
        <filter id="ha-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <!-- 左侧：三个来源 -->
      <g class="hero-art__sources">
        <g v-for="(s, i) in sources" :key="s.label" :transform="'translate(28, ' + (140 + i * 96) + ')'">
          <rect width="148" height="64" rx="16" class="hero-art__chip" />
          <circle cx="26" cy="32" r="4.5" class="hero-art__dot" />
          <text x="44" y="30" class="hero-art__label">{{ s.label }}</text>
          <text x="44" y="46" class="hero-art__sub">{{ s.sub }}</text>
        </g>
      </g>

      <!-- 汇聚线 -->
      <path d="M176 172 C 250 172, 246 250, 300 256" class="hero-art__wire" />
      <path d="M176 268 C 240 268, 250 260, 300 258" class="hero-art__wire" />
      <path d="M176 364 C 250 364, 246 268, 300 260" class="hero-art__wire" />

      <!-- 核心节点 -->
      <circle cx="322" cy="258" r="72" fill="url(#ha-core)" />
      <g filter="url(#ha-glow)">
        <circle cx="322" cy="258" r="26" class="hero-art__core" />
        <circle cx="322" cy="258" r="42" class="hero-art__ring" />
      </g>
      <path d="M312 258h20M322 248v20" class="hero-art__plus" />

      <!-- 输出扇出 -->
      <path d="M344 236 C 400 200, 408 150, 470 138" class="hero-art__wire hero-art__wire--out" />
      <path d="M348 250 C 404 236, 412 210, 470 204" class="hero-art__wire hero-art__wire--out" />
      <path d="M348 266 C 404 280, 412 306, 470 312" class="hero-art__wire hero-art__wire--out" />
      <path d="M344 280 C 400 316, 408 366, 470 378" class="hero-art__wire hero-art__wire--out" />

      <!-- 右侧：模型 -->
      <g class="hero-art__models">
        <g v-for="(m, i) in models" :key="m" :transform="'translate(470, ' + (96 + i * 78) + ')'">
          <rect width="140" height="56" rx="28" class="hero-art__chip hero-art__chip--model" />
          <text x="24" y="34" class="hero-art__model">{{ m }}</text>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
const sources = [
  { label: '你的应用', sub: 'Web · 小程序' },
  { label: '编码助手', sub: 'Cursor · Claude Code' },
  { label: '工作流', sub: '脚本 · Agent' },
]
const models = ['Claude', 'GPT', 'Gemini', 'Grok']
</script>

<style scoped>
.hero-art { width: 100%; max-width: 620px; margin-inline: auto; }
svg { width: 100%; height: auto; overflow: visible; }
.hero-art__chip { fill: var(--st-bg-elev); stroke: var(--st-line); stroke-width: 1; }
.hero-art__chip--model { fill: color-mix(in srgb, var(--st-accent) 7%, var(--st-bg-elev)); stroke: var(--st-accent-line); }
.hero-art__dot { fill: var(--st-accent); }
.hero-art__label { fill: var(--st-ink); font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
.hero-art__sub { fill: var(--st-ink-faint); font-size: 11px; }
.hero-art__model { fill: var(--st-ink); font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
.hero-art__wire { fill: none; stroke: url(#ha-line); stroke-width: 1.2; stroke-dasharray: 5 7; animation: ha-dash 6s linear infinite; }
.hero-art__wire--out { stroke-dasharray: 4 9; animation-duration: 8s; }
@keyframes ha-dash { to { stroke-dashoffset: -120; } }
.hero-art__core { fill: var(--st-accent); }
.hero-art__ring { fill: none; stroke: var(--st-accent); stroke-opacity: 0.38; stroke-width: 1; }
.hero-art__plus { stroke: var(--st-accent-ink); stroke-width: 1.8; stroke-linecap: round; }
@media (prefers-reduced-motion: reduce) { .hero-art__wire { animation: none; } }
</style>
