---
title: "USwitch 开关"
description: "开关控件，绑定布尔值表示开/关状态；支持开/关两侧文案、三种尺寸，可在 UForm 内用 field 绑定表单字段。字段允许 undefined 且视为开时，用 UFormItem 包裹并自行转换 modelValue。"
aliases: [switch, Switch, 开关, 切换开关, 切换]
keywords:
  - modelValue
  - activeText
  - inactiveText
  - change
  - field
  - rules
  - update:modelValue
  - UFormItem
  - 开关
  - 切换
  - 启用禁用
  - 表单开关
  - 布尔值
  - 值转换
  - undefined 视为开
---

# USwitch 开关

`@veltra/desktop` 导出 `USwitch`。它把布尔值渲染为开关控件，用于两种互斥状态的切换（启用/禁用、开/关）；需要“勾选/不勾选”语义时用 `UCheckbox`，需要从多个选项取一个值时用 `URadioGroup`。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USwitch } from '@veltra/desktop'

const enabled = ref(false)
</script>

<template>
  <u-switch v-model="enabled" />
  <!-- => 打开后 enabled 为 true，关闭后为 false -->
</template>
```

## API 签名

```ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 开关组件属性 */
export interface SwitchProps extends FormComponentProps {
  /** 开关状态。默认 false */
  modelValue?: boolean
  /** 打开时显示的文字，位于开关右侧；不设置则不显示 */
  activeText?: string
  /** 关闭时显示的文字，位于开关左侧；不设置则不显示 */
  inactiveText?: string
}

/** 开关组件定义的事件 */
export interface SwitchEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}

/** 开关组件暴露的属性和方法(组件内部使用) */
export interface _SwitchExposed {}

