<template>
  <div class="rg" aria-hidden="true">
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
      <ellipse cx="200" cy="150" rx="90" ry="46" class="rg__ring" />
      <ellipse cx="200" cy="150" rx="140" ry="72" class="rg__ring" />
      <ellipse cx="200" cy="150" rx="188" ry="98" class="rg__ring" />
      <rect x="176" y="126" width="48" height="48" rx="14" class="rg__mark" />
      <path d="M188 160c7 0 9-3.4 12.8-9.2 3.3-5.2 6.1-10.2 13.6-10.2" class="rg__mark-line" />
      <circle cx="217" cy="140" r="2.8" class="rg__mark-dot" />
    </svg>
  </div>
</template>

<style scoped>
.rg { width: 100%; }
.rg svg { width: 100%; height: auto; }
.rg__ring { fill: none; stroke: var(--st-line-2); stroke-width: 1; opacity: 0.75; }
.rg__mark { fill: var(--st-bg); stroke: var(--st-line-2); }
.rg__mark-line { fill: none; stroke: var(--st-ink); stroke-width: 2; stroke-linecap: round; }
.rg__mark-dot { fill: var(--st-ink); }
</style>
