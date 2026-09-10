---
title: useTransition 命令式过渡动效
description: 从 @veltra/compositions 导出的命令式过渡组合式函数，'css' 模式按类名（*-enter-from/active/to、*-leave-from/active/to）驱动过渡，'style' 模式按内联样式驱动；返回 toggle / enter / leave，进入与离开互相打断时阶段自动接管不卡死，用于弹层显隐、面板折叠、最大化切换等需要 JS 控制动画时序的场景。
aliases: [use-transition, 命令式过渡, css 过渡, style 过渡, 显隐动画]
keywords: [useTransition, useCssTransition, useStyleTransition, CssTransitionOptions, StyleTransitionOptions, keepEnterTo, afterEnter, afterLeave, toggle, enter, leave, enter-from, enter-active, leave-active, transitionend, 过渡动画, 进出打断, 弹层动画, 折叠展开]
---

# useTransition 命令式过渡动效

`@veltra/compositions` 导出的 `useTransition(type, options)` 以命令式 API 驱动进入 / 离开过渡：`type: 'css'` 走类名过渡（生成 `${name}-enter-from|active|to`、`${name}-leave-from|active|to` 六个类），`type: 'style'` 走内联样式过渡。返回 `{ toggle, enter, leave }`，由调用方决定何时播放，适配 `<Transition>` 组件不好接手的场景：弹层显隐后销毁 DOM、对话框最大化、联动手势动画。阶段互被打断时由新阶段接管，不会卡在半途。

## 快速上手

```vue
<script setup lang="ts">
import { useTransition } from '@veltra/compositions'
import { shallowRef } from 'vue'

const panel = shallowRef<HTMLElement>()

// css 模式：name 为类名前缀，类需自行定义样式
const transition = useTransition('css', {
  target: panel,
  name: 'fade',
  afterLeave() {
    console.log('离开完成')
  }
})

function show() {
  transition.enter()
}

function hide() {
  transition.leave()
}
</script>

<template>
  <button @click="show">进入</button>
  <button @click="hide">离开</button>
  <div ref="panel" class="panel">内容</div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s linear;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

`enter()` 播放进入过渡，`leave()` 播放离开过渡；`enter` / `leave` 分别是 `toggle(true)` / `toggle(false)` 的别名。类名样式必须自行提供（或用 `@veltra/styles` 预置过渡），否则类加了但没有动画。

## API 签名

```ts
/**
 * 类名过渡。类型参数只接受 'css'；传入其他值一律按 style 模式处理
 */
export function useTransition(type: 'css', options: CssTransitionOptions): Returned

/**
 * 内联样式过渡
 */
export function useTransition(type: 'style', options: StyleTransitionOptions): Returned

interface TransitionBase {
  /** 被应用的目标元素：元素本身或 ShallowRef */
  target: ShallowRef<HTMLElement | undefined> | HTMLElement
  /** 进入动画结束回调 */
  afterEnter?: () => void
  /** 进入动画被取消回调（当前两种实现都不会触发，见注意事项） */
  enterCanceled?: () => void
  /** 离开动画结束回调 */
  afterLeave?: () => void
  /** 离开动画被取消回调（当前两种实现都不会触发，见注意事项） */
  leaveCanceled?: () => void
}

interface CssTransitionOptions extends TransitionBase {
  /** 类名前缀，支持 string | Ref<string> | ShallowRef<string>，响应式切换动画 */
  name: ShallowRef<string> | string | Ref<string>
  /** 为 true 时进入结束后保留 `*-enter-to` 类，只移除 `*-enter-active`。默认 false */
  keepEnterTo?: boolean
}

interface StyleTransitionOptions extends TransitionBase {
  /** 进入后的目标样式，必需；其 key 也是 transitionend 的过滤范围 */
  enterTo: CSSProperties
  /** 进入过渡期间的样式，必需 */
  enterActive: CSSProperties
  /** 离开过渡期间的样式，必需 */
  leaveActive: CSSProperties
}

