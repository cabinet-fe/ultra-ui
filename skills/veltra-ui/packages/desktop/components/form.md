# UForm — 表单容器

> `import type { FormProps } from '@veltra/desktop'`

配合 `FormModel` 实现表单数据绑定、校验、尺寸/禁用/只读继承。

## Import

```ts
import { UForm, FormModel, formField } from '@veltra/desktop'
```

## 核心机制：自动 FormItem 包裹与数据绑定

**这是本组件库与其他开源组件库最大的区别。**

### 不需要手动写 FormItem

在大多数开源组件库（如 Element Plus、Ant Design Vue）中，表单的写法是：

```vue
<!-- ❌ 其他组件库的写法 — 本库不需要这样写 -->
<el-form :model="form">
  <el-form-item label="用户名" prop="username">
    <el-input v-model="form.username" />
  </el-form-item>
</el-form>
```

**在 Veltra UI 中，只需要在表单输入组件上设置 `field` 属性即可：**

```vue
<!-- ✅ Veltra UI 的写法 -->
<u-form :model="model">
  <u-input label="用户名" field="username" />
</u-form>
```

### 不需要 v-model

当输入组件在 `<u-form>` 内部使用且设置了 `field` 属性时，**不需要 v-model**。Form 会自动将 `field` 对应的 `model.data[field]` 绑定到组件上。

```vue
<!-- ✅ 不需要 v-model，Form 自动绑定 -->
<u-form :model="model">
  <u-input field="username" label="用户名" />
  <u-select field="role" label="角色" :options="roles" />
</u-form>

<!-- ⚠️ 只有独立使用（不在 Form 内）时才需要 v-model -->
<u-input v-model="keyword" placeholder="搜索" />
```

### 内部实现原理

Form 组件通过 VNode 拦截机制实现自动包裹：

1. **VNode 拦截**：Form 遍历 slot 中的所有子节点，检测每个组件是否有 `field` prop
2. **自动包裹**：如果组件有 `field` 且不是 `FormItem` 本身，Form 自动用 `<u-form-item>` 包裹它
3. **自动绑定**：Form 将 `model.data[field]` 作为 `model-value` 传入，并监听 `update:model-value` 事件写回 model

源码逻辑（form.vue 模板）：

```vue
<!-- 如果是 FormItem 或没有 field → 直接渲染 -->
<component v-if="isFormItem || !field" :is="node" />

<!-- 否则 → 自动包裹 FormItem 并绑定数据 -->
<u-form-item v-else v-bind="formItemProps">
  <component
    :is="node"
    :model-value="modelValue ?? o(model?.data ?? {}).get(field)"
    @update:model-value="handleUpdateValue(field, $event)"
  />
</u-form-item>
```

### 什么时候需要手动使用 FormItem？

只有在**一个表单项需要包含多个组件组合**的复杂场景下才需要手动使用 `<u-form-item>`：

```vue
<u-form :model="model">
  <!-- 普通字段：直接用 field，不需要 FormItem -->
  <u-input field="name" label="姓名" />

  <!-- 复杂场景：一个表单项内有两个输入组件 -->
  <u-form-item label="价格区间">
    <u-number-input v-model="model.data.minPrice" placeholder="最低价" />
    <span> — </span>
    <u-number-input v-model="model.data.maxPrice" placeholder="最高价" />
  </u-form-item>
</u-form>
```

## Props

| prop              | type                            | default  | 说明                         |
| ----------------- | ------------------------------- | -------- | ---------------------------- |
| `model`           | `FormModel \| DynamicFormModel` | **必填** | 表单数据模型                 |
| `cols`            | `number`                        | —        | 列数，不传则根据断点自动排列 |
| `showInitialData` | `boolean`                       | —        | 值变更后显示初始数据对比     |
| `labelWidth`      | `string \| number`              | —        | label 统一宽度               |
| `noTips`          | `boolean`                       | —        | 隐藏错误提示                 |
| `readonly`        | `boolean`                       | —        | 全局只读                     |
| `disabled`        | `boolean`                       | —        | 全局禁用                     |
| `size`            | `ComponentSize`                 | —        | 表单内组件尺寸               |

## Exposed

| 属性 | 类型                                           |
| ---- | ---------------------------------------------- |
| `el` | `ShallowRef<HTMLElement \| null \| undefined>` |

## Slots

```ts
default(props: { data: Model['data']; model: Model }): any
```

