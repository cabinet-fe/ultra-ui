---
title: 'USegment 分段控制器（移动端）'
description: '从 `@veltra/mobile` 导出的分段控制器：横排单选项切换一个绑定值，任何分段热区不小于 44×44；支持 valueKey / labelKey 自定义选项字段、单项与整组禁用、撑满容器宽度，可放进 UForm 用 field 绑定表单字段。'
aliases: [Segment, u-segment, 移动端分段控制器, Segmented, 分段选择器, 分段单选]
keywords:
  [
    modelValue,
    valueKey,
    labelKey,
    disabledItem,
    change,
    block,
    field,
    items,
    移动端分段,
    触控热区,
    分段选择,
    视图切换,
    互斥选项,
    单选切换,
    禁用单项,
    表单分段,
    撑满宽度
  ]
---

# USegment 分段控制器（移动端）

`@veltra/mobile` 导出 `USegment`。它把一组互斥选项横排渲染为分段单选，`v-model` 绑定选中项的值；适合视图维度切换（列表/卡片、按日/按周）这类只切值、不带内容面板的场景。API 与 `@veltra/desktop` 的 `USegment` 同名同默认值，交互形态按触屏适配。需要承载内容面板的多视图切换用 `UTabs` 标签页；有先后顺序的流程进度用 `USteps` 步骤条。

## 快速上手

```vue
<script setup lang="ts">
import { USegment } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/segment/style'

const view = shallowRef('list')
const items = [
  { label: '列表', value: 'list' },
  { label: '卡片', value: 'card' }
]
</script>

<template>
  <u-segment v-model="view" :items="items" />
  <!-- => 点击「卡片」后 view 为 'card' -->
</template>
```

视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`。

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** 预设校验规则 */
export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

/** 字段校验规则（rules 属性的类型，UForm 内生效） */
export interface ValidateRule {
  /** 是否必填；传字符串时作为校验失败提示 */
  required?: boolean | string
  /** 长度；元组第二项为失败提示 */
  length?: number | [number, string]
  /** 最小值；元组第二项为失败提示 */
  min?: number | [number, string]
  /** 最大值；元组第二项为失败提示 */
  max?: number | [number, string]
  /** 最小长度；元组第二项为失败提示 */
  minLen?: number | [number, string]
  /** 最大长度；元组第二项为失败提示 */
  maxLen?: number | [number, string]
  /** 正则匹配；string 为正则源，元组第二项为失败提示 */
  match?: RegExp | [RegExp, string] | string
  /** 预设规则，取值见 PresetRule */
  preset?: PresetRule
  /** 自定义校验；返回非空字符串表示失败且该字符串为提示，返回 Promise 时异步校验 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 表单组件通用属性：label / field / rules / tips / span 仅在 UForm（或 UFormItem）内生效 */
export interface FormComponentProps extends ComponentProps {
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?:
    number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** 表单项字段；有 field 时禁止再写 v-model */
  field?: string
  /** 是否禁用。组件 props > 表单 > 全局配置 > 默认 false */
  disabled?: boolean
  /** 是否只读。组件 props > 表单 > 全局配置 > 默认 false */
  readonly?: boolean
  /** 校验规则 */
  rules?: ValidateRule
}

/** 分段单选选项；字段名由 valueKey / labelKey 决定 */
export type SegmentItem = Record<string, any>

/** 分段单选组件属性（与 @veltra/desktop USegment 对齐） */
export interface SegmentProps extends FormComponentProps {
  /** 绑定值；等于选中项的 item[valueKey] */
  modelValue?: any
  /** 选项列表。必填 */
  items: SegmentItem[]
  /** 选项值 key。默认 'value'；空串按 'value' 处理 */
  valueKey?: string
  /** 选项标签 key。默认 'label'；空串按 'label' 处理 */
  labelKey?: string
  /** 是否禁用整组 */
  disabled?: boolean
  /** 禁用的选项判断函数；返回 true 的选项不可选中 */
  disabledItem?: (item: SegmentItem) => boolean
  /** 是否撑满容器宽度。默认 false */
  block?: boolean
}

/** 分段单选组件事件 */
export interface SegmentEmits {
  /** 绑定值更新 */
  (e: 'update:modelValue', modelValue: any): void
  /** 选中项切换事件；点击当前已选中项时不触发 */
  (e: 'change', item: SegmentItem): void
}

/** 分段单选组件暴露的属性和方法（经 DeconstructValue 解包后为空对象，ref.value 上无可访问成员） */
export type SegmentExposed = Record<string, never>
```

