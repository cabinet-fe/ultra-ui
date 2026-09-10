---
title: 动画与帧工具
description: 动画驱动工具集：ExpandTransition 高度展开/收起过渡（可接 Vue transition 钩子），Tween 基于 requestAnimationFrame 的数值补间，nextFrame 双 rAF 延迟，createIncrease 自增序列，createToggle 布尔开关。
aliases: [ExpandTransition, Tween, nextFrame, createIncrease, createToggle, 补间动画]
keywords: [ExpandTransition, Tween, nextFrame, createIncrease, createToggle, AnimeConfig, TweenConfig, easing, requestAnimationFrame, transitionend, 高度过渡, 展开收起, 折叠面板, 补间动画, 缓动函数, 帧回调, 自增, 布尔开关]
---

# 动画与帧工具

`@veltra/utils` 导出动画与调度工具：`ExpandTransition` 类驱动高度展开/收起过渡，`Tween` 类对数值状态做补间，`nextFrame` 双 `requestAnimationFrame` 延迟，`createIncrease` / `createToggle` 生成自增函数与布尔开关。折叠面板、数字滚动、弹层时序场景使用这一组工具。

## 快速上手

`ExpandTransition` 配合 Vue `<transition>` 钩子实现高度 0 到 auto 的展开收起：

```vue
<script setup lang="ts">
import { ExpandTransition } from '@veltra/utils'
import { ref } from 'vue'

const open = ref(true)
const t = new ExpandTransition({ transition: 'height 0.24s cubic-bezier(0.4, 0, 0.2, 1)' })
</script>

<template>
  <button @click="open = !open">切换</button>
  <transition
    @enter="(el: Element) => t.enter(el as HTMLElement)"
    @after-enter="(el: Element) => t.afterEnter(el as HTMLElement)"
    @before-leave="(el: Element) => t.beforeLeave(el as HTMLElement)"
    @leave="(el: Element) => t.leave(el as HTMLElement)"
    @after-leave="(el: Element) => t.afterLeave(el as HTMLElement)"
  >
    <div v-show="open">内容</div>
  </transition>
</template>
```

## API 签名

### ExpandTransition

```ts
export interface ExpandTransitionOptions {
  /** 进出共用的 CSS transition 值；缺省 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)' */
  transition?: string
  /** 进入过渡，优先于 transition */
  enterTransition?: string
  /** 离开过渡，优先于 transition */
  leaveTransition?: string
  /** true 时同时动画 opacity；仅 Vue 钩子路径生效 */
  opacity?: boolean
}

export class ExpandTransition {
  constructor(options?: ExpandTransitionOptions)
  /** Vue 钩子：进入，从 height:0 过渡到 scrollHeight */
  enter(el: HTMLElement): void
  /** Vue 钩子：进入完成，清除全部临时 inline 样式 */
  afterEnter(el: HTMLElement): void
  /** Vue 钩子：离开前，锁定当前高度与 padding */
  beforeLeave(el: HTMLElement): void
  /** Vue 钩子：离开，高度过渡到 0 */
  leave(el: HTMLElement): void
  /** Vue 钩子：离开完成，清除全部临时 inline 样式 */
  afterLeave(el: HTMLElement): void
  /** 命令式展开；onEnd 在落定（含无需动画直接落定）后调用，被新动画打断时不调用 */
  expand(el: HTMLElement, onEnd?: () => void): void
  /** 命令式收起；onEnd 语义同 expand */
  collapse(el: HTMLElement, onEnd?: () => void): void
  /** 取消进行中的动画并立刻落位：expanded 为 true 设 height:auto，否则 height:0 */
  setExpanded(el: HTMLElement, expanded: boolean): void
  /** 取消该元素上未完成的动画监听；被打断动画的 onEnd 不会再调用 */
  cancel(el: HTMLElement): void
}
```

### Tween

```ts
export interface TweenConfig<State extends Record<string, number>> {
  /** 动画时长（毫秒），默认 300 */
  duration?: number
  /** 每帧状态更新后调用 */
  onUpdate?(state: State): void
  /** 动画结束时调用 */
  onComplete?(state: State): void
  /** 缓动函数，默认 Tween.easing.linear */
  easingFunction?: (progress: number) => number
}

export interface AnimeConfig<State extends Record<string, number>> {
  /** 单次动画覆盖时长 */
  duration?: number
  /** 单次动画覆盖完成回调 */
  onComplete?(state: State): void
  /** 单次动画覆盖缓动 */
  easingFunction?: (progress: number) => number
}

export class Tween<State extends Record<string, number> = Record<string, number>> {
  /** 补间状态对象，原地修改（引用不变，字段值随帧更新） */
  readonly state: State
  constructor(state: State, config?: TweenConfig<State>)
  /** 补间到 state 给出的键；仅插值 state 中已存在的键；开始前停掉进行中的动画 */
  to(state: Partial<State>, config?: AnimeConfig<State>): void
  /** 补间回构造时的初始状态快照 */
  back(config?: AnimeConfig<State>): void
  /** 静态缓动库：linear / easeInQuad / easeOutQuad / easeInOutQuad / easeInBack / easeOutBack / easeInOutBack */
  static readonly easing: Record<string, (p: number) => number>
}
```

### nextFrame / createIncrease / createToggle

