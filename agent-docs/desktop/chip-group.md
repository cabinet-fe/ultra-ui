---
title: 'UChipGroup 胶囊单选组'
description: '单行胶囊单选组：用 items 渲染一组 UChip，选中项的 value 写入 modelValue。选项不换行，超出父容器宽度时在组内横向滚动；点被截断或贴边的纸片会先滚进可视区再选中。'
aliases: [ChipGroup, chip-group, Choice chips, v-chip-group, Chip.Group, 胶囊组, 纸片单选组]
keywords:
  - modelValue
  - items
  - labelKey
  - valueKey
  - disabledItem
  - change
  - field
  - rules
  - 单行滚动
  - 溢出滚动
  - 横向滚动
  - 贴边滚入
  - 方向键
  - 按项禁用
  - 表单单选
---

# UChipGroup 胶囊单选组

`@veltra/desktop` 导出 `UChipGroup`。它按 `items` 渲染一组 `UChip`，选中项的 `value` 写入 `modelValue`（单值，不是数组）。选项始终一行、不换行；组件宽度等于父元素宽度，放不下的纸片在组内横向滚动。单个纸片的自定义布局用 `UChip`（见 `agent-docs/desktop/chip.md`）。圆点单选用 `URadioGroup`，分段轨道用 `USegment`。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UChipGroup } from '@veltra/desktop'

const city = shallowRef('sh')
const items = [
  { label: '上海', value: 'sh' },
  { label: '杭州', value: 'hz' }
]

function handleChange(item: Record<string, any>) {
  console.log(item.label) // => '杭州'
}
</script>

<template>
  <u-chip-group v-model="city" :items="items" @change="handleChange" />
  <!-- => 点选「杭州」后 city 为 'hz' -->
</template>
```

## API 签名

```ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 胶囊单选组组件属性 */
export interface ChipGroupProps extends FormComponentProps {
  /** 绑定值，等于选中项的 item[valueKey]。默认无选中 */
  modelValue?: any
  /** 选项列表，必填 */
  items: Record<string, any>[]
  /** 选项值字段名。默认 'value' */
  valueKey?: string
  /** 标签文本字段名。默认 'label' */
  labelKey?: string
  /** 整组禁用。未设置时继承 UForm 的 disabled，再没有则为 false */
  disabled?: boolean
  /** 按项禁用：返回 true 的项不可选 */
  disabledItem?: (item: Record<string, any>) => boolean
}

/** 胶囊单选组组件事件 */
export interface ChipGroupEmits {
  /** 值更新 */
  (e: 'update:modelValue', modelValue: any): void
  /** 选中项变化，payload 为完整选项对象 */
  (e: 'change', item: Record<string, any>): void
}