插槽：`#item`，作用域 `{ item: SegmentItem; active: boolean }`，统一自定义每个选项的渲染。

## 参数说明

| 参数                     | 类型                                                       | 默认        | 必填 | 约束                                                                                                |
| ------------------------ | ---------------------------------------------------------- | ----------- | :--: | --------------------------------------------------------------------------------------------------- |
| `v-model`（`modelValue`） | `any`                                                      | —           |  否  | 值为选中项的 `item[valueKey]`；初始不匹配任何项时不高亮任何选项                                     |
| `items`                  | `SegmentItem[]`                                            | `[]`        |  是  | 选项按数组顺序横排渲染                                                                              |
| `valueKey`               | `string`                                                   | `'value'`   |  否  | 取 `item[valueKey]` 作为选项值，也是列表渲染的 key                                                  |
| `labelKey`               | `string`                                                   | `'label'`   |  否  | 取 `item[labelKey]` 作为选项文案                                                                    |
| `disabledItem`           | `(item: SegmentItem) => boolean`                           | —           |  否  | 返回 `true` 的选项禁用；禁用项点击与回车/空格均无效                                                 |
| `block`                  | `boolean`                                                  | `false`     |  否  | `true` 时组件撑满父容器宽度，选项弹性均分                                                          |
| `size`                   | `ComponentSize`                                            | `'default'` |  否  | `'small'` \| `'default'` \| `'large'`；未设置时继承 `<u-form>` 的 `size`                            |
| `label`                  | `string`                                                   | —           |  否  | 表单标签文字；仅在 `UForm` / `UFormItem` 内生效                                                     |
| `field`                  | `string`                                                   | —           |  否  | `UForm` 字段名；在 `UForm` 内必须用 `field` 绑定，禁止再写 `v-model`                                |
| `tips`                   | `string`                                                   | —           |  否  | 表单内提示文字；仅在 `UForm` / `UFormItem` 内生效                                                   |
| `span`                   | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | —           |  否  | 表单中所占列数；`'full'` 占满一行，响应式对象的 `default` 必填                                      |
| `disabled`               | `boolean`                                                  | `false`     |  否  | 禁用整组；未设置时继承 `<u-form>` 的 `disabled`                                                     |
| `readonly`               | `boolean`                                                  | `false`     |  否  | 只读时不可交互，且渲染为选中项文案的文字（无选中时显示 `-`）；未设置时继承 `<u-form>` 的 `readonly` |
| `rules`                  | `ValidateRule`                                             | —           |  否  | 校验规则；仅在 `UForm` 内生效                                                                       |

## 方法与事件

| 事件                | payload             | 触发时机                                                                     |
| ------------------- | ------------------- | ---------------------------------------------------------------------------- |
| `update:modelValue` | `modelValue: any`   | 选中项变化后写回 `item[valueKey]`                                            |
| `change`            | `item: SegmentItem` | 选中项变化后触发，payload 为完整选项对象；点击当前已选中项时不触发（值不变） |

- 键盘操作：选项可聚焦（`tabindex="0"`），`Enter` / `Space` 等同点击选中。
- 无障碍：容器 `role="radiogroup"`，选项 `role="radio"` 并带 `aria-checked` / `aria-disabled`。
- 整组 `disabled` 或选项被 `disabledItem` 命中时，点击与键盘选择均无效、不触发任何事件。
- `SegmentExposed` 解包后为空，模板 `ref` 上无可访问成员。

## 典型示例

### 视图切换与 change 事件

```vue
<script setup lang="ts">
import { USegment } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/segment/style'

const view = shallowRef('board')
const items = [
  { label: '列表', value: 'list' },
  { label: '卡片', value: 'card' },
  { label: '看板', value: 'board' }
]

function onChange(item: (typeof items)[number]) {
  console.log('切换到', item.value) // => 点击「卡片」输出 'card'
}
</script>

<template>
  <u-segment v-model="view" :items="items" block @change="onChange" />
  <!-- => block 撑满父容器宽度，选项弹性均分 -->
</template>
```

### 自定义字段、单项禁用与选项插槽

