---
title: UInput 示例
description: 文本输入、前后缀与 pattern，以及在 UForm 内用 field 绑定
---

独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。可用 `prefix` / `suffix` 字符串，或 `#prefix` / `#suffix` 插槽。`pattern` 限制可输入内容。

独立使用：

```vue
<script setup lang="ts">
import { Search } from '@veltra/icons/normal'
import { shallowRef } from 'vue'

const keyword = shallowRef('')
</script>

<template>
  <u-input v-model="keyword" placeholder="请输入关键词" clearable />
  <u-input v-model="keyword" prefix="前缀" clearable>
    <template #suffix>
      <u-icon :size="14"><Search /></u-icon>
    </template>
  </u-input>
  <u-input v-model="keyword" :pattern="/^\d*$/" placeholder="仅数字" />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ username: '' })
</script>

<template>
  <u-form :model="form">
    <u-input
      label="用户名"
      field="username"
      placeholder="请输入用户名"
      :rules="{ required: true, minLen: [2, '至少 2 个字符'] }"
    />
  </u-form>
</template>
```
