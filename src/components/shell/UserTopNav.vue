<template>
  <header class="st-nav" :class="{ 'st-nav--scrolled': scrolled }">
    <div class="st-shell st-nav__inner">
      <router-link to="/home" class="st-brand">
        <span class="st-brand__mark">
          <img v-if="siteLogo" :src="siteLogo" alt="" />
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 15.5c3.4 0 4.6-1.4 6.3-4.1C13 8.4 14.4 6 17.6 6" />
            <path d="M5 18.5c2.2 0 3.3-.9 4.4-2.6" opacity=".55" />
            <circle cx="18.5" cy="6" r="1.6" />
          </svg>
        </span>
        <span class="st-brand__name">{{ siteName }}</span>
      </router-link>

      <nav class="st-nav__links" aria-label="primary">
        <router-link v-for="item in links" :key="item.to" :to="item.to" class="st-nav__link">{{ item.label }}</router-link>
      </nav>

      <div class="st-nav__right">
        <router-link v-if="user" to="/dashboard" class="st-balance" :title="c('nav.balance')">
          <span class="st-balance__dot"></span>
          <span class="st-num">{{ money }}</span>
        </router-link>

        <LocaleSwitcher />

        <button class="st-icon-btn" type="button" :aria-label="c('nav.theme')" @click="toggleTheme">
          <svg v-if="isDark" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <template v-if="user">
          <div class="st-account">
            <button class="st-avatar" type="button" :aria-label="c('account.profile')" @click="menuOpen = !menuOpen">{{ initial }}</button>
            <transition name="st-pop">
              <div v-if="menuOpen" class="st-menu">
                <div class="st-menu__head">
                  <p class="st-menu__name">{{ user.username || user.email }}</p>
                  <p class="st-menu__mail">{{ user.email }}</p>
                </div>
                <router-link v-for="m in accountMenu" :key="m.to" :to="m.to" class="st-menu__item" @click="menuOpen = false">{{ m.label }}</router-link>
                <button class="st-menu__item st-menu__item--danger" type="button" @click="signOut">{{ c('account.logout') }}</button>
              </div>
            </transition>
          </div>
        </template>
        <template v-else>
          <router-link to="/login" class="st-btn st-btn--ghost st-btn--sm st-hide-sm">{{ c('nav.login') }}</router-link>
          <router-link to="/register" class="st-btn st-btn--primary st-btn--sm">{{ c('nav.signup') }}</router-link>
        </template>

        <button class="st-icon-btn st-show-sm" type="button" :aria-label="c('nav.menu')" @click="sheetOpen = !sheetOpen">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6">
            <path v-if="!sheetOpen" d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
            <path v-else d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <transition name="st-sheet">
      <div v-if="sheetOpen" class="st-sheet">
        <router-link v-for="item in links" :key="item.to" :to="item.to" class="st-sheet__link" @click="sheetOpen = false">{{ item.label }}</router-link>
        <div class="st-sheet__foot">
          <template v-if="!user">
            <router-link to="/login" class="st-btn st-btn--quiet st-btn--sm" @click="sheetOpen = false">{{ c('nav.login') }}</router-link>
            <router-link to="/register" class="st-btn st-btn--primary st-btn--sm" @click="sheetOpen = false">{{ c('nav.signup') }}</router-link>
          </template>
          <template v-else>
            <router-link v-for="m in accountMenu" :key="m.to" :to="m.to" class="st-sheet__link st-sheet__link--sub" @click="sheetOpen = false">{{ m.label }}</router-link>
          </template>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore, useAuthStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { useSimpleCopy } from '@/composables/useSimpleCopy'
import { formatCurrency } from '@/utils/format'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const { c } = useSimpleCopy()

