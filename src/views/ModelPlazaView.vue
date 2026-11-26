<template>
  <!-- 后台内嵌形态：?embedded=1 且已登录，套完整后台布局 -->
  <AppLayout v-if="isEmbedded">
    <ModelPlazaContent :response="data" :loading="loading" :error="loadFailed" embedded @retry="loadPlaza" />
  </AppLayout>

  <!-- 独立形态：用户端外壳（顶部导航 + 页脚） -->
  <UserShell v-else>
    <section class="st-section plaza-page">
      <div class="st-shell">
        <ModelPlazaContent :response="data" :loading="loading" :error="loadFailed" @retry="loadPlaza" />
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UserShell from '@/components/shell/UserShell.vue'
import ModelPlazaContent from '@/components/modelPlaza/ModelPlazaContent.vue'
import { getModelPlaza, type ModelPlazaResponse } from '@/api/modelPlaza'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

// embedded=1 但未登录（如转发的链接）自动降级为独立形态。
const isEmbedded = computed(() => route.query.embedded === '1' && authStore.isAuthenticated)

const data = ref<ModelPlazaResponse | null>(null)
const loading = ref(true)
const loadFailed = ref(false)

/** 首屏与错误态重试共用同一份加载逻辑。 */
async function loadPlaza() {
  loading.value = true
  loadFailed.value = false
  try {
    data.value = await getModelPlaza()
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 独立形态导航条需要站点名/Logo；有 __APP_CONFIG__ 注入时同步命中缓存。
  void appStore.fetchPublicSettings()
  void loadPlaza()
})
</script>

<style scoped>
.plaza-page { padding-top: clamp(36px, 5vw, 72px); }
</style>
