<template>
  <div class="st-root st-grain" :class="{ 'st-root--tabbar': showTabBar }">
    <div class="st-atmos" aria-hidden="true">
      <span class="st-aurora st-aurora--a"></span>
      <span class="st-aurora st-aurora--b"></span>
      <span class="st-aurora st-aurora--c"></span>
    </div>
    <UserTopNav />
    <main class="st-main" :class="{ 'st-main--tabbar': showTabBar }">
      <slot />
    </main>
    <UserFooter v-if="showFooter && !showTabBar" />
    <UserTabBar v-if="showTabBar" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getActivePinia } from 'pinia'
import { useAuthStore } from '@/stores'
import UserTopNav from './UserTopNav.vue'
import UserFooter from './UserFooter.vue'
import UserTabBar from './UserTabBar.vue'

const props = withDefaults(defineProps<{ showFooter?: boolean; tabBar?: boolean }>(), { showFooter: true, tabBar: true })

let route: ReturnType<typeof useRoute> | null = null
let authStore: ReturnType<typeof useAuthStore> | null = null
try {
  if (getActivePinia()) authStore = useAuthStore()
  route = useRoute()
} catch {
  // Unit tests may mount pages without a router/pinia; the shell still renders its default slot.
}
const showTabBar = computed(() => props.tabBar && !!authStore?.isAuthenticated && route?.meta?.requiresAuth === true)
</script>

<style scoped>
/* 底部 Tab 是固定层，给它留出空间放在根节点，页脚才不会被盖住 */
.st-root--tabbar { padding-bottom: calc(74px + env(safe-area-inset-bottom)); }
@media (min-width: 1024px) {
  .st-root--tabbar { padding-bottom: 0; }
}
</style>
