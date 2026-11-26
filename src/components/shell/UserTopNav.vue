<template>
  <header v-if="ready" class="nv" :class="{ 'nv--stuck': scrolled }">
    <div class="st-shell nv__in">
      <router-link to="/home" class="nv__brand">
        <span class="nv__mark">
          <img v-if="siteLogo" :src="siteLogo" alt="" />
          <svg v-else viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 14.2c2.9 0 3.9-1.2 5.4-3.5C10.9 8 12.1 5.8 15 5.8" />
            <path d="M4 16.6c1.9 0 2.8-.8 3.8-2.2" opacity=".45" />
            <circle cx="15.4" cy="5.8" r="1.35" />
          </svg>
        </span>
        <span class="nv__name">{{ siteName }}</span>
      </router-link>

      <nav class="nv__links" aria-label="primary">
        <router-link v-for="item in links" :key="item.to" :to="item.to" class="nv__link">{{ item.label }}</router-link>
      </nav>

      <div class="nv__right">
        <router-link v-if="user" to="/dashboard" class="nv__balance" :title="c('nav.balance')">{{ money }}</router-link>
        <LocaleSwitcher />
        <button class="st-icon-btn" type="button" :aria-label="c('nav.theme')" @click="toggleTheme">
          <svg v-if="isDark" viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="10" cy="10" r="3.4" />
            <path d="M10 1.6v1.6M10 16.8v1.6M1.6 10h1.6M16.8 10h1.6M4.1 4.1l1.1 1.1M14.8 14.8l1.1 1.1M15.9 4.1l-1.1 1.1M5.2 14.8l-1.1 1.1" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 11.9A7.4 7.4 0 1 1 8.1 3a5.9 5.9 0 0 0 8.9 8.9Z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <template v-if="user">
          <div class="nv__acct">
            <button class="nv__avatar" type="button" :aria-label="c('account.profile')" @click="menuOpen = !menuOpen">{{ initial }}</button>
            <transition name="pop">
              <div v-if="menuOpen" class="nv__menu">
                <div class="nv__menu-head">
                  <p class="nv__menu-name">{{ user.username || user.email }}</p>
                  <p class="nv__menu-mail">{{ user.email }}</p>
                </div>
                <router-link v-for="m in accountMenu" :key="m.to" :to="m.to" class="nv__menu-item" @click="menuOpen = false">{{ m.label }}</router-link>
                <button class="nv__menu-item nv__menu-item--danger" type="button" @click="signOut">{{ c('account.logout') }}</button>
              </div>
            </transition>
          </div>
        </template>
        <template v-else>
          <router-link to="/login" class="nv__login">{{ c('nav.login') }}</router-link>
          <router-link to="/register" class="st-btn st-btn--primary st-btn--sm">{{ c('nav.signup') }}</router-link>
        </template>

        <button class="st-icon-btn nv__burger" type="button" :aria-label="c('nav.menu')" @click="sheetOpen = !sheetOpen">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5">
            <path v-if="!sheetOpen" d="M3 6h14M3 10h14M3 14h14" stroke-linecap="round" />
            <path v-else d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <transition name="sheet">
      <div v-if="sheetOpen" class="nv__sheet">
        <router-link v-for="item in links" :key="item.to" :to="item.to" class="nv__sheet-link" @click="sheetOpen = false">{{ item.label }}</router-link>
        <div class="nv__sheet-foot">
          <template v-if="!user">
            <router-link to="/login" class="st-btn st-btn--quiet st-btn--sm" @click="sheetOpen = false">{{ c('nav.login') }}</router-link>
            <router-link to="/register" class="st-btn st-btn--primary st-btn--sm" @click="sheetOpen = false">{{ c('nav.signup') }}</router-link>
          </template>
          <template v-else>
            <router-link v-for="m in accountMenu" :key="m.to" :to="m.to" class="nv__sheet-link nv__sheet-link--sub" @click="sheetOpen = false">{{ m.label }}</router-link>
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

let router: ReturnType<typeof useRouter> | null = null
let authStore: ReturnType<typeof useAuthStore> | null = null
let appStore: ReturnType<typeof useAppStore> | null = null
try {
  router = useRouter()
  authStore = useAuthStore()
  appStore = useAppStore()
} catch {
  router = null
}
const ready = !!authStore && !!appStore
const { c } = useSimpleCopy()

