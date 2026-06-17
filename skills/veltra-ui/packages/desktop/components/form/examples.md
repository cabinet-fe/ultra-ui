# UForm 示例

> `UForm` 会拦截默认插槽中带 `field` 的子组件，自动生成 `UFormItem` 并绑定 `model` 对应路径的值。校验规则通过控件或 `UFormItem` 的 `rules` 属性声明；调用 `formRef.validate()` 触发校验。
>
> 完整 playground 见 `playgrounds/desktop/src/form/index.vue`：单页综合示例，涵盖常用表单控件及验证 / 清空验证 / 重置。

## 基础 + 校验

```vue
<script setup lang="ts">
import type { FormExposed } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

const formRef = shallowRef<FormExposed>()

const formData = reactive({ username: '', email: '', age: 18, customField: '' })

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (valid) console.log('提交:', formData)
}
</script>

<template>
  <u-form ref="formRef" :model="formData" label-width="100px" :cols="1">
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
  <u-button @click="formRef?.clearValidate()">清除校验</u-button>
  <u-button @click="formRef?.reset()">重置</u-button>
</template>
```
