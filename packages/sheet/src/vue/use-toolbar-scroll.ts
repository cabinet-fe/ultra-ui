import { onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from 'vue'

/** 模板 ref（useTemplateRef / shallowRef 均可） */
type ElRef = { readonly value: HTMLElement | null | undefined }

interface UseToolbarScrollOptions {
  /** 单行滚动视口（overflow-x: auto） */
  viewportRef: ElRef
  /** 工具列表容器（宽度随内容增长） */
  listRef: ElRef
  /** 内容源（工具组变化触发导航状态刷新） */
  content: Ref<readonly unknown[]>
}

/**
 * 工具栏溢出滚动（对齐 use-sheet-tabs-bar 的交互模式，无活动项跟随）：
 * - 内容超出视口宽度时显示左右箭头（showNav / canPrev / canNext）
 * - 箭头按视口宽度 ~80% 步进
 * - 纵向滚轮转横滚；触控板横滑不拦截
 * - 原生 ResizeObserver（不引入 @veltra/compositions peer）
 */
export function useToolbarScroll(options: UseToolbarScrollOptions) {
  const { viewportRef, listRef, content } = options

  const showNav = shallowRef(false)
  const canPrev = shallowRef(false)
  const canNext = shallowRef(false)

  let resizeObserver: ResizeObserver | undefined

  const updateNavState = () => {
    const vp = viewportRef.value
    if (!vp) return
    const { scrollLeft, scrollWidth, clientWidth } = vp
    const overflowing = scrollWidth - clientWidth > 1
    showNav.value = overflowing
    canPrev.value = overflowing && scrollLeft > 0
    canNext.value = overflowing && scrollLeft + clientWidth < scrollWidth - 1
  }

  const scrollByStep = (dir: 1 | -1) => {
    const vp = viewportRef.value
    if (!vp) return
    vp.scrollTo({ left: vp.scrollLeft + dir * vp.clientWidth * 0.8, behavior: 'smooth' })
  }

  /** 鼠标滚轮（纵向）驱动水平滚动；触控板横滑（已有 deltaX）不拦截 */
  const handleWheel = (e: WheelEvent) => {
    if (!showNav.value) return
    const vp = viewportRef.value
    if (!vp) return
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
    if (e.deltaY === 0) return
    e.preventDefault()
    vp.scrollLeft += e.deltaY
  }

  // 工具显隐 / 分组变化后宽度改变 → 刷新导航状态（等 DOM 更新完成再测）
  watch(
    content,
    async () => {
      await Promise.resolve()
      updateNavState()
    },
    { deep: false }
  )

  onMounted(() => {
    const vp = viewportRef.value
    if (vp) {
      vp.addEventListener('wheel', handleWheel, { passive: false })
      vp.addEventListener('scroll', updateNavState, { passive: true })
    }
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateNavState())
      if (vp) resizeObserver.observe(vp)
      const list = listRef.value
      if (list) resizeObserver.observe(list)
    }
    updateNavState()
  })

  onBeforeUnmount(() => {
    const vp = viewportRef.value
    if (vp) {
      vp.removeEventListener('wheel', handleWheel)
      vp.removeEventListener('scroll', updateNavState)
    }
    resizeObserver?.disconnect()
    resizeObserver = undefined
  })

  return { showNav, canPrev, canNext, updateNavState, scrollByStep }
}
