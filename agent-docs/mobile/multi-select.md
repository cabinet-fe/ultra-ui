---
title: UMultiSelect 多选选择器（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端多选选择器：点击触发器弹出底部面板多选，面板内勾选结果先暂存、点确定才落盘，支持取消丢弃、全选、最大可选数 max、已选展示上限 visibilityLimit、搜索与输入创建；已选项以可关闭标签单行展示在触发器上（超出折叠为 +N、长标签省略）。v-model 绑定选中值数组，属性与 @veltra/desktop 的 UMultiSelect 同名同默认值（弹层宽度类属性已移除），触发器密度与面板内搜索框字号（≥16px 防 iOS 聚焦缩放）走 --um-* 移动端 token。'
aliases: [MultiSelect, MultipleSelect, 多选下拉, 标签多选, 移动端多选]
keywords:
  [
    modelValue,
    options,
    valueKey,
    labelKey,
    filterable,
    creatable,
    clearable,
    visibilityLimit,
    max,
    MultiSelectProps,
    全选,
    暂存,
    确定,
    取消,
    标签,
    批量选择,
    远程搜索,
    数量上限,
    移动端多选
  ]
---

# UMultiSelect 多选选择器（@veltra/mobile 移动端）

`@veltra/mobile` 导出多选组件 `UMultiSelect`。点击触发器弹出**底部面板**：面板头部固定「取消 / 标题 / 确定」三段式，面板内勾选结果**先暂存**，点「确定」才写入 `v-model` 并发出 `change`，点「取消」或遮罩丢弃暂存。触发器上已选项以可关闭标签**单行**展示：超出 `visibilityLimit` 折叠为 `+N` 计数、长标签省略号截断，标签关闭与清除**立即生效**（不经暂存）。属性名、类型与默认值与 `@veltra/desktop` 的 `UMultiSelect` 对齐（breaking：桌面弹层的 `width` / `minWidth` 属性已随底部面板形态移除），触发器与选项密度走 `--um-*` 移动端 token。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UMultiSelect } from '@veltra/mobile'
import '@veltra/mobile/components/multi-select/style'

// 绑定值是数组，元素为各选中项 valueKey 字段的值
const selected = shallowRef<(string | number)[]>(['beijing'])

const cities = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' },
  { label: '深圳', value: 'shenzhen' }
]
</script>

<template>
  <UMultiSelect v-model="selected" :options="cities" placeholder="请选择城市" clearable filterable />
  <!-- 面板内勾选上海、广州后点确定：selected => ['beijing', 'shanghai', 'guangzhou'] -->
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件按需样式引入路径为 `@veltra/mobile/components/multi-select/style`。

## API 签名

```ts
// 以下公共类型定义来自 @veltra/utils（@veltra/mobile 未再导出，此处仅说明 prop 类型）
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

export interface ValidateRule {
  /** 是否必填。`true` 或校验失败提示文本 */
  required?: boolean | string
  /** 长度 */
  length?: number | [number, string]
  /** 最小值 */
  min?: number | [number, string]
  /** 最大值 */
  max?: number | [number, string]
  /** 最小长度 */
  minLen?: number | [number, string]
  /** 最大长度 */
  maxLen?: number | [number, string]
  /** 匹配 */
  match?: RegExp | [RegExp, string] | string
  /** 预设规则 */
  preset?: PresetRule
  /** 自定义校验：返回错误文本表示失败 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 多选器属性（MultiSelectProps 继承的 FormComponentProps 已展开） */
export interface MultiSelectProps {
  /** 绑定值：各选中项 valueKey 字段值的数组 */
  modelValue?: Array<any>
  /** 列表选项。传入函数时 filterable 被强制启用，且初始会以空串调用一次 */
  options?:
    Record<string, any>[] | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  /** 值字段名。默认 'value' */
  valueKey?: string
  /** 标签字段名。默认 'label' */
  labelKey?: string
  /** 是否可清除。默认 true */
  clearable?: boolean
  /** 占位符。默认 '请选择' */
  placeholder?: string
  /** 是否启用搜索。默认 false；creatable 或 options 为函数时强制开启 */
  filterable?: boolean
  /** 触发器上最多展示的标签数，超出折叠为 +N。默认 3 */
  visibilityLimit?: number
  /** 最大可选数量；达到上限后未选项禁用，且面板全选不可用 */
  max?: number
  /** 是否允许创建新选项（面板搜索框回车创建）。默认 false */
  creatable?: boolean
  /** 底部面板内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 底部面板内容容器类名 */
  contentClass?: unknown
  /** 组件尺寸。默认 'default' */
  size?: ComponentSize
  /** UForm 内的提示文字；移动端 UForm 不渲染该提示 */
  tips?: string
  /** 所占列数；移动端 UForm 单列呈现，该属性不生效 */
  span?:
    number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字，仅 UForm 内生效 */
  label?: string
  /** UForm 内绑定的 model 字段。设置后禁止再写 v-model */
  field?: string
  /** 是否禁用。默认 false */
  disabled?: boolean
  /** 是否只读（渲染为纯标签，不渲染触发器与面板）。默认 false */
  readonly?: boolean
  /** 校验规则，仅 UForm 内生效 */
  rules?: ValidateRule
}

export interface MultiSelectEmits {
  (e: 'update:modelValue', value: Array<any>): void
  (e: 'change', options: Record<string, any>[]): void
}
```

