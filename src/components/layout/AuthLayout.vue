<template>
  <div class="st-root st-grain auth-root">
    <div class="st-atmos" aria-hidden="true">
      <span class="st-aurora st-aurora--a"></span>
      <span class="st-aurora st-aurora--b"></span>
      <span class="st-aurora st-aurora--c"></span>
    </div>

    <div class="auth-grid">
      <!-- 左：品牌叙事 -->
      <aside class="auth-intro">
        <div class="auth-intro__inner">
          <router-link to="/" class="auth-brand st-reveal">
            <span class="auth-brand__mark">
              <img v-if="siteLogo" :src="siteLogo" :alt="siteName" />
              <span v-else class="auth-brand__glyph" aria-hidden="true">{{ monogram }}</span>
            </span>
            <span class="auth-brand__text">
              <strong>{{ siteName }}</strong>
              <small v-if="siteSubtitle">{{ siteSubtitle }}</small>
            </span>
          </router-link>

          <AuthAside />

          <p class="auth-intro__note st-reveal" style="--i: 5">{{ c('auth.shell.legal') }}</p>
        </div>
      </aside>

      <!-- 右：表单 -->
      <section class="auth-panel">
        <div class="auth-panel__inner">
          <router-link to="/" class="auth-panel__brand">
            <span class="auth-brand__mark auth-brand__mark--sm">
              <img v-if="siteLogo" :src="siteLogo" :alt="siteName" />
              <span v-else class="auth-brand__glyph" aria-hidden="true">{{ monogram }}</span>
            </span>
            <strong>{{ siteName }}</strong>
          </router-link>

          <div class="auth-panel__card st-card st-card--pad st-reveal">
            <slot />
          </div>

          <div v-if="$slots.footer" class="auth-panel__footer st-reveal" style="--i: 1">
            <slot name="footer" />
          </div>

          <p class="auth-panel__copyright st-reveal" style="--i: 2">
            &copy; {{ currentYear }} {{ siteName }}
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'
import AuthAside from '@/components/auth/AuthAside.vue'
import { useAuthCopy } from '@/composables/copy/auth'

const appStore = useAppStore()
const { c } = useAuthCopy()

const siteName = computed(() => appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(
  () => appStore.cachedPublicSettings?.site_subtitle || 'Subscription to API Conversion Platform'
)
const monogram = computed(() => String(siteName.value || 'S').trim().charAt(0).toUpperCase())

const currentYear = computed(() => new Date().getFullYear())

onMounted(() => {
  appStore.fetchPublicSettings?.()
})
</script>

<style scoped>
.auth-root {
  min-height: 100vh;
}

.auth-grid {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 480px);
  align-items: center;
  gap: clamp(40px, 6vw, 88px);
  width: 100%;
  max-width: var(--st-max);
  margin-inline: auto;
  padding: clamp(24px, 3.2vw, 48px) var(--st-gutter);
}

/* ---------- 左栏 ---------- */
.auth-intro {
  min-width: 0;
}

.auth-intro__inner {
  display: flex;
  flex-direction: column;
  gap: clamp(18px, 2vw, 26px);
  max-width: 540px;
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--st-ink);
  align-self: flex-start;
}

.auth-brand__mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--st-radius-md);
  border: 1px solid var(--st-line);
  background: var(--st-bg-elev);
  box-shadow: var(--st-shadow-sm);
  overflow: hidden;
  flex: none;
}

.auth-brand__mark--sm {
  width: 34px;
  height: 34px;
  border-radius: var(--st-radius-sm);
}

.auth-brand__mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.auth-brand__glyph {
  font-family: var(--st-font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--st-accent);
}

.auth-brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  min-width: 0;
}

.auth-brand__text strong {
  font-family: var(--st-font-display);
  font-size: 0.98rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--st-ink-strong);
}

.auth-brand__text small {
  font-size: 0.76rem;
  color: var(--st-ink-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-intro__note {
  font-size: 0.76rem;
  line-height: 1.6;
  color: var(--st-ink-faint);
  max-width: 40ch;
}

/* ---------- 右栏 ---------- */
.auth-panel {
  display: flex;
  justify-content: center;
  min-width: 0;
}

.auth-panel__inner {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  max-width: 480px;
}

.auth-panel__brand {
  display: none;
}

.auth-panel__card {
  padding: clamp(24px, 2.6vw, 34px);
}

.auth-panel__footer {
  text-align: center;
  font-size: 0.9rem;
  color: var(--st-ink-soft);
}

.auth-panel__copyright {
  text-align: center;
  font-size: 0.74rem;
  color: var(--st-ink-faint);
}

@media (max-width: 980px) {
  .auth-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    align-items: start;
    padding-block: clamp(24px, 6vw, 48px);
  }

  .auth-intro {
    display: none;
  }

  .auth-panel {
    justify-content: center;
  }

  .auth-panel__brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    align-self: center;
    text-decoration: none;
    color: var(--st-ink-strong);
    font-family: var(--st-font-display);
    font-size: 0.95rem;
    font-weight: 600;
  }

  .auth-panel__inner {
    max-width: 520px;
  }
}
</style>

