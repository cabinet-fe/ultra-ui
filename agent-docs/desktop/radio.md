---
title: "URadio 单选框"
description: "单选框，多个 URadio 共享同一个 modelValue 并用 value 区分选项，选中项即 modelValue 的值；表单里的一组单选请用 URadioGroup。"
aliases: [radio, Radio, 单选框, 单选按钮]
keywords:
  - modelValue
  - value
  - label
  - disabled
  - update:modelValue
  - size
  - 单选
  - 选项
  - 选中态
  - 表单单选
  - 禁用
---

# URadio 单选框

`@veltra/desktop` 导出 `URadio`。多个 `URadio` 绑定同一个 `modelValue`（`any` 类型），点选某项后 `modelValue` 等于该项的 `value`；选中判定为 `modelValue === value`。渲染一组选项时用 `URadioGroup`（见 `agent-docs/desktop/radio-group.md`）。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { URadio } from '@veltra/desktop'

const selected = ref('a')
</script>

<template>
  <u-radio v-model="selected" value="a">选项 A</u-radio>
  <u-radio v-model="selected" value="b" label="选项 B" />
  <!-- => 点选“选项 B”后 selected 为 'b' -->
</template>
```

## API 签名

```ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 单选框组件属性 */
export interface RadioProps extends FormComponentProps {
  /** 该选项的值，选中后写入 modelValue。任意类型，须在同级选项中唯一 */
  value?: any
  /** 选项文本；默认插槽内容优先于 label */
  label?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 绑定值；与某个 URadio 的 value 全等（===）时该项选中 */
  modelValue?: any
}

/** 单选框组件定义的事件 */
export interface RadioEmits {
  (e: 'update:modelValue', value: any): void
}

/** 单选框组件暴露的属性和方法(组件内部使用) */
export interface _RadioExposed {
  change: (isChecked: boolean) => void
}

/** 单选框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioExposed = DeconstructValue<_RadioExposed>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `value` | `any` | — | 否 | 该选项的值；同级选项间必须唯一 |
| `label` | `string` | — | 否 | 选项文本；本组件的 `label` 是选项文字，不是表单标签 |
| `modelValue` | `any` | — | 否 | 绑定值；与 `value` 全等（`===`）时选中 |
| `disabled` | `boolean` | `false` | 否 | 禁用当前项；未设置时继承 `<u-form>` 的 `disabled` |
| **继承自 `FormComponentProps`** | | | | |
| `size` | `ComponentSize` | `'default'` | 否 | `'small'` \| `'default'` \| `'large'`；未设置时继承 `<u-form>` 的 `size` |
| `field` | `string` | — | 否 | `UForm` 字段名；表单内单选组用 `URadioGroup` + `field`，禁止给多个 `URadio` 写同一个 `field` |
| `tips` | `string` | — | 否 | 表单内提示文字；仅在 `UForm` / `UFormItem` 内生效 |
| `span` | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | — | 否 | 表单中所占列数；`'full'` 占满一行，响应式对象的 `default` 必填 |
| `readonly` | `boolean` | `false` | 否 | 未设置时继承 `<u-form>` 的 `readonly` |
| `rules` | `ValidateRule` | — | 否 | 校验规则；仅在 `UForm` 内生效 |

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value: any` | 点选某项后，发出该项的 `value`；点选已选中项不触发 |

组件未 `defineExpose` 任何方法；`RadioExposed`（解包后为 `change: (isChecked: boolean) => void`）标注为组件内部使用，模板 `ref` 上取不到该方法。

## 典型示例

### 循环渲染一组单选

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { URadio } from '@veltra/desktop'

const selected = shallowRef('1')
const items = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' }
]
</script>

<template>
  <u-radio
    v-for="item of items"
    :key="item.value"
    v-model="selected"
    :value="item.value"
    :disabled="item.value === '3'"
  >
    {{ item.label }}
  </u-radio>
  <!-- => selected 初始为 '1'，“选项三”被禁用 -->
</template>
```

### 尺寸与插槽文本

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { URadio } from '@veltra/desktop'

const selected = ref('a')
</script>

<template>
  <u-radio v-model="selected" value="a" label="小号" size="small" />
  <u-radio v-model="selected" value="b" label="默认" />
  <u-radio v-model="selected" value="c" size="large">插槽文本优先于 label</u-radio>
  <!-- => 三个尺寸依次为 small / default / large，第三项显示插槽文本 -->
</template>
```

### 表单内单选：用 URadioGroup

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, URadioGroup } from '@veltra/desktop'

const formData = reactive({ gender: '' })
const genderList = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
]
</script>

<template>
  <!-- 表单内一组单选必须用 URadioGroup + field；值写入 formData.gender -->
  <u-form :model="formData">
    <u-radio-group label="性别" field="gender" :items="genderList" :rules="{ required: true }" />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
> - `URadio` 的 `label` 是**选项文本**，不是表单标签（同名属性在表单组件里是标签文字）；勾选/选项文本优先用默认插槽。
> - `URadio` 没有 `change` 事件，只有 `update:modelValue`。
> - 表单里的一组单选必须用 `URadioGroup` + `field`；禁止给多个 `URadio` 写同一个 `field`，也不要在 `URadio` 上同时写 `field` 和 `v-model`。
> - 选中判定是 `modelValue === value` 全等；`modelValue` 必须等于某项 `value` 才有选中项。
> - 独立使用（不在 `UForm` 内）时多个 `URadio` 共享同一个 `v-model`。
> - 组件颜色来自 `--u-*` token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则组件无颜色。

## 常见问题

### 点选后其他项没有取消选中

原因：各项绑定了各自独立的 `v-model`，或各项 `value` 重复。修复：让所有同级 `URadio` 绑定同一个 `modelValue`，并保证 `value` 互不相同：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { URadio } from '@veltra/desktop'

const selected = ref('a')
</script>

<template>
  <u-radio v-model="selected" value="a">A</u-radio>
  <u-radio v-model="selected" value="b">B</u-radio>
  <!-- => selected 同时驱动两项，选中项唯一 -->
</template>
```
