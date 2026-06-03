# USwitch 示例

## 基础用法

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

## 带文字提示

```vue
<u-switch v-model="notification" active-text="开" inactive-text="关" @change="handleToggle" />
```

## 禁用与只读

```vue
<u-switch v-model="enabled" disabled />
<u-switch v-model="enabled" readonly />
```

## 在表单中

```vue
<u-form :model="model">
  <u-switch label="开启通知" field="notification" />
</u-form>
```