slot 提供 `data` 和 `model` 作用域变量，可用于条件渲染等场景。

## FormModel vs DynamicFormModel

| 特性         | FormModel                             | DynamicFormModel                                      |
| ------------ | ------------------------------------- | ----------------------------------------------------- |
| 字段定义时机 | 构造时静态定义，不可增删              | 运行时可动态 `add()`/`delete()`                       |
| 类型安全     | 泛型推导，`model.data.xxx` 有类型提示 | `Record<string, any>`，无字段类型推导                 |
| 数据源       | 内部创建 reactive data                | 可通过 `model.data = externalReactive` 替换外部数据源 |
| 适用场景     | 字段固定的常规表单                    | 条件渲染字段、动态增减字段、字段由后端配置驱动        |

### 选择依据

- **字段在编码时已知且固定** → 用 `FormModel`（推荐，类型安全）
- **字段需要运行时增删**（如：用户点击"添加条件"、字段配置来自接口） → 用 `DynamicFormModel`

## FormModel API

```ts
const model = new FormModel({
  username: formField({ value: '', required: true }),
  email: formField({ value: '', preset: 'email' }),
  age: formField({ value: 18, min: 0, max: 150 })
})
```

### formField 校验规则

| 属性        | 类型                                               | 说明                                             |
| ----------- | -------------------------------------------------- | ------------------------------------------------ |
| `value`     | `any`                                              | 初始值                                           |
| `required`  | `boolean \| string`                                | 必填，string 时为自定义错误提示                  |
| `min`       | `number \| [number, string]`                       | 最小值，如果是元组，第二个参数是自定义错误提示   |
| `max`       | `number \| [number, string]`                       | 最大值，如果是元组，第二个参数是自定义错误提示   |
| `minLen`    | `number \| [number, string]`                       | 最小长度，如果是元组，第二个参数是自定义错误提示 |
| `maxLen`    | `number \| [number, string]`                       | 最大长度，如果是元组，第二个参数是自定义错误提示 |
| `match`     | `RegExp \| [RegExp, string] \| string`             | 正则匹配，如果是元组，第二个参数是自定义错误提示 |
| `preset`    | `'email' \| 'phone' \| 'num' \| 'url' \| 'idCard'` | 预设规则                                         |
| `validator` | `(value, data) => Promise<string> \| string`       | 自定义校验                                       |

### FormModel 方法

| 方法                             | 说明                                         |
| -------------------------------- | -------------------------------------------- |
| `data`                           | 当前表单数据（响应式）                       |
| `validate(fields?)`              | 校验 → 成功返回 `true`；`FormModel` 校验失败会 reject `false`，`DynamicFormModel` 校验失败返回 `false` |
| `resetData(fields?)`             | 重置到初始值                                 |
| `setData(data, config?)`         | 设置数据，`config.validate` 控制是否触发校验 |
| `setInitialData(data)`           | 设置初始值（用于重置和对比）                 |
| `clearValidate()`                | 清除校验状态                                 |
| `onChange(cb)` / `offChange(cb)` | 监听/取消监听值变更                          |
| `errors`                         | `Map<field, string[] \| undefined>` 校验错误集合 |

### DynamicFormModel 额外方法

| 方法                 | 说明                                              |
| -------------------- | ------------------------------------------------- |
| `add(field, item)`   | 运行时添加字段及其校验规则                        |
| `delete(field)`      | 运行时移除字段                                    |
| `append(fields)`     | 批量添加多个字段                                  |
| `data = reactiveObj` | 替换数据源为外部 reactive 对象（必须是 reactive） |

## FormComponentProps（表单输入组件通用属性）

所有表单输入组件（Input、Select、NumberInput 等）都继承这些属性：

| prop       | type               | 说明                                             |
| ---------- | ------------------ | ------------------------------------------------ |
| `field`    | `string`           | 绑定的表单字段名（在 Form 内使用时替代 v-model） |
| `label`    | `string`           | 表单项标签（自动传递给 FormItem）                |
| `tips`     | `string`           | 表单项提示信息                                   |
| `span`     | `number \| 'full' \| ({ [key in BreakpointName]?: number \| 'full' } & { default: number \| 'full' })` | 所占栅格列数，支持响应式对象 |
| `disabled` | `boolean`          | 是否禁用                                         |
| `readonly` | `boolean`          | 是否只读                                         |
| `size`     | `ComponentSize`    | 组件尺寸                                         |

## Examples

### 基础表单

