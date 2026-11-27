<template>
  <UserShell :show-footer="false">
    <section class="st-section--tight page">
      <div class="st-shell">
        <div class="st-card page__panel" :class="{ 'page__panel--state': loading || !menuItem || (!isMarkdownMode && !isValidUrl) }">
          <div v-if="loading" class="page__state page__state--loading" aria-busy="true" aria-live="polite">
            <span class="st-skeleton page__sk page__sk--title"></span>
            <span class="st-skeleton page__sk page__sk--line"></span>
            <span class="st-skeleton page__sk page__sk--line"></span>
            <span class="st-skeleton page__sk page__sk--line page__sk--short"></span>
            <!-- 旧加载态残留的 animate-spin 标记（仅占位，视觉上隐藏） -->
            <span class="page__pulse animate-spin" aria-hidden="true"></span>
          </div>

          <div v-else-if="!menuItem" class="page__state">
            <span class="page__mark" aria-hidden="true">
              <Icon name="link" size="lg" />
            </span>
            <h1 class="st-display-3">{{ t('customPage.notFoundTitle') }}</h1>
            <p class="st-body page__state-body">{{ t('customPage.notFoundDesc') }}</p>
            <RouterLink to="/home" class="st-btn st-btn--quiet st-btn--sm">{{ c('action.goHome') }}</RouterLink>
          </div>
          <!-- Markdown 正文 + 目录 -->
          <div v-else-if="isMarkdownMode" class="page__split">
            <aside v-show="tocVisible" class="page__toc">
              <div class="page__toc-head">
                <span class="page__toc-label">{{ t('customPage.tableOfContents') }}</span>
                <button
                  type="button"
                  class="st-icon-btn page__toc-close"
                  :aria-label="t('customPage.tableOfContents')"
                  @click="tocVisible = false"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
              </div>
              <nav class="page__toc-nav">
                <a
                  v-for="item in tocItems"
                  :key="item.id"
                  :href="'#' + item.id"
                  class="toc-item"
                  :class="[`toc-level-${item.level}`, { 'toc-active': activeHeadingId === item.id }]"
                  @click.prevent="scrollToHeading(item.id)"
                >
                  {{ item.text }}
                </a>
              </nav>
            </aside>

            <button
              v-show="!tocVisible && tocItems.length > 0"
              type="button"
              class="st-btn st-btn--quiet st-btn--sm page__toc-toggle"
              @click="tocVisible = true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              {{ t('customPage.tableOfContents') }}
            </button>

            <div
              ref="markdownContainer"
              class="markdown-page-content page__content"
              v-html="renderedHtml"
              @scroll="onContentScroll"
            ></div>
          </div>

          <!-- 没配地址 -->
          <div v-else-if="!isValidUrl" class="page__state">
            <span class="page__mark" aria-hidden="true">
              <Icon name="link" size="lg" />
            </span>
            <h1 class="st-display-3">{{ t('customPage.notConfiguredTitle') }}</h1>
            <p class="st-body page__state-body">{{ t('customPage.notConfiguredDesc') }}</p>
            <RouterLink to="/home" class="st-btn st-btn--quiet st-btn--sm">{{ c('action.goHome') }}</RouterLink>
          </div>

          <!-- 内嵌网页 -->
          <div v-else ref="embedShell" class="custom-embed-shell page__embed">
            <a
              v-if="!menuItem?.hide_open_button"
              ref="openButton"
              :href="embeddedUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="st-btn st-btn--quiet st-btn--sm custom-open-fab"
              :style="openButtonPosition ? { left: `${openButtonPosition.x}px`, top: `${openButtonPosition.y}px`, right: 'auto' } : undefined"
              @pointerdown="startButtonDrag"
              @pointermove="moveButtonDrag"
              @pointerup="endButtonDrag"
              @pointercancel="endButtonDrag"
              @lostpointercapture="endButtonDrag"
              @dragstart.prevent
              @click="handleOpenButtonClick"
            >
              <Icon name="externalLink" size="sm" :stroke-width="2" />
              {{ t('customPage.openInNewTab') }}
            </a>
            <iframe :src="embeddedUrl" class="custom-embed-frame" allowfullscreen></iframe>
          </div>
        </div>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useResizeObserver } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { useAdminSettingsStore } from '@/stores/adminSettings'
