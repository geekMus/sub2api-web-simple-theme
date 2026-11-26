<template>
  <UserShell :show-footer="false">
    <section class="auth">
      <div class="auth__bg" aria-hidden="true">
        <span class="auth__glow"></span>
        <span class="auth__grid"></span>
      </div>

      <div class="st-shell auth__wrap">
        <div class="auth__card st-card">
          <nav v-if="showTabs" class="auth__tabs" role="tablist">
            <router-link to="/login" class="auth__tab" :class="{ 'auth__tab--on': isLogin }" role="tab">
              {{ c('auth.tab.login') }}
            </router-link>
            <router-link to="/register" class="auth__tab" :class="{ 'auth__tab--on': !isLogin }" role="tab">
              {{ c('auth.tab.register') }}
            </router-link>
          </nav>

          <!-- key 绑定路由：切换时重新播放淡入，避免生硬跳变 -->
          <div :key="route.path" class="auth__body">
            <slot />
          </div>
        </div>

        <div v-if="$slots.footer" class="auth__footer">
          <slot name="footer" />
        </div>
        <p class="auth__legal">&copy; {{ currentYear }} {{ siteName }}</p>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores'
import UserShell from '@/components/shell/UserShell.vue'
import { useAuthCopy } from '@/composables/copy/auth'

const appStore = useAppStore()
const route = useRoute()
const { c } = useAuthCopy()
const showTabs = computed(() => route.path === '/login' || route.path === '/register')
const isLogin = computed(() => route.path === '/login')
const siteName = computed(() => appStore.siteName || 'Sub2API')
const currentYear = computed(() => new Date().getFullYear())

onMounted(() => {
  appStore.fetchPublicSettings?.()
})
</script>

<style scoped>
.auth {
  position: relative;
  min-height: calc(100vh - 62px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding-block: 24px;
  overflow: hidden;
}

/* 背景：柔光 + 网格（与首屏同一套语言） */
.auth__bg { position: absolute; inset: -60px 0 0 0; pointer-events: none; z-index: 0; }
.auth__glow {
  position: absolute;
  width: 900px; height: 620px;
  right: -180px; top: -260px;
  border-radius: 50%;
  background: var(--st-brand-soft);
  filter: blur(90px);
  opacity: 0.8;
}
.auth__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, var(--st-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--st-line) 1px, transparent 1px);
  background-size: 88px 88px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, #000 10%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, #000 10%, transparent 70%);
  opacity: 0.75;
}

.auth__wrap {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.auth__card {
  width: 100%;
  max-width: 420px;
  /* 高度固定：登录/注册来回切不跳动 */
  min-height: 452px;
  padding: clamp(22px, 3vw, 32px);
  box-shadow: var(--st-shadow-3), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  transition: min-height 220ms var(--st-ease);
}

.auth__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  animation: auth-swap 240ms var(--st-ease) both;
}
@keyframes auth-swap {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) { .auth__body { animation: none; } }

.auth__tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  margin-bottom: 24px;
  border-radius: 999px;
  border: 1px solid var(--st-line);
  background: var(--st-bg-soft);
}
.auth__tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  border-radius: 999px;
  font-size: 0.86rem;
  font-weight: 500;
  color: var(--st-ink-2);
  text-decoration: none;
  transition: color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease);
}
.auth__tab:hover { color: var(--st-ink); }
.auth__tab--on { background: var(--st-bg); color: var(--st-ink); box-shadow: var(--st-shadow-1); }

.auth__footer { margin-top: 14px; text-align: center; }
.auth__legal { margin: 16px 0 0; font-size: 0.76rem; color: var(--st-ink-3); }

@media (max-width: 480px) {
  .auth { padding-block: 16px; }
  .auth__wrap { padding-inline: 16px; }
  .auth__card { padding: 20px; border-radius: var(--st-r-md); min-height: 430px; }
}

/* 认证子页面通用排版 */
.auth__card :deep(.auth-form__head) { margin-bottom: 20px; }
.auth__card :deep(.auth-form__title) { margin: 0; }
.auth__card :deep(.auth-form__body) { display: flex; flex-direction: column; gap: 16px; }
.auth__card :deep(.auth-form__submit) { width: 100%; margin-top: 4px; }
.auth__card :deep(.auth-form__row) { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

.auth__card :deep(.auth-field) { display: flex; flex-direction: column; gap: 6px; }
.auth__card :deep(.auth-field__row) { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.auth__card :deep(.auth-field__control) { position: relative; }
.auth__card :deep(.auth-field__control-input) { width: 100%; padding-right: 46px; }
.auth__card :deep(.auth-field__eye) {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  display: inline-grid; place-items: center; width: 32px; height: 32px;
  border: 0; border-radius: 8px; background: none; color: var(--st-ink-3); cursor: pointer;
}
.auth__card :deep(.auth-field__eye:hover) { color: var(--st-ink); background: var(--st-bg-soft); }
.auth__card :deep(.auth-link) { font-size: 0.8rem; color: var(--st-ink-2); text-decoration: none; }
.auth__card :deep(.auth-link:hover) { color: var(--st-brand-text); }
</style>
