import { useConfig } from '@veltra/compositions'
import { nextTick, shallowRef, type ShallowRef } from 'vue'

import { lightTheme } from './presets'
import type { UITheme } from './ui-theme'

export const currentTheme: ShallowRef<UITheme | undefined> = shallowRef<UITheme>()

const SIZES = ['small', 'default', 'large'] as const
const TRANSITION_STYLE_ID = 'ultra-ui-theme-transition'
const TRANSITION_CSS =
  '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}::view-transition-old(root){z-index:1}::view-transition-new(root){z-index:2}'

let transitionSheet: CSSStyleSheet | null = null
let transitionSeq = 0

function applyTheme(theme: UITheme): void {
  currentTheme.value = theme
  const { config } = useConfig()
  const classList = document.documentElement.classList
  classList.remove(...SIZES.filter((s) => s !== config.size))
  classList.add(config.size)
  theme.render()
}

function toggleTransitionStyle(mount: boolean): void {
  if (typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in Document.prototype) {
    if (mount) {
      if (!transitionSheet) {
        transitionSheet = new CSSStyleSheet()
        transitionSheet.replaceSync(TRANSITION_CSS)
      }
      if (!document.adoptedStyleSheets.includes(transitionSheet)) {
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, transitionSheet]
      }
    } else if (transitionSheet) {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== transitionSheet)
    }
    return
  }

  const existing = document.getElementById(TRANSITION_STYLE_ID)
  if (mount && !existing) {
    const style = document.createElement('style')
    style.id = TRANSITION_STYLE_ID
    style.textContent = TRANSITION_CSS
    document.head.appendChild(style)
  } else if (!mount) {
    existing?.remove()
  }
}

/**
 * @description 加载主题, 如果你是 SSR 环境,
 * 请在 `onMounted` 中调用，否则你可以在
 * 项目的入口环境(通常是 main.ts)或其他全局环境中调用。
 *
 * 主题自带系列（`theme.series`），应用时会注入全局 token 与
 * 同系列的组件级 token，并把 `html[data-theme]` 置为对应系列。
 * 切换主题时默认从视口中心播放圆形涟漪过渡（可传 `transition = false` 关闭）。
 */
export function loadTheme(theme: UITheme = lightTheme, transition = true): void {
  if (typeof document === 'undefined') {
    currentTheme.value = theme
    return
  }

  const reducedMotion =
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)

  if (
    !transition ||
    !currentTheme.value ||
    typeof document.startViewTransition !== 'function' ||
    document.visibilityState === 'hidden' ||
    reducedMotion
  ) {
    applyTheme(theme)
    return
  }

  const x = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  const y = typeof window !== 'undefined' ? window.innerHeight / 2 : 0
  const endRadius = Math.hypot(x, y)
  const seq = ++transitionSeq

  toggleTransitionStyle(true)

  try {
    const vt = document.startViewTransition(async () => {
      applyTheme(theme)
      await nextTick()
    })

    vt.ready
      .then(() => {
        if (seq !== transitionSeq) return
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
          {
            duration: 400,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        )
      })
      .catch(() => {})

    vt.finished
      .catch(() => {})
      .finally(() => {
        if (seq === transitionSeq) {
          toggleTransitionStyle(false)
        }
      })
  } catch {
    if (seq === transitionSeq) {
      toggleTransitionStyle(false)
    }
    applyTheme(theme)
  }
}
