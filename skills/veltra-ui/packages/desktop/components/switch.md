# USwitch — 开关

> `import type { SwitchProps } from '@veltra/desktop'`

## Import

```ts
import { USwitch } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `boolean` | — | 开关状态 |
| `activeText` | `string` | — | 打开时的文字 |
| `inactiveText` | `string` | — | 关闭时的文字 |
| `size` | `ComponentSize` | — | 尺寸 |
| `disabled` | `boolean` | — | 禁用 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: boolean)` | 状态变化 |
| `change` | `(value: boolean)` | 状态变化 |

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

### 在表单中

```vue
<u-form :model="model">
  <u-switch label="开启通知" field="notification" />
</u-form>
```
