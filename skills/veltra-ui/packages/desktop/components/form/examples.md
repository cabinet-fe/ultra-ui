# UForm 示例

> **硬规则**：`u-form` 内控件用 `field` 绑定 `model`，**禁止**再写 `v-model`。需要标签 / 校验时必须写 `field`，否则 `label` / `rules` / `tips` 不生效。
>
> `UForm` 拦截默认插槽中带 `field` 的子组件，自动生成 `UFormItem` 并绑定 `model` 对应路径。校验写在控件或 `UFormItem` 的 `rules`；`formRef.validate()` 全量校验，`validate(['field'])` 按字段校验；失败自动滚到首个错误项；字段变化会重校验（`reset()` 期间抑制）。
>
> ❌ 错误：`<u-input v-model="form.name" label="姓名" field="name" />`（多写了 v-model）  
> ❌ 错误：`<u-checkbox v-model="save">保存</u-checkbox>`（在 form 内无 field，label 也不会挂到表单项）  
> ✅ 正确：`<u-input label="姓名" field="name" />`

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

## 常用控件合集（field，无 v-model）

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({
  opinion: '',
  saveAsCommon: false,
  handler: '',
  grade: undefined as number | undefined
})

const userOptions = [
  { username: 'zhang', realName: '张三' },
  { username: 'li', realName: '李四' }
]
const gradeList = [
  { label: '一年级', value: 1 },
  { label: '二年级', value: 2 }
]
</script>

<template>
  <u-form :model="form" label-width="100px" :cols="1">
    <u-textarea label="审批意见" field="opinion" :rows="3" placeholder="请输入审批意见" />
    <u-checkbox label="常用意见" field="saveAsCommon">保存为常用意见</u-checkbox>
    <u-select
      label="办理人"
      field="handler"
      :options="userOptions"
      value-key="username"
      label-key="realName"
      filterable
      clearable
      placeholder="可不填，覆盖当前节点办理人"
    />
    <u-select label="年级" field="grade" :options="gradeList" />
  </u-form>
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

## 何时使用 u-form-item（单独处理组件逻辑）

单字段控件直接放 `u-form` 写 `field` 即可；仅当需单独处理组件逻辑（多控件组合字段、自定义 label 插槽等）才用 `u-form-item`：`field`/`label`/`rules`/`tips` 写在 Item 上，内部控件自行 `v-model` 且**不再写 `field`**。更多场景（自定义 label、覆盖标签宽度、响应式栅格）见 `form-item/examples.md`。

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

    <!-- 两个输入组合成一个字段，校验/提示写在 u-form-item 上 -->
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

## 顶部标签布局

`label-position="top"` 时 label 在上方；Item 可单独覆盖，且 Item 也必须写 `field`。

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ name: '', email: '', note: '' })
</script>

<template>
  <u-form :model="formData" label-position="top" :cols="1">
    <u-input label="姓名" field="name" :rules="{ required: true }" />
    <u-input label="邮箱" field="email" :rules="{ required: true, preset: 'email' }" />
    <u-form-item label="备注" field="note" label-position="left" label-width="80px">
      <u-textarea v-model="formData.note" />
    </u-form-item>
  </u-form>
</template>
```
