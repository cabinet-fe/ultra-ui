---
title: useResizeObserver / useObserverCallback 尺寸变化观察
description: 从 @veltra/compositions 导出的 ResizeObserver 封装：useResizeObserver 对单个或一组元素 ref 建观察器，ref 换目标自动切换观察并随组件卸载清理；useObserverCallback 用单个观察器按元素注册/注销回调，首个初始回调自动跳过。适用于滚动条同步、表格列宽自适应、分栏拖拽重测。
aliases: [use-resize-observer, useObserverCallback, ResizeObserver 封装, 尺寸监听, 容器观察]
keywords: [useResizeObserver, useObserverCallback, RefElement, ResizeObserverReturn, ResizeObserverCallback, onResize, targets, observeEl, unobserveEl, disconnect, borderBoxSize, contentRect, 尺寸变化, 容器观察, 列宽自适应, 滚动条同步, 自动清理]
---

# useResizeObserver / useObserverCallback 尺寸变化观察

`@veltra/compositions` 导出两个 ResizeObserver 封装。`useResizeObserver({ targets, onResize })` 对单个或一组元素 ref 建立观察：ref 值变化时自动换观察目标，组件卸载自动清理，返回 `{ disconnect }` 手动停止。`useObserverCallback()` 返回 `observeEl` / `unobserveEl`，用单个观察器按元素注册回调，适合数量动态变化的节点列表。两者都不做尺寸换算，需要现成宽高时用 `useReactiveSize`。

## 快速上手

```ts
import { useResizeObserver } from '@veltra/compositions'
import { shallowRef } from 'vue'

const box = shallowRef<HTMLElement>()

const { disconnect } = useResizeObserver({
  targets: box,
  onResize(entries) {
    // entries 为原生 ResizeObserverEntry 数组
    const entry = entries[0]
    if (!entry) return
    console.log(entry.borderBoxSize[0]?.inlineSize) // => 首次观察与每次尺寸变化时输出宽度
  }
})

// 需要提前停止时调用；组件卸载时也会自动清理
// disconnect()
```

`targets` 传 ref 时，元素挂载（ref 赋值）后开始观察；`onResize` 首次在元素被观察时即触发一次，之后每次尺寸变化触发。

## API 签名

```ts
import type { Ref, ShallowRef } from 'vue'

/** 可观察的元素引用：值可为 HTMLElement | null | undefined */
export type RefElement =
  | ShallowRef<HTMLElement | undefined | null>
  | Ref<HTMLElement | undefined | null>

interface ResizeObserverOptions {
  /** 目标节点，单个 ref 或 ref 数组 */
  targets: RefElement | RefElement[]
  /** 原生 ResizeObserver 回调 */
  onResize: ResizeObserverCallback
  /** 指定观察条件 */
  when?: () => boolean
}

/** 监听器句柄 */
export type ResizeObserverReturn = {
  /** 终止监听 */
  disconnect: () => void
}

export function useResizeObserver(options: ResizeObserverOptions): ResizeObserverReturn

export function useObserverCallback(): {
  /** 开始观察元素并注册回调；同一元素重复调用会替换回调 */
  observeEl: <El extends HTMLElement>(
    el: El,
    cb: (entry: Omit<ResizeObserverEntry, 'target'> & { target: El }) => void
  ) => void
  /** 停止观察元素并注销回调 */
  unobserveEl: (el: HTMLElement) => void
}
```

`ResizeObserverOptions` 接口未从包导出，调用时按结构传对象即可；`RefElement` 与 `ResizeObserverReturn` 可从 `@veltra/compositions` 以 `import type` 导入。

## 参数说明

### useResizeObserver 的 options

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `targets` | `RefElement \| RefElement[]` | — | 是 | 单 ref：元素挂载即观察，ref 指向新元素时先 `unobserve` 旧元素再观察新元素；数组：任一成员 ref 变化即重算观察集合，值为 `null` / `undefined` 的成员跳过 |
| `onResize` | `ResizeObserverCallback` | — | 是 | `(entries, observer) => void`；`entries` 为原生 `ResizeObserverEntry[]`；首次观察每个元素时都会触发一次 |
| `when` | `() => boolean` | — | 否 | 类型上声明，当前实现未使用：传入无任何效果，观察条件实际由 targets 的 ref 值决定 |

### useObserverCallback 的回调

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `el` | `El extends HTMLElement` | — | 是 | 真实 DOM 元素，不是 ref；重复 `observeEl` 同一元素时观察幂等、回调被替换 |
| `cb` | `(entry) => void`，`entry.target` 收窄为 `El` | — | 是 | 每个元素的**首次回调被跳过**（内部用 `dataset.ob` 标记吞掉初始观察事件），从第二次尺寸变化开始触发 |

## 方法与事件

- `disconnect(): void`，同步。`unobserve` 当前全部目标并销毁内部 `ResizeObserver`；调用后若 `targets` 的 ref 再变化，watcher 仍活跃，会创建新的观察器继续观察新元素。`useResizeObserver` 与 `useObserverCallback` 都在 `onBeforeUnmount` 自动清理，常规用法无需手动调用。
- `onResize` 触发时机：目标元素首次被观察、元素尺寸变化、元素被替换（新元素首次观察）。无错误路径，回调内抛出的异常由调用方负责。
- `observeEl` / `unobserveEl`：同步，无返回值、不抛错；`unobserveEl` 同时清除该元素上的首次回调标记，之后再次 `observeEl` 会重新跳过一次首次回调。

