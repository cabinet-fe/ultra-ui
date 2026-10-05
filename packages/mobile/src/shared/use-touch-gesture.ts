/**
 * 单指触摸手势基建（Drawer 四向边缘拖拽关闭、DatePicker 横滑翻月共用）
 *
 * - 只消费 `touch*` 事件，不依赖 pointer / hover
 * - 判定逻辑不调用 `preventDefault`，监听是否 passive 均可工作；
 *   需要阻断滚动链时由组件在模板上加 `.prevent` 修饰符
 *
 * 用法：返回的四个处理函数逐个绑到模板（或 `v-on` 整体展开），
 * 位移跟随写在 `onMove`，释放判定用 `shouldCloseByDrag` / `horizontalSwipeDirection`
 */

export interface TouchGestureState {
  /** 相对起点的横向位移（px，向右为正） */
  dx: number
  /** 相对起点的纵向位移（px，向下为正） */
  dy: number
  /** 起触至今的时长（ms） */
  duration: number
  /** 横向速度（px/ms，向右为正，按最近一段位移计算） */
  vx: number
  /** 纵向速度（px/ms，向下为正，按最近一段位移计算） */
  vy: number
}

export interface UseTouchGestureOptions {
  /** 触摸开始（位移为 0 的首帧） */
  onStart?: (state: TouchGestureState) => void
  /** 触摸移动（每帧更新，供拖拽跟随） */
  onMove?: (state: TouchGestureState) => void
  /** 松手，在这里做释放判定 */
  onEnd?: (state: TouchGestureState) => void
  /** 手势被打断（来电、系统手势、落到多指等）：拖拽中的组件应回弹而非关闭 */
  onCancel?: (state: TouchGestureState) => void
}

/** 绑定到模板 `touch*` 事件的处理函数集，可直接 `v-on` 展开 */
export interface TouchGestureHandlers {
  touchstart: (event: TouchEvent) => void
  touchmove: (event: TouchEvent) => void
  touchend: (event: TouchEvent) => void
  touchcancel: () => void
}

export function useTouchGesture(options: UseTouchGestureOptions = {}): TouchGestureHandlers {
  let startX = 0
  let startY = 0
  let startT = 0
  let lastX = 0
  let lastY = 0
  let lastT = 0
  let lastVX = 0
  let lastVY = 0
  let tracking = false

  function stateAt(x: number, y: number, t: number): TouchGestureState {
    const dt = t - lastT
    // 速度按最近一段位移计算，长距离慢拖后再甩动时不被整体平均稀释
    if (dt > 0) {
      lastVX = (x - lastX) / dt
      lastVY = (y - lastY) / dt
    }

    return { dx: x - startX, dy: y - startY, duration: t - startT, vx: lastVX, vy: lastVY }
  }

  function cancelTracking() {
    if (!tracking) return
    tracking = false
    options.onCancel?.(stateAt(lastX, lastY, lastT))
  }

  return {
    touchstart(e) {
      // 只跟踪单指；第二指落下视为手势被打断
      if (tracking || e.touches.length !== 1) {
        cancelTracking()
        return
      }

      const touch = e.touches[0]!
      tracking = true
      startX = lastX = touch.clientX
      startY = lastY = touch.clientY
      lastT = startT = e.timeStamp
      lastVX = lastVY = 0
      options.onStart?.({ dx: 0, dy: 0, duration: 0, vx: 0, vy: 0 })
    },

    touchmove(e) {
      if (!tracking) return
      if (e.touches.length !== 1) {
        cancelTracking()
        return
      }

      const touch = e.touches[0]!
      options.onMove?.(stateAt(touch.clientX, touch.clientY, e.timeStamp))
      lastX = touch.clientX
      lastY = touch.clientY
      lastT = e.timeStamp
    },

    touchend(e) {
      if (!tracking) return
      tracking = false
      const touch = e.changedTouches[0]
      options.onEnd?.(stateAt(touch?.clientX ?? lastX, touch?.clientY ?? lastY, e.timeStamp))
    },

    touchcancel: cancelTracking
  }
}

export interface DragDismissOptions {
  /** 拖拽轴：Drawer 的 bottom / top 形态用 y，left / right 形态用 x */
  axis: 'x' | 'y'
  /**
   * 关闭方向：1 沿正方向（右 / 下）拖动关闭，-1 沿负方向（左 / 上）。
   * Drawer 对应关系：bottom 向下拉 1、top 向上推 -1、left 向左拖 -1、right 向右拖 1
   */
  sign: 1 | -1
  /** 判定为关闭的最小位移（px），默认 100 */
  distance?: number
  /** 判定为关闭的最小甩动速度（px/ms），默认 0.3 */
  velocity?: number
}

/**
 * 拖拽释放判定：沿关闭方向的位移或甩动速度任一达标即应关闭；
 * 反方向（离开关闭方向）拖动永远不关闭
 */
export function shouldCloseByDrag(state: TouchGestureState, options: DragDismissOptions): boolean {
  const { axis, sign, distance = 100, velocity = 0.3 } = options
  const delta = sign * (axis === 'x' ? state.dx : state.dy)

  if (delta <= 0) return false

  const speed = sign * (axis === 'x' ? state.vx : state.vy)
  return delta >= distance || speed >= velocity
}

/** 横向滑动方向判定：位移达阈值且横向分量大于纵向时返回方向，否则 null（点按或纵向滚动） */
export function horizontalSwipeDirection(
  state: TouchGestureState,
  distance = 50
): 'left' | 'right' | null {
  const { dx, dy } = state
  if (Math.abs(dx) < distance || Math.abs(dx) <= Math.abs(dy)) return null
  return dx > 0 ? 'right' : 'left'
}