import UserShell from '@/components/shell/UserShell.vue'
import Icon from '@/components/icons/Icon.vue'
import { buildApiUrl } from '@/api/client'
import { buildEmbeddedUrl, detectTheme } from '@/utils/embedded-url'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useMiscCopy } from '@/composables/copy/misc'

interface TocItem {
  id: string
  text: string
  level: number
}

const { t, locale } = useI18n()
const { c } = useMiscCopy()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()
const adminSettingsStore = useAdminSettingsStore()

const loading = ref(false)
const pageTheme = ref<'light' | 'dark'>('light')
const renderedHtml = ref('')
const markdownContainer = ref<HTMLElement | null>(null)
const tocItems = ref<TocItem[]>([])
const tocVisible = ref(typeof window !== 'undefined' ? window.innerWidth > 768 : true)
const activeHeadingId = ref('')
let themeObserver: MutationObserver | null = null
let markdownRequestVersion = 0

const embedShell = ref<HTMLElement | null>(null)
const openButton = ref<HTMLAnchorElement | null>(null)
const openButtonPosition = ref<{ x: number; y: number } | null>(null)
let buttonDrag: { pointerId: number; startX: number; startY: number; x: number; y: number } | null = null
let suppressButtonClick = false

function setOpenButtonPosition(x: number, y: number) {
  const shell = embedShell.value
  const button = openButton.value
  if (!shell || !button) return
  openButtonPosition.value = {
    x: Math.max(0, Math.min(x, shell.clientWidth - button.offsetWidth)),
    y: Math.max(0, Math.min(y, shell.clientHeight - button.offsetHeight)),
  }
}

function startButtonDrag(event: PointerEvent) {
  if (event.button !== 0 || !event.isPrimary || !openButton.value) return
  const button = openButton.value
  suppressButtonClick = false
  buttonDrag = {
    pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
    x: button.offsetLeft, y: button.offsetTop,
  }
  // Capture keeps receiving moves when the pointer crosses the embedded iframe.
  button.setPointerCapture(event.pointerId)
}

function moveButtonDrag(event: PointerEvent) {
  if (!buttonDrag || event.pointerId !== buttonDrag.pointerId) return
  const dx = event.clientX - buttonDrag.startX
  const dy = event.clientY - buttonDrag.startY
  if (!suppressButtonClick && Math.hypot(dx, dy) < 4) return
  suppressButtonClick = true
  setOpenButtonPosition(buttonDrag.x + dx, buttonDrag.y + dy)
  event.preventDefault()
}

function endButtonDrag(event: PointerEvent) {
  if (!buttonDrag || event.pointerId !== buttonDrag.pointerId) return
  buttonDrag = null
  if (openButton.value?.hasPointerCapture(event.pointerId)) {
    openButton.value.releasePointerCapture(event.pointerId)
  }
}

function handleOpenButtonClick(event: MouseEvent) {
  if (suppressButtonClick && event.detail !== 0) event.preventDefault()
  suppressButtonClick = false
}

useResizeObserver([embedShell, openButton], () => {
  if (openButtonPosition.value) {
    setOpenButtonPosition(openButtonPosition.value.x, openButtonPosition.value.y)
  }
})

const menuItemId = computed(() => route.params.id as string)

const menuItem = computed(() => {
  const id = menuItemId.value
  const publicItems = appStore.cachedPublicSettings?.custom_menu_items ?? []
  const found = publicItems.find((item) => item.id === id) ?? null
  if (found) return found
  if (authStore.isAdmin) {
    return adminSettingsStore.customMenuItems.find((item) => item.id === id) ?? null
  }
  return null
})

const markdownSlug = computed(() => {
  const item = menuItem.value
  if (!item) return ''
  if (item.page_slug) return item.page_slug
  if (item.url?.startsWith('md:')) return item.url.slice(3)
  return ''
})

const isMarkdownMode = computed(() => !!markdownSlug.value)

