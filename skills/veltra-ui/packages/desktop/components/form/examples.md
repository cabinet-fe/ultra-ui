# UForm 示例

## 基础 + 校验

```vue
<script setup lang="ts">
import { FormModel } from '@veltra/desktop'

// 带有 value 初始值时，无需使用 formField 包裹，自动推导类型
const model = new FormModel({
  username: {
    value: '',
    required: '用户名不能为空',
    minLen: [2, '至少 2 个字符'],
    maxLen: [20, '最多 20 个字符']
  },
  email: { value: '', required: true, preset: 'email' },
  age: { value: 18, min: 0, max: 150 },
  customField: {
    value: '',
    validator: async (val) => (val === 'admin' ? '该值已被占用' : undefined)
  }
})

// 💡 只有在没有指定 value 初始值时，才需要使用 formField<Type> 来显式指定类型：
// import { formField } from '@veltra/desktop'
// const model = new FormModel({
//   username: formField<string>({ required: '用户名不能为空' })
// })

async function handleSubmit() {
  const valid = await model.validate().catch(() => false)
  if (valid) console.log('提交:', model.data)
}
</script>

<template>
  <u-form :model="model" label-width="100px" :cols="1">
    <u-input label="用户名" field="username" />
    <u-input label="邮箱" field="email" />
    <u-number-input label="年龄" field="age" />
    <u-input label="自定义" field="customField" />
  </u-form>
  <u-button type="primary" @click="handleSubmit">提交</u-button>
</template>
```

## 嵌套字段 + 校验

```vue
<script setup lang="ts">
import { FormModel, nestField } from '@veltra/desktop'

const model = new FormModel({
  name: { value: '', required: true },
  contact: nestField({
    email: { value: '', required: true, preset: 'email' },
    phone: { value: '', required: true }
  })
})

async function handleSubmit() {
  const valid = await model.validate().catch(() => false)
  if (valid) console.log('提交:', model.data.contact.email)
}
</script>

<template>
  <u-form :model="model" label-width="100px" :cols="1">
    <u-input label="姓名" field="name" />
    <u-input label="邮箱" field="contact.email" />
    <u-input label="电话" field="contact.phone" />
  </u-form>
  <u-button type="primary" @click="handleSubmit">提交</u-button>
</template>
```

## 设置数据 + 初始值对比

```vue
<script setup lang="ts">
import { FormModel } from '@veltra/desktop'

const model = new FormModel({ name: { value: '张三' } })
model.setInitialData({ name: '张三' })

// 异步加载，不触发校验
setTimeout(() => model.setData({ name: '李四' }, { validate: false }), 1000)
</script>

<template>
  <!-- show-initial-data 让变更字段显示「变更前」对比 -->
  <u-form :model="model" :cols="1" show-initial-data>
    <u-input label="姓名" field="name" />
  </u-form>
</template>
```

## DynamicFormModel — 动态增减字段

```vue
<script setup lang="ts">
import { DynamicFormModel } from '@veltra/desktop'
import { ref } from 'vue'

const model = new DynamicFormModel({ name: { value: '', required: true } })
const extras = ref<string[]>([])

function addField() {
  const f = `extra_${extras.value.length}`
  extras.value.push(f)
  model.add(f, { value: '', required: true })
}
</script>

<template>
  <u-form :model="model" :cols="1">
    <u-input label="名称" field="name" />

    <u-form-item v-for="f in extras" :key="f" :label="`扩展 ${f}`" :field="f">
      <u-input v-model="model.data[f]" />
      <u-button
        size="small"
        @click="
          model.delete(f)
          extras = extras.filter((x) => x !== f)
        "
        >删除</u-button
      >
    </u-form-item>
  </u-form>
  <u-button @click="addField">添加字段</u-button>
</template>
```

## 复杂场景：一个 FormItem 内组合多个组件

```vue
<script setup lang="ts">
import { FormModel } from '@veltra/desktop'

const model = new FormModel({
  name: { value: '', required: true },
  minPrice: { value: 0 },
  maxPrice: { value: 100 }
})
</script>

<template>
  <u-form :model="model" label-width="100px" :cols="1">
    <u-input label="商品名" field="name" />

    <u-form-item label="价格区间">
      <u-number-input v-model="model.data.minPrice" placeholder="最低" />
      <span style="margin: 0 8px">—</span>
      <u-number-input v-model="model.data.maxPrice" placeholder="最高" />
    </u-form-item>
  </u-form>
</template>
```

## 全局禁用/只读 + 尺寸继承

```vue
<u-form :model="model" disabled size="small">
  <!-- 所有子组件自动继承 disabled 与 size -->
  <u-input field="name" label="姓名" />
  <u-select field="role" label="角色" :options="roles" />
</u-form>
```

## 监听字段变更

```ts
model.onChange((field, val) => console.log(field, val))
// 卸载时清理
model.offChange(cb)
```

## 默认插槽作用域（条件渲染）

```vue
<u-form :model="model">
  <template #default="{ data }">
    <u-input label="类型" field="type" />
    <u-input v-if="data.type === 'custom'" label="自定义值" field="customValue" />
  </template>
</u-form>
```

## DynamicFormModel — 接管外部 reactive 数据

```ts
const externalData = reactive({ keyword: '', category: '' })
const model = new DynamicFormModel({
  keyword: { value: '', required: true },
  category: { value: '' }
})
model.data = externalData // 之后修改 externalData 同步反映到表单
```
