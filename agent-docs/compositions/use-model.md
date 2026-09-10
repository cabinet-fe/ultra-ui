---
title: useModel 双向绑定组合式函数
description: 构造组件 v-model 双向绑定状态的组合式函数：local 模式内部持有副本并自动 watch props 回写（非受控下视图也能更新），proxy 模式纯代理完全受控，支持命名 model（propName）、默认值回退、浅层响应与运行时切换受控行为，适用于封装表单类、弹窗类组件。
aliases: [use-model, 双向绑定, v-model 封装, 受控组件, 非受控组件]
keywords: [props, propName, emit, local, defaultValue, shallow, modelValue, update:modelValue, __v_isRef, 受控, 非受控, 本地模式, v-model, 命名模型, 浅层响应]
---

# useModel 双向绑定组合式函数

`@veltra/compositions` 导出 `useModel`：在组件 `setup` 里把 `props` + `emit` 组装成一个可读写的模型值。默认 `local: true` 为「本地模式」——内部持有副本，赋值时 `emit('update:${propName}')` 并同步本地副本，父组件不绑定 `v-model` 时组件视图也能更新；`local: false` 为「代理模式」——读取直接来自 props，写入只 emit，行为完全受控。

## 快速上手

```vue
<script setup lang="ts">
import { useModel } from '@veltra/compositions'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// propName 缺省为 'modelValue'，local 缺省为 true
const model = useModel({ props, emit, defaultValue: '' })

function setInput(v: string) {
  model.value = v // => 触发 emit('update:modelValue', v)，并同步本地副本
}
defineExpose({ setInput })
</script>

<template>
  <!-- model 带 __v_isRef: true，模板中按 ref 解包 -->
  <input :value="model" @input="setInput(($event.target as HTMLInputElement).value)" />
</template>
```

## API 签名

```ts
interface ModelOptions<Props extends Record<string, unknown>, Name extends keyof Props> {
  /** 组件 defineProps 的返回值。必填 */
  props: Props
  /** 绑定的属性名。默认 'modelValue' */
  propName?: Name
  /** 组件 defineEmits 的返回值。必填 */
  emit: (...args: any[]) => void
  /**
   * 是否本地模式（非受控）。默认 true。
   * 传函数时在每次写入 value 求值，可运行时切换受控行为
   */
  local?: boolean | (() => boolean)
  /** props 上无值时的回退默认值 */
  defaultValue?: Props[Name]
  /**
   * 内部副本是否用 shallowRef，仅 local 分支生效。
   * 默认 false（深响应 ref）
   */
  shallow?: boolean
}

export function useModel<
  Props extends Record<string, any>,
  Name extends keyof Props = 'modelValue'
>(
  options: ModelOptions<Props, Name>
): Ref<Props[Name] | undefined> | { __v_isRef: boolean; value: Props[Name] }
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `props` | `Props extends Record<string, any>` | — | 是 | 必须包含 `propName` 对应的属性声明，否则读取永远走 `defaultValue` |
| `propName` | `Name extends keyof Props` | `'modelValue'` | 否 | 事件名固定为 `update:${propName}` |
| `emit` | `(...args: any[]) => void` | — | 是 | `defineEmits` 返回值直接传入 |
| `local` | `boolean \| (() => boolean)` | `true` | 否 | 函数形式在每次写入时求值；返回 `false` 的那次写入只 emit 不同步本地 |
| `defaultValue` | `Props[Name]` | — | 否 | `props[propName]` 为 `undefined` 时的读取回退 |
| `shallow` | `boolean` | `false` | 否 | 仅 `local: true` 分支生效；大对象（如表格行）用 `true` 降低响应式开销 |

## 方法与事件

返回值是一个带 `__v_isRef: true` 的对象（getter/setter 代理），在模板、`watch`、`v-model` 传递中都按 ref 使用（`.value` 读写）。

`local: true`（本地模式）：

- 初始化：内部副本值为 `props[propName] ?? defaultValue`
- 读取：来自内部副本；props 更新时内部 `watch` 自动把新值同步进副本
- 写入 `model.value = v`：`v !== 当前副本值` 时 emit `update:${propName}`；`local()` 求值为 `true` 时同时更新副本（父组件没绑 `v-model` 视图也能更新）
- `shallow: true` 时副本用 `shallowRef` 创建

`local: false`（代理模式）：

- 读取：直接返回 `props[propName] ?? defaultValue`
- 写入：仅 emit `update:${propName}`，本地不保存任何状态
- 无内部 `watch`，行为完全受控

事件：写入时触发的事件名由 `propName` 决定——`propName: 'visible'` 对应 `update:visible`，父组件用 `v-model:visible` 绑定。

## 典型示例

### 命名 model 弹窗开关（默认值 + 本地模式）

```vue
<script setup lang="ts">
import { useModel } from '@veltra/compositions'

const props = defineProps<{ visible?: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

// 父组件未绑 v-model:visible 时，内部副本默认 false，弹窗仍可独立开关
const visible = useModel({
  props,
  emit,
  propName: 'visible',
  defaultValue: false
})

function close() {
  visible.value = false // => emit('update:visible', false) + 副本同步
}
defineExpose({ close })
</script>

<template>
  <div v-if="visible">
    弹窗内容
    <button @click="close">关闭</button>
  </div>
</template>
```

### 完全受控模式（local: false）

```vue
<script setup lang="ts">
import { useModel } from '@veltra/compositions'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// 读取永远来自 props；写入只 emit，状态由父组件独占
const value = useModel({
  props,
  emit,
  local: false,
  defaultValue: 'draft'
})

console.log(value.value) // => props.modelValue ?? 'draft'
</script>

<template>
  <input
    :value="value"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
```

### 运行时切换受控行为 + 浅层副本（表格高亮当前行）

```ts
import { useModel } from '@veltra/compositions'

const props = defineProps<{
  current?: Record<string, unknown>
  highlightCurrent?: boolean
}>()
const emit = defineEmits<{ 'update:current': [value: Record<string, unknown>] }>()

// local 为函数：每次写入求值，highlightCurrent 关闭时点击行只 emit 不改本地高亮
const currentRow = useModel({
  props,
  emit,
  propName: 'current',
  shallow: true, // 行对象较大，用浅层 ref
  local: () => !!props.highlightCurrent
})

function onRowClick(row: Record<string, unknown>) {
  currentRow.value = row
}
```

## 注意事项

> [!WARNING]
> - 本库是 `@veltra/compositions` 的 `useModel`，不是 Vue 3.4 内置 `useModel`（`defineModel` 的别名）；两者签名与行为不同，禁止混用 import 来源。
> - 本地模式下读取来自内部副本而不是 props 实时值；props 变更经 `watch` 同步副本，两次同步之间读取到的是旧值，强实时场景用 `local: false`。
> - 写入只在 `v !== 当前值` 时 emit；对同一值重复赋值不触发事件。
> - `shallow` 只影响 `local: true` 的内部副本，`local: false` 模式下无意义。
> - 表单控件放进 `<u-form>` 时必须用 `field` 绑定 model，有 `field` 就禁止再写 `v-model`，二者同时存在会双重写值。
> - 必须在组件 `setup` 中调用（本地模式内部使用 `watch`）。

## 常见问题

### 父组件没绑 v-model 时视图不更新

原因：用了 `local: false` 的纯代理模式，写入只 emit，本地无状态。修复：改用默认 `local: true`，或在文档层面约定该组件必须配合 `v-model` 使用。