const user = computed(() => authStore.user)
const siteName = computed(() => appStore.siteName || 'Sub2API')
const siteLogo = computed(() => appStore.siteLogo || '')
const initial = computed(() => String(user.value?.username || user.value?.email || '?').trim().charAt(0).toUpperCase())
const money = computed(() => formatCurrency(user.value?.balance ?? 0))
const isDark = ref(typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
const scrolled = ref(false)
const menuOpen = ref(false)
const sheetOpen = ref(false)

const links = computed(() => {
  const settings = appStore.cachedPublicSettings
  const items = [
    { to: '/dashboard', label: c('nav.overview') },
    { to: '/keys', label: c('nav.passes') },
    { to: '/usage', label: c('nav.usage') },
  ]
  if (settings?.subscription_enabled !== false) items.push({ to: '/subscriptions', label: c('nav.plans') })
  if (settings?.model_plaza_enabled) items.push({ to: '/model-plaza', label: c('nav.models') })
  if (settings?.available_channels_enabled) items.push({ to: '/available-channels', label: c('nav.channels') })
  return items
})

const accountMenu = computed(() => {
  const items = [{ to: '/profile', label: c('account.profile') }]
  if (appStore.cachedPublicSettings?.affiliate_enabled) items.push({ to: '/affiliate', label: c('account.affiliate') })
  if (appStore.cachedPublicSettings?.mcp_enabled) items.push({ to: '/mcp', label: c('account.mcp') })
  if (authStore.isAdmin) items.push({ to: '/admin/dashboard', label: c('account.admin') })
  return items
})

function toggleTheme() {
  const root = document.documentElement
  const next = !root.classList.contains('dark')
  root.classList.toggle('dark', next)
  localStorage.setItem('theme', next ? 'dark' : 'light')
  isDark.value = next
}

function onScroll() { scrolled.value = window.scrollY > 6 }

async function signOut() {
  menuOpen.value = false
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.st-nav { position: sticky; top: 0; z-index: 40; border-bottom: 1px solid transparent; transition: background-color var(--st-dur) var(--st-ease), backdrop-filter var(--st-dur) var(--st-ease); }
.st-nav--scrolled { background: color-mix(in srgb, var(--st-bg) 78%, transparent); backdrop-filter: blur(16px) saturate(150%); border-bottom-color: var(--st-line); }
.st-nav__inner { display: flex; align-items: center; gap: 18px; height: 72px; }
.st-brand { display: inline-flex; align-items: center; gap: 10px; color: var(--st-ink); text-decoration: none; font-weight: 600; letter-spacing: -0.02em; flex-shrink: 0; }
.st-brand__mark { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; border: 1px solid var(--st-line); background: var(--st-bg-elev); color: var(--st-accent); }
.st-brand__mark img { width: 20px; height: 20px; object-fit: contain; }
.st-brand__mark svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; }
.st-brand__name { font-size: 0.98rem; }
.st-nav__links { display: none; gap: 4px; margin-inline: 10px; }
.st-nav__link { padding: 8px 12px; border-radius: 999px; font-size: 0.88rem; color: var(--st-ink-soft); text-decoration: none; transition: color var(--st-dur) var(--st-ease), background-color var(--st-dur) var(--st-ease); }
.st-nav__link:hover { color: var(--st-ink); background: var(--st-accent-soft); }
.st-nav__link.router-link-active { color: var(--st-ink); background: var(--st-accent-soft); }
.st-nav__right { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.st-balance { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding-inline: 12px; border-radius: 999px; border: 1px solid var(--st-line); background: var(--st-bg-elev); font-size: 0.8rem; font-weight: 550; color: var(--st-ink); text-decoration: none; transition: border-color var(--st-dur) var(--st-ease), transform var(--st-dur-fast) var(--st-ease); }
.st-balance:hover { border-color: var(--st-accent-line); transform: translateY(-1px); }
.st-balance__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--st-accent); box-shadow: 0 0 0 3px var(--st-accent-soft); }
.st-account { position: relative; }
.st-avatar { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--st-line-strong); background: var(--st-accent-soft); color: var(--st-ink); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: transform var(--st-dur-fast) var(--st-ease), border-color var(--st-dur) var(--st-ease); }
.st-avatar:hover { transform: translateY(-1px); border-color: var(--st-accent-line); }
.st-menu { position: absolute; top: 44px; right: 0; min-width: 210px; padding: 8px; border-radius: var(--st-radius-md); border: 1px solid var(--st-line); background: var(--st-bg-elev); box-shadow: var(--st-shadow-md); z-index: 50; }
.st-menu__head { padding: 8px 10px 10px; border-bottom: 1px solid var(--st-line); margin-bottom: 6px; }
.st-menu__name { font-size: 0.86rem; font-weight: 600; color: var(--st-ink); }
.st-menu__mail { font-size: 0.76rem; color: var(--st-ink-faint); margin-top: 2px; word-break: break-all; }
.st-menu__item { display: block; width: 100%; text-align: left; padding: 9px 10px; border-radius: 9px; font-size: 0.86rem; color: var(--st-ink-soft); text-decoration: none; background: none; border: 0; cursor: pointer; transition: background-color var(--st-dur-fast) var(--st-ease), color var(--st-dur-fast) var(--st-ease); }
.st-menu__item:hover { background: var(--st-accent-soft); color: var(--st-ink); }
.st-menu__item--danger:hover { background: rgba(224, 85, 77, 0.1); color: #e0554d; }
.st-sheet { position: absolute; inset: 72px 0 auto; padding: 12px var(--st-gutter) 20px; background: color-mix(in srgb, var(--st-bg) 96%, transparent); backdrop-filter: blur(20px); border-bottom: 1px solid var(--st-line); display: flex; flex-direction: column; gap: 2px; }
.st-sheet__link { padding: 12px 6px; font-size: 1rem; color: var(--st-ink); text-decoration: none; border-radius: 10px; }
.st-sheet__link--sub { font-size: 0.9rem; color: var(--st-ink-soft); }
.st-sheet__foot { display: flex; gap: 10px; padding-top: 12px; margin-top: 8px; border-top: 1px solid var(--st-line); flex-wrap: wrap; }
.st-show-sm { display: inline-grid; }
.st-hide-sm { display: none; }
.st-pop-enter-active, .st-pop-leave-active { transition: opacity var(--st-dur-fast) var(--st-ease), transform var(--st-dur-fast) var(--st-ease); }
.st-pop-enter-from, .st-pop-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }
.st-sheet-enter-active, .st-sheet-leave-active { transition: opacity var(--st-dur) var(--st-ease), transform var(--st-dur) var(--st-ease); }
.st-sheet-enter-from, .st-sheet-leave-to { opacity: 0; transform: translateY(-8px); }
@media (min-width: 960px) {
  .st-nav__links { display: flex; }
  .st-show-sm { display: none; }
  .st-hide-sm { display: inline-flex; }
}
</style>
