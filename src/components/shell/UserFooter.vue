<template>
  <footer class="ft">
    <div class="st-shell">
      <p class="ft__line">© {{ year }} {{ siteName }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'

const appStore = useAppStore()
/** 站点名来自后台设置（site_name），这里做兜底 */
const siteName = computed(
  () => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'Sub2API',
)
const year = new Date().getFullYear()
</script>

<style scoped>
.ft {
  margin-top: clamp(48px, 7vw, 96px);
  padding-block: 28px 36px;
  border-top: 1px solid var(--st-line);
}
.ft__line {
  margin: 0;
  text-align: center;
  font-size: 0.78rem;
  color: var(--st-ink-3);
  letter-spacing: 0.01em;
}
</style>