/** 组件未 defineExpose。解包后无公开方法 */
export type ChipGroupExposed = DeconstructValue<Record<string, never>>
```

组件没有默认插槽，也没有 `item` 具名插槽。每项文案只渲染 `item[labelKey]`。自定义单项外观时不用本组，改用多个 `UChip`。

## 参数说明

| 参数                            | 类型                                                       | 默认        | 必填 | 约束                                                                                                           |
| ------------------------------- | ---------------------------------------------------------- | ----------- | :--: | -------------------------------------------------------------------------------------------------------------- |
| `v-model`（`modelValue`）       | `any`                                                      | —           |  否  | 值为选中项的 `item[valueKey]`。与任何项都不全等时，没有任何纸片处于选中态                                      |
| `items`                         | `Record<string, any>[]`                                    | —           |  是  | 按数组顺序排成一行，不换行。`item[valueKey]` 同时作为列表 key，同组内必须互不相等                              |
| `valueKey`                      | `string`                                                   | `'value'`   |  否  | 空串视为默认 `'value'`                                                                                         |
| `labelKey`                      | `string`                                                   | `'label'`   |  否  | 空串视为默认 `'label'`                                                                                         |
| `disabledItem`                  | `(item: Record<string, any>) => boolean`                   | —           |  否  | 返回 `true` 的项禁用。整组 `disabled` 为 `true` 时每一项都禁用                                                 |
| **继承自 `FormComponentProps`** |                                                            |             |      |                                                                                                                |
| `size`                          | `ComponentSize`                                            | `'default'` |  否  | `'small'` \| `'default'` \| `'large'`；未设置时继承 `<u-form>` 的 `size`，并传给每一项 `UChip`                 |
| `label`                         | `string`                                                   | —           |  否  | 表单标签文字；仅在 `UForm` / `UFormItem` 内生效。不是选项文案，选项文案用 `labelKey`                           |
| `field`                         | `string`                                                   | —           |  否  | `UForm` 字段名。在 `UForm` 内必须用 `field` 绑定，禁止再写 `v-model`                                           |
| `tips`                          | `string`                                                   | —           |  否  | 表单内提示文字；仅在 `UForm` / `UFormItem` 内生效                                                              |
| `span`                          | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | —           |  否  | 表单中所占列数；`'full'` 占满一行，响应式对象的 `default` 必填                                                 |
| `disabled`                      | `boolean`                                                  | `false`     |  否  | 禁用整组；未设置时继承 `<u-form>` 的 `disabled`                                                                |
| `readonly`                      | `boolean`                                                  | `false`     |  否  | 只读时不渲染纸片，只显示选中项的 `item[labelKey]`；没有匹配项时显示 `-`。未设置时继承 `<u-form>` 的 `readonly` |
| `rules`                         | `ValidateRule`                                             | —           |  否  | 校验规则（如 `{ required: true }`）；仅在 `UForm` 内生效                                                       |

本组没有 `block`、`name`、`multiple`。不提供换行、下拉收纳或多选。

## 方法与事件

| 事件                | payload                     | 触发时机                                                                                        |
| ------------------- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| `update:modelValue` | `modelValue: any`           | 选中项变化后，发出选中项的 `item[valueKey]`。点选已选中项不触发                                 |
| `change`            | `item: Record<string, any>` | 选中项变化后，发出完整选项对象。点选已选中项不触发。payload 不是 value，取值用 `item[valueKey]` |

组件未 `defineExpose` 任何方法，模板 `ref` 上无可调用属性。

## 典型示例

### 自定义字段与按项禁用

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UChipGroup } from '@veltra/desktop'

const selected = shallowRef(2)
const users = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 },
  { name: '王五', id: 3 }
]

function handleChange(item: Record<string, any>) {
  console.log(item.name) // => '李四'
}
</script>

<template>
  <u-chip-group
    v-model="selected"
    :items="users"
    label-key="name"
    value-key="id"
    :disabled-item="(item) => item.id === 3"
    @change="handleChange"
  />
  <!-- => 「王五」禁用；点选「李四」后 selected 为 2，change 收到 { name: '李四', id: 2 } -->
</template>
```

### 窄容器里点溢出的纸片

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UChipGroup } from '@veltra/desktop'

const region = shallowRef('north')
const items = [
  { label: '华北 · 北京', value: 'north' },
  { label: '东北 · 沈阳', value: 'northeast' },
  { label: '华东 · 上海', value: 'east' },
  { label: '华南 · 广州', value: 'south' }
]
</script>

<template>
  <!-- 父元素必须有宽度上限。组本身宽度是父元素的 100%，选项不换行 -->
  <div style="width: 220px">
    <u-chip-group v-model="region" :items="items" />
  </div>
  <!-- => 右侧被截断或压在 30px 渐变上的纸片：先瞬间滚进可视区，然后 region 变成该项的 value -->
  <!-- => 已经完整露出、且不压在渐变上的纸片：点击后 region 立即更新 -->
  <!-- => 方向键移动选中项，并把焦点项滚出渐变 -->
