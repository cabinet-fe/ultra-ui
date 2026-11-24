import {
  computePosition,
  flip,
  shift,
  arrow,
  offset,
  type ComputePositionReturn,
  type Placement
} from '@floating-ui/dom'
import { getScrollParents, setStyles } from '@veltra/utils'
import { isRef, onBeforeUnmount, watch, type Ref, type ShallowRef } from 'vue'

import { useResizeObserver } from '../use-resize-observer'

type TipDirection = 'top' | 'bottom' | 'left' | 'right'
type TipAlign = 'center' | 'start' | 'end'

interface Options {
  triggerRef: ShallowRef<HTMLElement | undefined>
  contentRef: ShallowRef<HTMLElement | undefined>
  arrowRef?: ShallowRef<HTMLElement | undefined>
  direction?: ShallowRef<TipDirection> | TipDirection
  alignment?: ShallowRef<TipAlign> | TipAlign
  arrowSize?: number
  onTriggerPositionChange?: () => void
  onBeforeUpdate?: (triggerEl: HTMLElement, contentEl: HTMLElement) => void
  onAfterUpdate?: (position: ComputePositionReturn) => void
  onPop?: (position: ComputePositionReturn) => void
}

interface PopResult {
  update: () => Promise<void>
  popperContainerId: string
}

let popperContainer: HTMLElement | null = null

const popperContainerId = 'pop-container'

export function usePop(options: Options): PopResult {
  if (!popperContainer) {
    popperContainer = document.createElement('div')
    popperContainer.id = popperContainerId
    document.body.appendChild(popperContainer)
  }

  const {
    triggerRef,
    contentRef,
    arrowRef,
    arrowSize = 10,
    onTriggerPositionChange,
    onAfterUpdate,
    onBeforeUpdate,
    direction,
    alignment,
    onPop
  } = options

  const arrowPlacementDict = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' }

  function getMaybeRefValue<T>(value?: Ref<T> | T) {
    return isRef(value) ? value.value : value
  }

  async function update(callbackOnPop = false) {
    const triggerEl = triggerRef.value
    const contentEl = contentRef.value

    if (!(triggerEl instanceof HTMLElement) || !(contentEl instanceof HTMLElement)) {
      return
    }

    onBeforeUpdate?.(triggerEl, contentEl)

    const middleware = [offset(arrowRef?.value ? arrowSize : 6), flip(), shift()]

    if (arrowRef?.value) {
      middleware.push(arrow({ element: arrowRef.value }))
    }

    const _direction = getMaybeRefValue(direction) ?? 'top'
    const _alignment = getMaybeRefValue(alignment) ?? 'center'

    const position = await computePosition(triggerEl, contentEl, {
      middleware,

      placement: `${_direction}${_alignment === 'center' ? '' : `-${_alignment}`}` as Placement
    })

    const { x, y, middlewareData, placement } = position

    setStyles(contentEl, { left: `${x}px`, top: `${y}px` })
    callbackOnPop && onPop?.(position)
    onAfterUpdate?.(position)

    if (middlewareData.arrow) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow

      const arrowPlacement =
        arrowPlacementDict[placement.split('-')[0]! as keyof typeof arrowPlacementDict]
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

  // 面板内容尺寸变化时（如向上弹出的 select 搜索后面板变矮）需重新定位，
  // 否则 top 仍按初始高度计算，面板底部会离触发器越来越远
  useResizeObserver({ targets: contentRef, onResize: () => update() })

  function addScrollEvents() {
    if (!triggerRef.value) return
    if (onTriggerPositionChange) {
      scrollParents = getScrollParents(triggerRef.value)
      scrollParents.forEach((el) => {
        el.addEventListener('scroll', onTriggerPositionChange)
      })
    }
  }

  function removeScrollEvents() {
    if (onTriggerPositionChange) {
      scrollParents.forEach((el) => {
        el.removeEventListener('scroll', onTriggerPositionChange)
      })
    }

    scrollParents = []
  }

  function addResizeEvents() {
    onTriggerPositionChange && window.addEventListener('resize', onTriggerPositionChange)
  }

  function removeResizeEvents() {
    onTriggerPositionChange && window.removeEventListener('resize', onTriggerPositionChange)
  }

  watch(
    [contentRef, () => getMaybeRefValue(direction), () => getMaybeRefValue(alignment)],
    ([content]) => {
      if (content) {
        update(true)
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

  return { update, popperContainerId }
}
