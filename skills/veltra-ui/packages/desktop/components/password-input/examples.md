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

## 表单场景

```vue
<template>
  <u-form>
    <u-password-input
      v-model="password"
      label="新密码"
      field="password"
      placeholder="至少 8 位"
      tips="密码长度至少 8 位，包含字母和数字"
    />
  </u-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const password = ref('')
</script>
```