<style>
/* 认证页表单的公共零件（AuthLayout 是唯一入口，放这里有意识地保持一处维护） */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.auth-form__head {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.auth-form__title {
  margin: 0;
}

.auth-form__lede {
  margin: 0;
  max-width: 42ch;
}

.auth-form__body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.auth-field {
  display: flex;
  flex-direction: column;
}

.auth-field__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.auth-field__row .st-label {
  margin-bottom: 8px;
}

.auth-field__control {
  position: relative;
}

.auth-field__control-input {
  padding-right: 46px;
}

.auth-field__eye {
  position: absolute;
  top: 50%;
  right: 6px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--st-ink-faint);
  cursor: pointer;
  transform: translateY(-50%);
  transition: color var(--st-dur) var(--st-ease), background-color var(--st-dur) var(--st-ease);
}

.auth-field__eye:hover {
  color: var(--st-ink);
  background: var(--st-accent-soft);
}

.auth-field__eye:focus-visible {
  outline: 2px solid var(--st-accent);
  outline-offset: 2px;
}

.auth-field__hint {
  margin-top: 6px;
  font-size: 0.78rem;
  color: var(--st-ink-faint);
}

.auth-field__error {
  margin-top: 6px;
  font-size: 0.78rem;
  color: #e0554d;
}

.auth-form__submit {
  width: 100%;
}

.auth-spinner {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  animation: auth-spin 0.9s linear infinite;
}

@keyframes auth-spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-alt {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 2px;
}

.auth-alt__rule {
  margin: 0;
}

.auth-alt__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.auth-alt__btn {
  width: 100%;
}

.auth-captcha {
  display: flex;
  justify-content: center;
}

.auth-link {
  color: var(--st-accent);
  font-size: 0.82rem;
  font-weight: 550;
  text-decoration: none;
  transition: opacity var(--st-dur) var(--st-ease);
}

.auth-link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.auth-foot {
  margin: 0;
  font-size: 0.88rem;
  color: var(--st-ink-soft);
}

.auth-note {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--st-ink-faint);
}

.auth-choice {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.auth-choice__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  padding: 14px 16px;
  border-radius: var(--st-radius-md);
  border: 1px solid var(--st-line);
  background: var(--st-bg-elev);
  color: var(--st-ink);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--st-dur) var(--st-ease), transform var(--st-dur-fast) var(--st-ease),
    background-color var(--st-dur) var(--st-ease);
}

.auth-choice__item:hover {
  border-color: var(--st-accent-line);
  background: color-mix(in srgb, var(--st-accent) 5%, var(--st-bg-elev));
  transform: translateY(-1px);
}

.auth-choice__title {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--st-ink-strong);
}

.auth-choice__meta {
  font-size: 0.78rem;
  color: var(--st-ink-faint);
}

.auth-facts {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 16px 18px;
  border-radius: var(--st-radius-md);
  background: var(--st-bg-sunk);
  border: 1px solid var(--st-line);
  list-style: none;
}

.auth-facts li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  font-size: 0.84rem;
  color: var(--st-ink-soft);
}

.auth-facts li strong {
  font-weight: 550;
  color: var(--st-ink);
}

.auth-code-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--st-radius-sm);
  border: 1px solid var(--st-line);
  background: var(--st-bg-sunk);
}

.auth-code-row .st-code {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  padding: 0;
}

.auth-code-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--st-ink);
  font-family: var(--st-font-mono);
  font-size: 0.82rem;
  letter-spacing: 0.02em;
  outline: none;
}

.auth-field__badge {
  position: absolute;
  top: 50%;
  right: 12px;
  display: grid;
  place-items: center;
  color: var(--st-ink-faint);
  transform: translateY(-50%);
}

.auth-field__badge--ok {
  color: var(--st-accent);
}

/* 与 simple-theme 的 .st-input--error 同色（主题未单独暴露 error token） */
.auth-field__badge--bad {
  color: #e0554d;
}

.auth-field__opt {
  margin-left: 6px;
  font-size: 0.74rem;
  font-weight: 400;
  color: var(--st-ink-faint);
}

.auth-field__ok {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: var(--st-accent);
}

.st-input--ok {
  border-color: var(--st-accent-line);
}

.auth-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: var(--st-radius-md);
  border: 1px solid var(--st-line-strong);
  background: var(--st-bg-sunk);
}

.auth-notice p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--st-ink-soft);
}

.auth-notice svg {
  flex: none;
  margin-top: 2px;
  color: var(--st-ink-faint);
}

.auth-notice--warn {
  border-color: color-mix(in srgb, var(--st-ink) 22%, transparent);
}

.auth-frequency {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--st-ink-faint);
}

.auth-rule {
  flex: 1;
  height: 1px;
  background: var(--st-line);
}

.auth-status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding: 20px;
  border-radius: var(--st-radius-md);
  border: 1px solid var(--st-line);
  background: var(--st-bg-sunk);
}

.auth-status__spinner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--st-line-strong);
  border-top-color: var(--st-accent);
  animation: auth-spin 0.9s linear infinite;
}

.auth-status__title {
  margin: 0;
  font-size: 0.94rem;
  font-weight: 600;
  color: var(--st-ink-strong);
}

.auth-status__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}
</style>
