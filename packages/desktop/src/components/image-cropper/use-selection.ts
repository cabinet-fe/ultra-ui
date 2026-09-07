import { onBeforeUnmount, shallowRef, watch, type Ref, type ShallowRef } from 'vue'

/** 裁剪选区（图片像素坐标） */
export interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

/** 手柄方位：四角 + 四边 */
export type SelectionHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

/** 全部手柄方位 */
export const SELECTION_HANDLES: SelectionHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

/** 选区最小边长（图片像素） */
const MIN_SIZE = 20

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

interface UseSelectionOptions {
  /** 选区元素（mousedown 交互目标，手柄通过 data-handle 标识） */
  target: ShallowRef<HTMLElement | undefined | null> | Ref<HTMLElement | undefined | null>
  /** 图片原始宽（图片像素） */
  imageWidth: () => number
  /** 图片原始高（图片像素） */
  imageHeight: () => number
  /** 当前显示缩放（屏幕像素 / 图片像素） */
  scale: () => number
  /** 宽高比约束（宽 / 高），不传或 <= 0 为自由比例 */
  aspectRatio: () => number | undefined
}

interface UseSelectionReturn {
  /** 当前选区（图片像素坐标） */
  selection: ShallowRef<SelectionRect | null>
  /** 以图片居中约 80% 区域初始化选区（受宽高比约束） */
  initSelection: () => void
  /** 清空选区 */
  clearSelection: () => void
}

