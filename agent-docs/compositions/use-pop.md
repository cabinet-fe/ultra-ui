---
title: usePop 浮层定位组合式函数
description: 基于 @floating-ui/dom 的浮层定位组合式函数：计算触发元素与浮层内容的坐标并写入 left/top，内置 offset、flip 翻转、shift 防溢出与箭头定位，自动在 body 挂载 pop-container 单例容器供 Teleport 使用，适用于 Tooltip、Dropdown、Popover 与级联弹层。
aliases: [use-pop, Popper, floating-ui, 弹出层定位, 弹层定位, Tooltip 定位]
keywords: [triggerRef, contentRef, arrowRef, popperContainerId, pop-container, arrowSize, onTriggerPositionChange, onBeforeUpdate, onAfterUpdate, onPop, flip, shift, placement, 弹层, 气泡提示, 下拉定位, 箭头定位, 防溢出, 翻转, Teleport]
---

# usePop 浮层定位组合式函数

`@veltra/compositions` 导出 `usePop`：基于 `@floating-ui/dom` 的浮层定位组合式函数。它计算触发元素与浮层内容的坐标并把 `left` / `top` 写入内容元素内联样式，内置 `offset`、`flip` 翻转、`shift` 防溢出，传入箭头元素时启用 `arrow` 中间件；首次调用会在 `document.body` 创建 id 为 `pop-container` 的单例容器，供 `<Teleport>` 挂载浮层。

## 快速上手

内容元素必须自带 `position: absolute`（`usePop` 只写 `left` / `top`，不设置 `position`）：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { usePop } from '@veltra/compositions'

const triggerRef = shallowRef<HTMLElement>()
const contentRef = shallowRef<HTMLElement>()
const arrowRef = shallowRef<HTMLElement>()

const { update, popperContainerId } = usePop({
  triggerRef,
  contentRef,
  arrowRef,
  direction: 'bottom',
  alignment: 'start',
  // 触发器祖先滚动 / 窗口尺寸变化时回调，这里手动跟随更新位置
  onTriggerPositionChange() {
    void update()
  }
})
</script>

<template>
  <button ref="triggerRef">打开</button>
  <Teleport :to="`#${popperContainerId}`">
    <div ref="contentRef" style="position: absolute">
      浮层内容
      <span ref="arrowRef" />
    </div>
  </Teleport>
</template>
```

## API 签名

```ts
import type { ComputePositionReturn } from '@floating-ui/dom'

type TipDirection = 'top' | 'bottom' | 'left' | 'right'
type TipAlign = 'center' | 'start' | 'end'

interface Options {
  /** 触发元素 ref。必填 */
  triggerRef: ShallowRef<HTMLElement | undefined>
  /** 浮层内容元素 ref。必填 */
  contentRef: ShallowRef<HTMLElement | undefined>
  /** 箭头元素 ref；传入且已挂载时启用 arrow 中间件并在其上写入箭头样式 */
  arrowRef?: ShallowRef<HTMLElement | undefined>
  /** 弹出方向，支持静态值或 ref。默认 'top' */
  direction?: ShallowRef<TipDirection> | TipDirection
  /** 对齐方式，支持静态值或 ref。默认 'center' */
  alignment?: ShallowRef<TipAlign> | TipAlign
  /** 箭头大小（px），同时决定有箭头时的 offset 距离。默认 10 */
  arrowSize?: number
  /** 触发元素祖先滚动或 window resize 时回调，用于跟随更新弹层位置 */
  onTriggerPositionChange?: () => void
  /** 每次计算位置前回调，入参为触发元素与内容元素 */
  onBeforeUpdate?: (triggerEl: HTMLElement, contentEl: HTMLElement) => void
  /** 每次坐标写入后回调，入参为 Floating UI 计算结果 */
  onAfterUpdate?: (position: ComputePositionReturn) => void
  /** 弹层弹出时（自动 update）回调；手动调用 update() 不触发 */
  onPop?: (position: ComputePositionReturn) => void
}

interface PopResult {
  /** 计算并写入浮层位置；元素未挂载时静默返回。异步 */
  update: () => Promise<void>
  /** 浮层容器 id，恒为 'pop-container' */
  popperContainerId: string
}

export function usePop(options: Options): PopResult
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `triggerRef` | `ShallowRef<HTMLElement \| undefined>` | — | 是 | 仅读取 `.value`，传 `computed`、模板 ref 均可；变化不会自动触发 `update` |
| `contentRef` | `ShallowRef<HTMLElement \| undefined>` | — | 是 | 元素出现时自动定位并挂滚动监听；元素移除时自动卸监听 |
| `arrowRef` | `ShallowRef<HTMLElement \| undefined>` | — | 否 | 必须在 `update` 执行时已挂载，否则本次不启用箭头 |
| `direction` | `'top' \| 'bottom' \| 'left' \| 'right'` 或其 ref | `'top'` | 否 | 与 `alignment` 组合成 12 种 placement |
| `alignment` | `'center' \| 'start' \| 'end'` 或其 ref | `'center'` | 否 | `center` 时 placement 不带后缀，如 `'top'`；其余为 `'top-start'` 形式 |
| `arrowSize` | `number` | `10` | 否 | 单位 px；有箭头时 `offset` 距离取 `arrowSize`，无箭头时固定 `6` |
| `onTriggerPositionChange` | `() => void` | — | 否 | 只有传入该回调才会监听触发器祖先 `scroll` 与 `window.resize` |
| `onBeforeUpdate` | `(triggerEl, contentEl) => void` | — | 否 | 每次有效 `update` 前调用，可在此改内容元素宽度等样式 |
| `onAfterUpdate` | `(position: ComputePositionReturn) => void` | — | 否 | 每次有效 `update` 后调用 |
| `onPop` | `(position: ComputePositionReturn) => void` | — | 否 | 仅内容出现、`direction` / `alignment` 变化触发的自动 `update` 时调用 |

