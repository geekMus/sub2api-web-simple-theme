<template>
  <div class="mk">
    <div v-for="k in keys" :key="k.n" class="mk__card" :class="{ 'mk__card--off': k.off }">
      <div class="mk__top">
        <span class="mk__name">{{ k.n }}</span>
        <span class="mk__st" :class="k.off ? 'mk__st--off' : 'mk__st--on'">{{ k.off ? '已停用' : '生效中' }}</span>
      </div>
      <div class="mk__key"><code>{{ k.k }}</code><span class="mk__copy">复制</span></div>
      <div class="mk__meta">
        <span>今日 <b>{{ k.used }}</b></span>
        <span class="mk__dot"></span>
        <span>{{ k.at }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const keys = [
  { n: 'Claude Code', k: 'sk-ui-••••0001', used: '$3.20', at: '2 小时前', off: false },
  { n: 'Cursor 编辑器', k: 'sk-ui-••••0002', used: '$1.10', at: '1 天前', off: false },
  { n: '旧项目', k: 'sk-ui-••••0004', used: '$0.00', at: '20 天前', off: true },
]
</script>

<style scoped>
.mk { display: flex; flex-direction: column; gap: 8px; }
.mk__card { border: 1px solid var(--st-line); border-radius: 10px; background: var(--st-bg); padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
.mk__card--off { opacity: 0.55; }
.mk__top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.mk__name { font-size: 11px; font-weight: 550; color: var(--st-ink); }
.mk__st { font-size: 9px; padding: 2px 6px; border-radius: 4px; }
.mk__st--on { color: var(--st-ok); background: var(--st-ok-soft); }
.mk__st--off { color: var(--st-ink-3); background: var(--st-bg-soft); }
.mk__key { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 8px; border-radius: 6px; background: var(--st-bg-soft); border: 1px solid var(--st-line); }
.mk__key code { font-family: var(--st-font-mono); font-size: 9.5px; color: var(--st-ink-2); }
.mk__copy { font-size: 9px; color: var(--st-brand); }
.mk__meta { display: flex; align-items: center; gap: 8px; font-size: 9.5px; color: var(--st-ink-3); }
.mk__meta b { color: var(--st-ink); font-weight: 550; font-variant-numeric: tabular-nums; }
.mk__dot { width: 2px; height: 2px; border-radius: 50%; background: var(--st-ink-3); }
</style>
