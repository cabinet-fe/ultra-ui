import type { TipAlign, TipDirection } from '@ui/types'
import { setStyles } from '@ui/utils'

/**
 * 调整内容宽度
 */
export function adjustContentWidth(options: {
  triggerRect: DOMRect
  contentEl: HTMLElement
  align: TipAlign
  direction: TipDirection
}) {
  const { triggerRect, align, contentEl, direction } = options
  const contentWidth = contentEl.offsetWidth

  let width = contentWidth
  if (direction === 'bottom' || direction === 'top') {
    if (
      align === 'center' &&
      contentWidth > (triggerRect.left + triggerRect.width / 2) * 2
    ) {
      width = (triggerRect.left + triggerRect.width / 2) * 2
    } else if (
      align === 'start' &&
      contentWidth > window.innerWidth - triggerRect.left
    ) {
      width = window.innerWidth - triggerRect.left
    } else if (align === 'end' && contentWidth > triggerRect.right) {
      width = triggerRect.right
    }
  } else {
    if (direction === 'left' && contentWidth > triggerRect.left) {
      width = triggerRect.left
    } else if (
      direction === 'right' &&
      contentWidth > window.innerWidth - triggerRect.right
    ) {
      width = window.innerWidth - triggerRect.right - 10
    }
  }

  if (width !== contentWidth) {
    width -= 10

    setStyles(contentEl, {
      width: `${width}px`
    })
  }
}

export function getDirection(options: {
  triggerRect: DOMRect
  contentSize: { width: number; height: number }
  direction: TipDirection
}): TipDirection {
  const { triggerRect, contentSize, direction } = options

  if (direction === 'top') {
    if (contentSize.height > triggerRect.top) {
      return 'bottom'
    }
  } else if (direction === 'bottom') {
    if (contentSize.height > window.innerHeight - triggerRect.bottom) {
      return 'top'
    }
  } else if (direction === 'left') {
    if (contentSize.width > triggerRect.left) {
      return 'right'
    }
  } else if (direction === 'right') {
    if (contentSize.width > window.innerWidth - triggerRect.right) {
      return 'left'
    }
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
  align: TipAlign
}) {
  const { triggerRect, contentSize, direction, align } = options

  const styles = positionGetters[direction](triggerRect, contentSize, align)

  return {
    left: styles.left + 'px',
    top: styles.top + 'px'
  }
}

type AlignGetter = (
  triggerRect: DOMRect,
  contentSize: { width: number; height: number },
  align: TipAlign
) => number

const getLeft: AlignGetter = (triggerRect, contentSize, align) => {
  if (align === 'center')
    return triggerRect.left + triggerRect.width / 2 - contentSize.width / 2
  if (align === 'start') return triggerRect.left
  return triggerRect.right - contentSize.width
}

const getTop: AlignGetter = (triggerRect, contentSize, align) => {
  if (align === 'center')
    return triggerRect.top + triggerRect.height / 2 - contentSize.height / 2
  if (align === 'start') return triggerRect.top
  return triggerRect.bottom - contentSize.height
}
const positionGetters: Record<
  TipDirection,
  (
    triggerRect: DOMRect,
    contentSize: { width: number; height: number },
    align: TipAlign
  ) => { top: number; left: number }
> = {
  top(triggerRect, contentSize, align) {
    return {
      top: triggerRect.top - contentSize.height - 8,
      left: getLeft(triggerRect, contentSize, align)
    }
  },
  bottom(triggerRect, contentSize, align) {
    return {
      top: triggerRect.bottom + 8,
      left: getLeft(triggerRect, contentSize, align)
    }
  },
  left(triggerRect, contentSize, align) {
    return {
      top: getTop(triggerRect, contentSize, align),
      left: triggerRect.left - contentSize.width - 8
    }
  },
  right(triggerRect, contentSize, align) {
    return {
      top: getTop(triggerRect, contentSize, align),
      left: triggerRect.right + 8
    }
  }
}