`@veltra/mobile` 未定义 `MultiSelectExposed`，组件源码未调用 `defineExpose`，模板 ref 上无可用成员。

## 参数说明

| 参数              | 类型                                                                                                 | 默认             | 必填 | 约束                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ---------------- | :--: | ------------------------------------------------------------------------------------------------------ |
| `modelValue`      | `Array<any>`                                                                                         | —                |  否  | 元素为各选中项 `valueKey` 字段的值；回显按 Map 键严格匹配（`===`），元素类型必须与选项值一致           |
| `options`         | `Record<string, any>[] \| ((qs: string) => Promise<Record<string, any>[]> \| Record<string, any>[])` | —                |  是  | 数组为本地数据；传函数时 `filterable` 强制开启，初始以空串 `''` 调用一次，输入变化以 200ms 防抖调用    |
| `valueKey`        | `string`                                                                                             | `'value'`        |  否  | 选项对象取值字段名，支持 `a.b` 链式取值                                                                |
| `labelKey`        | `string`                                                                                             | `'label'`        |  否  | 选项对象展示字段名；本地过滤仅按该字段 `includes` 匹配                                                 |
| `clearable`       | `boolean`                                                                                            | `true`           |  否  | 有选中值且非禁用时触发器常显清除按钮，点击清空全部（立即生效）                                         |
| `placeholder`     | `string`                                                                                             | `'请选择'`       |  否  | 无选中值时的触发器文案；同时作为底部面板标题                                                            |
| `filterable`      | `boolean`                                                                                            | `false`          |  否  | 面板顶部渲染搜索框，展开后自动聚焦；本地过滤 200ms 防抖；`creatable` 或 `options` 传函数时强制开启     |
| `visibilityLimit` | `number`                                                                                             | `3`              |  否  | 触发器最多展示的标签数（单行呈现），超出折叠为 `+N`；负值按 0 处理；`disabled` 时展示全部，`readonly` 换行展示全部 |
| `max`             | `number`                                                                                             | —                |  否  | 最大可选数；暂存数达到 `max` 后未选项禁用、全选不可用，计数显示 `已选 X/max`                           |
| `creatable`       | `boolean`                                                                                            | `false`          |  否  | 面板搜索框输入后按 `Enter` 创建新选项，值与标签均为去除首尾空格后的输入串；创建项与已有选项同 label 时勾选原选项；勾选临时项立即转正 |
| `contentStyle`    | `CSSProperties \| string`                                                                            | —                |  否  | 底部面板内容容器样式                                                                                   |
| `contentClass`    | `unknown`                                                                                            | —                |  否  | 底部面板内容容器类名                                                                                   |
| `size`            | `ComponentSize`                                                                                      | `'default'`      |  否  | `'small' \| 'default' \| 'large'`；UForm 上设置的值兜底，组件 prop 优先                                |
| `tips`            | `string`                                                                                             | —                |  否  | 仅 UForm（或 UFormItem）内生效；移动端不渲染悬浮提示                                                   |
| `span`            | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }`                                           | —                |  否  | 仅 UForm 内生效；移动端单列呈现，不生效                                                                |
| `label`           | `string`                                                                                             | —                |  否  | 仅 UForm 内生效，生成 UFormItem 标签                                                                   |
| `field`           | `string`                                                                                             | —                |  否  | UForm 按该路径读写 `model`；设置后禁止再写 `v-model`                                                   |
| `disabled`        | `boolean`                                                                                            | `false`          |  否  | 禁用交互；标签不可关闭                                                                                 |
| `readonly`        | `boolean`                                                                                            | `false`          |  否  | 渲染为纯标签，不渲染触发器与面板；无选中时显示 `-`                                                     |
| `rules`           | `ValidateRule`                                                                                       | —                |  否  | 仅 UForm 内生效；枚举见 API 签名                                                                       |

## 方法与事件

- `update:modelValue` — payload 为选中值数组（`Array<any>`），按勾选顺序追加。`v-model` 即绑定此事件。仅三个入口触发：面板点「确定」（暂存落盘）、触发器标签关闭、清除按钮；面板内勾选 / 取消勾选 / 全选只改暂存，不触发。
- `change` — payload `(options: Record<string, any>[])`：与 `update:modelValue` 同步触发，为**当前全部选中项的选项对象数组**（未命中选项的值被过滤）。仅用户操作触发；在 `UFormItem` 内会冒泡为 Item 的 `change`。
- 面板交互：面板头部固定「取消 / 标题（placeholder）/ 确定」；内容区顶部为全选复选框（支持半选态）与 `已选 X/Y` 计数，`Y` 为 `max ?? options.length`；点「取消」或遮罩收起面板并丢弃暂存。
- `creatable` 创建方式：面板搜索框输入后按 `Enter`（键盘 `enterkeyhint="search"`）；重复 `Enter` 不会产生重复项。
- 插槽：`default` 作用域插槽 `{ option, index }` 自定义选项渲染。
- ref：无暴露成员。

## 典型示例

### 搜索 + 数量上限 + 标签折叠

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UMultiSelect } from '@veltra/mobile'
import '@veltra/mobile/components/multi-select/style'

const users = shallowRef<string[]>([])

const userList = [
  { label: '张三', value: '1' },
  { label: '李四', value: '2' },
  { label: '王五', value: '3' },
  { label: '赵六', value: '4' },
  { label: '孙七', value: '5' }
]
</script>

<template>
  <!-- filterable 搜索；最多选 3 个（达到后未选项禁用、全选不可用）；触发器最多展示 2 个标签，其余折叠为 +N -->
  <UMultiSelect
    v-model="users"
    :options="userList"
    filterable
    :max="3"
    :visibility-limit="2"
    placeholder="最多选择 3 人"
  />
</template>
```

