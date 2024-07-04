import type { TipAlign, TipDirection } from '@ui/types'
import { setStyles } from '@ui/utils'

/**
 * 调整内容尺寸防止溢出
 */
export function adjustContentSize(options: {
  triggerRect: DOMRect
  contentEl: HTMLElement
  contentSize: { width: number; height: number }
  alignment: TipAlign
  direction: TipDirection
}) {
  const { triggerRect, alignment, contentEl, contentSize, direction } = options

  let { width, height } = contentSize

  if (direction === 'bottom' || direction === 'top') {
    if (
      alignment === 'center' &&
      width > (triggerRect.left + triggerRect.width / 2) * 2
    ) {
      width = (triggerRect.left + triggerRect.width / 2) * 2
    } else if (
      alignment === 'start' &&
      width > window.innerWidth - triggerRect.left
    ) {
      width = window.innerWidth - triggerRect.left
    } else if (alignment === 'end' && width > triggerRect.right) {
      width = triggerRect.right
    }
  } else {
    if (direction === 'left' && width > triggerRect.left) {
      width = triggerRect.left
    } else if (
      direction === 'right' &&
      width > window.innerWidth - triggerRect.right
    ) {
      width = window.innerWidth - triggerRect.right
    }
  }

  if (width !== contentSize.width) {
    width -= 10
    setStyles(contentEl, {
      width: `${width}px`
    })
    height = contentEl.offsetHeight
  }
  return {
    width,
    height
  }
}

type XPosition = 'left' | 'right'
type YPosition = 'up' | 'down'

/**
 * 获取trigger相对于屏幕的位置
 * @param triggerRect
 * @returns
 */
const getTriggerPosition = (triggerRect: DOMRect): [XPosition, YPosition] => {
  let xPosition: XPosition
  let yPosition: YPosition

  const triggerCenter = {
    x: triggerRect.left + triggerRect.width / 2,
    y: triggerRect.top + triggerRect.height / 2
  }

  if (triggerCenter.x < window.innerWidth / 2) {
    xPosition = 'left'
  } else {
    xPosition = 'right'
  }

  if (triggerCenter.y < window.innerHeight / 2) {
    yPosition = 'up'
  } else {
    yPosition = 'down'
  }

  return [xPosition, yPosition]
}

/**
 * 弹出方向修正，当内容要溢出屏幕时修正方向
 * @param options 选项
 * @returns
 */
export function amendDirection(options: {
  triggerRect: DOMRect
  contentSize: { width: number; height: number }
  direction: TipDirection
}): TipDirection {
  const { triggerRect, contentSize, direction } = options

  const [xPosition, yPosition] = getTriggerPosition(triggerRect)

  if (direction === 'top') {
    if (yPosition === 'down' || contentSize.height < triggerRect.top) {
      return direction
    }
    return 'bottom'
  }

  if (direction === 'bottom') {
    if (
      yPosition === 'up' ||
      contentSize.height < window.innerHeight - triggerRect.bottom
    ) {
      return direction
    }
    return 'top'
  }

  if (direction === 'left') {
    if (xPosition === 'right' || contentSize.width < triggerRect.left) {
      return direction
    }
    return 'right'
  }

  if (direction === 'right') {
    if (
      xPosition === 'left' ||
      contentSize.width < window.innerWidth - triggerRect.right
    ) {
      return direction
    }
    return 'left'
  }

  return direction
}

/**
 * 计算tip位置
 * @param options
 * @returns
 */
export function calcTipPosition(options: {
  triggerRect: DOMRect
  contentSize: { width: number; height: number }
  direction: TipDirection
  alignment: TipAlign
}) {
  const { triggerRect, contentSize, direction, alignment } = options

  const styles = positionGetters[direction](triggerRect, contentSize, alignment)

  return {
    left: styles.left + 'px',
    top: styles.top + 'px'
  }
}

type AlignGetter = (
  triggerRect: DOMRect,
  contentSize: { width: number; height: number },
  alignment: TipAlign
) => number

const getLeft: AlignGetter = (triggerRect, contentSize, alignment) => {
  if (alignment === 'center')
    return triggerRect.left + triggerRect.width / 2 - contentSize.width / 2
  if (alignment === 'start') return triggerRect.left
  return triggerRect.right - contentSize.width
}

const getTop: AlignGetter = (triggerRect, contentSize, alignment) => {
  if (alignment === 'center')
    return triggerRect.top + triggerRect.height / 2 - contentSize.height / 2
  if (alignment === 'start') return triggerRect.top
  return triggerRect.bottom - contentSize.height
}
const positionGetters: Record<
  TipDirection,
  (
    triggerRect: DOMRect,
    contentSize: { width: number; height: number },
    alignment: TipAlign
  ) => { top: number; left: number }
> = {
  top(triggerRect, contentSize, alignment) {
    return {
      top: triggerRect.top - contentSize.height - 8,
      left: getLeft(triggerRect, contentSize, alignment)
    }
  },
  bottom(triggerRect, contentSize, alignment) {
    return {
      top: triggerRect.bottom + 8,
      left: getLeft(triggerRect, contentSize, alignment)
    }
  },
  left(triggerRect, contentSize, alignment) {
    return {
      top: getTop(triggerRect, contentSize, alignment),
      left: triggerRect.left - contentSize.width - 8
    }
  },
  right(triggerRect, contentSize, alignment) {
    return {
      top: getTop(triggerRect, contentSize, alignment),
      left: triggerRect.right + 8
    }
  }
}
