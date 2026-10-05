---
title: useTouchGesture 触摸手势
description: '@veltra/mobile 导出的单指触摸手势组合式函数：跟踪 touch 位移 / 时长 / 速度，配 shouldCloseByDrag 释放关闭判定（Drawer 四向边缘拖拽）与 horizontalSwipeDirection 横滑方向判定（日历翻月）。只消费 touch 事件，passive 监听可用，不依赖 pointer / hover。'
aliases: [TouchGesture, 触摸手势, 手势跟随, 拖拽关闭, 横滑判定, touch gesture]
keywords:
  [
    useTouchGesture,
    TouchGestureState,
    TouchGestureHandlers,
    shouldCloseByDrag,
    horizontalSwipeDirection,
    DragDismissOptions,
    dx,
    dy,
    vx,
    拖拽跟随,
    释放判定,
    边缘拖拽,
    拖拽关闭,
    横向滑动,
    翻月,
    touchmove,
    passive,
    触摸手势
  ]
---

# useTouchGesture 触摸手势

`@veltra/mobile` 导出的组合式函数 `useTouchGesture`：跟踪单指触摸的位移（`dx` / `dy`）、时长与最近一段速度（`vx` / `vy`），把四个 `touch*` 处理函数绑到模板上即可。配套两个纯函数判定：`shouldCloseByDrag`（沿关闭方向拖够距离或甩够速度即应关闭，供 Drawer 四向边缘拖拽关闭）与 `horizontalSwipeDirection`（横滑方向，供 DatePicker 翻月）。只消费 `touch*` 事件，判定不调用 `preventDefault`，监听是否 passive 均可工作。

## 快速上手

```vue
<script setup lang="ts">
import { useTouchGesture } from '@veltra/mobile'
import { shallowRef } from 'vue'

const offsetX = shallowRef(0)

const gesture = useTouchGesture({
  // 每帧位移，供拖拽跟随
  onMove: ({ dx }) => {
    offsetX.value = Math.max(0, dx)
  }
})

function reset() {
  offsetX.value = 0
}
</script>

<template>
  <!-- 四个处理函数逐个绑定；touchcancel 无参数 -->
  <div
    class="my-panel"
    :style="{ transform: `translateX(${offsetX}px)` }"
    @touchstart.passive="gesture.touchstart"
    @touchmove="gesture.touchmove"
    @touchend.passive="gesture.touchend"
    @touchcancel="gesture.touchcancel"
    @click="reset"
  >
    按住横向拖动
  </div>
</template>
```

## API 签名

```ts
import {
  horizontalSwipeDirection,
  shouldCloseByDrag,
  useTouchGesture
} from '@veltra/mobile'

/** 一帧手势状态：位移相对起点，速度按最近一段位移计算 */
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

/** 绑定到模板 touch* 事件的处理函数集，可直接 v-on 展开 */
export interface TouchGestureHandlers {
  touchstart: (event: TouchEvent) => void
  touchmove: (event: TouchEvent) => void
  touchend: (event: TouchEvent) => void
  touchcancel: () => void
}

export function useTouchGesture(
  options?: UseTouchGestureOptions
): TouchGestureHandlers

export interface DragDismissOptions {
  /** 拖拽轴：Drawer 的 bottom / top 形态用 y，left / right 形态用 x */
  axis: 'x' | 'y'
  /**
   * 关闭方向：1 沿正方向（右 / 下）拖动关闭，-1 沿负方向（左 / 上）。
   * Drawer 对应：bottom 向下拉 1、top 向上推 -1、right 向左拖 -1、left 向右拖 1
   */
  sign: 1 | -1
  /** 判定为关闭的最小位移（px），默认 100 */
  distance?: number
  /** 判定为关闭的最小甩动速度（px/ms），默认 0.3 */
  velocity?: number
}

/** 拖拽释放判定：位移或甩动速度任一达标即应关闭 */
export function shouldCloseByDrag(
  state: TouchGestureState,
  options: DragDismissOptions
): boolean

/** 横向滑动方向判定：位移达阈值且横向分量大于纵向返回方向，否则 null */
export function horizontalSwipeDirection(
  state: TouchGestureState,
  distance?: number
): 'left' | 'right' | null
```

