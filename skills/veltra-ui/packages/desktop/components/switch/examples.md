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
<script setup>
import { ref } from 'vue'
const notification = ref(false)

function handleToggle(value) {
  console.log('notification:', value)
}
</script>

<template>
  <u-switch v-model="notification" active-text="开" inactive-text="关" @change="handleToggle" />
</template>
```

## 禁用与只读

```vue
<script setup>
import { ref } from 'vue'
const enabled = ref(false)
</script>

<template>
  <u-switch v-model="enabled" disabled />
  <u-switch v-model="enabled" readonly />
</template>
```

## 在 UForm 中使用

> 表单内用 `field` 绑 `model`，勿再写 `v-model`；无 `field` 时 `label` 不生效。

```vue
<script setup>
import { reactive } from 'vue'
const model = reactive({ notification: false })
</script>

<template>
  <u-form :model="model">
    <u-switch label="开启通知" field="notification" />
  </u-form>
</template>
```
