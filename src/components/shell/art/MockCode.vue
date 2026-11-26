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
.mc { border: 1px solid #24262a; border-radius: 12px; background: #0c0e10; overflow: hidden; box-shadow: var(--st-shadow-3); }
.mc__tabs { display: flex; gap: 2px; padding: 6px 8px; border-bottom: 1px solid #24262a; background: #17191c; }
.mc__tab { font-size: 10px; padding: 3px 9px; border-radius: 5px; color: #6b7178; }
.mc__tab--on { background: #24262a; color: #ffffff; font-weight: 500; }
.mc__pane { padding: 12px 14px; overflow-x: auto; }
.mc__pane pre { margin: 0; }
.mc__pane code { font-family: var(--st-font-mono); font-size: 10.5px; line-height: 1.85; color: #c9ced4; white-space: pre; }
.k { color: #c9f24a; font-weight: 600; }
.s { color: #7ee787; }
.p { color: #ffffff; }
.n { color: #f0b866; }
.c { color: #6b7178; }
.mc__out { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 8px 14px; border-top: 1px solid #24262a; background: #17191c; }
.mc__ok { font-family: var(--st-font-mono); font-size: 10px; font-weight: 600; color: #7ee787; }
.mc__meta { font-size: 10px; color: #6b7178; font-variant-numeric: tabular-nums; }
</style>
