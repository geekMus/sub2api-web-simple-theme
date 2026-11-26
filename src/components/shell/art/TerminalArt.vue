<template>
  <div class="term-stage" aria-hidden="true">
    <div class="term-glow"></div>
    <div class="term-tilt">
      <div class="term">
        <div class="term__bar">
          <span class="term__dot term__dot--r"></span>
          <span class="term__dot term__dot--y"></span>
          <span class="term__dot term__dot--g"></span>
          <span class="term__title">zsh — 120×32</span>
        </div>
        <div class="term__body">
          <div class="term__line">
            <span class="term__prompt">~</span>
            <span class="term__caret">❯</span>
            <span class="term__cmd">curl</span>
            <span class="term__str">https://api.example.com/v1/messages</span>
            <span class="term__cont">\</span>
          </div>
          <div class="term__line term__line--ind">
            <span class="term__flag">-H</span>
            <span class="term__str">"Authorization: Bearer <span class="term__key">sk-or-v1-••••8f2c</span>"</span>
            <span class="term__cont">\</span>
          </div>
          <div class="term__line term__line--ind">
            <span class="term__flag">-d</span>
            <span class="term__str">'{ "model": <span class="term__key">"claude-opus-4"</span>, "stream": <span class="term__num">true</span> }'</span>
          </div>
          <div class="term__gap"></div>
          <div class="term__resp">
            <span class="term__ok">HTTP/2 200</span>
            <span class="term__dim">·</span>
            <span class="term__dim">1.24s</span>
            <span class="term__dim">·</span>
            <span class="term__dim">8,412 in / 1,203 out</span>
          </div>
          <div class="term__json">{</div>
          <div class="term__json term__json--i"><span class="term__prop">"id"</span>: <span class="term__str">"msg_01Xk"</span>,</div>
          <div class="term__json term__json--i"><span class="term__prop">"model"</span>: <span class="term__str">"claude-opus-4"</span>,</div>
          <div class="term__json term__json--i"><span class="term__prop">"usage"</span>: { <span class="term__prop">"input_tokens"</span>: <span class="term__num">8412</span>, <span class="term__prop">"output_tokens"</span>: <span class="term__num">1203</span> },</div>
          <div class="term__json term__json--i"><span class="term__prop">"content"</span>: [{ <span class="term__prop">"type"</span>: <span class="term__str">"text"</span>, <span class="term__prop">"text"</span>: <span class="term__str">"好的，先创建项目骨架…"</span> }]</div>
          <div class="term__json">}</div>
          <div class="term__line">
            <span class="term__prompt">~</span>
            <span class="term__caret">❯</span>
            <span class="term__cursor"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.term-stage { position: relative; width: 100%; }

.term-glow {
  position: absolute;
  inset: -12% -8% -18% -14%;
  background: radial-gradient(60% 55% at 62% 42%, var(--st-brand-soft), transparent 70%);
  filter: blur(40px);
  pointer-events: none;
}

.term-tilt {
  perspective: 1700px;
  perspective-origin: 50% 50%;
}

.term {
  /* 跟随主题：亮色浅终端 / 暗色深终端 */
  --t-bg: #fbfbfc;
  --t-bar: #f1f1f3;
  --t-line: #e3e3e6;
  --t-fg: #24292f;
  --t-dim: #8b8d93;
  --t-green: #1a7f37;
  --t-lime: #5c7a00;
  --t-key: #4f3bff;
  --t-num: #b45309;
  border-radius: 12px;
  border: 1px solid var(--t-line);
  background: var(--t-bg);
  box-shadow: var(--st-shadow-3);
  overflow: hidden;
  /* 朝左倾斜：左边大、右边小，正面朝向左侧文案 */
  transform: rotateY(-18deg) rotateX(5deg);
  transform-origin: 82% 50%;
  transition: transform var(--st-t-slow) var(--st-ease);
}
.term-stage:hover .term { transform: rotateY(-12deg) rotateX(3deg); }

.dark .term {
  --t-bg: #0c0e10;
  --t-bar: #17191c;
  --t-line: #24262a;
  --t-fg: #c9ced4;
  --t-dim: #6b7178;
  --t-green: #7ee787;
  --t-lime: #c9f24a;
  --t-key: #c9f24a;
  --t-num: #f0b866;
}

.term__bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 14px;
  background: var(--t-bar);
  border-bottom: 1px solid var(--t-line);
}
.term__dot { width: 11px; height: 11px; border-radius: 50%; }
.term__dot--r { background: #ff5f57; }
.term__dot--y { background: #febc2e; }
.term__dot--g { background: #28c840; }
.term__title {
  margin-left: 10px;
  font-family: var(--st-font-mono);
  font-size: 10.5px;
  color: var(--t-dim);
  letter-spacing: 0.02em;
}

.term__body {
  padding: 16px 18px 20px;
  font-family: var(--st-font-mono);
  font-size: 11.5px;
  line-height: 1.85;
  color: var(--t-fg);
  background: var(--t-bg);
  overflow: hidden;
}
.term__line { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; white-space: pre-wrap; word-break: break-all; }
.term__line--ind { padding-left: 18px; }
.term__prompt { color: var(--t-green); font-weight: 600; }
.term__caret { color: var(--t-lime); font-weight: 700; }
.term__cmd { color: var(--t-fg); font-weight: 600; }
.term__str { color: var(--t-fg); }
.term__key { color: var(--t-key); }
.term__num { color: var(--t-num); }
.term__flag { color: var(--t-dim); }
.term__cont { color: var(--t-dim); margin-left: auto; }
.term__gap { height: 8px; }
.term__resp { display: flex; align-items: center; gap: 7px; font-size: 10.5px; }
.term__ok { color: var(--t-green); font-weight: 600; }
.term__dim { color: var(--t-dim); }
.term__json { white-space: pre; }
.term__json--i { padding-left: 16px; }
.term__prop { color: var(--t-key); }
.term__cursor {
  display: inline-block;
  width: 7px; height: 13px;
  background: var(--t-lime);
  animation: term-blink 1.1s steps(1) infinite;
  transform: translateY(2px);
}
@keyframes term-blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }

@media (max-width: 900px) {
  .term { transform: none; }
  .term__body { font-size: 10.5px; }
}
@media (prefers-reduced-motion: reduce) {
  .term, .term__cursor { transition: none; animation: none; }
}
</style>