/** 裁剪选区交互：整体拖动 + 8 个手柄调整大小，支持宽高比约束与图片边界钳制 */
export function useSelection(options: UseSelectionOptions): UseSelectionReturn {
  const { target, imageWidth, imageHeight, scale, aspectRatio } = options

  const selection = shallowRef<SelectionRect | null>(null)

  /** 有效宽高比，非法值视为自由比例 */
  function validRatio() {
    const ratio = aspectRatio()
    return ratio && ratio > 0 ? ratio : undefined
  }

  /** 尺寸与位置钳制在图片像素范围内 */
  function clampRect(rect: SelectionRect): SelectionRect {
    const W = imageWidth()
    const H = imageHeight()
    const width = clamp(rect.width, Math.min(MIN_SIZE, W), W)
    const height = clamp(rect.height, Math.min(MIN_SIZE, H), H)
    return { width, height, x: clamp(rect.x, 0, W - width), y: clamp(rect.y, 0, H - height) }
  }

  /** 以选区中心为锚按比例重算选区 */
  function applyRatio(sel: SelectionRect, ratio: number): SelectionRect {
    const W = imageWidth()
    const H = imageHeight()
    const cx = sel.x + sel.width / 2
    const cy = sel.y + sel.height / 2

    let width = sel.width
    let height = width / ratio
    if (height > H) {
      height = H
      width = height * ratio
    }
    if (width > W) {
      width = W
      height = width / ratio
    }

    return clampRect({ x: cx - width / 2, y: cy - height / 2, width, height })
  }

  function initSelection() {
    const W = imageWidth()
    const H = imageHeight()
    if (!W || !H) {
      selection.value = null
      return
    }

    let width = W * 0.8
    let height = H * 0.8
    const ratio = validRatio()
    // 在居中 80% 框内内接指定比例
    if (ratio) {
      if (width / height > ratio) width = height * ratio
      else height = width / ratio
    }

    selection.value = { x: (W - width) / 2, y: (H - height) / 2, width, height }
  }

  function clearSelection() {
    selection.value = null
  }

  // 宽高比变化时以选区中心为锚按比例重算
  watch(
    () => aspectRatio(),
    () => {
      const ratio = validRatio()
      if (!ratio || !selection.value) return
      selection.value = applyRatio(selection.value, ratio)
    }
  )

  // ---------- 拖动交互（参照 useDrag 模式：mousedown 起，document 级 move/up 收尾） ----------

  interface DragSession {
    /** 'move' 为整体拖动，其余为手柄方位 */
    mode: 'move' | SelectionHandle
    startX: number
    startY: number
    origin: SelectionRect
  }

  let session: DragSession | null = null

  function handleMousedown(e: MouseEvent) {
    const sel = selection.value
    if (e.button !== 0 || !sel) return
    // 阻止冒泡与默认行为：避免触发画布层交互（P3 平移）与原生选中
    e.stopPropagation()
    e.preventDefault()

    const handle = (e.target as HTMLElement | null)
      ?.closest('[data-handle]')
      ?.getAttribute('data-handle')

    session = {
      mode: (handle as SelectionHandle | null) ?? 'move',
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...sel }
    }

    document.addEventListener('mousemove', handleMousemove, { passive: true })
    document.addEventListener('mouseup', handleMouseup)
  }

  function handleMousemove(e: MouseEvent) {
    if (!session) return
    const currentScale = scale()
    if (!currentScale) return

    // 屏幕位移换算为图片像素位移
    const dx = (e.clientX - session.startX) / currentScale
    const dy = (e.clientY - session.startY) / currentScale
    selection.value =
      session.mode === 'move'
        ? moveSelection(session.origin, dx, dy)
        : resizeSelection(session.origin, session.mode, dx, dy)
  }

  function handleMouseup() {
    session = null
    cleanup()
  }

  function cleanup() {
    document.removeEventListener('mousemove', handleMousemove)
    document.removeEventListener('mouseup', handleMouseup)
  }

  function moveSelection(origin: SelectionRect, dx: number, dy: number): SelectionRect {
    return clampRect({ ...origin, x: origin.x + dx, y: origin.y + dy })
  }

  function resizeSelection(
    origin: SelectionRect,
    handle: SelectionHandle,
    dx: number,
    dy: number
  ): SelectionRect {
    const W = imageWidth()
    const H = imageHeight()
    const right = origin.x + origin.width
    const bottom = origin.y + origin.height
    const cx = origin.x + origin.width / 2
    const cy = origin.y + origin.height / 2
    const ratio = validRatio()

    const west = handle.includes('w')
    const east = handle.includes('e')
    const north = handle.includes('n')
    const south = handle.includes('s')

    // 候选尺寸：被拖动的边随指针位移，对侧保持不动
    let width = origin.width + (east ? dx : west ? -dx : 0)
    let height = origin.height + (south ? dy : north ? -dy : 0)

    // 各轴最大尺寸：拖动边受图片边界限制，未拖动的轴绕中心扩展
    const maxWidth = east ? W - origin.x : west ? right : 2 * Math.min(cx, W - cx)
    const maxHeight = south ? H - origin.y : north ? bottom : 2 * Math.min(cy, H - cy)

    if (ratio) {
      if ((east || west) && !north && !south) {
        // 横向边中手柄：宽度驱动，高度按比例绕中心联动
        height = width / ratio
      } else if ((north || south) && !east && !west) {
        // 纵向边中手柄：高度驱动，宽度按比例绕中心联动
        width = height * ratio
      } else {
        // 角手柄：取位移更大的一侧驱动，单方向拖动也能生效
        const widthFromHeight = height * ratio
        width =
          Math.abs(width - origin.width) >= Math.abs(widthFromHeight - origin.width)
            ? width
            : widthFromHeight
        height = width / ratio
      }
      const maxCoupledWidth = Math.min(maxWidth, maxHeight * ratio)
      width = clamp(width, Math.min(MIN_SIZE, maxCoupledWidth), maxCoupledWidth)
      height = width / ratio
    } else {
      width = clamp(width, Math.min(MIN_SIZE, maxWidth), maxWidth)
      height = clamp(height, Math.min(MIN_SIZE, maxHeight), maxHeight)
    }

    return clampRect({
      x: west ? right - width : east ? origin.x : cx - width / 2,
      y: north ? bottom - height : south ? origin.y : cy - height / 2,
      width,
      height
    })
  }

  watch(
    target,
    (el, oldEl) => {
      oldEl?.removeEventListener('mousedown', handleMousedown)
      el?.addEventListener('mousedown', handleMousedown)
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    target.value?.removeEventListener('mousedown', handleMousedown)
    cleanup()
  })

  return { selection, initSelection, clearSelection }
}