const user = computed(() => authStore?.user ?? null)
const siteName = computed(() => appStore?.siteName || 'Sub2API')
const siteLogo = computed(() => appStore?.siteLogo || '')
const initial = computed(() => String(user.value?.username || user.value?.email || '?').trim().charAt(0).toUpperCase())
const money = computed(() => formatCurrency(user.value?.balance ?? 0))
const isDark = ref(typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
const scrolled = ref(false)
const menuOpen = ref(false)
const sheetOpen = ref(false)

const links = computed(() => {
  const settings = appStore?.cachedPublicSettings
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
  if (appStore?.cachedPublicSettings?.affiliate_enabled) items.push({ to: '/affiliate', label: c('account.affiliate') })
  if (appStore?.cachedPublicSettings?.mcp_enabled) items.push({ to: '/mcp', label: c('account.mcp') })
  if (authStore?.isAdmin) items.push({ to: '/admin/dashboard', label: c('account.admin') })
  return items
})

function toggleTheme() {
  const root = document.documentElement
  const next = !root.classList.contains('dark')
  root.classList.toggle('dark', next)
  localStorage.setItem('theme', next ? 'dark' : 'light')
  isDark.value = next
}

function onScroll() { scrolled.value = window.scrollY > 4 }

async function signOut() {
  menuOpen.value = false
  await authStore?.logout()
  router?.push('/login')
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.nv {
  position: sticky;
  top: 0;
  z-index: 40;
  background: color-mix(in srgb, var(--st-bg) 86%, transparent);
  backdrop-filter: blur(12px) saturate(160%);
  border-bottom: 1px solid transparent;
  transition: border-color var(--st-t) var(--st-ease);
}
.nv--stuck { border-bottom-color: var(--st-line); }
.nv__in { display: flex; align-items: center; gap: 24px; height: 60px; }

.nv__brand { display: inline-flex; align-items: center; gap: 9px; text-decoration: none; color: var(--st-ink); flex-shrink: 0; }
.nv__mark { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 7px; background: var(--st-ink); color: var(--st-bg); }
.nv__mark img { width: 17px; height: 17px; object-fit: contain; }
.nv__mark svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; }
.nv__name { font-family: var(--st-font-display); font-size: 0.94rem; font-weight: 600; letter-spacing: -0.02em; }

.nv__links { display: none; align-items: center; gap: 2px; margin-left: 8px; }
.nv__link { padding: 6px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 450; color: var(--st-ink-2); text-decoration: none; transition: color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease); }
.nv__link:hover { color: var(--st-ink); background: var(--st-bg-soft); }
.nv__link.router-link-active { color: var(--st-ink); font-weight: 500; }

.nv__right { display: flex; align-items: center; gap: 4px; margin-left: auto; }
.nv__balance { font-size: 0.82rem; font-weight: 550; color: var(--st-ink); text-decoration: none; padding: 5px 9px; border-radius: 6px; font-variant-numeric: tabular-nums; transition: background-color var(--st-t) var(--st-ease); }
.nv__balance:hover { background: var(--st-bg-soft); }
.nv__login { display: none; font-size: 0.85rem; color: var(--st-ink-2); text-decoration: none; padding: 6px 10px; }
.nv__login:hover { color: var(--st-ink); }

.nv__acct { position: relative; }
.nv__avatar { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--st-line-2); background: var(--st-bg-soft); color: var(--st-ink); font-family: inherit; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: border-color var(--st-t) var(--st-ease); }
.nv__avatar:hover { border-color: var(--st-ink-3); }

.nv__menu { position: absolute; top: 38px; right: 0; min-width: 200px; padding: 5px; border-radius: var(--st-r-md); border: 1px solid var(--st-line); background: var(--st-bg); box-shadow: var(--st-shadow-3); z-index: 50; }
.nv__menu-head { padding: 9px 9px 10px; border-bottom: 1px solid var(--st-line); margin-bottom: 4px; }
.nv__menu-name { font-size: 0.83rem; font-weight: 600; color: var(--st-ink); }
.nv__menu-mail { margin-top: 1px; font-size: 0.74rem; color: var(--st-ink-3); word-break: break-all; }
.nv__menu-item { display: block; width: 100%; text-align: left; padding: 7px 9px; border-radius: 6px; border: 0; background: none; font-family: inherit; font-size: 0.84rem; color: var(--st-ink-2); text-decoration: none; cursor: pointer; transition: background-color var(--st-t-fast) var(--st-ease), color var(--st-t-fast) var(--st-ease); }
.nv__menu-item:hover { background: var(--st-bg-soft); color: var(--st-ink); }
.nv__menu-item--danger:hover { background: var(--st-danger-soft); color: var(--st-danger); }

.nv__burger { display: inline-grid; }
.nv__sheet { position: absolute; inset: 60px 0 auto; padding: 8px var(--st-gutter) 18px; background: var(--st-bg); border-bottom: 1px solid var(--st-line); display: flex; flex-direction: column; }
.nv__sheet-link { padding: 11px 4px; font-size: 0.95rem; color: var(--st-ink); text-decoration: none; border-bottom: 1px solid var(--st-line); }
.nv__sheet-link--sub { font-size: 0.86rem; color: var(--st-ink-2); border-bottom: 0; }
.nv__sheet-foot { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 12px; }

.pop-enter-active, .pop-leave-active { transition: opacity var(--st-t-fast) var(--st-ease), transform var(--st-t-fast) var(--st-ease); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-4px); }
.sheet-enter-active, .sheet-leave-active { transition: opacity var(--st-t) var(--st-ease), transform var(--st-t) var(--st-ease); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; transform: translateY(-6px); }

@media (min-width: 920px) {
  .nv__links { display: flex; }
  .nv__login { display: inline-block; }
  .nv__burger { display: none; }
}
</style>
