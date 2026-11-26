<template>
  <div class="mg">
    <span v-for="m in models" :key="m" class="mg__i">{{ m }}</span>
  </div>
</template>

<script setup lang="ts">
const models = ['Anthropic', 'OpenAI', 'Google', 'xAI', 'DeepSeek', 'Qwen', 'Mistral', 'Meta', 'Moonshot', 'Zhipu']
</script>

<style scoped>
.mg { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 1px; background: var(--st-line); border: 1px solid var(--st-line); border-radius: 10px; overflow: hidden; }
.mg__i { display: grid; place-items: center; height: 52px; background: var(--st-bg); font-family: var(--st-font-display); font-size: 0.82rem; font-weight: 600; letter-spacing: -0.02em; color: var(--st-ink-3); transition: color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease); }
.mg__i:hover { color: var(--st-ink); background: var(--st-bg-soft); }
</style>
