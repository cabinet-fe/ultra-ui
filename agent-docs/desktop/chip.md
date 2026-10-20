---
title: 'UChip 胶囊单选'
description: '单选胶囊纸片：多个 UChip 共享同一个 modelValue 并用 value 区分选项，选中项即 modelValue 的值；同一 name 的一组可用方向键移动。一行溢出滚动用 UChipGroup。'
aliases: [Chip, ChoiceChip, v-chip, 胶囊, 纸片单选, 选择芯片]
keywords:
  - modelValue
  - value
  - label
  - name
  - disabled
  - size
  - field
  - 单选胶囊
  - 纸片
  - 方向键
  - 选中态
  - 表单单选
---

# UChip 胶囊单选

`@veltra/desktop` 导出 `UChip`。多个 `UChip` 绑定同一个 `modelValue`（`any` 类型），点选某项后 `modelValue` 等于该项的 `value`；选中判定为 `modelValue === value`。外观是胶囊纸片，语义是单选，不是多选标签。一行排布且容器放不下时用 `UChipGroup`（见 `agent-docs/desktop/chip-group.md`）。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UChip } from '@veltra/desktop'

const city = shallowRef('sh')
</script>

<template>
  <u-chip v-model="city" name="city" value="sh">上海</u-chip>
  <u-chip v-model="city" name="city" value="hz">杭州</u-chip>
  <!-- => 点选「杭州」后 city 为 'hz' -->
</template>
```

## API 签名

```ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 胶囊单选组件属性 */
export interface ChipProps extends FormComponentProps {
  /** 选项值；与 modelValue 全等时选中 */
  value?: any
  /** 选项文本。未提供默认插槽时显示。默认无文本 */
  label?: string
  /** 禁用当前项。未设置时继承 UForm 的 disabled，再没有则为 false */
  disabled?: boolean
  /** 绑定值 */
  modelValue?: any
  /**
   * 原生 radio 的 name。
   * 同一组必须传同一个非空字符串，方向键才在组内移动。
   * 放进 UChipGroup 时由组自动传入，调用方不用写。
   */
  name?: string
}

/** 胶囊单选组件事件 */
export interface ChipEmits {
  (e: 'update:modelValue', value: any): void
}

/** 组件未 defineExpose。解包后无公开方法 */
export type ChipExposed = DeconstructValue<Record<string, never>>
```

默认插槽替换选项文案。有默认插槽时忽略 `label` 属性。没有 `item` 之类的具名插槽。

## 参数说明

| 参数                            | 类型                                                       | 默认        | 必填 | 约束                                                                                                    |
| ------------------------------- | ---------------------------------------------------------- | ----------- | :--: | ------------------------------------------------------------------------------------------------------- |
| `value`                         | `any`                                                      | —           |  否  | 该选项的值；同一 `name` 下各项必须互不相等                                                              |
| `label`                         | `string`                                                   | —           |  否  | 选项文本。本组件的 `label` 是纸片文案，不是 `UForm` 的表单标签文字                                     |
| `name`                          | `string`                                                   | —           |  否  | 同一组单选必须相同且非空。不传时各项互不组成 radio 组，方向键不跨项移动                                |
| `v-model`（`modelValue`）       | `any`                                                      | —           |  否  | 与 `value` 全等（`===`）时选中                                                                          |
| `disabled`                      | `boolean`                                                  | `false`     |  否  | 禁用当前项；未设置时继承 `<u-form>` 的 `disabled`                                                       |
| **继承自 `FormComponentProps`** |                                                            |             |      |                                                                                                         |
| `size`                          | `ComponentSize`                                            | `'default'` |  否  | `'small'` \| `'default'` \| `'large'`；未设置时继承 `<u-form>` 的 `size`                                |
| `field`                         | `string`                                                   | —           |  否  | `UForm` 字段名。表单内一组单选必须用 `UChipGroup` + `field`，禁止给多个 `UChip` 写同一个 `field`        |
| `tips`                          | `string`                                                   | —           |  否  | 表单内提示文字；仅在 `UForm` / `UFormItem` 内生效                                                       |
| `span`                          | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | —           |  否  | 表单中所占列数；`'full'` 占满一行，响应式对象的 `default` 必填                                          |
| `readonly`                      | `boolean`                                                  | `false`     |  否  | `UChip` 不根据 `readonly` 改成纯文本，点击仍会更新值。只读展示用 `UChipGroup` 的 `readonly`             |
| `rules`                         | `ValidateRule`                                             | —           |  否  | 校验规则；仅在 `UForm` 内生效。规则挂在 `UChipGroup` 上，不要挂在单个 `UChip`                          |

## 方法与事件

| 事件                | payload      | 触发时机                                                     |
| ------------------- | ------------ | ------------------------------------------------------------ |
| `update:modelValue` | `value: any` | 点选未选中项后，发出该项的 `value`。点选已选中项不触发       |

组件未 `defineExpose` 任何方法，模板 `ref` 上无可调用属性。

## 典型示例

### 同一 name 的一组胶囊

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UChip } from '@veltra/desktop'

const selected = shallowRef('1')
const items = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' }
]
</script>

<template>
  <u-chip
    v-for="item of items"
    :key="item.value"
    v-model="selected"
    name="demo"
    :value="item.value"
    :disabled="item.value === '3'"
  >
    {{ item.label }}
  </u-chip>
  <!-- => 点选「选项二」后 selected 为 '2'；「选项三」不可点；方向键在「选项一」「选项二」之间移动 -->
</template>
```

