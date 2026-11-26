<template>
  <UserShell>
    <section class="auth">
      <div class="st-shell auth__grid">
        <div class="auth__art" aria-hidden="true">
          <MockApp />
        </div>
        <div class="auth__panel">
          <div class="auth__card st-card st-card--pad">
            <slot />
          </div>
          <div v-if="$slots.footer" class="auth__footer">
            <slot name="footer" />
          </div>
          <p class="auth__legal">
            &copy; {{ currentYear }} {{ siteName }}
          </p>
        </div>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import UserShell from '@/components/shell/UserShell.vue'
import MockApp from '@/components/shell/art/MockApp.vue'

const appStore = useAppStore()
const siteName = computed(() => appStore.siteName || 'Sub2API')
const currentYear = computed(() => new Date().getFullYear())

onMounted(() => {
  appStore.fetchPublicSettings?.()
})
</script>

<style scoped>
.auth { padding-block: clamp(28px, 5vw, 72px); min-height: calc(100vh - 60px); display: flex; align-items: center; }
.auth__grid { display: grid; grid-template-columns: 1fr; gap: clamp(28px, 5vw, 72px); align-items: center; width: 100%; }
.auth__art { display: none; min-width: 0; }
.auth__panel { width: 100%; max-width: 460px; margin-inline: auto; }
.auth__card { padding: clamp(22px, 3vw, 34px); }

/* 认证表单在各子页面里的通用排版（子页面不再自带样式） */
.auth__card :deep(.auth-form__head) { margin-bottom: 22px; }
.auth__card :deep(.auth-form__title) { margin: 0; }
.auth__card :deep(.auth-form__lede) { margin: 8px 0 0; }
.auth__card :deep(.auth-form__body) { display: flex; flex-direction: column; gap: 16px; }
.auth__card :deep(.auth-form__submit) { width: 100%; margin-top: 4px; }
.auth__card :deep(.auth-form__row) { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.auth__card :deep(.field) { display: flex; flex-direction: column; position: relative; }
.auth__card :deep(.field__control) { position: relative; }
.auth__card :deep(.field__icon) { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--st-ink-3); pointer-events: none; }
.auth__card :deep(.field__action) { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); display: inline-grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: 6px; background: none; color: var(--st-ink-3); cursor: pointer; }
.auth__card :deep(.field__action:hover) { color: var(--st-ink); background: var(--st-bg-soft); }
.auth__card :deep(.field .st-input) { width: 100%; }

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
.auth__footer { margin-top: 16px; text-align: center; }
.auth__legal { margin: 18px 0 0; text-align: center; font-size: 0.76rem; color: var(--st-ink-3); }

@media (min-width: 960px) {
  .auth__grid { grid-template-columns: 1fr 1fr; }
  .auth__art { display: block; }
  .auth__panel { margin-inline: 0; }
}
</style>
