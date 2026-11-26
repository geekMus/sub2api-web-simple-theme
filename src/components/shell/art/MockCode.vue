<template>
  <div class="mc">
    <div class="mc__tabs">
      <span class="mc__tab mc__tab--on">请求</span>
      <span class="mc__tab">响应</span>
    </div>
    <div class="mc__pane">
      <pre><code><span class="k">POST</span> https://api.example.com<span class="s">/v1/messages</span>
<span class="c">Authorization: Bearer sk-…7f2a</span>

{
  <span class="p">"model"</span>: <span class="s">"claude-opus-4"</span>,
  <span class="p">"max_tokens"</span>: <span class="n">1024</span>,
  <span class="p">"messages"</span>: [
    { <span class="p">"role"</span>: <span class="s">"user"</span>, <span class="p">"content"</span>: <span class="s">"帮我写个快排"</span> }
  ]
}</code></pre>
    </div>
    <div class="mc__out">
      <span class="mc__ok">200 OK</span>
      <span class="mc__meta">1.24s · 8,412 in / 1,203 out · $0.0432</span>
    </div>
  </div>
</template>

<style scoped>
.mc { border: 1px solid var(--st-line); border-radius: 12px; background: var(--st-bg); overflow: hidden; box-shadow: var(--st-shadow-2); }
.mc__tabs { display: flex; gap: 2px; padding: 6px 8px; border-bottom: 1px solid var(--st-line); background: var(--st-bg-soft); }
.mc__tab { font-size: 10px; padding: 3px 9px; border-radius: 5px; color: var(--st-ink-3); }
.mc__tab--on { background: var(--st-bg); color: var(--st-ink); font-weight: 500; box-shadow: var(--st-shadow-1); }
.mc__pane { padding: 12px 14px; overflow-x: auto; }
.mc__pane pre { margin: 0; }
.mc__pane code { font-family: var(--st-font-mono); font-size: 10.5px; line-height: 1.85; color: var(--st-ink-2); white-space: pre; }
.k { color: var(--st-brand); font-weight: 600; }
.s { color: var(--st-ok); }
.p { color: var(--st-ink); }
.n { color: var(--st-warn); }
.c { color: var(--st-ink-3); }
.mc__out { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 8px 14px; border-top: 1px solid var(--st-line); background: var(--st-bg-soft); }
.mc__ok { font-family: var(--st-font-mono); font-size: 10px; font-weight: 600; color: var(--st-ok); }
.mc__meta { font-size: 10px; color: var(--st-ink-3); font-variant-numeric: tabular-nums; }
</style>
