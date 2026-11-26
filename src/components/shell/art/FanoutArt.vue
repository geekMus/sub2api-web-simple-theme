<template>
  <div class="fo" aria-hidden="true">
    <svg viewBox="0 0 660 340" preserveAspectRatio="xMidYMid meet">
      <!-- 起点：实心圆 + 实线 -->
      <circle cx="18" cy="170" r="5" class="fo__src" />
      <path d="M23 170 H 104" class="fo__wire fo__wire--main" />

      <!-- 中央节点 -->
      <circle cx="132" cy="170" r="34" class="fo__halo" />
      <rect x="104" y="142" width="56" height="56" rx="16" class="fo__hub" />
      <path d="M118 182c8 0 10.5-3.8 14.8-10 4-5.6 7-11 15.2-11" class="fo__hub-mark" />
      <circle cx="151" cy="159" r="2.6" class="fo__hub-dot" />

      <!-- 扇出连线 -->
      <path v-for="(p, i) in paths" :key="i" :d="p" class="fo__wire fo__wire--out" :style="{ animationDelay: i * 0.3 + 's' }" />

      <!-- 右侧卡片 -->
      <g v-for="(item, i) in items" :key="item.name" :transform="'translate(400, ' + (14 + i * 84) + ')'">
        <rect width="238" height="66" rx="14" class="fo__card" />
        <g :transform="'translate(18, 33)'">
          <circle cx="0" cy="0" r="16" class="fo__icon-bg" />
          <path :d="item.icon" class="fo__icon" />
        </g>
        <text x="48" y="30" class="fo__label">{{ item.name }}</text>
        <text x="48" y="47" class="fo__meta">{{ item.meta }}</text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
const items = [
  {
    name: 'Codex',
    meta: 'CLI',
    // 六边形 + 内部尖角，暗示编码终端
    icon: 'M-7 -4L0 -8L7 -4V4L0 8L-7 4Z',
  },
  {
    name: 'Work Buddy',
    meta: '桌面端',
    // 圆角方块 + 对话点
    icon: 'M-7 -6H7V2H-1L-4 6V2H-7Z',
  },
  {
    name: 'DeepSeek Harness',
    meta: 'Agent',
    // 波浪（鲸）
    icon: 'M-8 3c4 0 5-3 8-3s4 3 8 3',
  },
  {
    name: 'Claude Code',
    meta: 'CLI',
    // 星芒（Claude 视觉语言）
    icon: 'M0 -8V8M-7 -4L7 4M7 -4L-7 4',
  },
]

const paths = [
  'M160 170 C 250 170, 250 47, 396 47',
  'M160 170 C 250 170, 250 131, 396 131',
  'M160 170 C 250 170, 250 215, 396 215',
  'M160 170 C 250 170, 250 299, 396 299',
]
</script>

<style scoped>
.fo { width: 100%; }
.fo svg { width: 100%; height: auto; overflow: visible; }

.fo__src { fill: var(--st-ink); }

.fo__wire { fill: none; stroke: var(--st-line-2); stroke-width: 1.2; }
.fo__wire--main { stroke: var(--st-ink-2); stroke-width: 1.4; }
.fo__wire--out {
  stroke: color-mix(in srgb, var(--st-brand) 55%, var(--st-line-2));
  stroke-dasharray: 4 6;
  animation: fo-flow 7s linear infinite;
}
@keyframes fo-flow { to { stroke-dashoffset: -100; } }

.fo__halo { fill: var(--st-brand-soft); }
.fo__hub { fill: var(--st-bg); stroke: var(--st-line-2); stroke-width: 1; }
.fo__hub-mark { fill: none; stroke: var(--st-ink); stroke-width: 2.2; stroke-linecap: round; }
.fo__hub-dot { fill: var(--st-ink); }

.fo__card {
  fill: var(--st-bg);
  stroke: var(--st-line);
  stroke-width: 1;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.10));
}
.fo__icon-bg { fill: var(--st-bg-soft); stroke: var(--st-line); stroke-width: 1; }
.fo__icon { fill: none; stroke: var(--st-ink-2); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }

.fo__label {
  font-family: var(--st-font-display);
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  fill: var(--st-ink);
}
.fo__meta {
  font-family: var(--st-font-mono);
  font-size: 9.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  fill: var(--st-ink-3, #8a8b92);
}

@media (prefers-reduced-motion: reduce) { .fo__wire--out { animation: none; } }
</style>