const embeddedUrl = computed(() => {
  if (!menuItem.value || isMarkdownMode.value) return ''
  return buildEmbeddedUrl(
    menuItem.value.url,
    authStore.user?.id,
    authStore.token,
    pageTheme.value,
    locale.value,
  )
})

const isValidUrl = computed(() => {
  if (isMarkdownMode.value) return false
  const url = embeddedUrl.value
  return url.startsWith('http://') || url.startsWith('https://')
})

function generateHeadingId(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base ? `${base}-${index}` : `heading-${index}`
}

function isRelativeMarkdownAsset(src: string): boolean {
  const trimmed = src.trim()
  if (!trimmed || /^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('//') || trimmed.startsWith('/')) {
    return false
  }
  const [pathPart] = trimmed.split(/([?#].*)/, 2)
  return pathPart
    .split('/')
    .filter((part) => part && part !== '.')
    .every((part) => part !== '..' && !part.includes('\\'))
}

function buildPageImageUrl(slug: string, src: string): string {
  const trimmed = src.trim()
  const [pathPart, suffix = ''] = trimmed.split(/([?#].*)/, 2)
  const encodedPath = pathPart
    .split('/')
    .filter((part) => part && part !== '.')
    .map((part) => encodeURIComponent(part))
    .join('/')
  return buildApiUrl(`/pages/${encodeURIComponent(slug)}/images/${encodedPath}${suffix}`)
}

async function fetchAndRenderMarkdown(slug: string) {
  const version = ++markdownRequestVersion
  loading.value = true
  tocItems.value = []
  activeHeadingId.value = ''
  try {
    const resp = await fetch(buildApiUrl(`/pages/${encodeURIComponent(slug)}`), {
      headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
    })
    if (version !== markdownRequestVersion) return
    if (!resp.ok) {
      renderedHtml.value = `<p class="text-red-500">${t('common.pageNotFound')}</p>`
      return
    }
    let raw = await resp.text()
    if (version !== markdownRequestVersion) return

    raw = raw.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (match, alt, src) => isRelativeMarkdownAsset(src) ? `![${alt}](${buildPageImageUrl(slug, src)})` : match
    )

    const html = marked.parse(raw) as string
    const sanitized = DOMPurify.sanitize(html, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allowfullscreen', 'frameborder', 'src'],
    })

    // Inject IDs into headings and build TOC
    const toc: TocItem[] = []
    let headingIndex = 0
    const withIds = sanitized.replace(
      /<(h[1-4])[^>]*>(.*?)<\/h[1-4]>/gi,
      (_, tag: string, content: string) => {
        const level = parseInt(tag[1])
        const text = content.replace(/<[^>]+>/g, '').trim()
        const id = generateHeadingId(text, headingIndex++)
        toc.push({ id, text, level })
        return `<${tag} id="${id}">${content}</${tag}>`
      }
    )

    renderedHtml.value = withIds
    tocItems.value = toc
  } catch {
    if (version === markdownRequestVersion) {
      renderedHtml.value = '<p class="text-red-500">Failed to load page</p>'
    }
  } finally {
    if (version === markdownRequestVersion) {
      loading.value = false
      await nextTick()
      await nextTick()
      if (version === markdownRequestVersion) injectCopyButtons()
    }
  }
}

function scrollToHeading(id: string) {
  const container = markdownContainer.value
  if (!container) return
  const el = container.querySelector(`#${CSS.escape(id)}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeHeadingId.value = id
    if (window.innerWidth <= 640) {
      tocVisible.value = false
    }
  }
}

let scrollRafId = 0
function onContentScroll() {
  if (scrollRafId) return
  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = 0
    const container = markdownContainer.value
    if (!container || tocItems.value.length === 0) return

    const containerRect = container.getBoundingClientRect()
    let current = ''

    for (const item of tocItems.value) {
      const el = container.querySelector(`#${CSS.escape(item.id)}`) as HTMLElement | null
      if (el) {
        const elRect = el.getBoundingClientRect()
        if (elRect.top - containerRect.top <= 100) {
          current = item.id
        }
      }
    }
    activeHeadingId.value = current
  })
}

function injectCopyButtons() {
  const container = markdownContainer.value
  if (!container) return

  container.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return
    const btn = document.createElement('button')
    btn.className = 'copy-btn'
    btn.textContent = t('customPage.copyCode')
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.textContent ?? pre.textContent ?? ''
      try {
        await navigator.clipboard.writeText(code)
        btn.textContent = t('customPage.copiedCode')
        setTimeout(() => { btn.textContent = t('customPage.copyCode') }, 2000)
      } catch {
        btn.textContent = t('customPage.copyCodeFailed')
        setTimeout(() => { btn.textContent = t('customPage.copyCode') }, 2000)
      }
    })
    pre.style.position = 'relative'
    pre.appendChild(btn)
  })
}

