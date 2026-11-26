<template>
  <div class="auth-aside">
    <div class="auth-aside__copy">
      <p class="st-eyebrow st-reveal">{{ c('auth.aside.eyebrow') }}</p>
      <h1 class="st-display-2 auth-aside__title st-reveal" style="--i: 1">
        {{ c('auth.aside.title1') }}<br />
        <span class="auth-aside__accent">{{ c('auth.aside.title2') }}</span>
      </h1>
      <p class="st-lede auth-aside__lede st-reveal" style="--i: 2">{{ c('auth.aside.lede') }}</p>
    </div>

    <div class="auth-aside__art st-reveal" style="--i: 3">
      <MockApp flat />
    </div>

    <ul class="auth-aside__facts st-reveal" style="--i: 4">
      <li v-for="fact in facts" :key="fact">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>{{ fact }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MockApp from '@/components/shell/art/MockApp.vue'
import { useAuthCopy } from '@/composables/copy/auth'

const { c } = useAuthCopy()

const facts = computed(() => [c('auth.aside.fact1'), c('auth.aside.fact2'), c('auth.aside.fact3')])
</script>

<style scoped>
.auth-aside {
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 1.8vw, 24px);
  max-width: 540px;
}
.auth-aside__title {
  margin-top: 14px;
}
.auth-aside__accent {
  color: var(--st-accent);
}
.auth-aside__lede {
  margin-top: 14px;
  max-width: 44ch;
}
.auth-aside__art {
  margin-block: clamp(6px, 1.2vw, 14px);
  max-width: 460px;
}
.auth-aside__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.auth-aside__facts li {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.8rem;
  color: var(--st-ink-soft);
  white-space: nowrap;
}
.auth-aside__facts svg {
  color: var(--st-accent);
  flex: none;
}
</style>