## 方法与事件

`update(): Promise<void>`：异步计算位置并写入内容元素 `left` / `top`。

- `triggerRef` 或 `contentRef` 的值不是 `HTMLElement` 时直接返回，不抛错
- 不带参数调用（`update()`）不触发 `onPop`；内部自动更新调用 `update(true)` 时触发 `onPop`
- 每次有效更新都会依次触发 `onBeforeUpdate` → 计算 → `onAfterUpdate`

自动行为：

- `contentRef` 出现、`direction` 或 `alignment` 变化：自动 `update(true)`，并给触发器祖先滚动元素与 `window` 挂监听（前提是传了 `onTriggerPositionChange`）
- `contentRef` 变为 `undefined`：移除上述监听
- 组件卸载（`onBeforeUnmount`）：自动移除滚动与 resize 监听，无需手动清理；`#pop-container` 容器为应用级单例，不随组件卸载移除

## 典型示例

### Dropdown 式浮层：按弹出方向切换动画并定制宽度

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { usePop } from '@veltra/compositions'

const triggerRef = shallowRef<HTMLElement>()
const contentRef = shallowRef<HTMLElement>()
const open = shallowRef(false)
const transitionName = shallowRef('slide-down')

const { update, popperContainerId } = usePop({
  triggerRef,
  contentRef,
  direction: 'bottom',
  alignment: 'start',
  onPop(position) {
    // 弹出时才知道 flip 后的真实方向，据此切换进出场动画
    transitionName.value = position.placement.includes('top') ? 'slide-up' : 'slide-down'
  },
  onBeforeUpdate(triggerEl, contentEl) {
    // 下拉宽度跟随触发器
    contentEl.style.width = `${triggerEl.offsetWidth}px`
  },
  onTriggerPositionChange() {
    // 触发器滚出视口时关闭浮层
    open.value = false
  }
})
</script>

<template>
  <button ref="triggerRef" @click="open = !open">菜单</button>
  <Teleport :to="`#${popperContainerId}`">
    <div v-if="open" ref="contentRef" style="position: absolute">下拉项</div>
  </Teleport>
</template>
```

### 响应式方向与对齐

`direction` / `alignment` 传 ref 时，值变化即自动重新定位：

```vue
<script setup lang="ts">
import { shallowRef, toRef } from 'vue'
import { usePop } from '@veltra/compositions'

const props = defineProps<{ direction?: 'top' | 'bottom' | 'left' | 'right' }>()

const triggerRef = shallowRef<HTMLElement>()
const contentRef = shallowRef<HTMLElement>()

const { update, popperContainerId } = usePop({
  triggerRef,
  contentRef,
  // props 变化经 toRef 转为响应式来源，update 无需手动调用
  direction: toRef(() => props.direction ?? 'top'),
  alignment: 'center'
})

defineExpose({ update })
</script>

<template>
  <button ref="triggerRef" @click="open = !open">触发</button>
  <Teleport :to="`#${popperContainerId}`">
    <div v-if="open" ref="contentRef" style="position: absolute">气泡</div>
  </Teleport>
</template>
```

### 替换触发元素后手动更新

`triggerRef` 的变化不在自动更新监听范围内，触发元素被替换后必须手动 `update()`：

```ts
import { nextTick, shallowRef } from 'vue'
import { usePop } from '@veltra/compositions'

const triggerRef = shallowRef<HTMLElement>()
const contentRef = shallowRef<HTMLElement>()

const { update, popperContainerId } = usePop({ triggerRef, contentRef })
void popperContainerId

// 业务代码把触发元素换成另一个 DOM 后：
async function onTriggerReplaced() {
  await nextTick() // 等新元素挂载
  await update()
}
```

## 注意事项

> [!WARNING]
> - 内容元素必须自带 `position: absolute`（组件库的 `u-tip__content`、`u-dropdown__content` 均如此）；`usePop` 只写 `left` / `top`，不设置 `position`，缺省时坐标写在内联样式上但元素仍按文档流定位。
> - 本库用 `direction`（4 值）+ `alignment`（3 值）两个参数表达方位，不是 Floating UI 的 `placement` 字符串参数；最终 placement 由两者拼接。
> - 调用 `usePop` 时会立即访问 `document` 创建容器，必须在浏览器环境调用；不支持 SSR。
> - `onPop` 只在内容出现与 `direction` / `alignment` 变化时触发；手动调用 `update()` 只触发 `onBeforeUpdate` / `onAfterUpdate`。
> - `triggerRef` 变化不会自动重新定位，替换触发元素后必须手动 `update()`。
> - 箭头元素的尺寸与对侧偏移（`-arrowSize/2`）由 `usePop` 写入内联样式，禁止在 CSS 里给箭头写死 `width` / `height`。

## 常见问题

### 浮层出现在页面左上角或跟随文档流

原因：内容元素没有 `position: absolute`。修复：给内容元素加 `style="position: absolute"`，或使用组件库自带的 `u-tip__content` 类名。

### 箭头不显示

原因：`update()` 执行时 `arrowRef.value` 尚未挂载（例如箭头在 `v-if` 的浮层内部，且在挂载前调用了 `update`）。修复：在浮层挂载后再调用 `update()`，`usePop` 会在内容元素出现时自动执行一次带箭头的定位。
