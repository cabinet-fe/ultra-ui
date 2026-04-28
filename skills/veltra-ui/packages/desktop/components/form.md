# UForm — 表单容器

> `import type { FormProps } from '@veltra/desktop'`

配合 `FormModel` 实现表单数据绑定、校验、尺寸/禁用/只读继承。

## Import

```ts
import { UForm, FormModel, formField } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `model` | `FormModel \| DynamicFormModel` | **必填** | 表单数据模型 |
| `cols` | `number` | — | 列数，不传则根据断点自动排列 |
| `showInitialData` | `boolean` | — | 值变更后显示初始数据对比 |
| `labelWidth` | `string \| number` | — | label 统一宽度 |
| `noTips` | `boolean` | — | 隐藏错误提示 |
| `readonly` | `boolean` | — | 全局只读 |
| `disabled` | `boolean` | — | 全局禁用 |
| `size` | `ComponentSize` | — | 表单内组件尺寸 |

## Exposed

| 属性 | 类型 |
|------|------|
| `el` | `ShallowRef<HTMLElement \| null \| undefined>` |

## FormModel API

```ts
const model = new FormModel({
  username: formField({ value: '', required: true, message: '请输入用户名' }),
  email: formField({ value: '', pattern: /^.+@.+$/, message: '邮箱格式不正确' }),
  age: formField({ value: 18 })
})
```

| 方法 | 说明 |
|------|------|
| `data` | 当前表单数据（响应式） |
| `validate(fields?)` | 校验 → `Promise<boolean>` |
| `validateField(field)` | 校验单个字段 |
| `setData(data, config?)` | 设置数据 |
| `resetData(fields?)` | 重置到初始值 |
| `setInitialData(data)` | 设置初始值 |
| `clearValidate()` | 清除校验 |
| `onChange(cb)` / `offChange(cb)` | 监听/取消监听值变更 |

## Examples

### 基础表单

```vue
<script setup lang="ts">
import { UForm, FormModel, formField } from '@veltra/desktop'

const model = new FormModel({
  username: formField({ value: '', required: true, message: '请输入用户名' }),
  email: formField({ value: '', required: true, pattern: /^.+@.+$/, message: '邮箱格式错误' }),
  age: formField({ value: 18 })
})

async function handleSubmit() {
  const valid = await model.validate()
  if (valid) {
    console.log('提交:', model.data)
  }
}
</script>

<template>
  <u-form :model="model" label-width="100px" :cols="1">
    <u-input label="用户名" field="username" placeholder="请输入" />
    <u-input label="邮箱" field="email" placeholder="请输入" />
    <u-number-input label="年龄" field="age" :min="0" :max="150" />
  </u-form>
  <u-button type="primary" @click="handleSubmit">提交</u-button>
</template>
```

### 设置数据 + 初始值对比

```vue
<script setup lang="ts">
import { UForm, FormModel, formField } from '@veltra/desktop'

const model = new FormModel({ name: formField({ value: '张三' }) })

// 设置初始值
model.setInitialData({ name: '张三' })

// 模拟异步数据回填
setTimeout(() => model.setData({ name: '李四' }), 1000)
</script>

<template>
  <u-form :model="model" label-width="80px" :cols="1" show-initial-data>
    <u-input label="姓名" field="name" />
  </u-form>
</template>
```

### DynamicFormModel — 动态表单

```vue
<script setup lang="ts">
import { UForm, DynamicFormModel, formField } from '@veltra/desktop'
import { reactive } from 'vue'

const data = reactive({ keyword: '' })
const model = new DynamicFormModel({
  keyword: formField({ value: '', required: true, message: '请输入' })
})
</script>

<template>
  <u-form :model="model" label-width="100px" :cols="1">
    <u-input label="关键字" field="keyword" v-model="data.keyword" />
  </u-form>
</template>
```

### 监听字段变更

```ts
model.onChange((field, val) => {
  console.log(`字段 ${String(field)} 变为`, val)
})
```
