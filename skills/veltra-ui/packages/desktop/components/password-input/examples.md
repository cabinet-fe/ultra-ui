# UPasswordInput 示例

## 基础用法

```vue
<template>
  <u-password-input v-model="password" placeholder="请输入密码" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const password = ref('')
</script>
```

## 带清除按钮

```vue
<template>
  <u-password-input v-model="password" placeholder="请输入密码" clearable />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const password = ref('')
</script>
```

## 禁用与只读

```vue
<template>
  <u-password-input v-model="password" label="密码" disabled />
  <u-password-input v-model="password" label="密码" readonly />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const password = ref('mySecret')
</script>
```

## 在 UForm 中使用

> 表单内用 `field` 绑 `model`，勿再写 `v-model`；无 `field` 时 `label`/`tips` 不生效。

```vue
<template>
  <u-form :model="form">
    <u-password-input
      label="新密码"
      field="password"
      placeholder="至少 8 位"
      tips="密码长度至少 8 位，包含字母和数字"
    />
  </u-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ password: '' })
</script>
```