## 参数说明

`useTouchGesture` 的 `options` 四个回调全部可选，无回调时仍正确维护跟踪状态：

| 参数        | 类型                                      | 默认     | 必填 | 约束                                                       |
| ----------- | ----------------------------------------- | -------- | :--: | ---------------------------------------------------------- |
| `onStart`   | `(state) => void`                         | `undefined` | 否  | 首帧触发一次，`state` 固定为 `dx: 0, dy: 0, duration: 0, vx: 0, vy: 0` |
| `onMove`    | `(state) => void`                         | `undefined` | 否  | 每个 `touchmove` 帧触发；多指落下那一帧不触发，改触发 `onCancel` |
| `onEnd`     | `(state) => void`                         | `undefined` | 否  | 松手时触发一次，`state` 用 `changedTouches` 的最终坐标计算     |
| `onCancel`  | `(state) => void`                         | `undefined` | 否  | `touchcancel`、跟踪中第二指落下时触发，`state` 为最后一次有效帧 |

`shouldCloseByDrag` 的 `options`（`axis` / `sign` 必填）：

| 参数       | 类型          | 默认  | 必填 | 约束                                                             |
| ---------- | ------------- | ----- | :--: | ---------------------------------------------------------------- |
| `axis`     | `'x' \| 'y'`  | —     | 是  | 拖拽轴，与面板滑出方向垂直的轴                                   |
| `sign`     | `1 \| -1`     | —     | 是  | 沿关闭方向拖动的符号，见签名内 JSDoc 对应表                      |
| `distance` | `number`      | `100` | 否  | 关闭判定最小位移，单位 px                                        |
| `velocity` | `number`      | `0.3` | 否  | 关闭判定最小甩动速度，单位 px/ms                                 |

`horizontalSwipeDirection` 的 `distance`：横滑判定最小位移，单位 px，默认 `50`。

## 方法与事件

`useTouchGesture()` 返回四个处理函数（`TouchGestureHandlers`），逐个绑到模板或 `v-on` 整体展开：

| 处理函数      | 绑定事件      | 行为                                                                             |
| ------------- | ------------- | -------------------------------------------------------------------------------- |
| `touchstart`  | `touchstart`  | 单指按下开始跟踪；跟踪中再落指则按打断处理（触发 `onCancel`）                      |
| `touchmove`   | `touchmove`   | 单指移动时更新状态并触发 `onMove`；出现第二指则停止跟踪并触发 `onCancel`           |
| `touchend`    | `touchend`    | 松手结束跟踪并触发 `onEnd`（未在跟踪时为空操作）                                  |
| `touchcancel` | `touchcancel` | 系统取消手势，触发 `onCancel`（未在跟踪时为空操作）                               |

三个判定函数均为同步纯函数，不抛错：

- `shouldCloseByDrag(state, options)`：沿关闭方向的位移 `sign * (axis === 'x' ? dx : dy)` ≤ 0（反方向拖动）时恒为 `false`；否则位移 ≥ `distance` 或速度 `sign * (axis === 'x' ? vx : vy)` ≥ `velocity` 任一成立即 `true`。
- `horizontalSwipeDirection(state, distance)`：`|dx| < distance` 或 `|dx| <= |dy|` 时返回 `null`（点按或纵向滚动）；否则 `dx > 0` 返回 `'right'`，`dx < 0` 返回 `'left'`。

## 典型示例

### 边缘拖拽跟随 + 释放关闭（Drawer 四向）

