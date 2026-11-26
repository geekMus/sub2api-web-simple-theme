/**
 * 主题切换过渡
 * ------------------------------------------------------------------
 * 实现参考 keleus/BewlyCat 的 useDark()：
 *   1. 切换期间临时禁用全站 CSS transition —— 否则各元素的颜色过渡会和圆形遮罩叠加，
 *      画面会变成浑浊的交叉淡入（这是之前「看起来不对」的根因）
 *   2. 用 View Transitions 快照做圆形遮罩：切暗色时新层在上向外扩散，
 *      切亮色时旧层在上向内收拢
 *   3. 动画结束清理临时样式
 * 不支持 View Transition 或用户要求减少动效时，直接切换。
 */
export type ThemeName = 'dark' | 'light'

const DURATION = 320
const EASING = 'ease-in-out'

export function currentTheme(): ThemeName {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem('theme', theme)
  } catch {
    /* 隐私模式忽略 */
  }
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    ready: Promise<void>
    finished: Promise<void>
  }
}

function killTransitions(): HTMLStyleElement {
  const style = document.createElement('style')
  style.textContent =
    '*, *::before, *::after{transition:none !important;animation-duration:0s !important}'
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

export function toggleThemeFrom(x: number, y: number): ThemeName {
  const next: ThemeName = currentTheme() === 'dark' ? 'light' : 'dark'
  const doc = document as ViewTransitionDocument
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (typeof doc.startViewTransition !== 'function' || reduceMotion) {
    applyTheme(next)
    return next
  }

  const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  const noTransitionStyle = killTransitions()
  const vtStyle = baseViewTransitionStyle()

  const transition = doc.startViewTransition(() => {
    applyTheme(next)
  })

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
        .finally(() => zIndexStyle.remove())
    })
    .catch(() => undefined)

  transition.finished
    .catch(() => undefined)
    .finally(() => {
      noTransitionStyle.remove()
      vtStyle.remove()
    })

  return next
}

/** 以元素中心为原点 */
export function toggleThemeFromElement(el: Element | null | undefined): ThemeName {
  const rect = el?.getBoundingClientRect()
  if (!rect) return toggleThemeFrom(window.innerWidth / 2, window.innerHeight / 2)
  return toggleThemeFrom(rect.left + rect.width / 2, rect.top + rect.height / 2)
}
