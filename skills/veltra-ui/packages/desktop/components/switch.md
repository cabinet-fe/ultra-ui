# USwitch — 开关

> `import type { SwitchProps, SwitchEmits, SwitchExposed } from '@veltra/desktop'`

开关组件，基于原生 `<input type="checkbox">` 实现，支持 v-model 双向绑定、自定义开关文字、表单集成。

## Import

```ts
import { USwitch } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `boolean` | — | 开关状态 |
| `activeText` | `string` | — | 打开时显示的文字（右侧） |
| `inactiveText` | `string` | — | 关闭时显示的文字（左侧） |
| `size` | `ComponentSize` | — | 尺寸 |
| `disabled` | `boolean` | `undefined` | 是否禁用 |
| `readonly` | `boolean` | `undefined` | 是否只读 |
| `label` | `string` | — | 表单标签文字 |
| `field` | `string` | — | 表单项字段名 |
| `tips` | `string` | — | 表单内的提示文字 |
| `span` | `number \| 'full' \| BreakpointSpan` | — | 表单内所占列宽 |

> `ComponentSize`: `'small' \| 'default' \| 'large'`
> `BreakpointSpan`: `{ xs?: 'full' \| number, sm?: 'full' \| number, md?: 'full' \| number, lg?: 'full' \| number, xl?: 'full' \| number, default: number \| 'full' }`

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: boolean)` | v-model 状态变化 |
| `change` | `(value: boolean)` | 状态变化（与 `update:modelValue` 同时触发） |

## Slots

无自定义插槽。

## Exposed

```ts
interface SwitchExposed {}
```

组件不暴露额外的方法或属性。

## Examples

### 基础用法

```vue
<script setup>
import { ref } from 'vue'
const enabled = ref(false)
</script>

<template>
  <u-switch v-model="enabled" />
  <p>状态: {{ enabled ? '开' : '关' }}</p>
</template>
```

### 带文字提示

```vue
<u-switch v-model="notification" active-text="开" inactive-text="关" @change="handleToggle" />
```

### 禁用与只读

```vue
<u-switch v-model="enabled" disabled />
<u-switch v-model="enabled" readonly />
```

### 在表单中

```vue
<u-form :model="model">
  <u-switch label="开启通知" field="notification" />
</u-form>
```