```vue
<script setup lang="ts">
import { shouldCloseByDrag, useTouchGesture } from '@veltra/mobile'
import { computed, shallowRef } from 'vue'

const props = defineProps<{
  /** 面板方向：bottom / top / left / right */
  placement: 'bottom' | 'top' | 'left' | 'right'
}>()

const emit = defineEmits<{ close: [] }>()

// 各方向：拖拽轴 + 关闭方向符号
const dismissMap = {
  bottom: { axis: 'y', sign: 1 }, // 向下拉关闭
  top: { axis: 'y', sign: -1 }, // 向上推关闭
  right: { axis: 'x', sign: -1 }, // 向左拖关闭
  left: { axis: 'x', sign: 1 } // 向右拖关闭
} as const

const dragging = shallowRef(false)
const offset = shallowRef(0)

// 拖拽偏移并入 transform：负值不跟随（拖离关闭方向不回弹成反向位移）
const style = computed(() => {
  if (!dragging.value) return undefined
  const translate =
    props.placement === 'left' || props.placement === 'right'
      ? `translateX(${offset.value}px)`
      : `translateY(${offset.value}px)`
  return { transform: translate }
})

const gesture = useTouchGesture({
  onStart: () => {
    dragging.value = true
  },
  onMove: ({ dx, dy }) => {
    const { axis, sign } = dismissMap[props.placement]
    const delta = sign * (axis === 'x' ? dx : dy)
    offset.value = Math.max(0, delta) // 只跟随关闭方向
  },
  onEnd: (state) => {
    dragging.value = false
    if (shouldCloseByDrag(state, dismissMap[props.placement])) {
      emit('close') // 位移 ≥ 100px 或速度 ≥ 0.3 px/ms
    } else {
      offset.value = 0 // 回弹
    }
  },
  onCancel: () => {
    dragging.value = false
    offset.value = 0 // 手势被打断：回弹，不关闭
  }
})
</script>

<template>
  <div
    :class="['my-drawer', `is-${props.placement}`]"
    :style="style"
    @touchstart.passive="gesture.touchstart"
    @touchmove="gesture.touchmove"
    @touchend.passive="gesture.touchend"
    @touchcancel="gesture.touchcancel"
  >
    <slot />
  </div>
</template>
```

### 横向滑动方向判定（日历翻月）

```vue
<script setup lang="ts">
import { horizontalSwipeDirection, useTouchGesture } from '@veltra/mobile'

const emit = defineEmits<{ turn: ['prev' | 'next'] }>()

const gesture = useTouchGesture({
  onEnd: (state) => {
    const direction = horizontalSwipeDirection(state) // 阈值默认 50px
    if (direction === 'left') {
      emit('turn', 'next') // 左滑下一月
    } else if (direction === 'right') {
      emit('turn', 'prev') // 右滑上一月
    }
    // null：点按或纵向滚动，不翻月
  }
})
</script>

<template>
  <div
    class="my-calendar"
    @touchstart.passive="gesture.touchstart"
    @touchmove.passive="gesture.touchmove"
    @touchend.passive="gesture.touchend"
    @touchcancel="gesture.touchcancel"
  >
    <!-- 月历网格 -->
  </div>
</template>
```

### 判定参数自定义（更灵敏的轻扫关闭）

```ts
import { shouldCloseByDrag, useTouchGesture } from '@veltra/mobile'
import type { TouchGestureState } from '@veltra/mobile'

// 面板拖出 60px，或以 0.5 px/ms 甩动即关闭
function shouldClose(state: TouchGestureState): boolean {
  return shouldCloseByDrag(state, {
    axis: 'y',
    sign: 1,
    distance: 60,
    velocity: 0.5
  })
}

const gesture = useTouchGesture({
  onEnd: (state) => {
    if (shouldClose(state)) {
      console.log('close') // => close（拖出 60px 或快速下甩时）
    }
  }
})
```

## 注意事项

> [!WARNING]
>
> - 本库手势只消费 `touch*` 事件，不监听 `pointerdown` / `mousedown`，桌面端鼠标拖动不产生手势。
> - 判定逻辑不调用 `preventDefault`，`touchstart` / `touchmove` / `touchend` 以 passive 绑定同样工作；需要阻断滚动链时由组件在模板上加 `.prevent` 修饰符（非 passive）。
> - 只跟踪单指：跟踪开始后落下第二指，手势按被打断处理并触发 `onCancel`，拖拽中的面板必须回弹而不是关闭。
> - `vx` / `vy` 按最近一段位移计算，长距离慢拖后紧接着甩动不会被整体平均速度稀释。
> - `touchcancel` 处理函数无参数（`touchcancel: () => void`），绑定 `@touchcancel` 时不要给它传参。