```vue
<script setup lang="ts">
import { UForm, UInput, UNumberInput, UButton, FormModel, formField } from '@veltra/desktop'

const model = new FormModel({
  username: formField({ value: '', required: true }),
  email: formField({ value: '', required: true, preset: 'email' }),
  age: formField({ value: 18 })
})

async function handleSubmit() {
  const valid = await model.validate().catch(() => false)
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
import { UForm, UInput, FormModel, formField } from '@veltra/desktop'

const model = new FormModel({ name: formField({ value: '张三' }) })

model.setInitialData({ name: '张三' })
setTimeout(() => model.setData({ name: '李四' }), 1000)
</script>

<template>
  <u-form :model="model" label-width="80px" :cols="1" show-initial-data>
    <u-input label="姓名" field="name" />
  </u-form>
</template>
```

### DynamicFormModel — 动态增减字段

```vue
<script setup lang="ts">
import { UForm, UFormItem, UInput, UButton, DynamicFormModel, formField } from '@veltra/desktop'
import { ref } from 'vue'

const model = new DynamicFormModel({ name: formField({ value: '', required: true }) })

const extraFields = ref<string[]>([])

function addField() {
  const field = `extra_${extraFields.value.length}`
  extraFields.value.push(field)
  // 运行时动态添加字段及其校验规则
  model.add(field, { value: '', required: true })
}

function removeField(field: string) {
  extraFields.value = extraFields.value.filter((f) => f !== field)
  // 运行时动态移除字段
  model.delete(field)
}
</script>

<template>
  <u-form :model="model" label-width="100px" :cols="1">
    <u-input label="名称" field="name" />
    <u-form-item v-for="field in extraFields" :key="field" :label="`扩展字段`" :field="field">
      <u-input v-model="model.data[field]" />
      <u-button @click="removeField(field)">删除</u-button>
    </u-form-item>
  </u-form>
  <u-button @click="addField">添加字段</u-button>
</template>
```

### DynamicFormModel — 使用外部数据源

```vue
<script setup lang="ts">
import { UForm, UInput, DynamicFormModel, formField } from '@veltra/desktop'
import { reactive } from 'vue'

// 可以将外部 reactive 对象作为数据源
const externalData = reactive({ keyword: '', category: '' })

const model = new DynamicFormModel({
  keyword: formField({ value: '', required: true }),
  category: formField({ value: '' })
})
// 替换内部数据源为外部 reactive 对象
model.data = externalData
</script>

<template>
  <u-form :model="model" label-width="100px" :cols="1">
    <u-input label="关键字" field="keyword" />
    <u-input label="分类" field="category" />
  </u-form>
</template>
```

### 复杂场景：手动使用 FormItem

```vue
<script setup lang="ts">
import { UForm, UFormItem, UInput, UNumberInput, FormModel, formField } from '@veltra/desktop'

const model = new FormModel({
  name: formField({ value: '', required: true }),
  minPrice: formField({ value: 0 }),
  maxPrice: formField({ value: 100 })
})
</script>

<template>
  <u-form :model="model" label-width="100px" :cols="1">
    <!-- 普通字段：直接用 field -->
    <u-input label="商品名" field="name" />

    <!-- 复杂组合：手动 FormItem -->
    <u-form-item label="价格区间">
      <u-number-input v-model="model.data.minPrice" placeholder="最低" />
      <span style="margin: 0 8px">—</span>
      <u-number-input v-model="model.data.maxPrice" placeholder="最高" />
    </u-form-item>
  </u-form>
</template>
```

### 使用 slot 作用域

```vue
<template>
  <u-form :model="model" :cols="1">
    <template #default="{ data }">
      <u-input label="类型" field="type" />
      <u-input v-if="data.type === 'custom'" label="自定义值" field="customValue" />
    </template>
  </u-form>
</template>
```

### 监听字段变更

```ts
model.onChange((field, val) => {
  console.log(`字段 ${String(field)} 变为`, val)
})
```

## 使用决策速查

| 场景                               | 写法                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| 表单内普通输入                     | `<u-input field="xxx" label="标签" />` — 不需要 FormItem、不需要 v-model       |
| 表单内一个项多个组件               | `<u-form-item label="标签"><组件 v-model="model.data.xxx" />...</u-form-item>` |
| 独立使用输入组件（不在 Form 内）   | `<u-input v-model="value" />`                                                  |
| 属性继承（size/disabled/readonly） | 设在 Form 上，所有子组件自动继承                                               |
