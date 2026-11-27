<template>
  <router-link :to="to" class="bm" :class="{ 'bm--lg': size === 'lg' }">
    <span class="bm__mark">
      <img v-if="logo" :src="logo" alt="" />
      <svg v-else viewBox="0 0 20 20" aria-hidden="true">
        <path d="M4 14.2c2.9 0 3.9-1.2 5.4-3.5C10.9 8 12.1 5.8 15 5.8" />
        <path d="M4 16.6c1.9 0 2.8-.8 3.8-2.2" opacity=".45" />
        <circle cx="15.4" cy="5.8" r="1.35" />
      </svg>
    </span>
    <span class="bm__name">{{ name }}</span>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'

withDefaults(defineProps<{ size?: 'md' | 'lg'; to?: string }>(), { size: 'md', to: '/home' })
const appStore = useAppStore()
const name = computed(() => appStore.siteName || 'Sub2API')
const logo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
</script>

<style scoped>
.bm { display: inline-flex; align-items: center; gap: 9px; text-decoration: none; color: var(--st-ink); flex-shrink: 0; }
.bm__mark {
  display: grid; place-items: center;
  width: 26px; height: 26px; border-radius: 7px;
  background: var(--st-ink); color: var(--st-bg);
}
.bm--lg .bm__mark { width: 30px; height: 30px; border-radius: 8px; }
.bm__mark img { width: 17px; height: 17px; object-fit: contain; }
.bm__mark svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; }
.bm__name { font-family: var(--st-font-display); font-size: 0.94rem; font-weight: 600; letter-spacing: -0.02em; }
.bm--lg .bm__name { font-size: 1rem; }
</style>
