---
title: useUserAction / useFocus 用户交互组合式函数
description: 从 @veltra/compositions 导出的两个用户交互组合式函数：useUserAction 用计数窗口标记用户主动操作，在窗口内跳过 watch 回显以切断 emit → props 回流的循环更新；useFocus 维护聚焦状态 ref 并提供 handleFocus / handleBlur 处理器。两者在 UInput、UDatePicker 等受控表单控件中搭配使用。
aliases: [use-user-action, useFocus, use-focus, 用户操作窗口, 回显屏蔽, 焦点状态管理]
keywords: [useUserAction, UserAction, UserActionResult, isUserActive, userAction, useFocus, handleFocus, handleBlur, nextTick, 循环更新, 回显屏蔽, 双向绑定死循环, 聚焦状态, 失焦校验, watch 守卫, 用户主动操作]
---

# useUserAction / useFocus 用户交互组合式函数

`@veltra/compositions` 导出 `useUserAction` 与 `useFocus` 两个用户交互组合式函数。`useUserAction()` 返回 `userAction` 包装器与 `isUserActive` 判断：被包装的函数执行期间（含其后一次 `nextTick`）`isUserActive()` 为 `true`，用于让 `watch(props.modelValue)` 跳过用户自己触发的回流。`useFocus(cb?)` 返回 `focus` 状态与 `handleFocus` / `handleBlur` 处理器，只同步状态、不操作 DOM 焦点。二者在 `UInput`、`UDatePicker` 等受控控件中搭配使用。

## 快速上手

```vue
<script setup lang="ts">
import { useUserAction } from '@veltra/compositions'
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const inner = ref('')

const { userAction, isUserActive } = useUserAction()

// 用户选择：标记为用户动作，窗口期内 watch 不回写内部状态
const handleSelect = userAction((value: string) => {
  inner.value = value
  emit('update:modelValue', value)
})

// 外部回显：用户动作窗口期内跳过，防止循环更新
watch(
  () => props.modelValue,
  (v) => {
    if (isUserActive()) return
    inner.value = v ?? ''
  },
  { immediate: true }
)
</script>

<template>
  <div class="demo" @click="handleSelect('ok')">{{ inner }}</div>
</template>
```

`useFocus` 同理一行接入，见「典型示例」第三节。

## API 签名

```ts
/** 把函数标记为用户动作的包装器类型 */
export type UserAction = <T extends (...args: any[]) => void | Promise<void>>(
  fn: T
) => (...args: Parameters<T>) => Promise<void>

export interface UserActionResult {
  /** 当前是否存在进行中的用户动作窗口 */
  isUserActive: () => boolean
  /** 包装器：把同步/异步函数包装成用户动作 */
  userAction: UserAction
}

/** 创建用户动作窗口。无参数、无清理需求 */
export function useUserAction(): UserActionResult

/** 聚焦状态。cb 在每次焦点变化后被调用，参数为最新状态 */
export function useFocus(cb?: (focused: boolean) => void): {
  /** 是否聚焦，初始 false */
  focus: Ref<boolean>
  /** 绑定到 @blur：focus 置 false 后调用 cb(false) */
  handleBlur: () => void
  /** 绑定到 @focus：focus 置 true 后调用 cb(true) */
  handleFocus: () => void
}
```

`Ref` 类型来自 `vue`。`UserAction`、`UserActionResult` 与 `useFocus` 均从 `@veltra/compositions` 直接导出。

## 参数说明

### useUserAction

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| （无参数） | — | — | — | 内部为模块外闭包计数器 `actionCount`，每次调用返回独立实例 |
| `fn`（`userAction` 的参数） | `(...args: any[]) => void \| Promise<void>` | — | 是 | 同步或异步函数；抛出的异常被捕获后 `console.error`，不再向外抛 |
| 包装后函数的参数 | `Parameters<T>` | — | — | 原样转发给 `fn`；返回值恒为 `Promise<void>`，不是 `fn` 的返回值 |

### useFocus

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `cb` | `(focused: boolean) => void` | — | 否 | 在 `focus.value` 赋值之后同步调用；`handleFocus` 传 `true`，`handleBlur` 传 `false` |

## 方法与事件

### userAction 包装后的函数

签名：`(...args: Parameters<T>) => Promise<void>`，异步。执行顺序固定为：

1. `actionCount++`，进入用户动作窗口，此后 `isUserActive()` 返回 `true`。
2. `await fn(...args)`；`fn` 抛错时以 `console.error` 记录，异常不向外传播，`Promise` 不会 reject。
3. `await nextTick()`，等本轮组件更新完成。
4. `actionCount--`，退出窗口。

多个被包装函数并发调用时窗口按计数嵌套：全部完成后 `isUserActive()` 才回到 `false`。

### isUserActive

签名：`() => boolean`，同步，返回 `actionCount > 0`。只在「包装函数调用后到其后的下一次 tick 前」之间为 `true`；`watch` 回调里用它做守卫。

### useFocus 返回值

