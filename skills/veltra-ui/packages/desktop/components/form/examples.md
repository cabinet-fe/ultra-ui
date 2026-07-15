# UForm 示例

> `UForm` 会拦截默认插槽中带 `field` 的子组件，自动生成 `UFormItem` 并绑定 `model` 对应路径的值。校验规则通过控件或 `UFormItem` 的 `rules` 属性声明；调用 `formRef.validate()` 触发全部字段校验，或传入 `keys` 仅校验指定字段。校验失败时会自动滚动到第一个错误项。字段值变化时会自动重新校验（`reset()` 期间会抑制）。
>
> 下方示例涵盖常用表单控件及验证、按字段校验、清除校验与重置。

## 基础 + 校验

```vue
<script setup lang="ts">
import { reactive, useTemplateRef } from 'vue'

const formRef = useTemplateRef('form')

const formData = reactive({ username: '', email: '', age: 18, customField: '' })

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
    <u-input
      label="自定义"
      field="customField"
      :rules="{ validator: async (val) => (val === 'admin' ? '该值已被占用' : undefined) }"
    />
  </u-form>
  <u-button type="primary" @click="handleSubmit">提交</u-button>
</template>
```

## 嵌套字段

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ name: '', contact: { email: '', phone: '' } })
</script>

<template>
  <u-form :model="formData" label-width="100px" :cols="1">
    <u-input label="姓名" field="name" :rules="{ required: true }" />
    <u-input label="邮箱" field="contact.email" :rules="{ required: true, preset: 'email' }" />
    <u-input label="电话" field="contact.phone" :rules="{ required: true }" />
  </u-form>
</template>
```

## 按字段校验

```vue
<script setup lang="ts">
import { reactive, useTemplateRef } from 'vue'

const formRef = useTemplateRef('form')
const formData = reactive({ username: '', email: '' })

async function handleSubmit() {
  // 校验全部
  const valid = await formRef.value?.validate()
  if (valid) console.log('提交:', formData)
}

async function saveDraft() {
  const valid = await formRef.value?.validate(['username'])
  if (valid) console.log('存草稿:', formData)
}
</script>

<template>
  <u-form ref="form" :model="formData" :cols="1">
    <u-input label="用户名" field="username" :rules="{ required: true }" />
    <u-input label="邮箱" field="email" :rules="{ required: true, preset: 'email' }" />
  </u-form>
  <u-button type="primary" @click="saveDraft">存草稿</u-button>
  <u-button type="primary" @click="handleSubmit">提交</u-button>
</template>
```

## 清除校验和重置

```vue
<script setup lang="ts">
import { reactive, useTemplateRef } from 'vue'

const formRef = useTemplateRef('form')
const formData = reactive({ name: '' })
</script>

<template>
  <u-form ref="form" :model="formData" :cols="1">
    <u-input label="姓名" field="name" :rules="{ required: true }" />
  </u-form>
  <u-button @click="formRef.value?.clearValidate()">清除校验</u-button>
  <u-button @click="formRef.value?.reset()">重置</u-button>
</template>
```

## 顶部标签布局

`label-position="top"` 时 label 在控件上方；默认为 `left`。`UFormItem` 可单独覆盖。

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ name: '', email: '', note: '' })
</script>

<template>
  <u-form :model="formData" label-position="top" :cols="1">
    <u-input label="姓名" field="name" :rules="{ required: true }" />
    <u-input label="邮箱" field="email" :rules="{ required: true, preset: 'email' }" />
    <u-form-item label="备注" label-position="left" label-width="80px">
      <u-textarea field="note" />
    </u-form-item>
  </u-form>
</template>
```
