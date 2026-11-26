<template>
  <UserShell>
    <section class="st-section--tight doc">
      <div class="st-shell">
        <!-- 加载 -->
        <div v-if="loading" class="doc__loading" aria-busy="true">
          <div class="st-skeleton doc__sk-title"></div>
          <div class="st-skeleton doc__sk-line"></div>
          <div class="st-skeleton doc__sk-line doc__sk-line--short"></div>
          <div class="st-skeleton doc__sk-body"></div>
        </div>

        <!-- 加载失败 -->
        <div v-else-if="loadError" class="st-card doc__state" role="alert">
          <span class="doc__state-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M12 8v5M12 16.5v.5" stroke-linecap="round" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <p class="st-eyebrow">{{ c('legal.eyebrow') }}</p>
          <h1 class="st-display-2 doc__state-title">{{ c('legal.loadFailed') }}</h1>
          <p class="st-body">{{ c('legal.retryLater') }}</p>
          <button type="button" class="st-btn st-btn--primary st-btn--sm" @click="loadSettings">
            {{ c('action.retry') }}
          </button>
        </div>

        <!-- 文档不存在 -->
        <div v-else-if="!currentDocument" class="st-card doc__state">
          <span class="doc__state-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M6 4h9l4 4v12H6z" stroke-linejoin="round" />
              <path d="M9 11h6M9 15h4" stroke-linecap="round" />
            </svg>
          </span>
          <p class="st-eyebrow">{{ c('legal.eyebrow') }}</p>
          <h1 class="st-display-2 doc__state-title">{{ c('legal.notFound') }}</h1>
          <p class="st-body">{{ c('legal.notFoundDescription') }}</p>
          <router-link to="/home" class="st-btn st-btn--quiet st-btn--sm">{{ c('legal.backHome') }}</router-link>
        </div>

        <!-- 正文 -->
        <article v-else class="doc__layout">
          <aside v-if="tocItems.length > 1" class="doc__toc st-reveal">
            <p class="doc__toc-label">{{ c('legal.toc') }}</p>
            <nav class="doc__toc-nav">
              <a
                v-for="item in tocItems"
                :key="item.id"
                :href="'#' + item.id"
                class="doc__toc-link"
                :class="[`doc__toc-link--l${item.level}`, { 'doc__toc-link--active': activeId === item.id }]"
              >{{ item.text }}</a>
            </nav>
          </aside>

          <div class="doc__main st-reveal" style="--i: 1">
            <header class="doc__head">
              <p class="st-eyebrow">{{ documentTypeLabel }}</p>
              <h1 class="st-display-2 doc__title">{{ currentDocument.title }}</h1>
              <p class="doc__meta">
                <span v-if="updatedAt">{{ t('legal.updatedAt', { date: updatedAt }) }}</span>
                <span v-else>{{ c('legal.readingHint') }}</span>
              </p>
            </header>

            <div v-if="hasContent" class="doc__body" v-html="renderedHtml"></div>
            <div v-else class="doc__empty">{{ c('legal.empty') }}</div>

            <footer class="doc__foot">
              <router-link to="/home" class="st-btn st-btn--ghost st-btn--sm">{{ c('legal.backHome') }}</router-link>
            </footer>
          </div>
        </article>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useI18n } from 'vue-i18n'
import UserShell from '@/components/shell/UserShell.vue'
import { getLocale } from '@/i18n'
import { useAppStore } from '@/stores/app'
import { useMiscCopy } from '@/composables/copy/misc'
import type { LoginAgreementDocument } from '@/types'
import zhAdminCompliance from '../../../docs/legal/admin-compliance.zh.md?raw'
import enAdminCompliance from '../../../docs/legal/admin-compliance.en.md?raw'

interface TocEntry {
  id: string
  text: string
  level: number
}

const route = useRoute()
const { t } = useI18n()
const { c } = useMiscCopy()
const appStore = useAppStore()
const settings = computed(() => appStore.cachedPublicSettings)
const loading = ref(!settings.value)
const loadError = ref(false)
const activeId = ref('')

marked.setOptions({
  breaks: true,
  gfm: true,
})