### 远程搜索 + 回车创建标签

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UMultiSelect } from '@veltra/mobile'
import '@veltra/mobile/components/multi-select/style'

const tags = shallowRef<(string | number)[]>([])

// options 传函数即远程搜索：filterable 自动开启，200ms 防抖
// 初始会以空串调用一次，因此空串分支必须返回数组
async function searchTags(qs: string) {
  if (!qs) return []
  const res = await fetch(`/api/tags?q=${encodeURIComponent(qs)}`)
  return (await res.json()) as { id: number; name: string }[]
}
</script>

<template>
  <!-- 面板搜索框输入无匹配项时按 Enter 创建（值=标签=输入串），勾选后点确定落盘 -->
  <UMultiSelect
    v-model="tags"
    :options="searchTags"
    creatable
    value-key="id"
    label-key="name"
    placeholder="搜索或创建标签"
  />
</template>
```

### UForm 内 field 绑定 + 必填校验

```vue
<script setup lang="ts">
import { reactive, useTemplateRef } from 'vue'

import { UButton, UForm, UMultiSelect } from '@veltra/mobile'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/multi-select/style'
import '@veltra/mobile/components/button/style'

// UForm 按 field 路径读写 model；控件上禁止再写 v-model
const form = reactive({ tags: [] as string[] })

const formRef = useTemplateRef<{ validate: (keys?: string[]) => Promise<boolean> }>('formRef')

const options = [
  { label: '紧急', value: 'urgent' },
  { label: '缺陷', value: 'bug' },
  { label: '需求', value: 'feature' }
]

async function submit() {
  const ok = await formRef.value?.validate()
  if (ok) console.log(form.tags) // => ['urgent', 'bug']
}
</script>

