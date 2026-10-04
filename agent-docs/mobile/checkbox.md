---
title: 'UCheckbox 复选框（移动端）'
description: '从 `@veltra/mobile` 导出的复选框，为单个布尔勾选提供独立绑定：整个 label 是 ≥44×44 触控热区、指示器最小 20px、支持半选状态；可在 UForm 内用 field 绑定表单字段。移动端只导出 UCheckbox，没有按钮形态。'
aliases: [checkbox, u-checkbox, 移动端复选框, 勾选框, 多选框, Checkbox]
keywords:
  [
    modelValue,
    indeterminate,
    'update:modelValue',
    change,
    field,
    disabled,
    readonly,
    移动端复选框,
    触控热区,
    全选,
    半选,
    勾选,
    部分选中,
    表单勾选,
    同意条款,
    只读
  ]
---

# UCheckbox 复选框（移动端）

`@veltra/mobile` 导出复选框 `UCheckbox`。它绑定一个布尔值，表示**单个**选项的勾选状态；需要把多个选项收集成一个值数组时用 `UCheckboxGroup`（见 `agent-docs/mobile/checkbox-group.md`）。API 与 `@veltra/desktop` 的 `UCheckbox` 同名同默认值，交互形态按触屏适配。

## 快速上手

```vue
<script setup lang="ts">
import { UCheckbox } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/checkbox/style'

const agreed = shallowRef(false)
</script>

<template>
  <!-- 勾选文本写在默认插槽，不写 label -->
  <u-checkbox v-model="agreed">我已阅读并同意</u-checkbox>
  <!-- => 点击勾选后 agreed 为 true，取消后为 false -->
</template>
```

视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

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

/** 复选框组件属性（与 @veltra/desktop UCheckbox 对齐） */
export interface CheckboxProps extends FormComponentProps {
  /** 部分选中（半选）。仅影响样式，不改写 modelValue。默认 false */
  indeterminate?: boolean
  /** 是否选中。默认 false */
  modelValue?: boolean
}

export interface CheckboxEmits {
  (name: 'update:modelValue', checked: boolean): void
  (name: 'change', checked: boolean, e: MouseEvent): void
}
```

`@veltra/mobile` 未导出 `UCheckboxButton` 等按钮形态组件；`CheckboxProps` / `CheckboxEmits` 之外的复选框类型不在本包内。

## 参数说明

| 参数                            | 类型                                                       | 默认        | 必填 | 约束                                                                                         |
| ------------------------------- | ---------------------------------------------------------- | ----------- | :--: | -------------------------------------------------------------------------------------------- |
| `v-model` / `modelValue`        | `boolean`                                                  | `false`     |  否  | 仅 `true` / `false`；本库没有 `trueValue` / `falseValue` 配置                                |
| `indeterminate`                 | `boolean`                                                  | `false`     |  否  | `true` 时显示半选样式，不改写 `modelValue`                                                   |
| `size`                          | `ComponentSize`                                            | `'default'` |  否  | `'small'` \| `'default'` \| `'large'`；未设置时继承 `<u-form>` 的 `size`                     |
| `label`                         | `string`                                                   | —           |  否  | 表单标签文字；仅在 `UForm` / `UFormItem` 内生效。勾选文本不是它，是默认插槽                  |
| `field`                         | `string`                                                   | —           |  否  | `UForm` 字段名；在 `UForm` 内必须用 `field` 绑定，禁止再写 `v-model`                         |
| `tips`                          | `string`                                                   | —           |  否  | 表单内提示文字；仅在 `UForm` / `UFormItem` 内生效                                            |
| `span`                          | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | —           |  否  | 表单中所占列数；`'full'` 占满一行，响应式对象的 `default` 必填                               |
| `disabled`                      | `boolean`                                                  | `false`     |  否  | 禁用；未设置时继承 `<u-form>` 的 `disabled`                                                  |
| `readonly`                      | `boolean`                                                  | `false`     |  否  | 只读；未设置时继承 `<u-form>` 的 `readonly`。只读时点击不更新值也不触发 `change`             |
| `rules`                         | `ValidateRule`                                             | —           |  否  | 校验规则（如 `{ required: true }`）；仅在 `UForm` 内生效                                     |

插槽：默认插槽承载勾选文本。

## 方法与事件

| 事件                | payload                             | 触发时机                                                    |
| ------------------- | ----------------------------------- | ----------------------------------------------------------- |
| `update:modelValue` | `checked: boolean`                  | 勾选状态变化时                                              |
| `change`            | `(checked: boolean, e: MouseEvent)` | 点击复选框时；`readonly` 时值不变且不触发，`disabled` 时不触发 |

组件未 `defineExpose` 任何成员，模板 `ref` 上无可调用的属性或方法。

## 典型示例

### 全选与半选联动

```vue
<script setup lang="ts">
import { UCheckbox, UCheckboxGroup } from '@veltra/mobile'
import { computed, shallowRef } from 'vue'
import '@veltra/mobile/components/checkbox/style'
import '@veltra/mobile/components/checkbox-group/style'

