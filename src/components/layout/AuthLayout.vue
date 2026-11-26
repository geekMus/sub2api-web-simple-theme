<template>
  <UserShell>
    <section class="auth">
      <div class="st-shell auth__wrap">
        <div class="auth__card st-card">
          <slot />
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
import { useAppStore } from '@/stores'
import UserShell from '@/components/shell/UserShell.vue'

const appStore = useAppStore()
const siteName = computed(() => appStore.siteName || 'Sub2API')
const currentYear = computed(() => new Date().getFullYear())

onMounted(() => {
  appStore.fetchPublicSettings?.()
})
</script>

<style scoped>
.auth {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  padding-block: clamp(28px, 5vw, 64px);
}

.auth__wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.auth__card {
  width: 100%;
  max-width: 428px;
  padding: clamp(22px, 3.2vw, 34px);
  box-shadow: var(--st-shadow-2);
}

.auth__footer { margin-top: 14px; text-align: center; }
.auth__legal { margin: 18px 0 0; font-size: 0.76rem; color: var(--st-ink-3); }

/* 小屏：铺满可用宽度，压缩外留白 */
@media (max-width: 480px) {
  .auth { padding-block: 20px 32px; align-items: flex-start; }
  .auth__wrap { padding-inline: 16px; }
  .auth__card { padding: 20px; border-radius: var(--st-r-md); }
}

/* 认证子页面通用排版 */
.auth__card :deep(.auth-form__head) { margin-bottom: 22px; }
.auth__card :deep(.auth-form__title) { margin: 0; }
.auth__card :deep(.auth-form__lede) { margin: 8px 0 0; }
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
