<template>
  <div class="app" :class="{ 'app--flat': flat }">
    <div class="app__chrome">
      <span class="app__dot"></span><span class="app__dot"></span><span class="app__dot"></span>
      <span class="app__url">app.example.com/dashboard</span>
    </div>
    <div class="app__body">
      <aside class="app__side">
        <div class="app__brand"><span class="app__logo"></span><span>Sub2API</span></div>
        <nav class="app__nav">
          <span class="app__nav-i app__nav-i--on"><i></i>概览</span>
          <span class="app__nav-i"><i></i>通行证</span>
          <span class="app__nav-i"><i></i>用量</span>
          <span class="app__nav-i"><i></i>套餐</span>
        </nav>
        <div class="app__side-foot">
          <span class="app__nav-i"><i></i>账户设置</span>
        </div>
      </aside>

      <div class="app__main">
        <div class="app__head">
          <div>
            <p class="app__eyebrow">今日概览</p>
            <p class="app__title">晚上好，UI Dev</p>
          </div>
          <span class="app__avatar">U</span>
        </div>

        <div class="app__stats">
          <div class="app__stat app__stat--key">
            <span class="app__sk">可用余额</span>
            <span class="app__sv">$128.40</span>
            <span class="app__sd app__sd--ok">额度充足</span>
          </div>
          <div class="app__stat">
            <span class="app__sk">今日调用</span>
            <span class="app__sv">1,284</span>
            <span class="app__sd">较昨日 +18%</span>
          </div>
          <div class="app__stat">
            <span class="app__sk">今日 Token</span>
            <span class="app__sv">4.21M</span>
            <span class="app__sd">输入 2.8M · 输出 1.4M</span>
          </div>
        </div>

        <div class="app__chart">
          <div class="app__chart-head">
            <span class="app__sk">近 7 天消耗</span>
            <span class="app__seg"><b>日</b><s>周</s></span>
          </div>
          <svg viewBox="0 0 420 96" preserveAspectRatio="none" class="app__spark">
            <defs>
              <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--st-brand)" stop-opacity="0.22" />
                <stop offset="100%" stop-color="var(--st-brand)" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 74 L60 62 L120 68 L180 44 L240 52 L300 30 L360 36 L420 18 L420 96 L0 96 Z" fill="url(#ag)" />
            <path d="M0 74 L60 62 L120 68 L180 44 L240 52 L300 30 L360 36 L420 18" fill="none" stroke="var(--st-brand)" stroke-width="1.6" stroke-linejoin="round" />
            <circle cx="420" cy="18" r="3" fill="var(--st-brand)" />
          </svg>
        </div>

        <div class="app__table">
          <div class="app__tr app__tr--head">
            <span>模型</span><span>Token</span><span>费用</span><span>时间</span>
          </div>
          <div v-for="(r, i) in rows" :key="i" class="app__tr">
            <span class="app__model"><b class="app__mdot" :style="{ background: r.c }"></b>{{ r.m }}</span>
            <span class="app__num">{{ r.t }}</span>
            <span class="app__num">{{ r.cost }}</span>
            <span class="app__time">{{ r.at }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ flat?: boolean }>(), { flat: false })
const rows = [
  { m: 'claude-opus-4', t: '12.4k', cost: '$0.0432', at: '14:02', c: 'var(--st-brand)' },
  { m: 'gpt-5', t: '8.1k', cost: '$0.0186', at: '13:48', c: 'var(--st-ok)' },
  { m: 'gemini-2.5-pro', t: '21.7k', cost: '$0.0310', at: '13:21', c: 'var(--st-warn)' },
  { m: 'claude-sonnet-4', t: '5.9k', cost: '$0.0094', at: '12:57', c: 'var(--st-brand)' },
]
</script>

<style scoped>
.app {
  border: 1px solid var(--st-line);
  border-radius: 14px;
  background: var(--st-bg);
  box-shadow: var(--st-shadow-3);
  overflow: hidden;
  font-size: 11px;
}
.app--flat { box-shadow: none; }
.app__chrome { display: flex; align-items: center; gap: 5px; padding: 8px 10px; border-bottom: 1px solid var(--st-line); background: var(--st-bg-soft); }
.app__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--st-line-2); }
.app__url { margin-left: 10px; font-size: 9.5px; color: var(--st-ink-3); font-family: var(--st-font-mono); }
.app__body { display: flex; min-height: 300px; }

