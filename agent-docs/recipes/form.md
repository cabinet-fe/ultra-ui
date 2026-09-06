---
title: UForm 表单硬规则
description: 在 UForm 内用 field 绑定 model，禁止与 v-model 并用，以及校验与 UFormItem 例外
---

`UForm` 拦截默认插槽里带 `field` 的子组件，自动生成 `UFormItem`，并按 `field` 路径读写 `model`。写表单时必须遵守下面两条硬规则。

## 硬规则

1. **必须有 `field`**：`u-form` 内凡需要标签、校验或写入 `model` 的控件，都要定义 `field`（支持 `a.b` 嵌套路径）。没有 `field` 时，`label` / `rules` / `tips` 不会进表单项，值也不会绑到 `model`。
2. **有 `field` 就不要再写 `v-model`**：`UForm` 会按 `field` 读写 `model`。`v-model="form.xxx"` 与 `field="xxx"` 并用是错误写法。

正确：

```vue
<u-form :model="form">
  <u-input label="用户名" field="username" />
  <u-textarea label="意见" field="opinion" :rows="3" />
  <u-select label="办理人" field="handler" :options="options" />
  <u-checkbox label="记住" field="remember">记住我</u-checkbox>
</u-form>
```

不要在同一个控件上同时写 `field` 和 `v-model`。不要在 `u-form` 内省略 `field` 却还指望 `label` / `rules` 生效。

独立使用控件（不在 `u-form` 内）时才用 `v-model`。不要把各控件文档开头的「基础用法」原样搬进表单。

## 基础校验

`validate()` 全量校验，`validate(['field'])` 按字段校验；失败会滚到首个错误项。`reset()` 把 `model` 恢复为最近一次 `props.model` 引用变更时的快照并清除校验。

```vue
<script setup lang="ts">
import { reactive, useTemplateRef } from 'vue'

const formRef = useTemplateRef('form')
const formData = reactive({ username: '', email: '', age: 18 })

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (valid) console.log('提交:', formData)
}
</script>

<template>
  <u-form ref="form" :model="formData" label-width="100px" :cols="1">
    <u-input
      label="用户名"
      field="username"
      :rules="{
        required: '用户名不能为空',
        minLen: [2, '至少 2 个字符'],
        maxLen: [20, '最多 20 个字符']
      }"
    />
    <u-input label="邮箱" field="email" :rules="{ required: true, preset: 'email' }" />
    <u-number-input label="年龄" field="age" :rules="{ min: 0, max: 150 }" />
  </u-form>
  <u-button type="primary" @click="handleSubmit">提交</u-button>
</template>
```

嵌套路径：

```vue
<u-form :model="formData" label-width="100px" :cols="1">
  <u-input label="姓名" field="name" :rules="{ required: true }" />
  <u-input label="邮箱" field="contact.email" :rules="{ required: true, preset: 'email' }" />
</u-form>
```

按字段校验与重置：

```ts
await formRef.value?.validate(['username'])
formRef.value?.clearValidate()
formRef.value?.reset()
```

`label-position` 可选 `'left'`（默认语义）或 `'top'`。

## 何时用 `u-form-item`

单字段控件直接放在 `u-form` 上写 `field` 即可。仅当需要多控件组合同一个字段、或自定义 label 插槽时才用 `u-form-item`：`field` / `label` / `rules` / `tips` 写在 Item 上，**内部控件自行 `v-model`，且不再写 `field`**。

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({
  name: '',
  priceRange: { min: undefined as number | undefined, max: undefined as number | undefined }
})
</script>

<template>
  <u-form :model="formData" label-width="100px" :cols="1">
    <u-input label="商品名" field="name" :rules="{ required: '商品名不能为空' }" />

    <u-form-item
      label="价格区间"
      field="priceRange"
      :rules="{ required: '请填写价格区间' }"
      tips="最低价不能高于最高价"
    >
      <u-number-input v-model="formData.priceRange.min" placeholder="最低" />
      <span style="margin: 0 8px">—</span>
      <u-number-input v-model="formData.priceRange.max" placeholder="最高" />
    </u-form-item>
  </u-form>
</template>
```

筛选条、工具栏上的独立输入不包在 `u-form` 里，那些控件用 `v-model` 是正确的。
