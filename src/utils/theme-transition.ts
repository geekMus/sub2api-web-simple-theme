/**
 * 主题切换：以触发元素为原点，用圆形扩散做过渡。
 *
 * 实现走 View Transitions API（Chromium 支持）；
 * 不支持或用户开了「减少动态效果」时，退化为直接切换，不影响功能。
 */
export type ThemeName = 'dark' | 'light'

const TRANSITION_MS = 560

export function currentTheme(): ThemeName {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem('theme', theme)
  } catch {
    /* 隐私模式下 localStorage 可能不可写，忽略即可 */
  }
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> }
}

/**
 * 切换主题，并从 (x, y) 处做圆形扩散动画。
 * @returns 切换后的主题
 */
export function toggleThemeFrom(x: number, y: number): ThemeName {
  const next: ThemeName = currentTheme() === 'dark' ? 'light' : 'dark'
  const doc = document as ViewTransitionDocument
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (typeof doc.startViewTransition !== 'function' || reduceMotion) {
    applyTheme(next)
    return next
  }

  const transition = doc.startViewTransition(() => applyTheme(next))
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
        },
        {
          duration: TRANSITION_MS,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
    .catch(() => {
      /* 动画失败不影响主题已经切换 */
    })

  return next
}

/** 以元素中心为原点切换 */
export function toggleThemeFromElement(el: Element | null | undefined): ThemeName {
  const rect = el?.getBoundingClientRect()
  if (!rect) return toggleThemeFrom(window.innerWidth / 2, window.innerHeight / 2)
  return toggleThemeFrom(rect.left + rect.width / 2, rect.top + rect.height / 2)
}