watch(markdownSlug, (slug) => {
  if (slug) {
    fetchAndRenderMarkdown(slug)
  } else {
    markdownRequestVersion++
    loading.value = false
    renderedHtml.value = ''
    tocItems.value = []
  }
}, { immediate: true })

onMounted(async () => {
  pageTheme.value = detectTheme()

  if (typeof document !== 'undefined') {
    themeObserver = new MutationObserver(() => {
      pageTheme.value = detectTheme()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  }

  if (appStore.publicSettingsLoaded) return
  loading.value = true
  try {
    await appStore.fetchPublicSettings()
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  markdownRequestVersion++
  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }
})
</script>

<style scoped>
.page { padding-block: clamp(10px, 1.4vw, 20px) clamp(24px, 4vw, 44px); }

.page__panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: clamp(420px, calc(100dvh - 200px), 1180px);
  overflow: hidden;
  padding: 0;
}

.page__state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 44px 20px;
  text-align: center;
}
.page__state-body { max-width: 42ch; }
.page__mark {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid var(--st-line);
  background: var(--st-bg-soft);
  color: var(--st-ink-3);
}
.page__spinner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid var(--st-line-2);
  border-top-color: var(--st-brand-text);
  animation: page-spin 900ms linear infinite;
}
@keyframes page-spin { to { transform: rotate(360deg); } }

.page__panel--state { height: auto; min-height: clamp(360px, 52vh, 560px); }
.page__split { position: relative; flex: 1; min-height: 0; display: flex; }

.page__toc {
  flex: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 220px;
  border-right: 1px solid var(--st-line);
  background: var(--st-bg-soft);
  overflow: hidden;
}
.page__toc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 12px 10px;
  border-bottom: 1px solid var(--st-line);
}
.page__toc-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--st-ink-3);
}
.page__toc-close { width: 28px; height: 28px; }
.page__toc-nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.toc-item {
  display: block;
  padding: 6px 10px;
  border-radius: 8px;
  border-left: 2px solid transparent;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--st-ink-2);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease);
}
.toc-item:hover { color: var(--st-ink); background: var(--st-bg-sink); }
.toc-item.toc-active {
  color: var(--st-brand-text) !important;
  background: var(--st-brand-soft) !important;
  border-left-color: var(--st-brand-text);
  font-weight: 600;
}
.toc-level-1 { padding-left: 10px !important; }
.toc-level-2 { padding-left: 20px !important; }
.toc-level-3 { padding-left: 30px !important; }
.toc-level-4 { padding-left: 40px !important; }

.page__toc-toggle { position: absolute; left: 12px; top: 12px; z-index: 10; }

.page__content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: clamp(18px, 2.6vw, 36px) clamp(18px, 4vw, 52px) clamp(28px, 4vw, 56px);
}

.page__embed { position: relative; flex: 1; min-height: 0; }
.custom-embed-shell { overflow: hidden; }
.custom-open-fab {
  position: absolute;
  right: 14px;
  top: 14px;
  z-index: 10;
  max-width: calc(100% - 28px);
  touch-action: none;
  user-select: none;
  box-shadow: var(--st-shadow-2);
}
.custom-embed-frame { display: block; width: 100%; height: 100%; border: 0; background: var(--st-bg); }

@media (max-width: 900px) {
  .page__toc {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 20;
    width: min(78%, 268px);
    box-shadow: var(--st-shadow-3);
  }
}
@media (max-width: 900px) {
  .page__content { padding-top: 64px; }
}
@media (max-width: 640px) {
  .page__panel { height: clamp(380px, calc(100dvh - 156px), 900px); }
  .page__panel--state { height: auto; min-height: 360px; }
  .page__content { padding: 64px 16px 30px; }
}

