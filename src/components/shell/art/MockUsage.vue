<template>
  <div class="mu">
    <div class="mu__head">
      <span class="mu__t">用量分布</span>
      <span class="mu__seg"><b>按模型</b><s>按天</s></span>
    </div>
    <div class="mu__rows">
      <div v-for="m in models" :key="m.n" class="mu__row">
        <span class="mu__n"><i :style="{ background: m.c }"></i>{{ m.n }}</span>
        <span class="mu__bar"><b :style="{ width: m.p + '%', background: m.c }"></b></span>
        <span class="mu__v">{{ m.v }}</span>
      </div>
    </div>
    <div class="mu__foot">
      <div><span class="mu__fk">本月合计</span><span class="mu__fv">$42.86</span></div>
      <div><span class="mu__fk">调用次数</span><span class="mu__fv">18,204</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const models = [
  { n: 'claude-opus-4', p: 78, v: '$18.2', c: 'var(--st-brand)' },
  { n: 'gpt-5', p: 54, v: '$12.6', c: 'var(--st-ok)' },
  { n: 'gemini-2.5-pro', p: 38, v: '$7.9', c: 'var(--st-warn)' },
  { n: 'claude-sonnet-4', p: 21, v: '$4.1', c: 'var(--st-ink-3)' },
]
</script>

<style scoped>
.mu { border: 1px solid var(--st-line); border-radius: 12px; background: var(--st-bg); padding: 14px 16px; box-shadow: var(--st-shadow-2); }
.mu__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.mu__t { font-size: 11.5px; font-weight: 600; color: var(--st-ink); }
.mu__seg { display: inline-flex; }
.mu__seg b, .mu__seg s { font-size: 9.5px; padding: 3px 7px; border-radius: 5px; color: var(--st-ink-3); text-decoration: none; font-weight: 500; }
.mu__seg b { background: var(--st-bg-soft); color: var(--st-ink); }
.mu__rows { display: flex; flex-direction: column; gap: 9px; }
.mu__row { display: grid; grid-template-columns: 104px 1fr 42px; align-items: center; gap: 10px; }
.mu__n { display: flex; align-items: center; gap: 5px; font-family: var(--st-font-mono); font-size: 9.5px; color: var(--st-ink-2); }
.mu__n i { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.mu__bar { height: 5px; border-radius: 3px; background: var(--st-bg-soft); overflow: hidden; }
.mu__bar b { display: block; height: 100%; border-radius: 3px; }
.mu__v { font-family: var(--st-font-mono); font-size: 9.5px; color: var(--st-ink); text-align: right; font-variant-numeric: tabular-nums; }
.mu__foot { display: flex; gap: 32px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--st-line); }
.mu__fk { display: block; font-size: 9px; color: var(--st-ink-3); }
.mu__fv { font-size: 14px; font-weight: 600; letter-spacing: -0.02em; color: var(--st-ink); font-variant-numeric: tabular-nums; }
</style>