const options = ['苹果', '香蕉', '橙子']
const checkedItems = shallowRef<string[]>([])

const isChecked = computed(() => checkedItems.value.length === options.length)
const isIndeterminate = computed(
  () => checkedItems.value.length > 0 && checkedItems.value.length < options.length
)

function handleCheckAll(checked: boolean) {
  checkedItems.value = checked ? [...options] : []
}
</script>

<template>
  <!-- 全选用 :model-value + @change 自己控制，不写 v-model -->
  <u-checkbox :model-value="isChecked" :indeterminate="isIndeterminate" @change="handleCheckAll">
    全选
  </u-checkbox>
  <u-checkbox-group v-model="checkedItems" :items="options.map((o) => ({ label: o, value: o }))" />
</template>
```

### 尺寸与状态

```vue
<script setup lang="ts">
import { UCheckbox } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/checkbox/style'

const checked = shallowRef(false)
</script>

<template>
  <u-checkbox v-model="checked" size="small">小</u-checkbox>
  <u-checkbox v-model="checked">默认</u-checkbox>
  <u-checkbox v-model="checked" size="large">大</u-checkbox>
  <u-checkbox :model-value="true" disabled>选中禁用</u-checkbox>
  <u-checkbox :model-value="true" readonly>选中只读（点击无效）</u-checkbox>
  <u-checkbox v-model="checked" indeterminate>部分选中</u-checkbox>
</template>
```

### 在 UForm 内用 field 绑定

```vue
<script setup lang="ts">
import { UCheckbox, UForm } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/checkbox/style'

const formData = reactive({ remember: false })
</script>

<template>
  <!-- 有 field 就不要再写 v-model；label / rules 仅在 UForm 内生效 -->
  <u-form :model="formData">
    <u-checkbox label="记住登录" field="remember">30 天内免登录</u-checkbox>
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是整个 `<label>`（含文本）为触控热区，最小 `max(--u-form-component-height-*, 44px)` 保底 44×44；桌面端热区高度直接取 `--u-form-component-height-*`，无 44px 保底。
> - 移动端是指示器（方框）边长取 `max(组件高度 / 2, 20px)` 保底 20px、标签字号保底 14px；桌面端指示器是组件高度的一半、无字号下限。
> - 移动端没有 hover，按压反馈走 `:active`（边框变主色）；焦点环由视觉隐藏的原生 `<input>` 驱动（`:focus-visible`）。
> - `@veltra/mobile` 只导出 `UCheckbox`，不导出 `@veltra/desktop` 的 `UCheckboxButton`（按钮形态复选框）；需要按钮式多选用 `UCheckTag`。
> - `modelValue` 是布尔值。本库没有 `trueValue` / `falseValue` 配置（不是 Element Plus 的 `true-label` / `false-label`）；勾选后要收集业务值时用 `UCheckboxGroup`。
> - `indeterminate` 只是样式，不会改写 `modelValue`，全选逻辑必须自行计算。
> - 复选框的可见文本来自默认插槽；`label` 是表单标签，仅在 `UForm` / `UFormItem` 内生效。
> - 在 `UForm` 内必须用 `field` 绑定字段，有 `field` 时禁止再写 `v-model`。
> - 按需引入样式必须走 `import '@veltra/mobile/components/checkbox/style'`；独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则组件无颜色。

## 常见问题

### 点击复选框没有反应

两种原因：设置了 `disabled`（原生 input 被禁用），或设置了 `readonly`（点击被拦截且不触发 `change`）。修复：移除对应属性，或改由 `<u-form>` 的 `disabled` / `readonly` 控制整表状态：

```vue
<script setup lang="ts">
import { UCheckbox, UForm } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/checkbox/style'

const formData = reactive({ agreed: false })
</script>

<template>
  <u-form :model="formData" :readonly="false">
    <u-checkbox field="agreed" label="同意条款">我已阅读并同意</u-checkbox>
  </u-form>
</template>
```

### 小尺寸下勾选状态看不清

移动端指示器有 20px 最小边长保底，`size="small"` 不会更小；若视觉上仍偏小，改用 `size="default"` 或 `size="large"`，禁止用 CSS 覆盖指示器尺寸破坏 44px 热区换算。