## 典型示例

### 滚动容器内容变化时同步滚动条

`UScroll` 内部的真实用法：同时观察内容与轨道两个元素，按 `entry.target` 区分来源：

```vue
<script setup lang="ts">
import { useResizeObserver } from '@veltra/compositions'
import { reactive, shallowRef } from 'vue'

const emit = defineEmits<{ resize: [targets: HTMLElement[]] }>()

const contentRef = shallowRef<HTMLElement>()
const scrollRef = shallowRef<HTMLElement>()

const trackSize = reactive({ width: 0, height: 0 })

useResizeObserver({
  targets: [contentRef, scrollRef],
  onResize: (entries) => {
    const trackEl = scrollRef.value
    if (trackEl) {
      trackSize.width = trackEl.clientWidth
      trackSize.height = trackEl.clientHeight
    }
    if (entries.length) {
      emit(
        'resize',
        entries.map((entry) => entry.target as HTMLElement)
      )
    }
  }
})
</script>

<template>
  <div ref="scrollRef" class="scroll">
    <div ref="contentRef" class="scroll__content">
      <slot />
    </div>
  </div>
</template>
```

内容增删（内容元素尺寸变化）与容器缩放（轨道尺寸变化）都会触发回调。

### ref 换目标时自动重新观察

`targets` 指向的元素被 `v-if` / `key` 替换时，观察器自动切换，无需手动重建：

```vue
<script setup lang="ts">
import { useResizeObserver } from '@veltra/compositions'
import { ref, shallowRef } from 'vue'

const mode = ref<'a' | 'b'>('a')
const pane = shallowRef<HTMLElement>()

useResizeObserver({
  targets: pane,
  onResize([entry]) {
    console.log('当前面板宽度', entry?.borderBoxSize[0]?.inlineSize)
  }
})

function toggle() {
  mode.value = mode.value === 'a' ? 'b' : 'a'
}
</script>

<template>
  <button @click="toggle">切换</button>
  <div v-if="mode === 'a'" ref="pane">面板 A</div>
  <div v-else ref="pane">面板 B</div>
</template>
```

`pane` 从面板 A 切到面板 B 时，旧元素被 `unobserve`、新元素被 `observe` 并触发一次回调。

### useObserverCallback 管理动态数量节点

节点数量运行时变化的场景：每挂载一个节点注册一次，卸载时注销：

```vue
<script setup lang="ts">
import { useObserverCallback } from '@veltra/compositions'
import { onBeforeUnmount, ref } from 'vue'

const { observeEl, unobserveEl } = useObserverCallback()

const items = ref<{ id: number; el?: HTMLElement }[]>([
  { id: 1 },
  { id: 2 }
])

function setEl(item: { id: number; el?: HTMLElement }, el: unknown) {
  if (!(el instanceof HTMLElement)) return
  item.el = el
  // 首次回调被跳过；元素尺寸后续变化时触发
  observeEl(el, (entry) => {
    console.log(`节点 ${item.id} 宽度`, entry.contentRect.width)
  })
}

onBeforeUnmount(() => {
  items.value.forEach((item) => item.el && unobserveEl(item.el))
})
</script>

<template>
  <div v-for="item in items" :key="item.id" :ref="(el) => setEl(item, el)">
    节点 {{ item.id }}
  </div>
</template>
```

`observeEl` 接收元素本身（不是 ref）；组件卸载时 `useObserverCallback` 内部也会清空全部观察，此处显式 `unobserveEl` 是为了在节点单独移除时及时注销。

## 注意事项

> [!WARNING]
> - `when` 选项声明了但实现未使用：依赖它控制启停不会生效，启停用 `disconnect()` 与 targets 的 ref 值控制。
> - `targets` 必须是 ref（`RefElement`），不能直接传 DOM 元素；`observeEl` 相反，必须传元素本身。
> - 本库是 `useResizeObserver(options)`（对象参数），不是 VueUse `useResizeObserver(target, cb)`（位置参数）；回调名是 `onResize`，不是 VueUse 的原生回调第二参形式。
> - `useResizeObserver` 数组形式下 `watch(targets)` 只追踪数组内各 ref 的值变化；用 `push` / `splice` 增删成员不会建立观察，数组目标集合在调用时确定。
> - `disconnect()` 后 watcher 未停止：ref 再变化会创建新观察器继续工作；需要永久停止时把 `targets` 置 `null` 后再 `disconnect()`。

## 常见问题

### 首次回调触发时读不到最新布局

`onResize` 首次触发发生在元素被观察时，与挂载同帧，此时若刚改动内容，布局尚未稳定。修复：需要稳定后的尺寸时在回调内用 `requestAnimationFrame` 二次读取，或改用 `useReactiveSize` 拿持续更新的 reactive 宽高。

### `observeEl` 注册的回调一次都没执行

每个元素的首次回调被内部标记跳过，元素尺寸不再变化就没有第二次触发。修复：初始状态需要读取尺寸的逻辑不要放在回调里，注册后直接读一次 `el.clientWidth` / `entry`，或先改元素尺寸触发变化。
