---
title: UFormItem 示例
description: 仅在多控件组合或自定义 label 时显式使用；field 写在 Item 上
---

单字段控件直接放在 `UForm` 上写 `field` 即可，一般不必手写 `UFormItem`。仅当需要多控件组合同一个字段、或自定义 label 插槽时才用：`field` / `label` / `rules` / `tips` 写在 Item 上；**内部控件自行 `v-model`，且不再写 `field`**。

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({
  name: '',
  priceRange: { min: undefined as number | undefined, max: undefined as number | undefined }
})
</script>

<template>
  <u-form :model="form" label-width="100px" :cols="1">
    <u-input label="商品名" field="name" :rules="{ required: '商品名不能为空' }" />

    <u-form-item
      label="价格区间"
      field="priceRange"
      :rules="{ required: '请填写价格区间' }"
      tips="最低价不能高于最高价"
    >
      <u-number-input v-model="form.priceRange.min" placeholder="最低" />
      <span>—</span>
      <u-number-input v-model="form.priceRange.max" placeholder="最高" />
    </u-form-item>
  </u-form>
</template>
```

自定义 label 插槽：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ agree: false })
</script>

<template>
  <u-form :model="form">
    <u-form-item field="agree">
      <template #label>
        <span>我已阅读并同意条款</span>
      </template>
      <u-checkbox v-model="form.agree" />
    </u-form-item>
  </u-form>
</template>
```