.page__state--loading { align-items: stretch; justify-content: flex-start; gap: 12px; padding: clamp(24px, 4vw, 40px); }
.page__sk { display: block; height: 14px; border-radius: 6px; }
.page__sk--title { height: 30px; width: 46%; }
.page__sk--line { width: 100%; }
.page__sk--short { width: 62%; }
.page__pulse { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

.page__panel { box-shadow: var(--st-shadow-2); }

@media (max-width: 900px) {
  .page__toc-label { font-size: 12px; }
}
@media (max-width: 640px) {
  .toc-item { font-size: 0.85rem; }
  .page__toc-close { width: 34px; height: 34px; }
}
</style>

<style>
/* Markdown 正文（v-html 注入，不能 scoped） */
.markdown-page-content {
  font-size: 0.97rem;
  line-height: 1.8;
  color: var(--st-ink-2);
  overflow-wrap: anywhere;
}
.markdown-page-content h1,
.markdown-page-content h2,
.markdown-page-content h3,
.markdown-page-content h4 {
  font-family: var(--st-font-display);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: var(--st-ink);
}
.markdown-page-content h1 { font-size: 1.65rem; margin: 1.5em 0 0.6em; padding-bottom: 10px; border-bottom: 1px solid var(--st-line); }
.markdown-page-content h2 { font-size: 1.26rem; margin: 1.5em 0 0.5em; }
.markdown-page-content h3 { font-size: 1.06rem; margin: 1.3em 0 0.4em; }
.markdown-page-content h4 { font-size: 1rem; margin: 1.2em 0 0.4em; }
.markdown-page-content > :first-child { margin-top: 0; }
.markdown-page-content p { margin: 0 0 1.05em; }
.markdown-page-content ul,
.markdown-page-content ol { padding-left: 1.4em; margin: 0 0 1.05em; }
.markdown-page-content ul { list-style: disc; }
.markdown-page-content ol { list-style: decimal; }
.markdown-page-content li { margin-bottom: 0.35em; }
.markdown-page-content a { color: var(--st-brand-text); text-decoration: underline; text-underline-offset: 3px; }
.markdown-page-content strong { color: var(--st-ink); font-weight: 600; }
.markdown-page-content blockquote {
  margin: 1.3em 0;
  padding: 2px 0 2px 16px;
  border-left: 2px solid var(--st-brand-line);
  color: var(--st-ink-2);
}
.markdown-page-content code {
  font-family: var(--st-font-mono);
  font-size: 0.86em;
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--st-bg-sink);
  border: 1px solid var(--st-line);
}
.markdown-page-content pre {
  position: relative;
  margin: 1.3em 0;
  padding: 16px 18px;
  border-radius: var(--st-r-md);
  border: 1px solid var(--st-line);
  background: var(--st-bg-sink);
  overflow-x: auto;
}
.markdown-page-content pre code { padding: 0; border: 0; background: transparent; font-size: 0.82rem; line-height: 1.7; }
.markdown-page-content table { width: 100%; border-collapse: collapse; margin: 1.3em 0; font-size: 0.88rem; }
.markdown-page-content th,
.markdown-page-content td { padding: 9px 12px; border-bottom: 1px solid var(--st-line); text-align: left; vertical-align: top; }
.markdown-page-content th { font-size: 0.76rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--st-ink-3); }
.markdown-page-content img { max-width: 100%; height: auto; border-radius: var(--st-r-md); margin: 1.3em 0; }
.markdown-page-content hr { border: 0; height: 1px; background: var(--st-line); margin: 2em 0; }
.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  font-size: 12px;
  font-family: inherit;
  border-radius: 999px;
  border: 1px solid var(--st-line-2);
  background: var(--st-bg);
  color: var(--st-ink-2);
  cursor: pointer;
  opacity: 1;
  transition: opacity var(--st-t) var(--st-ease), color var(--st-t) var(--st-ease);
}
.copy-btn:hover { color: var(--st-ink); }
@media (max-width: 640px) {
  .markdown-page-content table { display: block; overflow-x: auto; }
}
</style>

