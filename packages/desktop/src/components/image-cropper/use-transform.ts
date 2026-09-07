import { onBeforeUnmount, reactive, watch, type Ref, type ShallowRef } from 'vue'

/** 图片变换状态：缩放 / 平移 / 90° 步进旋转 / 翻转 */
export interface TransformState {
  scale: number
  translateX: number
  translateY: number
  /** 90° 步进角度：0 / 90 / 180 / 270 */
  rotation: number
  flipX: boolean
  flipY: boolean
}

interface Size {
  width: number
  height: number
}

/** 画布内的屏幕坐标点（相对画布左上角） */
interface Point {
  x: number
  y: number
}

/** 滚轮 / 按钮单次缩放步进系数 */
const ZOOM_STEP = 1.2
/** 最大缩放倍数（相对适应容器的缩放） */
const MAX_ZOOM_RATIO = 10

interface UseTransformOptions {
  /** 画布元素（wheel 缩放与选区外平移的交互目标） */
  target: ShallowRef<HTMLElement | undefined | null> | Ref<HTMLElement | undefined | null>
  /** 画布可视尺寸（屏幕像素） */
  canvasSize: () => Size
  /** 图片原始宽（图片像素） */
  imageWidth: () => number
  /** 图片原始高（图片像素） */
  imageHeight: () => number
  /** 重置变换时复位选区 */
  onReset: () => void
}

interface UseTransformReturn {
  /** 当前变换状态 */
  transform: TransformState
  /** 图片按比例适应容器并居中（按当前旋转交换宽高计算） */
  fit: () => void
  /** 复位变换状态（不重新布局、不复位选区） */
  reset: () => void
  /** 重置：恢复初始变换，重新适应容器并复位选区 */
  resetTransform: () => void
  /** 放大一级，anchor 为缩放锚点（默认画布中心） */
  zoomIn: (anchor?: Point) => void
  /** 缩小一级，anchor 为缩放锚点（默认画布中心） */
  zoomOut: (anchor?: Point) => void
  /** 缩放到指定值（按适应缩放钳制范围），anchor 为缩放锚点（默认画布中心） */
  zoomTo: (scale: number, anchor?: Point) => void
  /** 90° 步进旋转，direction 为 1 顺时针、-1 逆时针 */
  rotate: (direction: 1 | -1) => void
  /** 水平 / 垂直翻转 */
  flip: (axis: 'horizontal' | 'vertical') => void
  /** 屏幕位移换算为图片像素位移（考虑旋转 / 翻转 / 缩放） */
  toImageDelta: (dx: number, dy: number) => Point
}

/**
 * 图片变换：滚轮以指针为锚缩放、选区外拖动平移、90° 步进旋转、翻转与重置。
 * 舞台 transform-origin 为中心，旋转 / 翻转不改变图片中心位置，无需补偿平移
 */
