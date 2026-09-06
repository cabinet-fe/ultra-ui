---
title: UPasswordInput 示例
description: 密码输入与明文切换，以及在 UForm 内用 field 绑定
---

继承 `UInput` 的占位、清空等能力，并带明文/密文切换。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。需要把密码放进自定义 `UFormItem` 时，Item 写 `field`，内部 `UPasswordInput` 自行 `v-model`。

独立使用：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const password = shallowRef('')
</script>

<template>
  <u-password-input v-model="password" placeholder="请输入密码" clearable />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ password: '' })
</script>

<template>
  <u-form :model="form">
    <u-password-input
      label="密码"
      field="password"
      placeholder="至少 6 位"
      :rules="{ required: true, minLen: 6 }"
    />
  </u-form>
</template>
```