### 用 label 属性而不是插槽

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UChip } from '@veltra/desktop'

const selected = shallowRef('a')
</script>

<template>
  <u-chip v-model="selected" name="letter" value="a" label="甲" />
  <u-chip v-model="selected" name="letter" value="b" label="乙" />
  <!-- => 点选「乙」后 selected 为 'b' -->
</template>
```

## 注意事项

> [!WARNING]
>
> - `UChip` 是单选（原生 `input type="radio"`），不是多选标签。多选用 `UCheckbox` / `UCheckboxGroup`；可切换的单个标签用 `UCheckTag`。
> - 圆点单选用 `URadio` / `URadioGroup`。分段轨道用 `USegment`。选项要在一行里溢出滚动时用 `UChipGroup`，不要自己用 `UChip` 做换行或下拉。
> - 方向键只在 `name` 相同的未禁用项之间移动，并同时改变 `modelValue`。各项 `name` 不同或未传 `name` 时，方向键不跨项移动。
> - 选中判定是全等：`modelValue` 与 `value` 类型不一致（如 `'1'` 与 `1`）时无法回显选中。
> - 表单里禁止给多个 `UChip` 写同一个 `field`。一组单选必须用 `UChipGroup` + `field`；有 `field` 时禁止再写 `v-model`。
> - 组件颜色来自 `--u-*` token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则组件无颜色。

## 常见问题

### 设置了 `modelValue` 但没有选中项

原因：`modelValue` 与该项 `value` 不全等，常见于数字和字符串混用。修复：两边使用同一种类型。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UChip } from '@veltra/desktop'

const selected = shallowRef(2)
</script>

<template>
  <!-- value 是数字 2，不能写成 value="2"（那是字符串） -->
  <u-chip v-model="selected" name="id" :value="2" label="李四" />
</template>
```

### 方向键不能切到下一项

原因：这些 `UChip` 的 `name` 不是同一个非空字符串，或下一项 `disabled`。修复：同一组传入相同 `name`。需要溢出滚动时改用 `UChipGroup`，组内会自动共用 `name`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UChip } from '@veltra/desktop'

const selected = shallowRef('a')
</script>

<template>
  <u-chip v-model="selected" name="group" value="a" label="甲" />
  <u-chip v-model="selected" name="group" value="b" label="乙" />
</template>
```
