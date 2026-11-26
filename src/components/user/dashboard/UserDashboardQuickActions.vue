<template>
  <aside class="dash-quick st-card st-card--pad st-card--halo">
    <header class="dash-quick__head">
      <p class="st-eyebrow">{{ c('usercore.dash.quickTitle') }}</p>
      <h2 class="st-display-3">{{ c('usercore.dash.quickTitle') }}</h2>
      <p class="st-body dash-quick__lede">{{ c('usercore.dash.quickLede') }}</p>
    </header>

    <ul class="dash-quick__list">
      <li v-for="item in actions" :key="item.to">
        <button type="button" class="dash-quick__item" @click="router.push(item.to)">
          <span class="dash-quick__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6">
              <path v-for="(d, i) in item.paths" :key="i" :d="d" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="dash-quick__copy">
            <span class="dash-quick__title">{{ item.title }}</span>
            <span class="dash-quick__body">{{ item.body }}</span>
          </span>
          <svg class="dash-quick__arrow" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="M7 4.5L12.5 10 7 15.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </li>
    </ul>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBatchImageAccess } from '@/composables/useBatchImageAccess'
import { useAppStore } from '@/stores/app'
import { useUserCoreCopy } from '@/composables/copy/userCore'

const router = useRouter()
const appStore = useAppStore()
const { c } = useUserCoreCopy()
const { canUseBatchImage, refreshBatchImageAccess } = useBatchImageAccess()

const subscriptionsEnabled = computed(() => appStore.cachedPublicSettings?.subscription_enabled !== false)

const actions = computed(() => {
  const items = [
    {
      to: '/keys',
      title: c('usercore.dash.quickKeyTitle'),
      body: c('usercore.dash.quickKeyBody'),
      paths: ['M14.5 4.5l5 5-3 3-1.5-1.5M7.5 9.5l-3 3 2 2 3-3', 'M9.5 3.5l3 3M3.5 12.5l3 3', 'M16 16l3 3'],
    },
    {
      to: '/usage',
      title: c('usercore.dash.quickUsageTitle'),
      body: c('usercore.dash.quickUsageBody'),
      paths: ['M4 19V5', 'M4 19h16', 'M8 15l3.5-4 3 2.5L20 8'],
    },
  ]
  if (subscriptionsEnabled.value) {
    items.push({
      to: '/subscriptions',
      title: c('usercore.dash.quickPlanTitle'),
      body: c('usercore.dash.quickPlanBody'),
      paths: ['M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z'],
    })
  }
  items.push({
    to: '/redeem',
    title: c('usercore.dash.quickRedeemTitle'),
    body: c('usercore.dash.quickRedeemBody'),
    paths: ['M4 9h16v11H4z', 'M2 6h20v3H2z', 'M12 6v14', 'M12 6c-1.5-2-4.5-2.5-4.5-.5S10 6 12 6z', 'M12 6c1.5-2 4.5-2.5 4.5-.5S14 6 12 6z'],
  })
  if (canUseBatchImage.value) {
    items.push({
      to: '/batch-image',
      title: c('usercore.dash.quickBatchTitle'),
      body: c('usercore.dash.quickBatchBody'),
      paths: ['M4 5h16v14H4z', 'M4 15l4-4 3.5 3.5L15 10l5 5', 'M15.5 8.5h.01'],
    })
  }
  return items
})

onMounted(() => {
  void refreshBatchImageAccess()
})
</script>

<style scoped>
.dash-quick { display: flex; flex-direction: column; gap: 16px; }
.dash-quick__head { display: flex; flex-direction: column; gap: 8px; }
.dash-quick__head .st-display-3 { margin-top: 2px; }
.dash-quick__lede { font-size: 0.86rem; }

.dash-quick__list { display: flex; flex-direction: column; gap: 2px; }
.dash-quick__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 10px;
  border: 0;
  border-radius: var(--st-radius-md);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--st-dur) var(--st-ease), transform var(--st-dur-fast) var(--st-ease);
}
.dash-quick__item:hover { background: color-mix(in srgb, var(--st-accent) 6%, transparent); transform: translateX(2px); }
.dash-quick__item:focus-visible { outline: 2px solid var(--st-accent); outline-offset: 2px; }
.dash-quick__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: none;
  border-radius: 12px;
  border: 1px solid var(--st-line);
  background: var(--st-bg-sunk);
  color: var(--st-accent);
}
.dash-quick__copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.dash-quick__title { font-size: 0.9rem; font-weight: 550; color: var(--st-ink); }
.dash-quick__body { font-size: 0.76rem; color: var(--st-ink-faint); }
.dash-quick__arrow { margin-left: auto; color: var(--st-ink-faint); flex: none; transition: transform var(--st-dur) var(--st-ease); }
.dash-quick__item:hover .dash-quick__arrow { transform: translateX(2px); color: var(--st-accent); }
</style>

