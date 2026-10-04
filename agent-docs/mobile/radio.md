---
title: 'URadio 单选框（移动端）'
description: '从 `@veltra/mobile` 导出的单选框：多个 URadio 共享同一个 modelValue 并用 value 区分选项，选中项即 modelValue 的值；整个 label 是 ≥44×44 触控热区、指示器最小 20px。表单里的一组单选用 URadioGroup。'
aliases: [radio, u-radio, 移动端单选框, 单选按钮, Radio, 选项框]
keywords:
  [
    modelValue,
    value,
    label,
    disabled,
    'update:modelValue',
    size,
    移动端单选框,
    触控热区,
    单选,
    选项,
    选中态,
    表单单选,
    禁用
  ]
---

# URadio 单选框（移动端）

`@veltra/mobile` 导出单选框 `URadio`。多个 `URadio` 绑定同一个 `modelValue`（`any` 类型），点选某项后 `modelValue` 等于该项的 `value`；选中判定为 `modelValue === value`。渲染一组选项时用 `URadioGroup`（见 `agent-docs/mobile/radio-group.md`）。API 与 `@veltra/desktop` 的 `URadio` 同名同默认值，交互形态按触屏适配。

## 快速上手

```vue
<script setup lang="ts">
import { URadio } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/radio/style'

const selected = shallowRef('a')
</script>

<template>
  <u-radio v-model="selected" value="a">选项 A</u-radio>
  <u-radio v-model="selected" value="b" label="选项 B" />
  <!-- => 点选「选项 B」后 selected 为 'b' -->
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

/** 单选框组件属性（与 @veltra/desktop URadio 对齐） */
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
```

`@veltra/mobile` 未导出 `URadioButton` 等按钮形态组件；`RadioProps` / `RadioEmits` 之外的单选框类型不在本包内。

## 参数说明

| 参数                     | 类型                                                       | 默认        | 必填 | 约束                                                                                         |
| ------------------------ | ---------------------------------------------------------- | ----------- | :--: | -------------------------------------------------------------------------------------------- |
| `v-model` / `modelValue` | `any`                                                      | —           |  否  | 绑定值；与 `value` 全等（`===`）时选中                                                       |
| `value`                  | `any`                                                      | —           |  否  | 该选项的值；同级选项间必须唯一                                                               |
| `label`                  | `string`                                                   | —           |  否  | 选项文本；本组件的 `label` 是选项文字，不是表单标签                                          |
| `disabled`               | `boolean`                                                  | `false`     |  否  | 禁用当前项；未设置时继承 `<u-form>` 的 `disabled`                                            |
| `size`                   | `ComponentSize`                                            | `'default'` |  否  | `'small'` \| `'default'` \| `'large'`；未设置时继承 `<u-form>` 的 `size`                     |
| `field`                  | `string`                                                   | —           |  否  | `UForm` 字段名；表单内单选组用 `URadioGroup` + `field`，禁止给多个 `URadio` 写同一个 `field` |
| `tips`                   | `string`                                                   | —           |  否  | 表单内提示文字；仅在 `UForm` / `UFormItem` 内生效                                            |
| `span`                   | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | —           |  否  | 表单中所占列数；`'full'` 占满一行，响应式对象的 `default` 必填                               |
| `readonly`               | `boolean`                                                  | `false`     |  否  | 仅作为表单回退属性继承；`URadio` 独立组件未实现只读拦截，点击仍会更新                        |
| `rules`                  | `ValidateRule`                                             | —           |  否  | 校验规则；仅在 `UForm` 内生效                                                                |

插槽：默认插槽承载选项文本，优先于 `label` 属性。

## 方法与事件

| 事件                | payload      | 触发时机                                           |
| ------------------- | ------------ | -------------------------------------------------- |
| `update:modelValue` | `value: any` | 点选某项后，发出该项的 `value`；点选已选中项不触发 |

组件未 `defineExpose` 任何成员，模板 `ref` 上无可调用的属性或方法。

## 典型示例

### 循环渲染一组单选

```vue
<script setup lang="ts">
import { URadio } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/radio/style'

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
  <!-- => selected 初始为 '1'，「选项三」被禁用 -->
</template>
```

### 尺寸与插槽文本

```vue
<script setup lang="ts">
import { URadio } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/radio/style'

const selected = shallowRef('a')
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
import { UForm, URadioGroup } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/radio-group/style'

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
>
> - 移动端是整个 `<label>`（含文本）为触控热区，最小 `max(--u-form-component-height-*, 44px)` 保底 44×44；桌面端热区高度直接取 `--u-form-component-height-*`，无 44px 保底。
> - 移动端是指示器（圆圈外框）边长取 `max(组件高度 / 2, 20px)` 保底 20px、标签字号保底 14px；桌面端指示器是组件高度的一半、无字号下限。
> - 移动端没有 hover，按压反馈走 `:active`（边框变主色）；焦点环由视觉隐藏的原生 `<input>` 驱动（`:focus-visible`）。
> - `@veltra/mobile` 只导出 `URadio`，不导出 `@veltra/desktop` 的 `URadioButton`（按钮形态单选框）。
> - `URadio` 的 `label` 是**选项文本**，不是表单标签（同名属性在表单组件里是标签文字）；选项文本优先用默认插槽。
> - `URadio` 没有 `change` 事件，只有 `update:modelValue`。
> - `URadio` 未实现 `readonly` 拦截（桌面端同样未实现）：独立使用时点击仍会更新值；需要只读展示用 `URadioGroup` 的 `readonly`。
> - 表单里的一组单选必须用 `URadioGroup` + `field`；禁止给多个 `URadio` 写同一个 `field`，也不要在 `URadio` 上同时写 `field` 和 `v-model`。
> - 选中判定是 `modelValue === value` 全等；`modelValue` 必须等于某项 `value` 才有选中项。
> - 独立使用（不在 `UForm` 内）时多个 `URadio` 共享同一个 `v-model`。
> - 按需引入样式必须走 `import '@veltra/mobile/components/radio/style'`；独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则组件无颜色。

## 常见问题

### 点选后其他项没有取消选中

原因：各项绑定了各自独立的 `v-model`，或各项 `value` 重复。修复：让所有同级 `URadio` 绑定同一个 `modelValue`，并保证 `value` 互不相同：

```vue
<script setup lang="ts">
import { URadio } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/radio/style'

const selected = shallowRef('a')
</script>

<template>
  <u-radio v-model="selected" value="a">A</u-radio>
  <u-radio v-model="selected" value="b">B</u-radio>
  <!-- => selected 同时驱动两项，选中项唯一 -->
</template>
```

### 小尺寸下选中圆点看不清

移动端指示器有 20px 最小边长保底，`size="small"` 不会更小；若视觉上仍偏小，改用 `size="default"` 或 `size="large"`。
