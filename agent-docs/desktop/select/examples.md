---
title: USelect 示例
description: 单选下拉、可搜索与可创建，以及在 UForm 内用 field 绑定
---

`options` 为对象数组，或 `(qs: string) =>` 异步函数（传入函数时会强制开启搜索）。默认 `value` / `label` 字段，可用 `value-key` / `label-key` 改。展示文案由 options 推导，用 `@update:text` 同步冗余字段，不要写 `v-model:text`。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。

独立使用：

```vue
<script setup lang="ts">
import { reactive, shallowRef } from 'vue'

const city = shallowRef('')
const cities = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' }
]

const dict = reactive<{ code?: string; text?: string }>({ code: 'beijing', text: '旧文案' })
</script>

<template>
  <u-select v-model="city" :options="cities" clearable filterable placeholder="请选择城市" />
  <u-select
    v-model="dict.code"
    :options="cities"
    clearable
    @update:text="dict.text = $event"
  />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ grade: '' })
const gradeList = [
  { label: '一年级', value: '1' },
  { label: '二年级', value: '2' }
]
</script>

<template>
  <u-form :model="form">
    <u-select
      label="年级"
      field="grade"
      :options="gradeList"
      :rules="{ required: true }"
      clearable
      placeholder="请选择年级"
    />
  </u-form>
</template>
```