.app__side { width: 118px; flex-shrink: 0; border-right: 1px solid var(--st-line); padding: 10px 8px; display: flex; flex-direction: column; gap: 12px; background: var(--st-bg-soft); }
.app__brand { display: flex; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 600; color: var(--st-ink); }
.app__logo { width: 14px; height: 14px; border-radius: 4px; background: var(--st-ink); }
.app__nav { display: flex; flex-direction: column; gap: 2px; }
.app__nav-i { display: flex; align-items: center; gap: 6px; padding: 5px 6px; border-radius: 5px; font-size: 10px; color: var(--st-ink-2); }
.app__nav-i i { width: 10px; height: 10px; border-radius: 3px; background: var(--st-line-2); }
.app__nav-i--on { background: var(--st-bg); color: var(--st-ink); font-weight: 500; box-shadow: var(--st-shadow-1); }
.app__nav-i--on i { background: var(--st-brand); }
.app__side-foot { margin-top: auto; }

.app__main { flex: 1; min-width: 0; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
.app__head { display: flex; align-items: flex-start; justify-content: space-between; }
.app__eyebrow { font-size: 9px; color: var(--st-ink-3); letter-spacing: 0.06em; }
.app__title { margin-top: 2px; font-size: 14px; font-weight: 600; letter-spacing: -0.02em; color: var(--st-ink); }
.app__avatar { width: 18px; height: 18px; border-radius: 50%; background: var(--st-bg-soft); border: 1px solid var(--st-line-2); display: grid; place-items: center; font-size: 8px; color: var(--st-ink-2); }

.app__stats { display: grid; grid-template-columns: 1.25fr 1fr 1fr; gap: 8px; }
.app__stat { border: 1px solid var(--st-line); border-radius: 9px; padding: 8px 9px; display: flex; flex-direction: column; gap: 3px; background: var(--st-bg); }
.app__stat--key { border-color: var(--st-brand-line); background: var(--st-brand-soft); }
.app__sk { font-size: 8.5px; color: var(--st-ink-3); }
.app__sv { font-size: 15px; font-weight: 600; letter-spacing: -0.03em; color: var(--st-ink); font-variant-numeric: tabular-nums; }
.app__sd { font-size: 8px; color: var(--st-ink-3); }
.app__sd--ok { color: var(--st-ok); }

.app__chart { border: 1px solid var(--st-line); border-radius: 9px; padding: 8px 10px 4px; }
.app__chart-head { display: flex; align-items: center; justify-content: space-between; }
.app__seg { display: inline-flex; gap: 2px; }
.app__seg b, .app__seg s { font-size: 8px; font-weight: 500; padding: 2px 6px; border-radius: 4px; text-decoration: none; color: var(--st-ink-3); }
.app__seg b { background: var(--st-bg-soft); color: var(--st-ink); }
.app__spark { width: 100%; height: 52px; margin-top: 4px; }

.app__table { border: 1px solid var(--st-line); border-radius: 9px; overflow: hidden; }
.app__tr { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 6px; padding: 5px 9px; font-size: 9px; color: var(--st-ink-2); }
.app__tr + .app__tr { border-top: 1px solid var(--st-line); }
.app__tr--head { background: var(--st-bg-soft); color: var(--st-ink-3); font-size: 8.5px; }
.app__model { display: flex; align-items: center; gap: 5px; font-family: var(--st-font-mono); font-size: 8.5px; }
.app__mdot { width: 5px; height: 5px; border-radius: 50%; }
.app__num { font-family: var(--st-font-mono); font-variant-numeric: tabular-nums; }
.app__time { color: var(--st-ink-3); font-variant-numeric: tabular-nums; }

@media (max-width: 640px) {
  .app__side { display: none; }
  .app__stats { grid-template-columns: 1fr 1fr; }
}
</style>
