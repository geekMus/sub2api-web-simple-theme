/**
 * 主题切换过渡（自绘遮罩层）
 * ------------------------------------------------------------------
 * 方向语义：
 *   light → dark ：深色圆从按钮处【向外扩散】铺满
 *   dark → light ：深色圆【向内收拢】回按钮，露出亮色
 * 实现：一层 fixed 遮罩 + 一圈品牌色光晕，同步用 Web Animations 驱动。
 * 不用 View Transitions —— 它会把页面替换成快照，装饰层无法渲染。
 */
export type ThemeName = 'dark' | 'light'

const DURATION = 660
const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'

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

function radiusFrom(x: number, y: number): number {
  return Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
}

function readBg(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--st-bg').trim()
  return v || '#000'
}

export function toggleThemeFrom(x: number, y: number): ThemeName {
  const next: ThemeName = currentTheme() === 'dark' ? 'light' : 'dark'
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) {
    applyTheme(next)
    return next
  }

  const beforeBg = readBg()
  applyTheme(next)
  const afterBg = readBg()
  // 遮罩始终使用「深色那一侧」的颜色：
  // 变深色时是新主题色（向外铺），变亮色时是旧主题色（向内收）
  const veilColor = next === 'dark' ? afterBg : beforeBg

  const r = radiusFrom(x, y)
  const fromClip = `circle(${next === 'dark' ? 0 : r}px at ${x}px ${y}px)`
  const toClip = `circle(${next === 'dark' ? r : 0}px at ${x}px ${y}px)`

  const veil = document.createElement('div')
  veil.setAttribute('aria-hidden', 'true')
  veil.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:2147483000',
    'pointer-events:none',
    `background:${veilColor}`,
    `clip-path:${fromClip}`,
    'will-change:clip-path',
  ].join(';')

  // 边缘光晕：一圈跟随揭示边界的细环
  const ring = document.createElement('div')
  ring.setAttribute('aria-hidden', 'true')
  const startSize = next === 'dark' ? 0 : r * 2
  const endSize = next === 'dark' ? r * 2 : 0
  ring.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    `width:${startSize}px`,
    `height:${startSize}px`,
    'border-radius:9999px',
    'pointer-events:none',
    'z-index:2147483001',
    `border:1.5px solid color-mix(in srgb, var(--st-brand) 65%, transparent)`,
    'box-shadow:0 0 32px 8px var(--st-brand-soft), inset 0 0 18px var(--st-brand-soft)',
    `transform:translate(${x}px, ${y}px) translate(-50%,-50%)`,
    'opacity:0.9',
    'will-change:width,height,opacity',
  ].join(';')

  document.body.append(veil, ring)

  const veilAnim = veil.animate(
    { clipPath: [fromClip, toClip] },
    { duration: DURATION, easing: EASING, fill: 'forwards' },
  )
  const ringAnim = ring.animate(
    [
      { width: `${startSize}px`, height: `${startSize}px`, opacity: 0.9 },
      { width: `${endSize}px`, height: `${endSize}px`, opacity: 0 },
    ],
    { duration: DURATION, easing: EASING, fill: 'forwards' },
  )

  veilAnim.finished
    .catch(() => undefined)
    .finally(() => {
      veil.remove()
      ring.remove()
    })

  ringAnim.finished.catch(() => undefined)

  return next
}

/** 以元素中心为原点 */
export function toggleThemeFromElement(el: Element | null | undefined): ThemeName {
  const rect = el?.getBoundingClientRect()
  if (!rect) return toggleThemeFrom(window.innerWidth / 2, window.innerHeight / 2)
  return toggleThemeFrom(rect.left + rect.width / 2, rect.top + rect.height / 2)
}