const documentId = computed(() => String(route.params.documentId || ''))
const isAdminComplianceDocument = computed(() => documentId.value === 'admin-compliance')
const documents = computed(() => settings.value?.login_agreement_documents ?? [])
const updatedAt = computed(() =>
  isAdminComplianceDocument.value ? '' : settings.value?.login_agreement_updated_at || ''
)
const documentTypeLabel = computed(() =>
  isAdminComplianceDocument.value ? t('legal.adminCompliance') : t('legal.loginAgreement')
)

const currentDocument = computed<LoginAgreementDocument | null>(() => {
  if (isAdminComplianceDocument.value) {
    return {
      id: 'admin-compliance',
      title: t('adminCompliance.title'),
      content_md: getLocale() === 'zh' ? zhAdminCompliance : enAdminCompliance
    }
  }
  const id = documentId.value
  if (!id) {
    return null
  }
  return documents.value.find((doc) => doc.id === id) ?? null
})

const hasContent = computed(() => Boolean(currentDocument.value?.content_md?.trim()))

const tocItems = computed<TocEntry[]>(() => renderedHtml.value.toc)
const renderedHtml = computed(() => {
  const content = currentDocument.value?.content_md?.trim() || ''
  if (!content) {
    return { html: '', toc: [] as TocEntry[] }
  }
  const raw = marked.parse(content) as string
  const sanitized = DOMPurify.sanitize(raw)
  // 为正文标题注入锚点并生成目录（纯展示用，不改动文档内容）
  const toc: TocEntry[] = []
  let index = 0
  const html = sanitized.replace(/<(h[1-3])[^>]*>([\s\S]*?)<\/h[1-3]>/gi, (_m, tag: string, inner: string) => {
    const level = Number(tag[1])
    const text = inner.replace(/<[^>]+>/g, '').trim()
    if (!text) return _m
    const slug = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '')
    const id = `sec-${slug || 'h'}-${index++}`
    toc.push({ id, text, level })
    return `<${tag} id="${id}">${inner}</${tag}>`
  })
  return { html, toc }
})

/** 滚动时点亮当前小节；只读 DOM，不改内容。 */
let observer: IntersectionObserver | null = null

function observeHeadings() {
  observer?.disconnect()
  if (typeof document === 'undefined') return
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('.doc__body [id^="sec-"]'))
  if (nodes.length === 0) return
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
      if (visible.length > 0) activeId.value = visible[0].target.id
    },
    { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
  )
  nodes.forEach((n) => observer?.observe(n))
}

async function loadSettings() {
  loadError.value = false
  loading.value = true
  try {
    const loadedSettings = await appStore.fetchPublicSettings()
    if (!loadedSettings) {
      loadError.value = true
    }
  } finally {
    loading.value = false
  }
  requestAnimationFrame(observeHeadings)
}

onMounted(() => {
  void loadSettings()
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.doc { padding-top: clamp(30px, 4vw, 56px); padding-bottom: clamp(64px, 9vw, 120px); }

.doc__layout { display: grid; grid-template-columns: 1fr; gap: clamp(24px, 4vw, 64px); align-items: start; }

.doc__toc {
  position: sticky;
  top: 96px;
  display: none;
  flex-direction: column;
  gap: 10px;
  padding-left: 2px;
}
.doc__toc-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--st-ink-faint);
}
.doc__toc-nav { display: flex; flex-direction: column; border-left: 1px solid var(--st-line); }
.doc__toc-link {
  padding: 5px 0 5px 12px;
  margin-left: -1px;
  border-left: 1px solid transparent;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--st-ink-faint);
  text-decoration: none;
  transition: color var(--st-t) var(--st-ease), border-color var(--st-t) var(--st-ease);
}
.doc__toc-link:hover { color: var(--st-ink); }
.doc__toc-link--active { color: var(--st-brand-text); border-left-color: var(--st-brand); }
.doc__toc-link--l2 { padding-left: 22px; }
.doc__toc-link--l3 { padding-left: 32px; font-size: 0.78rem; }

.doc__main { min-width: 0; max-width: 70ch; }
.doc__head { padding-bottom: clamp(20px, 3vw, 32px); border-bottom: 1px solid var(--st-line); }
.doc__title { margin-top: 14px; overflow-wrap: anywhere; }
.doc__meta { margin-top: 14px; font-size: 0.8rem; color: var(--st-ink-faint); }