interface Returned {
  /** 切换进入/离开。传函数时入参为当前状态，返回值为目标状态 */
  toggle(active: boolean | ((active: boolean) => boolean)): void
  /** 进入动画，toggle(true) 的别名 */
  enter(): void
  /** 离开动画，toggle(false) 的别名 */
  leave(): void
}
```

`CssTransitionOptions`、`StyleTransitionOptions`、`Returned` 接口未从 `@veltra/compositions` 导出，`import type { CssTransitionOptions }` 会失败；调用时按结构传对象，返回值按结构使用。

## 参数说明

### 公共选项（两种模式共用）

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `target` | `ShallowRef<HTMLElement \| undefined> \| HTMLElement` | — | 是 | ref 形式支持运行时替换元素；目标不存在时进入 / 离开调用为空操作 |
| `afterEnter` | `() => void` | — | 否 | 进入阶段完整结束（类清理 / 样式恢复）后触发；该阶段被新阶段打断时不触发 |
| `afterLeave` | `() => void` | — | 否 | 离开阶段完整结束后触发；典型用途是 `visible.value = false` 再卸载 DOM |
| `enterCanceled` / `leaveCanceled` | `() => void` | — | 否 | 类型存在，但当前实现不会触发（见注意事项） |

### css 模式专属

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `name` | `string \| Ref<string> \| ShallowRef<string>` | — | 是 | 生成 `${name}-enter-from`、`${name}-enter-to`、`${name}-enter-active`、`${name}-leave-from`、`${name}-leave-to`、`${name}-leave-active` 六个类；ref 形式可在切换动画时响应式改名 |
| `keepEnterTo` | `boolean` | `false` | 否 | `true` 时进入结束后仅移除 `*-enter-active`，保留 `*-enter-to`（元素停留在进入终态样式）；`false` 时两者都移除 |

### style 模式专属

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `enterTo` | `CSSProperties` | — | 是 | 进入的终态样式；进入前的原始值在 target 出现时自动采样，离开时按 key 恢复 |
| `enterActive` | `CSSProperties` | — | 是 | 进入期间的过渡声明，如 `{ transition: 'opacity 0.3s' }` |
| `leaveActive` | `CSSProperties` | — | 是 | 离开期间的过渡声明 |

## 方法与事件

返回 `Returned`，三个方法均为同步调用、内部异步完成动画：

- `toggle(active: boolean)`：`true` 播放进入，`false` 播放离开；与当前状态相同时不重复播放。传入函数 `toggle((current) => !current)` 时以当前状态求出目标状态再切换。
- `enter()`：`toggle(true)` 别名。css 模式流程：移除全部离开类 → 加 `enter-from` → 双 `requestAnimationFrame` 后加 `enter-active`、移除 `enter-from`、加 `enter-to` → 按元素计算样式的「最长 transition 时长 + 延迟 + 50ms」定时器收尾：移除 `enter-active`（`keepEnterTo: true` 时保留 `enter-to`）并触发 `afterEnter`。
- `leave()`：`toggle(false)` 别名。css 模式流程：移除全部进入类 → 加 `leave-from`、`leave-active` → 双帧后移除 `leave-from`、加 `leave-to` → 同样定时器收尾：移除 `leave-active`、`leave-to` 并触发 `afterLeave`。
- style 模式流程：进入时加 `enterActive`、下一帧写 `enterTo`，结束时恢复采样到的原始样式并触发 `afterEnter`；离开时加 `leaveActive`、下一帧把 `enterTo` 的 key 恢复为原始值，`transitionend` 后恢复 `leaveActive` 并触发 `afterLeave`。
- 打断语义（两模式一致）：进入途中调 `leave()` 或反之，旧阶段立即作废，新阶段从零开始；旧阶段的 `afterEnter` / `afterLeave` 不触发，也没有取消回调。
- 清理：css 模式在 `onBeforeUnmount` 清理收尾定时器；style 模式在 `onBeforeUnmount` 移除 `transitionend` 监听。均无需手动清理。

## 典型示例

### css 模式：弹层收起后隐藏 DOM

`UDropdown` 内部的真实模式：离开动画结束后才把 `visible` 置 `false` 卸载节点，避免动画被 DOM 移除截断：

```vue
<script setup lang="ts">
import { useTransition } from '@veltra/compositions'
import { shallowRef, watch } from 'vue'

const props = defineProps<{ open: boolean }>()

const content = shallowRef<HTMLElement>()
const rendered = shallowRef(true)

const transition = useTransition('css', {
  target: content,
  name: 'slide-down',
  afterLeave() {
    // 离开动画完成后才卸载节点
    rendered.value = false
  }
})

watch(
  () => props.open,
  (open) => {
    if (open) rendered.value = true
    // 渲染与动画解耦：动画只负责播放，DOM 存在与否由 rendered 控制
    open ? transition.enter() : transition.leave()
  }
)
</script>

<template>
  <div v-if="rendered" ref="content" class="dropdown-content">菜单</div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}
</style>
```

连续快速切换 `open` 时阶段互相接管，动画从头播放新的方向，不会停在半透明状态。

### style 模式：无需预置类名的位移动画

样式直接写在 options 里，适合一次性、程序化的动效：

```vue
<script setup lang="ts">
import { useTransition } from '@veltra/compositions'
import { computed, shallowRef } from 'vue'

const trigger = shallowRef<HTMLElement>()

// target 支持计算 ref，这里直接观察触发元素本身
const origin = computed<HTMLElement | undefined>(() => trigger.value)

