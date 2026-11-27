/**
 * 主题切换
 * ------------------------------------------------------------------
 * 支持三档偏好：system（跟随系统）/ light（亮色）/ dark（暗色）。
 * 切换时用 View Transitions 做圆形遮罩：
 *   1. 切换期间只冻结 CSS transition（绝不改 animation-duration，否则 .st-reveal 会永久隐形）
 *   2. 切暗色时新层在上向外扩散，切亮色时旧层在上向内收拢
 *   3. 动画结束清理临时样式，并有定时器兜底
 */
export type ThemeName = 'dark' | 'light'
export type ThemePreference = 'system' | 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'

const DURATION = 320
const EASING = 'ease-in-out'

const systemQuery = (): MediaQueryList | null =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

/** 当前实际生效的主题（看 DOM） */
export function currentTheme(): ThemeName {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/** 用户偏好：没存过就是 system */
export function getThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    /* 隐私模式忽略 */
  }
  return 'system'
}

/** 偏好 → 实际主题 */
export function resolveTheme(preference: ThemePreference): ThemeName {
  if (preference === 'light' || preference === 'dark') return preference
  return systemQuery()?.matches ? 'dark' : 'light'
}

/** 只落 DOM，不写偏好 */
export function applyResolvedTheme(theme: ThemeName): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** 直接应用某个偏好（含持久化），不做过渡 */
export function applyThemePreference(preference: ThemePreference): ThemeName {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    /* 隐私模式忽略 */
  }
  const theme = resolveTheme(preference)
  applyResolvedTheme(theme)
  return theme
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    ready: Promise<void>
    finished: Promise<void>
  }
}

/**
 * 切换期间冻结「颜色过渡」，但**不能**动动画时长：
 * 一旦把 animation-duration 打成 0s，带 animation-delay 的 .st-reveal 会停在 opacity:0，
 * 只要清理时机没赶上（移动端 View Transition 常被打断），整页正文就再也显示不出来。
 * 这里只禁 transition，并把入场动画的终态用 !important 提前钉住（!important 优先级高于动画）。
 */
function killTransitions(): HTMLStyleElement {
  const style = document.createElement('style')
  style.textContent = `
    *, *::before, *::after { transition: none !important; }
    .st-reveal, .st-fade-in { opacity: 1 !important; transform: none !important; }
  `
  document.head.appendChild(style)
  return style
}

function baseViewTransitionStyle(): HTMLStyleElement {
  const style = document.createElement('style')
  style.textContent = `
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none !important;
      mix-blend-mode: normal;
    }
  `
  document.head.appendChild(style)
  return style
}

/** 带圆形遮罩过渡地切到某个实际主题（不做持久化） */
function transitionToTheme(next: ThemeName, x: number, y: number): void {
  const doc = document as ViewTransitionDocument
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (typeof doc.startViewTransition !== 'function' || reduceMotion || currentTheme() === next) {
    applyResolvedTheme(next)
    return
  }

  const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  const noTransitionStyle = killTransitions()
  const vtStyle = baseViewTransitionStyle()

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    noTransitionStyle.remove()
    vtStyle.remove()
  }
  // 兜底：移动端切后台/打断时 transition.finished 可能永远不 resolve
  const safetyTimer = window.setTimeout(cleanup, 600)

  // 关键：主题必须真正落到 DOM 上（callback 可能被打断）
  applyResolvedTheme(next)

  const transition = doc.startViewTransition(() => {
    applyResolvedTheme(next)
  })

  const verifyTimer = window.setTimeout(() => {
    if (currentTheme() !== next) applyResolvedTheme(next)
  }, 120)

  transition.ready
    .then(() => {
      const isDarkNow = document.documentElement.classList.contains('dark')

      const zIndexStyle = document.createElement('style')
      zIndexStyle.textContent = `
        ::view-transition-old(root) { z-index: ${isDarkNow ? 1 : 9999}; }
        ::view-transition-new(root) { z-index: ${isDarkNow ? 9999 : 1}; }
      `
      document.head.appendChild(zIndexStyle)

      const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]
      const animation = document.documentElement.animate(
        { clipPath: isDarkNow ? clipPath : [...clipPath].reverse() },
        {
          duration: DURATION,
          easing: EASING,
          pseudoElement: isDarkNow ? '::view-transition-new(root)' : '::view-transition-old(root)',
        },
      )

      animation.finished
        .catch(() => undefined)
        .finally(() => {
          zIndexStyle.remove()
          window.clearTimeout(safetyTimer)
          cleanup()
        })
    })
    .catch(() => undefined)

  transition.finished
    .catch(() => undefined)
    .finally(() => {
      window.clearTimeout(safetyTimer)
      window.clearTimeout(verifyTimer)
      if (currentTheme() !== next) applyResolvedTheme(next)
      cleanup()
    })
}

/**
 * 选中某个偏好：持久化 + 过渡到对应实际主题。
 * origin 给定时以该点为圆心扩散；否则从屏幕中心。
 */
export function setThemePreference(preference: ThemePreference, origin?: { x: number; y: number } | null): ThemeName {
  const theme = applyThemePreference(preference)
  // applyThemePreference 已经直接把 class 打上了；这里要的是过渡，所以先回滚再走动画
  const previous: ThemeName = theme === 'dark' ? 'light' : 'dark'
  applyResolvedTheme(previous)
  const x = origin?.x ?? window.innerWidth / 2
  const y = origin?.y ?? window.innerHeight / 2
  transitionToTheme(theme, x, y)
  return theme
}

/** 兼容旧调用：以坐标点切换明暗（会在 light/dark 之间来回切） */
export function toggleThemeFrom(x: number, y: number): ThemeName {
  const next: ThemeName = currentTheme() === 'dark' ? 'light' : 'dark'
  applyThemePreference(next)
  const previous: ThemeName = next === 'dark' ? 'light' : 'dark'
  applyResolvedTheme(previous)
  transitionToTheme(next, x, y)
  return next
}

/** 兼容旧调用：以元素中心为原点 */
export function toggleThemeFromElement(el: Element | null | undefined): ThemeName {
  const rect = el?.getBoundingClientRect()
  if (!rect) return toggleThemeFrom(window.innerWidth / 2, window.innerHeight / 2)
  return toggleThemeFrom(rect.left + rect.width / 2, rect.top + rect.height / 2)
}

/** 系统主题变化时同步（仅在偏好为 system 时生效） */
export function watchSystemTheme(onChange: (theme: ThemeName) => void): () => void {
  const query = systemQuery()
  if (!query) return () => undefined
  const handler = () => {
    if (getThemePreference() !== 'system') return
    const theme = resolveTheme('system')
    applyResolvedTheme(theme)
    onChange(theme)
  }
  query.addEventListener('change', handler)
  return () => query.removeEventListener('change', handler)
}
