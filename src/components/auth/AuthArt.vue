<template>
  <div class="auth-art" aria-hidden="true">
    <svg viewBox="0 0 520 400" role="presentation">
      <defs>
        <linearGradient id="aa-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--st-line-strong)" />
          <stop offset="52%" stop-color="var(--st-accent)" />
          <stop offset="100%" stop-color="var(--st-line-strong)" />
        </linearGradient>
        <radialGradient id="aa-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--st-accent)" stop-opacity="0.22" />
          <stop offset="62%" stop-color="var(--st-accent)" stop-opacity="0.06" />
          <stop offset="100%" stop-color="var(--st-accent)" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- 门：一圈实线 + 一圈渐隐虚线 -->
      <circle cx="164" cy="200" r="132" fill="url(#aa-halo)" />
      <circle cx="164" cy="200" r="104" class="auth-art__gate" />
      <circle cx="164" cy="200" r="132" class="auth-art__gate auth-art__gate--dash" />

      <!-- 通行证：钥匙孔与钥匙 -->
      <g class="auth-art__pass">
        <rect x="116" y="150" width="96" height="100" rx="16" class="auth-art__pass-card" />
        <circle cx="164" cy="188" r="13" class="auth-art__keyhole" />
        <path d="M164 198v18M157 208h14" class="auth-art__keyhole-slot" />
        <rect x="134" y="228" width="60" height="5" rx="2.5" class="auth-art__pass-bar" />
      </g>
      <g class="auth-art__key">
        <circle cx="164" cy="188" r="7.5" />
        <path d="M171.5 188h26m-8 0v9m-9-9v6" />
      </g>

      <!-- 扇出到右侧的模型 -->
      <path d="M268 168 C 316 140, 330 116, 356 110" class="auth-art__wire" />
      <path d="M270 200 C 314 198, 330 198, 356 198" class="auth-art__wire auth-art__wire--b" />
      <path d="M268 232 C 316 260, 330 284, 356 290" class="auth-art__wire auth-art__wire--c" />

      <g class="auth-art__chips">
        <g v-for="(m, i) in models" :key="m" :transform="'translate(356, ' + (92 + i * 88) + ')'">
          <rect width="140" height="44" rx="22" class="auth-art__chip" />
          <circle cx="24" cy="22" r="4" class="auth-art__chip-dot" />
          <text x="40" y="27" class="auth-art__chip-label">{{ m }}</text>
        </g>
      </g>

    </svg>
  </div>
</template>

<script setup lang="ts">
const models = ['Claude', 'GPT', 'Gemini']
</script>

<style scoped>
.auth-art {
  width: 100%;
  max-width: 400px;
  margin-inline: 0;
}
.auth-art svg {
  width: 100%;
  height: auto;
  overflow: visible;
}
.auth-art__gate {
  fill: none;
  stroke: var(--st-line);
  stroke-width: 1;
}
.auth-art__gate--dash {
  stroke: color-mix(in srgb, var(--st-accent) 34%, transparent);
  stroke-dasharray: 2 10;
  stroke-linecap: round;
  animation: aa-spin 44s linear infinite;
  transform-origin: 164px 200px;
}
.auth-art__pass-card {
  fill: var(--st-bg-elev);
  stroke: var(--st-line-strong);
  stroke-width: 1;
}
.auth-art__keyhole {
  fill: color-mix(in srgb, var(--st-accent) 16%, transparent);
  stroke: var(--st-accent);
  stroke-width: 1.2;
}
.auth-art__keyhole-slot {
  fill: none;
  stroke: var(--st-accent);
  stroke-width: 1.2;
  stroke-linecap: round;
}
.auth-art__pass-bar {
  fill: var(--st-line-strong);
}
.auth-art__key circle {
  fill: none;
  stroke: var(--st-accent);
  stroke-width: 1.8;
}
.auth-art__key path {
  fill: none;
  stroke: var(--st-accent);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.auth-art__wire {
  fill: none;
  stroke: url(#aa-line);
  stroke-width: 1.2;
  stroke-dasharray: 5 8;
  animation: aa-dash 9s linear infinite;
}
.auth-art__wire--b {
  animation-duration: 11s;
}
.auth-art__wire--c {
  animation-duration: 13s;
}
.auth-art__chip {
  fill: color-mix(in srgb, var(--st-accent) 6%, var(--st-bg-elev));
  stroke: var(--st-accent-line);
  stroke-width: 1;
}
.auth-art__chip-dot {
  fill: var(--st-accent);
}
.auth-art__chip-label {
  fill: var(--st-ink);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
@keyframes aa-dash {
  to {
    stroke-dashoffset: -104;
  }
}
@keyframes aa-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .auth-art__wire,
  .auth-art__gate--dash {
    animation: none;
  }
}
</style>