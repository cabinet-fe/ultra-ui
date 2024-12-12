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
import { getScrollParents, setStyles } from '@ui/utils'
import { isRef, onBeforeUnmount, watch, type Ref, type ShallowRef } from 'vue'
import { useObserverCallback } from '../use-resize-observer'

interface Options {
  /** 触发元素 */
  triggerRef: ShallowRef<HTMLElement | undefined>
  /** 内容元素 */
  contentRef: ShallowRef<HTMLElement | undefined>
  /**
   * 箭头元素，如果存在，则会在弹框的箭头位置显示箭头
   */
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
  /**
   * 触发器元素位置变更时回调，
   * 一般用于在触发器元素位置变更时更新弹框位置
   */
  onTriggerPositionChange?: () => void
  /** 更新元素前回调 */
  onBeforeUpdate?: (triggerEl: HTMLElement, contentEl: HTMLElement) => void
  /** 更新元素后回调 */
  onAfterUpdate?: (position: ComputePositionReturn) => void
}

interface PopResult {
  /**
   * 更新弹框位置
   */
  update: () => Promise<void>
}

/**
 * 浮框组合式函数
 * @param options 选项
 * @returns
 */
export function usePop(options: Options): PopResult {
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

  const { observeEl, unobserveEl } = useObserverCallback()

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

  /** 更新浮框位置 */
  async function update() {
    const triggerEl = triggerRef.value
    const contentEl = contentRef.value

    if (!triggerEl || !contentEl) return

    onBeforeUpdate?.(triggerEl, contentEl)

    // 计算位置 ↓↓↓
    const middleware = [
      offset(arrowRef?.value ? arrowSize : 6),
      flip(),
      shift()
    ]

    if (arrowRef?.value) {
      middleware.push(arrow({ element: arrowRef.value }))
    }

    const _direction = getMaybeRefValue(direction) ?? 'top'
    const _alignment = getMaybeRefValue(alignment) ?? 'center'

    const position = await computePosition(triggerEl, contentEl, {
      middleware,
      placement:
        `${_direction}${_alignment === 'center' ? '' : `-${_alignment}`}` as Placement
    })

    const { x, y, middlewareData, placement } = position

    setStyles(contentEl, {
      left: `${x}px`,
      top: `${y}px`
    })

    onAfterUpdate?.(position)

    // 设置箭头位置 ↓↓↓
    if (middlewareData.arrow) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow

      const arrowPlacement = arrowPlacementDict[placement.split('-')[0]!]
      const size = `${arrowSize}px`
      // 箭头半径
      const arrowRadius = arrowSize / 2

      setStyles(arrowRef!.value!, {
        width: size,
        height: size,
        left: arrowX && `${arrowX - arrowRadius}px`,
        top: arrowY && `${arrowY - arrowRadius}px`,
        [arrowPlacement]: `-${arrowRadius}px`
      })
    }
    // 设置箭头位置 ↑↑↑
  }

  let scrollParents: HTMLElement[] = []

  /** 为触发器元素的祖先元素添加滚动事件 */
  function addScrollEvents() {
    if (!triggerRef.value) return
    if (onTriggerPositionChange) {
      scrollParents = getScrollParents(triggerRef.value)
      scrollParents.forEach(el => {
        el.addEventListener('scroll', onTriggerPositionChange)
      })
    }
  }

  /** 移除触发器元素祖先元素的滚动事件 */
  function removeScrollEvents() {
    if (onTriggerPositionChange) {
      scrollParents.forEach(el => {
        el.removeEventListener('scroll', onTriggerPositionChange)
      })
    }

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

  watch(triggerRef, () => update())

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
    /** 更新浮框位置 */
    update
  }
}
