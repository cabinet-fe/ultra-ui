import {
  computePosition,
  flip,
  shift,
  arrow,
  offset,
  type ComputePositionReturn,
  type Placement
} from '@floating-ui/dom'
import type { TipAlign, TipDirection } from '@ui/types'
import { getScrollParents, observeEl, setStyles, unobserveEl } from '@ui/utils'
import { isRef, onBeforeUnmount, watch, type Ref, type ShallowRef } from 'vue'

interface Options {
  /** 触发元素 */
  triggerRef: ShallowRef<HTMLElement | undefined>
  /** 内容元素 */
  contentRef: ShallowRef<HTMLElement | undefined>
  /** 箭头元素 */
  arrowRef?: ShallowRef<HTMLElement | undefined>
  /** 方向 */
  direction?: ShallowRef<TipDirection> | TipDirection
  /** 对齐方式 */
  alignment?: ShallowRef<TipAlign> | TipAlign
  /**
   * 箭头大小
   * @default 10
   */
  arrowSize?: number
  /** 触发器元素位置变更时回调 */
  onTriggerPositionChange?: () => void
  /** 更新元素前回调 */
  onBeforeUpdate?: (triggerEl: HTMLElement, contentEl: HTMLElement) => void
  /** 更新元素后回调 */
  onAfterUpdate?: (position: ComputePositionReturn) => void
}

/**
 * 浮框组合式函数
 * @param options 选项
 * @returns
 */
export function usePop(options: Options) {
  const {
    triggerRef,
    contentRef,
    arrowRef,
    arrowSize = 10,
    onTriggerPositionChange,
    onAfterUpdate,
    onBeforeUpdate,
    direction,
    alignment
  } = options

  /** 箭头位置 */
  const arrowPlacementDict = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right'
  }

  function getMaybeRefValue<T>(value?: Ref<T> | T) {
    return isRef(value) ? value.value : value
  }

  async function update() {
    if (!triggerRef.value || !contentRef.value) return
    const middleware = [
      offset(arrowRef?.value ? arrowSize : 6),
      flip(),
      shift()
    ]

    if (arrowRef?.value) {
      middleware.push(arrow({ element: arrowRef.value }))
    }

    onBeforeUpdate?.(triggerRef.value, contentRef.value)

    const _direction = getMaybeRefValue(direction) ?? 'top'
    const _alignment = getMaybeRefValue(alignment) ?? 'center'

    const position = await computePosition(triggerRef.value, contentRef.value, {
      middleware,
      placement:
        `${_direction}${_alignment === 'center' ? '' : `-${_alignment}`}` as Placement
    })

    onAfterUpdate?.(position)

    const { x, y, middlewareData, placement } = position

    setStyles(contentRef.value, {
      left: `${x}px`,
      top: `${y}px`
    })

    if (middlewareData.arrow) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow

      const arrowPlacement = arrowPlacementDict[placement.split('-')[0]!]
      const size = `${arrowSize}px`
      const arrowRadius = arrowSize / 2

      setStyles(arrowRef!.value!, {
        width: size,
        height: size,
        left: arrowX && `${arrowX - arrowRadius}px`,
        top: arrowY && `${arrowY - arrowRadius}px`,
        [arrowPlacement]: `-${arrowRadius}px`
      })
    }
  }

  let scrollParents: HTMLElement[] = []

  /** 为触发器元素的祖先元素添加滚动事件 */
  function addScrollEvents() {
    if (!onTriggerPositionChange || !triggerRef.value) return
    scrollParents = getScrollParents(triggerRef.value)
    scrollParents.forEach(el => {
      el.addEventListener('scroll', onTriggerPositionChange)
    })
  }

  /** 移除触发器元素祖先元素的滚动事件 */
  function removeScrollEvents() {
    if (!onTriggerPositionChange) return
    scrollParents.forEach(el => {
      el.removeEventListener('scroll', onTriggerPositionChange)
    })

    scrollParents = []
  }

  function addResizeEvents() {
    onTriggerPositionChange &&
      window.addEventListener('resize', onTriggerPositionChange)
    triggerRef.value && observeEl(triggerRef.value, update)
  }

  function removeResizeEvents() {
    triggerRef.value && unobserveEl(triggerRef.value)
    onTriggerPositionChange &&
      window.removeEventListener('resize', onTriggerPositionChange)
  }

  watch(
    [
      contentRef,
      () => getMaybeRefValue(direction),
      () => getMaybeRefValue(alignment)
    ],
    ([contentRef]) => {
      if (contentRef) {
        addScrollEvents()
        addResizeEvents()
        return
      }
      removeScrollEvents()
      removeResizeEvents()
    }
  )

  onBeforeUnmount(() => {
    removeScrollEvents()
    removeResizeEvents()
  })

  return {
    update
  }
}
