---
title: "UCheckbox / UCheckboxButton 复选框"
description: "复选框与按钮形态复选框，为单个布尔勾选提供独立绑定；支持半选状态、五种主题色、圆角，可在 UForm 内用 field 绑定表单字段。"
aliases: [checkbox, Checkbox, CheckboxButton, 复选框, 勾选框, 多选框, 多选]
keywords:
  - modelValue
  - indeterminate
  - update:modelValue
  - change
  - round
  - field
  - disabled
  - 全选
  - 半选
  - 勾选
  - 部分选中
  - 表单勾选
  - 同意条款
  - 只读
---

# UCheckbox / UCheckboxButton 复选框

`@veltra/desktop` 导出 `UCheckbox`（复选框）与 `UCheckboxButton`（按钮形态复选框）。两者都绑定一个布尔值，表示**单个**选项的勾选状态；需要把多个选项收集成一个值数组时用 `UCheckboxGroup`（见 `agent-docs/desktop/checkbox-group.md`）。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UCheckbox } from '@veltra/desktop'

const agreed = ref(false)
</script>

<template>
  <!-- 勾选文本写在默认插槽，不写 label -->
  <u-checkbox v-model="agreed">我已阅读并同意</u-checkbox>
  <!-- => 点击勾选后 agreed 为 true，取消后为 false -->
</template>
```

## API 签名

```ts
import type { FormComponentProps } from '@veltra/utils'

export type ComponentSize = 'small' | 'default' | 'large'

export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** 复选框组件属性 */
export interface CheckboxProps extends FormComponentProps {
  /** 部分选中（半选）。仅影响样式，不改写 modelValue。默认 false */
  indeterminate?: boolean
  /** 是否选中。默认 false */
  modelValue?: boolean
}

/** 复选按钮组件属性 */
export interface CheckboxButtonProps extends FormComponentProps {
  /** 是否选中 */
  modelValue?: boolean
  /** 是否圆角。默认 false */
  round?: boolean
  /** 主题色。默认 'primary' */
  type?: ColorType
}

export interface CheckboxEmits {
  (name: 'update:modelValue', checked: boolean): void
  (name: 'change', checked: boolean, e: MouseEvent): void
}

export interface CheckboxButtonEmits {
  (name: 'update:modelValue', checked: boolean): void
  (name: 'change', checked: boolean): void
}

/** 复选框暴露的属性和方法（空对象：ref 上无公开方法） */
export interface CheckboxExposed {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `boolean` | — | 否 | 仅 `true` / `false`；本库没有 `trueValue` / `falseValue` 配置 |
| `indeterminate` | `boolean` | `false` | 否 | 仅 `UCheckbox`；`true` 时显示半选样式，不改写 `modelValue` |
| `type` | `ColorType` | `'primary'` | 否 | 仅 `UCheckboxButton`；`'primary'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` |
| `round` | `boolean` | `false` | 否 | 仅 `UCheckboxButton`；圆角样式 |
| **继承自 `FormComponentProps`** | | | | |
| `size` | `ComponentSize` | `'default'` | 否 | `'small'` \| `'default'` \| `'large'`；未设置时继承 `<u-form>` 的 `size` |
| `label` | `string` | — | 否 | 表单标签文字；仅在 `UForm` / `UFormItem` 内生效。勾选文本不是它，是默认插槽 |
| `field` | `string` | — | 否 | `UForm` 字段名；在 `UForm` 内必须用 `field` 绑定，禁止再写 `v-model` |
| `tips` | `string` | — | 否 | 表单内提示文字；仅在 `UForm` / `UFormItem` 内生效 |
| `span` | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | — | 否 | 表单中所占列数；`'full'` 占满一行，响应式对象的 `default` 必填 |
| `disabled` | `boolean` | `false` | 否 | 禁用；未设置时继承 `<u-form>` 的 `disabled` |
| `readonly` | `boolean` | `false` | 否 | 只读；未设置时继承 `<u-form>` 的 `readonly`。`UCheckbox` 只读时点击不更新值也不触发 `change` |
| `rules` | `ValidateRule` | — | 否 | 校验规则（如 `{ required: true }`）；仅在 `UForm` 内生效 |

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `checked: boolean` | 勾选状态变化时 |
| `change`（`UCheckbox`） | `(checked: boolean, e: MouseEvent)` | 点击复选框时；`readonly` 时值不变且不触发 |
| `change`（`UCheckboxButton`） | `checked: boolean` | 点击复选按钮时；`readonly` 时不渲染为可点按钮，无此事件 |

组件未 `defineExpose` 任何方法，模板 `ref` 上无可调用属性。

## 典型示例

### 全选与半选联动

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UCheckbox } from '@veltra/desktop'

const options = ['苹果', '香蕉', '橙子']
const checkedItems = ref<string[]>([])

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
</template>
```

### 按钮形态 UCheckboxButton

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UCheckboxButton } from '@veltra/desktop'

const deepThink = ref(false)
</script>

<template>
  <u-checkbox-button v-model="deepThink" type="success" round>深度思考(R1)</u-checkbox-button>
  <!-- => 选中时按钮呈 success 色；readonly 时渲染为标签“是”/“否” -->
</template>
```

### 在 UForm 内用 field 绑定

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, UCheckbox, UCheckboxButton } from '@veltra/desktop'

const formData = reactive({ remember: false, deepThink: false })
</script>

<template>
  <!-- 有 field 就不要再写 v-model；label / rules 仅在 UForm 内生效 -->
  <u-form :model="formData">
    <u-checkbox label="记住登录" field="remember">30 天内免登录</u-checkbox>
    <u-checkbox-button label="能力" field="deepThink" type="success">深度思考</u-checkbox-button>
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
> - `modelValue` 是布尔值。本库没有 `trueValue` / `falseValue` 配置（不是 Element Plus 的 `true-label` / `false-label`）；勾选后要收集业务值时用 `UCheckboxGroup`。
> - `indeterminate` 只是样式，不会改写 `modelValue`，全选逻辑必须自行计算。
> - 复选框的可见文本来自默认插槽；`label` 是表单标签，仅在 `UForm` / `UFormItem` 内生效。
> - 在 `UForm` 内必须用 `field` 绑定字段，有 `field` 时禁止再写 `v-model`。
> - `UCheckboxButton` 的 `readonly` 形态渲染为标签（选中“是”/未选“否”），不可点击。
> - 组件颜色来自 `--u-*` token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则组件无颜色。

## 常见问题

### 点击复选框没有反应

两种原因：设置了 `disabled`（原生 input 被禁用），或设置了 `readonly`（点击被拦截且不触发 `change`）。修复：移除对应属性，或改由 `<u-form>` 的 `disabled` 控制整表禁用。