</template>
```

### 在 UForm 内用 field 绑定

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, UChipGroup } from '@veltra/desktop'

const formData = reactive({ choice: '' })
const options = [
  { value: 'a', label: '选项 A' },
  { value: 'b', label: '选项 B' },
  { value: 'c', label: '选项 C' }
]
</script>

<template>
  <!-- 有 field 就不要再写 v-model；值写入 formData.choice -->
  <u-form :model="formData">
    <u-chip-group label="选择" field="choice" :items="options" :rules="{ required: true }" />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
>
> - `modelValue` 是单值，不是数组。多选用 `UCheckboxGroup`。可切换的单个标签用 `UCheckTag`。本组没有 `multiple`。
> - 选项不换行，也不收入下拉菜单。父元素没有宽度上限时，组会把父元素撑开，不会出现横向滚动。
> - 左右溢出时，对应一侧有 30px 渐变遮罩。滚到起点不显示左侧遮罩，滚到终点不显示右侧遮罩。滚动条隐藏。指针在组内且内容横向溢出时，纵向滚轮（`deltaY`）转为 `scrollLeft`，不必按 Shift。横轴位移已经更大时（触控板横滑，或 Shift 把滚轮变成 `deltaX`）不叠加 `deltaY`。这一档用不到的 `deltaY` 加到最近还能滚动的纵向父级；父级也不能滚时不拦截。鼠标按住并水平移动超过 4px 后拖动滚动，过程中光标为 grabbing，松手恢复 pointer，且这次不选中；不足 4px 仍是点击，悬停光标为 pointer。禁用项光标仍是 not-allowed。触控沿用原生滚动。方向键仍可滚动。
> - 点击被截断、或落在渐变里的纸片：先把该纸片瞬间滚出渐变，再写入 `modelValue` 并发出 `change`。完整露出且不压渐变时立即选中。连续方向键同样瞬间滚到位，不会停在半路。
> - 方向键（`ArrowLeft` / `ArrowRight` / `ArrowUp` / `ArrowDown`）在未禁用项之间移动选中与焦点，并绕回首尾。焦点项若被截断或压在渐变上，会滚出渐变。禁用项会被跳过。
> - 点选已选中、但还没完全露出的纸片：只滚动，不发出 `change`。
> - `change` 的 payload 是完整选项对象，不是 value。
> - 选中判定是全等：`modelValue` 与 `item[valueKey]` 类型不一致（如 `'1'` 与 `1`）时无法回显选中。
> - 表单里一组单选必须用 `UChipGroup` + `field`；有 `field` 时禁止再写 `v-model`。
> - `label` / `tips` / `span` / `rules` 仅在 `UForm` / `UFormItem` 内生效。
> - 组件颜色来自 `--u-*` token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则组件无颜色。

## 常见问题

### 设置了 `modelValue` 但没有选中项

原因：`modelValue` 与任何选项的 `valueKey` 字段值都不全等，常见于数字和字符串类型不一致。修复：统一类型，或改用对应字段并通过 `value-key` 指定。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UChipGroup } from '@veltra/desktop'

const selected = shallowRef(2)
const items = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]
</script>

<template>
  <u-chip-group v-model="selected" :items="items" label-key="name" value-key="id" />
</template>
```

### 选项把容器撑开了，没有横向滚动

原因：父元素宽度随内容增长（例如父级是 `width: max-content` 或未限制宽度的 flex 子项）。`UChipGroup` 的宽度是父元素的 100%，父元素不被限制时没有溢出。修复：给父元素确定宽度。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UChipGroup } from '@veltra/desktop'

const selected = shallowRef('a')
const items = [
  { label: '华北 · 北京', value: 'a' },
  { label: '华东 · 上海', value: 'b' },
  { label: '华南 · 广州', value: 'c' }
]
</script>

<template>
  <div style="width: 220px">
    <u-chip-group v-model="selected" :items="items" />
  </div>
</template>
```

### 点了贴边的纸片，值没有立刻变

原因：该纸片被截断，或落在左右 30px 渐变里。组件先把它瞬间滚进可视区，再写入 `modelValue`。这次写入排在点击处理之后，点击回调里同步读 `v-model` 仍是旧值。完整露出且不压渐变的纸片会在点击处理里直接更新。用 `v-model` 或 `change` 接结果。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UChipGroup } from '@veltra/desktop'

const selected = shallowRef('a')
const items = [
  { label: '华北 · 北京', value: 'a' },
  { label: '华东 · 上海', value: 'b' }
]

function handleChange(item: Record<string, any>) {
  console.log(item.value)
}
</script>

<template>
  <div style="width: 160px">
    <u-chip-group v-model="selected" :items="items" @change="handleChange" />
  </div>
</template>
```