.doc__body {
  margin-top: clamp(20px, 3vw, 32px);
  font-size: 1rem;
  line-height: 1.8;
  color: var(--st-ink-soft);
  overflow-wrap: anywhere;
  max-width: 68ch;
}

.doc__body :deep(h1),
.doc__body :deep(h2),
.doc__body :deep(h3),
.doc__body :deep(h4) {
  margin: 2.2em 0 0.7em;
  font-family: var(--st-font-display);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.28;
  color: var(--st-ink-strong);
  scroll-margin-top: 96px;
}
.doc__body :deep(h1) { font-size: 1.6rem; margin-top: 1.4em; }
.doc__body :deep(h2) { font-size: 1.28rem; }
.doc__body :deep(h3) { font-size: 1.08rem; }
.doc__body :deep(h4) { font-size: 1rem; }
.doc__body :deep(p) { margin: 0 0 1.1em; }
.doc__body :deep(a) { color: var(--st-brand-text); text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; }
.doc__body :deep(ul),
.doc__body :deep(ol) { margin: 0 0 1.1em; padding-left: 1.4em; }
.doc__body :deep(li) { margin-bottom: 0.4em; }
.doc__body :deep(strong) { color: var(--st-ink); font-weight: 600; }
.doc__body :deep(blockquote) {
  margin: 1.4em 0;
  padding: 2px 0 2px 16px;
  border-left: 2px solid var(--st-brand-line);
  color: var(--st-ink-soft);
}
.doc__body :deep(code) {
  font-family: var(--st-font-mono);
  font-size: 0.86em;
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--st-bg-sunk);
  border: 1px solid var(--st-line);
}
.doc__body :deep(pre) {
  margin: 1.4em 0;
  padding: 16px 18px;
  border-radius: var(--st-radius-md);
  border: 1px solid var(--st-line);
  background: var(--st-bg-sunk);
  overflow-x: auto;
}
.doc__body :deep(pre code) { padding: 0; border: 0; background: transparent; font-size: 0.82rem; line-height: 1.7; }
.doc__body :deep(table) { width: 100%; margin: 1.4em 0; border-collapse: collapse; font-size: 0.88rem; }
.doc__body :deep(th),
.doc__body :deep(td) { padding: 9px 12px; border-bottom: 1px solid var(--st-line); text-align: left; vertical-align: top; }
.doc__body :deep(th) { font-size: 0.76rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--st-ink-faint); }
.doc__body :deep(img) { max-width: 100%; height: auto; border-radius: var(--st-radius-md); }
.doc__body :deep(hr) { margin: 2.2em 0; border: 0; height: 1px; background: var(--st-line); }

.doc__foot { margin-top: clamp(32px, 5vw, 56px); padding-top: 20px; border-top: 1px solid var(--st-line); }

.doc__empty {
  margin-top: 28px;
  padding: 28px 20px;
  text-align: center;
  font-size: 0.9rem;
  color: var(--st-ink-faint);
  border: 1px dashed var(--st-line-strong);
  border-radius: var(--st-radius-md);
}

.doc__loading { display: flex; flex-direction: column; gap: 14px; max-width: 70ch; }
.doc__sk-title { height: 40px; width: 60%; }
.doc__sk-line { height: 14px; width: 100%; }
.doc__sk-line--short { width: 42%; }
.doc__sk-body { height: 260px; margin-top: 12px; }

.doc__state { max-width: 62ch; display: flex; flex-direction: column; gap: 12px; align-items: flex-start; padding: clamp(24px, 4vw, 40px); }
.doc__state-title { margin: 2px 0 0; }
.doc__state-mark {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid var(--st-line);
  background: var(--st-bg-soft);
  color: var(--st-ink-3);
}
.doc__foot .st-btn { min-height: 40px; }

@media (max-width: 720px) {
  .doc__toc-link { font-size: 0.85rem; }
  .doc__state .st-btn { min-height: 44px; }
  .doc__foot .st-btn { min-height: 44px; }
}

@media (max-width: 720px) {
  .doc__meta,
  .doc__state .st-eyebrow,
  .doc__toc-label { font-size: 12px; }
  .doc__body { font-size: 1rem; }
}

@media (min-width: 1000px) {
  .doc__layout { grid-template-columns: 208px minmax(0, 1fr); }
  .doc__toc { display: flex; }
}
</style>
