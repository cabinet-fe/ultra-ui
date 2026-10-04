import type { MaybeRefOrGetter } from 'vue'
import { onMounted, onScopeDispose, toValue, watch } from 'vue'

/** 锚点滚动联动选项 */
export interface UseAnchorOptions {
  /** 有序锚点列表（锚点项注册顺序） */
  items: MaybeRefOrGetter<string[]>
  /** 滚动容器：CSS 选择器或元素（含 null，缺省 window） */
  container: MaybeRefOrGetter<string | HTMLElement | null | undefined>
  /** 定位偏移 */
  offset: MaybeRefOrGetter<number>
  /** 命中锚点变化回调 */
  onChange: (href: string) => void
}

/**
 * 解析滚动容器。
 * window 滚动统一返回 documentElement，便于复用 scrollTop / scrollHeight。
 */
function resolveContainer(target: string | HTMLElement | null | undefined): HTMLElement {
  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target) ?? document.documentElement
  }
  return target ?? document.documentElement
}

/** 锚点滚动联动：点击平滑定位、滚动时计算当前命中锚点 */
export function useAnchor(options: UseAnchorOptions) {
  const { items, container, offset, onChange } = options

  /** 锚点对应的目标元素 */
  function getTarget(href: string): HTMLElement | null {
    return document.querySelector<HTMLElement>(href)
  }

  /** 点击项：平滑滚动到目标锚点 */
  function scrollTo(href: string) {
    const target = getTarget(href)
    if (!target) return

    const wrap = resolveContainer(toValue(container))
    const top =
      wrap === document.documentElement
        ? window.scrollY + target.getBoundingClientRect().top - toValue(offset)
        : wrap.scrollTop +
          target.getBoundingClientRect().top -
          wrap.getBoundingClientRect().top -
          toValue(offset)

    wrap.scrollTo({ top, behavior: 'smooth' })
  }

  /** 计算当前命中锚点并通知 */
  function update() {
    const hrefs = toValue(items)
    const first = hrefs[0]
    if (!first) return

    const wrap = resolveContainer(toValue(container))
    const containerTop = wrap === document.documentElement ? 0 : wrap.getBoundingClientRect().top

    let hit: string | undefined
    for (const href of hrefs) {
      const target = getTarget(href)
      if (target && target.getBoundingClientRect().top - containerTop - toValue(offset) <= 0) {
        hit = href
      }
    }

    // 滚动到底部时直接命中最后一项（容器实际可滚动时才生效，避免内容不足一屏时误命中末项）
    const scrollable = wrap.scrollHeight - wrap.clientHeight > 1
    if (scrollable && wrap.scrollTop + wrap.clientHeight >= wrap.scrollHeight - 1) {
      hit = hrefs[hrefs.length - 1] ?? first
    }

    onChange(hit ?? first)
  }

  // 滚动监听（rAF 节流）
  let rafId = 0
  function handleScroll() {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      update()
    })
  }

  let bound: HTMLElement = document.documentElement
  function bind() {
    unbind()
    bound = resolveContainer(toValue(container))
    bound.addEventListener('scroll', handleScroll, { passive: true })
  }

  function unbind() {
    bound.removeEventListener('scroll', handleScroll)
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
  }

  // 容器变化重绑监听；锚点增删只需重算命中
  watch(
    () => toValue(container),
    () => {
      bind()
      update()
    }
  )
  watch(items, update)

  onMounted(() => {
    bind()
    update()
  })

  onScopeDispose(unbind)

  return { scrollTo, update }
}