- `focus`：`Ref<boolean>`，初始 `false`。只由 `handleFocus` / `handleBlur` 修改；不监听任何 DOM 事件，绑定事件由调用方完成。
- `handleFocus()` / `handleBlur()`：同步，无返回值、不抛错。先改 `focus.value` 再调用 `cb`。

## 典型示例

### 日期选择：提交动作与 modelValue 回显互斥

`UDatePicker` 内部的真实模式：用户选日期走 `userAction` 窗口，外部 `modelValue` 变化回显时跳过窗口期：

```vue
<script setup lang="ts">
import { useUserAction } from '@veltra/compositions'
import { ref, shallowRef, watch } from 'vue'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const currentDate = shallowRef<string | undefined>()

const { userAction, isUserActive } = useUserAction()

const commitSelectedDate = userAction((value: string) => {
  currentDate.value = value
  emit('update:modelValue', value)
})

watch(
  () => props.modelValue,
  (v) => {
    if (isUserActive()) return // 用户刚选择过，跳过回显
    currentDate.value = v
  }
)

function clear() {
  commitSelectedDate('')
}
</script>

<template>
  <input :value="currentDate" readonly @click="clear" />
</template>
```

窗口覆盖到 `nextTick` 之后：父组件同步回写 `modelValue` 触发的 `watch` 在同一轮 flush 中执行时 `isUserActive()` 仍为 `true`，回显被跳过。

### 并发窗口按计数嵌套

窗口计数支持叠加，两个动作并发时窗口以最后一个结束为准：

```ts
import { useUserAction } from '@veltra/compositions'

const { userAction, isUserActive } = useUserAction()

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const slow = userAction(async () => {
  await delay(100)
})
const fast = userAction(async () => {
  await delay(10)
})

async function main() {
  const p1 = slow()
  console.log(isUserActive()) // => true
  await fast()
  console.log(isUserActive()) // => true，slow 仍在窗口内
  await p1
  console.log(isUserActive()) // => false，全部结束
}

main()
```

包装后的函数立即返回 `Promise`，调用处不 `await` 也会先进入窗口。

### useFocus 绑定原生焦点并转发事件

`UInput` 内部的真实用法：`focus` 驱动聚焦样式，`cb` 里转发 `focus` / `blur` 事件：

```vue
<script setup lang="ts">
import { useFocus } from '@veltra/compositions'
import { computed, ref } from 'vue'

const emit = defineEmits<{ focus: []; blur: [] }>()

const inputEl = ref<HTMLInputElement>()

const { focus, handleBlur, handleFocus } = useFocus((focused) => {
  // 在状态变更后调用；据此转发原生焦点事件
  focused ? emit('focus') : emit('blur')
})

const inputClass = computed(() => ({ 'is-focus': focus.value }))

function focusInput() {
  // useFocus 不操作 DOM 焦点；主动聚焦需调用原生 focus()
  inputEl.value?.focus()
}
</script>

<template>
  <div :class="inputClass">
    <input ref="inputEl" @focus="handleFocus" @blur="handleBlur" />
  </div>
</template>
```

`focus.value` 为 `true` 时容器带 `is-focus` 类；外部调用 `focusInput()` 触发原生聚焦后，浏览器派发的 `focus` 事件会把状态同步为 `true`。

## 注意事项

> [!WARNING]
> - `userAction` 包装后的函数返回 `Promise<void>` 且不会 reject：`fn` 的异常被 `console.error` 吞掉。需要向上传播错误时在 `fn` 内部自行 try/catch 处理，不能依赖外层 `catch`。
> - 窗口结束点包含一次 `await nextTick()`：同步代码里调用包装函数后立刻读 `isUserActive()` 为 `true`，但 `await` 该 Promise 完成后即为 `false`；守卫必须放在窗口期内会执行的 `watch` / 回调里，而不是延迟检查。
> - `useFocus` 是状态同步，不是焦点管理：它不调用 `element.focus()` / `blur()`，也不监听 `focusin`；给 `<input>` 绑 `@focus` / `@blur` 才会更新。
> - `useUserAction` 的计数器不与组件生命周期绑定，无 `onBeforeUnmount` 清理；窗口内发起的异步操作在组件卸载后仍会执行完毕。
> - 本库是 `isUserActive()`（函数调用），不是布尔 ref `isActive.value`；`useFocus` 返回的 `focus` 才是 ref，模板外读值要 `focus.value`。

## 常见问题

### `watch(props.modelValue)` 在用户选择后又被触发了一次，界面闪回旧值

原因：`watch` 回调没有用 `isUserActive()` 守卫，或触发点晚于窗口结束。修复：确认回显逻辑写成 `if (isUserActive()) return`，且用户动作经 `userAction` 包装；若父组件回写是异步的（跨过 `nextTick`），窗口无法覆盖，需要在 `fn` 里把回写限制在同一轮更新内。

### 包装函数抛错后没有日志、也没有 reject

`useUserAction` 约定异常路径：`console.error(error)` 后照常结束窗口。排查错误到控制台按 `error` 过滤；要让调用方感知失败，把业务逻辑移到 `fn` 内部自行捕获并上报。