const transition = useTransition('style', {
  target: origin,
  enterTo: { transform: 'translate(100px, 0)' },
  enterActive: { transition: 'transform 0.3s' },
  leaveActive: { transition: 'transform 0.3s' }
})

function launch() {
  transition.toggle((active) => !active) // 每次点击在进出之间切换
}
</script>

<template>
  <button ref="trigger" @click="launch">位移动画元素</button>
</template>
```

`toggle` 的函数形式以当前状态取反，适合做开关；进入结束、离开开始时元素样式回到采样原点，动画可反复播放。

### css 模式 + keepEnterTo：最大化切换

`UDialog` 最大化内部用法：窗口最大化后需要一直保留终态样式：

```vue
<script setup lang="ts">
import { useTransition } from '@veltra/compositions'
import { shallowRef } from 'vue'

const dialog = shallowRef<HTMLElement>()
const maximized = shallowRef(false)

const maximizeTransition = useTransition('css', {
  target: dialog,
  name: 'dialog-maximize',
  keepEnterTo: true, // 进入结束后保留 dialog-maximize-enter-to
  afterLeave() {
    console.log('已还原')
  }
})

function toggleMaximize() {
  maximized.value = !maximized.value
  maximized.value ? maximizeTransition.enter() : maximizeTransition.leave()
}
</script>

<template>
  <div ref="dialog" class="dialog">对话框</div>
  <button @click="toggleMaximize">最大化 / 还原</button>
</template>

<style>
.dialog-maximize-enter-active {
  transition: width 0.25s ease, height 0.25s ease;
}
.dialog-maximize-enter-to {
  width: 100vw;
  height: 100vh;
}
.dialog-maximize-leave-active {
  transition: width 0.25s ease, height 0.25s ease;
}
</style>
```

`keepEnterTo: true` 让终态类在进入后常驻，元素保持最大化尺寸；离开阶段开始时 `enter-to` 被移除，元素在 `leave-active` 的过渡声明下动画还原到自然尺寸（与 `UDialog` 的 `dialog-maximize` 实现一致：无需定义 `leave-from` / `leave-to`）。

## 注意事项

> [!WARNING]
> - 本库是命令式 `enter()` / `leave()`，不是 `<Transition>` 组件的 `v-if` / `v-show` 声明式用法；DOM 的挂载与卸载完全由调用方控制，`afterLeave` 是卸载 DOM 的安全时机。
> - `type` 只认 `'css'`：传入其他任何值（包括 `'style'` 拼写错误以外的字符串）都按 style 模式处理，不会报错。
> - `enterCanceled` / `leaveCanceled` 当前实现不会触发：css 模式阶段被打断时由新阶段直接接管（阶段序号作废旧回调）；style 模式只注册了 `transitionend`，未监听 `transitioncancel`。不要把必要逻辑放进取消回调。
> - css 模式的结束回调靠「计算过渡时长 + 定时器」而非 `transitionend`：动画期间修改元素 `transition-duration` / `transition-delay` 会导致收尾时刻不准；定时器在计算值基础上加 50ms 容错。
> - style 模式只支持「当前样式 → `enterTo`」的进入方向：`enterFrom` / `leaveTo` 选项在类型与实现中均不存在；离开是把 `enterTo` 的 key 恢复为进入前采样值。`transitionend` 只认 `Object.keys(enterTo)` 中的属性名，子元素上的过渡不会误触发结束回调。
> - 本库是 `useTransition('css', { name, target })`（显式模式参数），不是 VueUse/开源库的 `useTransition`（数值插值动画）；做数值补间请用其他方案。

## 常见问题

### 类加了但没有动画

`name` 对应的类没有样式定义，或定义在 scoped 样式里但目标元素不在该组件的作用域内。修复：在本组件 `<style scoped>` 中定义全部六个类，或使用 `@veltra/styles` 预置过渡：`@use 'pkg:@veltra/styles/transitions/fade.scss' as *;`（预置有 `fade`、`fade-scale`、`slide`、`spring`、`zoom-in`）。

### 快速连点后元素停在中间状态

进入 / 离开必须经由 `toggle` / `enter` / `leave` 驱动；绕过它们直接操作类名或样式会绕过阶段接管。修复：状态切换统一收敛到 `useTransition` 的方法里，并且不要在 `afterEnter` / `afterLeave` 之外手动清理过渡类。

### style 模式进入动画没有过渡、直接跳到终态

`enterActive` 未提供 `transition` 声明，或 `transition` 属性名与 `enterTo` 中变化的属性对不上。修复：`enterActive` 写全，如 `{ transition: 'opacity 0.3s, transform 0.3s' }`，且属性名出现在 `enterTo` 中（`transitionend` 按 `enterTo` 的 key 过滤）。