```vue
<script setup lang="ts">
import { USegment } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/segment/style'

const mode = shallowRef('fast')
// 选项字段名不是 label / value 时用 labelKey / valueKey 指定
const items = [
  { name: '快速', id: 'fast' },
  { name: '均衡', id: 'balanced' },
  { name: '质量', id: 'quality', offline: true }
]
</script>

<template>
  <u-segment
    v-model="mode"
    :items="items"
    label-key="name"
    value-key="id"
    :disabled-item="(item) => Boolean(item.offline)"
  />
  <!-- => 「质量」项禁用，不可选中 -->

  <!-- #item 插槽整体接管选项渲染，作用域含 item 与 active -->
  <u-segment v-model="mode" :items="items" label-key="name" value-key="id" block>
    <template #item="{ item, active }">
      <span :style="active ? 'font-weight: 600' : ''">{{ item.name }}</span>
    </template>
  </u-segment>
</template>
```

### 在 UForm 内用 field 绑定

```vue
<script setup lang="ts">
import { UForm, USegment } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/segment/style'

const formData = reactive({ period: 'monthly' })
const periodItems = [
  { label: '日', value: 'daily' },
  { label: '月', value: 'monthly' },
  { label: '年', value: 'yearly' }
]
</script>

<template>
  <!-- 有 field 就不要再写 v-model；值写入 formData.period -->
  <u-form :model="formData">
    <u-segment label="统计周期" field="period" :items="periodItems" />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是每个分段的 `min-width` / `min-height` 取 `max(--u-form-component-height-<size> - 4px, 44px)` 保底 44×44（短标签也不小于 44px 宽）；桌面端分段高度直接取 `--u-form-component-height-<size> - 4px`，无 44px 保底。
> - 移动端 `block` 形态下选项以 `flex: 1 1 0%` + `min-width: 0` 弹性均分容器宽度；桌面端 `block` 仅撑满容器。选项文案过长时标签省略号截断（`ellipsis`）。
> - 移动端没有 hover，按压反馈走 `:active`（非激活分段浅色高亮）；桌面端反馈走 `:hover`。
> - 本库选项数据是 `items` prop 数组（`SegmentItem`），不是 Element Plus `ElSegmented` 的 `options` prop 名，也不是 `<el-segmented-option>` 子组件模式。
> - `change` 的 payload 是完整选项对象 `SegmentItem`，不是裸值；裸值从 `v-model` 拿。
> - 点击已选中项不触发 `change`，值也不会变；没有「取消选中」交互。
> - 在 `UForm` 内必须用 `field` 绑定字段，有 `field` 时禁止再写 `v-model`；`label` / `tips` / `span` / `rules` 仅在 `UForm` / `UFormItem` 内生效。
> - `readonly` 时组件渲染为选中项的文字标签（无选中显示 `-`），不是禁用外观；选项外观只能通过 `#item` 插槽的 `{ item, active }` 作用域整体定制，没有按激活态切换样式的属性。
> - 按需引入样式必须走 `import '@veltra/mobile/components/segment/style'`；独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则组件无颜色。

## 常见问题

### 在表单里绑定的值不更新

原因：在 `UForm` 内同时写了 `v-model` 与 `field`，或只写了 `v-model`。修复：表单内只用 `field`：

```vue
<script setup lang="ts">
import { UForm, USegment } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/segment/style'

const formData = reactive({ view: 'list' })
const items = [
  { label: '列表', value: 'list' },
  { label: '卡片', value: 'card' }
]
</script>

<template>
  <u-form :model="formData">
    <u-segment label="视图" field="view" :items="items" />
  </u-form>
  <!-- => 点击后 formData.view 更新 -->
</template>
```

### 选项都不高亮

原因：`modelValue` 与任何 `item[valueKey]` 都不相等（常见于值类型不一致，如 `'1'` 与 `1`）。修复：让初始值与选项值的类型和值完全一致。

```vue
<script setup lang="ts">
import { USegment } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/segment/style'

const level = shallowRef(1) // 数字；若 items 的 value 是字符串 '1'，这里必须是 '1'
const items = [
  { label: '低', value: 1 },
  { label: '高', value: 2 }
]
</script>

<template>
  <u-segment v-model="level" :items="items" />
</template>
```

### 短标签分段太窄点不中

移动端分段有 44px 最小宽度保底，短标签（如「日」「周」）也能命中；若点不中，检查是否被外层 CSS（如 `min-width: 0` 的覆盖或 `overflow` 裁剪）破坏了该保底。
