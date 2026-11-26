<template>
  <div class="st-root st-grain">
    <div class="st-atmos" aria-hidden="true">
      <span class="st-aurora st-aurora--a"></span>
      <span class="st-aurora st-aurora--b"></span>
      <span class="st-aurora st-aurora--c"></span>
    </div>
    <UserTopNav />
    <main class="st-main">
      <slot />
    </main>
    <UserFooter v-if="showFooter" />
  </div>
</template>

<script setup lang="ts">
import UserTopNav from './UserTopNav.vue'
import UserFooter from './UserFooter.vue'

withDefaults(defineProps<{ showFooter?: boolean }>(), { showFooter: true })
</script>

<style scoped>
.st-main { position: relative; z-index: 1; min-height: 60vh; }
</style>