```ts
/** 连续两层 requestAnimationFrame 后执行 cb；无返回值，无法取消 */
export function nextFrame(cb: () => void): void

/** 创建自增函数；initial 默认 1000；后置递增——首次调用返回 initial 本身 */
export function createIncrease(initial = 1000): () => number

export type Active = boolean | ((active: boolean) => boolean) | ((active: boolean) => Promise<boolean>)
type ToggleReturn = [{ value: boolean }, (active: Active) => void]

/**
 * 创建布尔开关
 * @param initial 初始值，默认 false
 * @param onChange 值被 toggle 更新后调用
 * @returns [state, toggle]；state 是普通对象 { value: boolean }，不是 Vue ref
 */
export function createToggle(initial?: boolean, onChange?: (active: boolean) => void): ToggleReturn
```

## 参数说明

### ExpandTransitionOptions

| 字段 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `transition` | `string` | `'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)'` | 否 | 完整 CSS `transition` 值（属性 + 时长 + 缓动） |
| `enterTransition` | `string` | 回落 `transition` | 否 | 优先级高于 `transition` |
| `leaveTransition` | `string` | 回落 `transition` | 否 | 优先级高于 `transition` |
| `opacity` | `boolean` | `false` | 否 | 仅 `enter` / `beforeLeave` / `leave` 钩子路径生效；`expand` / `collapse` 恒只动画高度 |

副作用：所有方法直接改写 `el` 的 inline style（`box-sizing`、`height`、`padding-top`、`padding-bottom`、`overflow`、`transition`、`will-change`，钩子路径含 `opacity`）；`expand` / `collapse` 监听 `transitionend` / `transitioncancel` 并在落定后清除临时样式。`expand` / `collapse` 在起始高度与目标高度相同时跳过动画、同步落位并立即调用 `onEnd`。

### Tween 构造配置

| 字段 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `state` | `State extends Record<string, number>` | — | 是 | 补间对象，逐帧原地写入 |
| `duration` | `number` | `300` | 否 | 毫秒；`to` 的 `config.duration` 可单次覆盖 |
| `onUpdate` | `(state) => void` | — | 否 | 每帧调用，含最后一帧 |
| `onComplete` | `(state) => void` | — | 否 | 动画结束时调用；被 `to` 打断的旧动画不触发，新动画结束时触发 |
| `easingFunction` | `(progress) => number` | `Tween.easing.linear` | 否 | 入参 0~1 线性进度，返回缓动后进度 |

### createToggle 的 toggle 入参

| 入参形态 | 行为 |
| --- | --- |
| `boolean` | 直接设为该值并触发 `onChange` |
| `(active) => boolean` | 用当前值算下一值，递归走 boolean 分支 |
| `(active) => Promise<boolean>` | Promise 兑现后以兑现值递归走 boolean 分支；兑现值必须是 `boolean` |

## 典型示例

### 命令式播放折叠面板

```ts
import { ExpandTransition } from '@veltra/utils'

const panel = document.querySelector<HTMLElement>('.panel')!
const t = new ExpandTransition({ transition: 'height 0.25s ease' })

// 初始状态直接落位，不播动画
t.setExpanded(panel, false)

t.expand(panel) // 展开到内容高度
t.collapse(panel, () => {
  // 收起落定后执行，如卸载内容
})
t.cancel(panel) // 组件卸载前取消监听
```

### 数字滚动

```ts
import { Tween } from '@veltra/utils'

const display = document.querySelector<HTMLElement>('.display')!
const number = { value: 0 }
const tween = new Tween(number, {
  duration: 800,
  easingFunction: Tween.easing.easeInOutQuad,
  onUpdate(state) {
    display.textContent = String(Math.round(state.value))
  },
  onComplete(state) {
    display.textContent = String(state.value) // => '100'
  }
})

tween.to({ value: 100 })
// tween.back() // 回到构造时的 { value: 0 }
```

### 双帧后读取布局与基础辅助

```ts
import { createIncrease, createToggle, nextFrame } from '@veltra/utils'

// 等当前帧绘制完成再读布局（如展开后测量再滚动）
nextFrame(() => {
  const el = document.querySelector<HTMLElement>('.target')!
  el.scrollIntoView()
})

// 自增序列：首次调用返回初始值本身
const nextId = createIncrease(1)
nextId() // => 1
nextId() // => 2

// 布尔开关
const [state, toggle] = createToggle(false, (active) => {
  console.log(active) // => true
})
toggle(true)
toggle((active) => !active)
console.log(state.value) // => false
```

## 注意事项

> [!WARNING]
> - `ExpandTransition` 的高度动画要求元素 `box-sizing: border-box` 且 padding 可控，类内自动设置并在落定后还原；禁止在动画期间并发改写这些 inline 属性。
> - `opacity: true` 只在 Vue `<transition>` 钩子路径（`enter` / `beforeLeave` / `leave`）生效；`expand` / `collapse` 恒只动画高度。
> - `ExpandTransition` 实例内部按元素记录动画状态；同一元素禁止用两个实例同时驱动，多面板共用一个实例。
> - `Tween` 只插值 `state` 中已存在的键；`to({ key: 1 })` 中 `state` 没有 `key` 时该键被忽略。
> - `Tween.state` 是原地修改，传响应式对象时字段变化可被追踪，但引用不变，`watch` 需开 `deep` 或读字段。
> - `createIncrease` 是后置递增：首次调用返回 `initial` 本身；全局弹层层级单例是 `zIndex`（见 `agent-docs/utils/style.md`）。
> - `createToggle` 的 `state` 是普通对象，直接改 `state.value` 不触发 `onChange`；必须通过 `toggle` 修改。
> - `nextFrame` 无法取消；需要在卸载前取消时自行持帧 ID 用原生 `requestAnimationFrame`。
