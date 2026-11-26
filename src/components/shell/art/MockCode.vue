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
/* 跟随主题 */
.mc {
  --c-bg: #fbfbfc;
  --c-bar: #f1f1f3;
  --c-line: #e3e3e6;
  --c-fg: #24292f;
  --c-dim: #8b8d93;
  --c-on: #ffffff;
  --c-on-fg: #24292f;
  --c-k: #4f3bff;
  --c-s: #1a7f37;
  --c-p: #24292f;
  --c-n: #b45309;
  border: 1px solid var(--c-line);
  border-radius: 12px;
  background: var(--c-bg);
  overflow: hidden;
  box-shadow: var(--st-shadow-2);
}
.dark .mc {
  --c-bg: #0c0e10;
  --c-bar: #17191c;
  --c-line: #24262a;
  --c-fg: #c9ced4;
  --c-dim: #6b7178;
  --c-on: #24262a;
  --c-on-fg: #ffffff;
  --c-k: #c9f24a;
  --c-s: #7ee787;
  --c-p: #ffffff;
  --c-n: #f0b866;
}
.mc__tabs { display: flex; gap: 2px; padding: 6px 8px; border-bottom: 1px solid var(--c-line); background: var(--c-bar); }
.mc__tab { font-size: 10px; padding: 3px 9px; border-radius: 5px; color: var(--c-dim); }
.mc__tab--on { background: var(--c-on); color: var(--c-on-fg); font-weight: 500; }
.mc__pane { padding: 12px 14px; overflow-x: auto; }
.mc__pane pre { margin: 0; }
.mc__pane code { font-family: var(--st-font-mono); font-size: 10.5px; line-height: 1.85; color: var(--c-fg); white-space: pre; }
.k { color: var(--c-k); font-weight: 600; }
.s { color: var(--c-s); }
.p { color: var(--c-p); }
.n { color: var(--c-n); }
.c { color: var(--c-dim); }
.mc__out { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 8px 14px; border-top: 1px solid var(--c-line); background: var(--c-bar); }
.mc__ok { font-family: var(--st-font-mono); font-size: 10px; font-weight: 600; color: var(--c-s); }
.mc__meta { font-size: 10px; color: var(--c-dim); font-variant-numeric: tabular-nums; }
</style>