export function useTransform(options: UseTransformOptions): UseTransformReturn {
  const { target, canvasSize, imageWidth, imageHeight, onReset } = options

  const transform = reactive<TransformState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    rotation: 0,
    flipX: false,
    flipY: false
  })

  /** 当前旋转下的显示尺寸（90° / 270° 交换宽高，图片像素） */
  function displaySize(): Size {
    const width = imageWidth()
    const height = imageHeight()
    return transform.rotation % 180 === 0 ? { width, height } : { width: height, height: width }
  }

  /** 适应容器的缩放（同时是缩放范围下限） */
  function fitScale() {
    const { width: cw, height: ch } = canvasSize()
    const { width: dw, height: dh } = displaySize()
    if (!cw || !ch || !dw || !dh) return 0
    return Math.min(cw / dw, ch / dh)
  }

  function fit() {
    const scale = fitScale()
    if (!scale) return
    const { width: cw, height: ch } = canvasSize()
    transform.scale = scale
    // transform-origin 为舞台中心，居中平移只取决于舞台原始尺寸，与缩放 / 旋转无关
    transform.translateX = (cw - imageWidth()) / 2
    transform.translateY = (ch - imageHeight()) / 2
  }

  function reset() {
    transform.scale = 1
    transform.translateX = 0
    transform.translateY = 0
    transform.rotation = 0
    transform.flipX = false
    transform.flipY = false
  }

  function resetTransform() {
    reset()
    fit()
    onReset()
  }

  function zoomTo(scale: number, anchor?: Point) {
    const base = fitScale()
    if (!base) return
    const next = Math.min(Math.max(scale, base), base * MAX_ZOOM_RATIO)
    const { width: cw, height: ch } = canvasSize()
    const { x: ax, y: ay } = anchor ?? { x: cw / 2, y: ch / 2 }
    // 舞台中心（transform-origin）局部坐标
    const cx = imageWidth() / 2
    const cy = imageHeight() / 2
    const k = next / transform.scale
    // 缩放前后锚点下的图片点保持不动：t' = A - C - k·(A - t - C)
    transform.translateX = ax - cx - k * (ax - transform.translateX - cx)
    transform.translateY = ay - cy - k * (ay - transform.translateY - cy)
    transform.scale = next
  }

  function zoomIn(anchor?: Point) {
    zoomTo(transform.scale * ZOOM_STEP, anchor)
  }

  function zoomOut(anchor?: Point) {
    zoomTo(transform.scale / ZOOM_STEP, anchor)
  }

  function rotate(direction: 1 | -1) {
    transform.rotation = (transform.rotation + direction * 90 + 360) % 360
    // 90° / 270° 后按交换宽高重新适应布局
    fit()
  }

  function flip(axis: 'horizontal' | 'vertical') {
    if (axis === 'horizontal') transform.flipX = !transform.flipX
    else transform.flipY = !transform.flipY
  }

  function toImageDelta(dx: number, dy: number): Point {
    // 先按旋转逆变换，再除掉带翻转符号的缩放
    let x = dx
    let y = dy
    if (transform.rotation === 90) {
      x = dy
      y = -dx
    } else if (transform.rotation === 180) {
      x = -dx
      y = -dy
    } else if (transform.rotation === 270) {
      x = -dy
      y = dx
    }
    return {
      x: x / ((transform.flipX ? -1 : 1) * transform.scale),
      y: y / ((transform.flipY ? -1 : 1) * transform.scale)
    }
  }

  // ---------- wheel 缩放（以指针位置为锚点） ----------

  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    const el = target.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const anchor = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    if (e.deltaY < 0) zoomIn(anchor)
    else zoomOut(anchor)
  }

  // ---------- 选区外拖动平移（选区内拖动由 use-selection 拦截，不冒泡到这里） ----------

  /** 图片显示尺寸超出容器才允许平移 */
  function isOverflowing() {
    const { width: cw, height: ch } = canvasSize()
    const { width: dw, height: dh } = displaySize()
    return dw * transform.scale > cw || dh * transform.scale > ch
  }

  let panStart: Point | null = null

  function handleMousedown(e: MouseEvent) {
    if (e.button !== 0 || !isOverflowing()) return
    e.preventDefault()

    panStart = { x: e.clientX, y: e.clientY }
    document.addEventListener('mousemove', handleMousemove, { passive: true })
    document.addEventListener('mouseup', handleMouseup)
  }

  function handleMousemove(e: MouseEvent) {
    if (!panStart) return
    transform.translateX += e.clientX - panStart.x
    transform.translateY += e.clientY - panStart.y
    panStart = { x: e.clientX, y: e.clientY }
  }

  function handleMouseup() {
    panStart = null
    cleanup()
  }

  function cleanup() {
    document.removeEventListener('mousemove', handleMousemove)
    document.removeEventListener('mouseup', handleMouseup)
  }

  watch(
    target,
    (el, oldEl) => {
      oldEl?.removeEventListener('mousedown', handleMousedown)
      oldEl?.removeEventListener('wheel', handleWheel)
      el?.addEventListener('mousedown', handleMousedown)
      // wheel 需要 preventDefault 阻止页面滚动，必须非 passive
      el?.addEventListener('wheel', handleWheel, { passive: false })
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    target.value?.removeEventListener('mousedown', handleMousedown)
    target.value?.removeEventListener('wheel', handleWheel)
    cleanup()
  })

  return {
    transform,
    fit,
    reset,
    resetTransform,
    zoomIn,
    zoomOut,
    zoomTo,
    rotate,
    flip,
    toImageDelta
  }
}