/** 开关组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SwitchExposed = DeconstructValue<_SwitchExposed>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `boolean` | — | 否 | 仅 `true` / `false`；本库没有 `activeValue` / `inactiveValue`，不支持非布尔值 |
| `activeText` | `string` | — | 否 | 打开状态的文案，渲染在开关右侧；不设置则不渲染文案 |
| `inactiveText` | `string` | — | 否 | 关闭状态的文案，渲染在开关左侧；不设置则不渲染文案 |
| **继承自 `FormComponentProps`** | | | | |
| `size` | `ComponentSize` | `'default'` | 否 | `'small'` \| `'default'` \| `'large'`；未设置时继承 `<u-form>` 的 `size` |
| `label` | `string` | — | 否 | 表单标签文字；仅在 `UForm` / `UFormItem` 内生效 |
| `field` | `string` | — | 否 | `UForm` 字段名；在 `UForm` 内必须用 `field` 绑定，禁止再写 `v-model` |
| `tips` | `string` | — | 否 | 表单内提示文字；仅在 `UForm` / `UFormItem` 内生效 |
| `span` | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | — | 否 | 表单中所占列数；`'full'` 占满一行，响应式对象的 `default` 必填 |
| `disabled` | `boolean` | `false` | 否 | 禁用：点击无效；未设置时继承 `<u-form>` 的 `disabled` |
| `readonly` | `boolean` | `false` | 否 | 只读：点击无效，渲染形态不变；未设置时继承 `<u-form>` 的 `readonly` |
| `rules` | `ValidateRule` | — | 否 | 校验规则；仅在 `UForm` 内生效 |

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value: boolean` | 开关状态切换后 |
| `change` | `value: boolean` | 开关状态切换后；`disabled` 或 `readonly` 时点击无效、不触发 |

组件未 `defineExpose` 任何方法，模板 `ref` 上无可调用属性。

## 典型示例

### 文案与 change 事件

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USwitch } from '@veltra/desktop'

const notification = ref(false)

function handleToggle(value: boolean) {
  console.log('notification:', value) // => 打开后输出 true
}
</script>

<template>
  <!-- 文案仅由 activeText / inactiveText 控制，不设置就不显示 -->
  <u-switch v-model="notification" active-text="开" inactive-text="关" @change="handleToggle" />
</template>
```

### 尺寸、禁用与只读

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USwitch } from '@veltra/desktop'

const enabled = ref(true)
</script>

<template>
  <u-switch v-model="enabled" size="small" />
  <u-switch v-model="enabled" size="large" />
  <u-switch v-model="enabled" disabled />
  <!-- => disabled 后点击无效，状态不变 -->
  <u-switch v-model="enabled" readonly />
  <!-- => readonly 后点击无效，开关渲染形态不变（不变成文字） -->
</template>
```

### 在 UForm 内用 field 绑定

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, USwitch } from '@veltra/desktop'

const formData = reactive({ enabled: true, notification: false })
</script>

<template>
  <!-- 有 field 就不要再写 v-model；值写入 formData.enabled / formData.notification -->
  <u-form :model="formData">
    <u-switch label="启用状态" field="enabled" active-text="启用" inactive-text="禁用" />
    <u-switch label="推送通知" field="notification" />
  </u-form>
</template>
```

### 字段值为 undefined 时显示为「开」（值转换）

`modelValue` 只接受布尔值，`undefined` 会渲染成关闭态。当字段允许 `undefined`（未设置）且约定 `undefined` 与 `true` 都显示为「开」时，`field` 直连无法表达这种映射，改用 `UFormItem` 绑 `field`、控件自行转换读写：

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, UFormItem, USwitch } from '@veltra/desktop'

// status 允许 undefined（未设置，视为开）
const formData = reactive({ status: undefined as boolean | undefined })
</script>

<template>
  <u-form :model="formData">
    <u-form-item label="启用状态" field="status">
      <!-- 读：undefined 与 true 都为「开」；写：统一落成布尔值 -->
      <u-switch
        :model-value="formData.status === undefined || formData.status === true"
        @update:model-value="(val) => (formData.status = val)"
        active-text="开"
        inactive-text="关"
      />
    </u-form-item>
  </u-form>
</template>
```

此时 `field` 写在 `u-form-item` 上，开关上**不要**再写 `field`（否则会被 `UForm` 再包一层表单项，形成双重绑定）。

## 注意事项

> [!WARNING]
> - `modelValue` 是布尔值。本库没有 `activeValue` / `inactiveValue`（不是 Element Plus 的自定义开/关值）；非布尔的两态切换用 `URadioGroup`。
> - 本库没有 `show-text` 属性：文案是否显示由 `activeText` / `inactiveText` 是否设置决定，两个属性互不依赖。
> - `activeText` 渲染在开关右侧，`inactiveText` 渲染在开关左侧；文案不随状态切换隐藏，两侧都设置时同时可见。
> - `readonly` 仅阻止交互，不改变渲染形态（`UCheckboxButton` 只读才渲染为文字标签）。
> - 在 `UForm` 内必须用 `field` 绑定字段，有 `field` 时禁止再写 `v-model`；`label` / `tips` / `span` / `rules` 仅在 `UForm` / `UFormItem` 内生效。
> - 字段允许 `undefined` 且约定 `undefined` 与 `true` 都为「开」时，不能给开关直接写 `field`（`undefined` 会渲染成关闭态）：改用 `UFormItem` 绑 `field`，开关上写 `:model-value` / `@update:model-value` 做映射，且不再写 `field`。见「典型示例 · 字段值为 undefined 时显示为『开』」。
> - 组件颜色来自 `--u-*` token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则组件无颜色。

## 常见问题

### 点击开关状态不变

原因：设置了 `disabled` 或 `readonly`，或该属性由 `<u-form>` 继承而来。修复：移除组件上的对应属性，或在表单上放开 `disabled`：

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, USwitch } from '@veltra/desktop'

const formData = reactive({ enabled: true })
</script>

<template>
  <!-- 表单级 disabled 会传导到内部所有开关 -->
  <u-form :model="formData" :disabled="false">
    <u-switch field="enabled" label="启用状态" />
  </u-form>
</template>
```

### 字段值为 undefined 时开关显示为关闭，但期望是「开」

原因：给开关直接写 `field` 时，`modelValue` 原样等于字段值 `undefined`，渲染为关闭态；开关没有「非布尔值也算开」的配置项。修复：改用 `UFormItem` 绑定 `field`，开关本身改为受控映射读写，并不再写 `field`：

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, UFormItem, USwitch } from '@veltra/desktop'

const formData = reactive({ status: undefined as boolean | undefined })
</script>

<template>
  <u-form :model="formData">
    <u-form-item label="启用状态" field="status">
      <u-switch
        :model-value="formData.status === undefined || formData.status === true"
        @update:model-value="(val) => (formData.status = val)"
      />
    </u-form-item>
  </u-form>
</template>
```