<template>
  <UForm ref="formRef" :model="form">
    <UMultiSelect
      label="标签"
      field="tags"
      :options="options"
      :rules="{ required: '至少选择一个标签' }"
    />
    <UButton type="primary" @click="submit">提交</UButton>
  </UForm>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是**面板内暂存 + 确定/取消**：勾选只改暂存，点「确定」才写入 `v-model` 并发出 `change`，点「取消」或遮罩丢弃暂存；桌面端是勾选即时生效的下列表。
> - 移动端面板内提供「全选」按钮与 `已选 X/Y` 计数（全选在暂存上操作）；桌面端是下拉面板顶部的全选复选框。
> - 移动端触发器标签**单行**呈现：超出 `visibilityLimit` 折叠为 `+N` 计数、长标签省略号截断，不撑高表单行；只读态是纯展示，换行展示全部标签。标签关闭与清除按钮**立即生效**（不经确定）。
> - 移动端选项列表**直接渲染、无虚拟滚动**；桌面端选项超过 80 条自动虚拟滚动。
> - 移动端空态与加载态为面板内文本「暂无数据」「加载中...」；桌面端空态渲染 `UEmpty` 组件。
> - breaking：桌面弹层的 `width` / `minWidth` 属性已移除；底部面板为全宽面板，无需宽度控制。
> - 移动端密度全部取 `--um-*` token：触发器高度 `max(--um-control-height-*, --um-touch-target)`（44px 保底）、字号 `--um-font-size-main`（16px）、右侧箭头热区 `--um-touch-target`（≥44px）；选项行整行热区 `--um-touch-target`。面板内搜索输入框字号 `--um-font-size-main`（16px，placeholder 继承同字号），iOS Safari 聚焦不触发页面缩放。
> - 嵌入 `UFormItem` 控件区后自动呈列表行式形态：去边框、透明底、占满控件区（整行热区 ≥44px）；独立使用时为带边框的盒式触发器。
> - 在 UForm 中必须用 `field` 绑定，禁止再写 `v-model`；`label` / `rules` / `span` / `tips` 仅在 UForm（或 UFormItem）内生效。
> - `v-model` 绑定的是选中值**数组**，不是选项对象数组；需要对象时监听 `@change`（payload 为选中项对象数组）。
> - 没有 `update:text` 事件（那是 `USelect` 的），需要文案从 `@change` 的对象数组里取 `labelKey` 字段。
> - `options` 传函数时 `filterable` 被强制开启，且初始以空串 `''` 调用一次，函数必须能处理空串。
> - 远程搜索请求期间面板内显示「加载中...」；组件内置竞态守卫，慢的旧响应不会覆盖新查询的结果。
> - 本库 `options` 是平铺数组，没有选项分组能力。
> - 设置 `max` 后全选不可用，这是预期行为；需要全选时移除 `max`。全选只勾选当前列表里的正式选项，跳过 `creatable` 输入过程中产生的临时项。
> - 清除全部、标签关闭会同步移除对应 `creatable` 产生的历史创建项；面板取消不回退已创建项。

## 常见问题

### 面板内勾选后 `v-model` 没有变化

原因：勾选只写暂存，必须点面板头部的「确定」才落盘；点「取消」或遮罩会丢弃暂存。修复：确认流程走「勾选 → 确定」。

### 回显后标签不显示或只显示部分

原因：`modelValue` 数组元素与选项 `valueKey` 字段的值类型不一致，回显按 Map 键严格匹配，`1` 匹配不到 `'1'`。修复：保证元素类型与选项值一致。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UMultiSelect } from '@veltra/mobile'
import '@veltra/mobile/components/multi-select/style'

// 选项为 { label: '设计', value: 1 } 时，初值元素必须是 number
const selected = shallowRef<number[]>([1, 2]) // 正确
// const selected = shallowRef<string[]>(['1']) // 错误：无法匹配，标签不显示
</script>

<template>
  <UMultiSelect v-model="selected" :options="[{ label: '设计', value: 1 }, { label: '研发', value: 2 }]" />
</template>
```

### 达到 `max` 后无法继续勾选也无法全选

达到 `max` 后未选项自动禁用、全选不可用，均为预期行为。需要放开上限时调整 `:max` 取值或移除该属性。

### 在 UForm 中同时写了 `field` 和 `v-model`

状态由 `field` 接管后 `v-model` 是重复绑定，两者会竞争写入。修复：删除 `v-model`，只保留 `field`。
