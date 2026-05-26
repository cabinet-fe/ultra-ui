# UForm — 表单容器

> `import type { FormProps, FormExposed, FormModelItem, ModelData, ModelRules, IFormModel, DataSettingConfig } from '@veltra/desktop'`

配合 `FormModel` / `DynamicFormModel` 实现表单数据绑定、校验、`size`/`disabled`/`readonly` 上下文继承。

**核心机制**：UForm 自动检测 slot 子组件 — 凡设置了 `field` 属性且不是 `UFormItem` 的，会被自动用 `<u-form-item>` 包裹，`model.data[field]` 自动作为 `model-value` 双向绑定。**不要手写 `<u-form-item>`，不要写 `v-model`**。

```vue
<!-- ✅ 推荐：field 自动绑定 -->
<u-form :model="model">
  <u-input label="用户名" field="username" />
  <u-select label="角色" field="role" :options="roles" />
</u-form>

<!-- ⚠️ 独立使用（不在 Form 内）才写 v-model -->
<u-input v-model="keyword" placeholder="搜索" />
```

`field` 支持 lodash 风格嵌套路径（`profile.name`），但 `FormModel` 构造时必须包含完整结构。

只有「一个表单项内有多个组件」才需要手写 `<u-form-item>`：

```vue
<u-form-item label="价格区间">
  <u-number-input v-model="model.data.minPrice" placeholder="最低" />
  <span> — </span>
  <u-number-input v-model="model.data.maxPrice" placeholder="最高" />
</u-form-item>
```

## Import

```ts
// UForm、UFormItem 由 Vite 自动导入，无需手动 import
import { FormModel, DynamicFormModel, formField } from '@veltra/desktop'
```

## 关联类型

### `FormModel<Fields>` vs `DynamicFormModel`

| 特性             | `FormModel`                              | `DynamicFormModel`                                   |
| ---------------- | ---------------------------------------- | ---------------------------------------------------- |
| 字段定义时机     | 构造时静态，不可增删                     | 运行时 `add()` / `delete()` 增删                     |
| 类型安全         | 泛型推导，`model.data.xxx` 有类型提示    | `Record<string, any>`，无字段级类型                  |
| `data` 数据源    | 内部 reactive，不可替换                  | 可 `model.data = externalReactive` 替换为外部对象    |
| `validate()` 失败 | `Promise.reject(false)`                  | `Promise.resolve(false)`                             |
| `setData()`      | 返回 `this`（链式）                      | 返回 `void`                                          |
| `setInitialData()`| ✅ 提供                                 | ❌ 直接操作 `model.initialData`                     |

选择：字段编码时已知 → `FormModel`；字段需运行时增删 → `DynamicFormModel`。

### 共同 API

```ts
class FormModel<Fields extends Record<string, FormModelItem>> {
  readonly data: ModelData<Fields>
  readonly fields: Fields
  readonly errors: Map<keyof Fields, string[] | undefined>
  initialData: ModelData<Fields>
  readonly allKeys: (keyof Fields)[]

  validate(fields?: (keyof Fields)[]): Promise<boolean>
  resetData(fields?: (keyof Fields)[]): void
  setData(data: Partial<ModelData<Fields>>, config?: { validate?: boolean }): this
  setInitialData(data: ModelData<Fields>): this
  clearValidate(): void
  onChange(cb: (field, value) => void): void
  offChange(cb): void
}

class DynamicFormModel {
  data: Record<string, any>          // 支持 setter，可替换
  readonly fields: Record<string, FormModelItem>
  get allKeys(): string[]
  // 同上的 errors / initialData / clearValidate / onChange / offChange / resetData / setData

  add(field: string, item: FormModelItem): void
  delete(field: string): void
  append(fields: Record<string, FormModelItem>): void
  validate(fields?: string[]): Promise<boolean>  // 失败 resolve(false)，不 reject
}
```

### `formField<Val>(item?: FormModelItem<Val>)`

类型辅助函数，定义字段值与校验规则。`FormModelItem` 继承 `ValidateRule`：

| 属性        | 类型                                                    | 说明                                                          |
| ----------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| `value`     | `any`                                                   | 初始值                                                        |
| `required`  | `boolean \| string`                                     | 必填（string 为自定义错误提示）                               |
| `min`       | `number \| [number, string]`                            | 最小值                                                        |
| `max`       | `number \| [number, string]`                            | 最大值                                                        |
| `minLen`    | `number \| [number, string]`                            | 最小长度                                                      |
| `maxLen`    | `number \| [number, string]`                            | 最大长度                                                      |
| `length`    | `number \| [number, string]`                            | 精确长度                                                      |
| `match`     | `RegExp \| [RegExp, string] \| string`                  | 正则匹配                                                      |
| `preset`    | `'email' \| 'phone' \| 'num' \| 'url' \| 'idCard'`      | 预设规则                                                      |
| `validator` | `(value, data) => Promise<string> \| string`            | 自定义校验，返回非空字符串=错误，空/`undefined`=通过          |

元组形式 `[规则值, 错误提示]` 用于自定义错误信息。

## Props

`FormProps` 继承 `ComponentProps`：

| prop              | type                              | default | 说明                                                       |
| ----------------- | --------------------------------- | ------- | ---------------------------------------------------------- |
| `model`           | `FormModel \| DynamicFormModel`   | **必填** | 表单数据模型                                              |
| `cols`            | `number`                          | —       | 列数（默认按断点 xs:1 / md:2 / lg:3 / xl:4 自适应）        |
| `labelWidth`      | `string \| number`                | —       | 表单项 label 统一宽度                                      |
| `showInitialData` | `boolean`                         | —       | 显示初始数据对比（需设置 `setInitialData`）                |
| `noTips`          | `boolean`                         | —       | 隐藏错误提示与 tips                                        |
| `readonly`        | `boolean`                         | —       | 全局只读，子组件 provide/inject 继承                       |
| `disabled`        | `boolean`                         | —       | 全局禁用，子组件 provide/inject 继承                       |
| `size`            | `'small' \| 'default' \| 'large'` | —       | 表单内组件尺寸                                             |

`FormProps<MyModel>` 接受泛型，`MyModel extends IFormModel`。

## Slots

| slot      | 作用域                                  | 说明                                |
| --------- | --------------------------------------- | ----------------------------------- |
| `default` | `{ data: Model['data']; model: Model }` | 表单内容，`data` 用于条件渲染        |

## Exposed

```ts
interface FormExposed {
  el: HTMLElement | null | undefined  // UGrid 根元素
}
```

## Examples

### 基础 + 校验

```vue
<script setup lang="ts">
import { FormModel, formField } from '@veltra/desktop'

const model = new FormModel({
  username: formField({
    value: '',
    required: '用户名不能为空',
    minLen: [2, '至少 2 个字符'],
    maxLen: [20, '最多 20 个字符']
  }),
  email: formField({ value: '', required: true, preset: 'email' }),
  age: formField({ value: 18, min: 0, max: 150 }),
  customField: formField({
    value: '',
    validator: async val => val === 'admin' ? '该值已被占用' : undefined
  })
})

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

### 设置数据 + 初始值对比

```vue
<script setup lang="ts">
import { FormModel, formField } from '@veltra/desktop'

const model = new FormModel({ name: formField({ value: '张三' }) })
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

### DynamicFormModel — 动态增减字段

```vue
<script setup lang="ts">
import { DynamicFormModel, formField } from '@veltra/desktop'
import { ref } from 'vue'

const model = new DynamicFormModel({ name: formField({ value: '', required: true }) })
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
      <u-button size="small" @click="model.delete(f); extras = extras.filter(x => x !== f)">删除</u-button>
    </u-form-item>
  </u-form>
  <u-button @click="addField">添加字段</u-button>
</template>
```

### 复杂场景：一个 FormItem 内组合多个组件

```vue
<script setup lang="ts">
import { FormModel, formField } from '@veltra/desktop'

const model = new FormModel({
  name: formField({ value: '', required: true }),
  minPrice: formField({ value: 0 }),
  maxPrice: formField({ value: 100 })
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

### 全局禁用/只读 + 尺寸继承

```vue
<u-form :model="model" disabled size="small">
  <!-- 所有子组件自动继承 disabled 与 size -->
  <u-input field="name" label="姓名" />
  <u-select field="role" label="角色" :options="roles" />
</u-form>
```

### 监听字段变更

```ts
model.onChange((field, val) => console.log(field, val))
// 卸载时清理
model.offChange(cb)
```

### 默认插槽作用域（条件渲染）

```vue
<u-form :model="model">
  <template #default="{ data }">
    <u-input label="类型" field="type" />
    <u-input v-if="data.type === 'custom'" label="自定义值" field="customValue" />
  </template>
</u-form>
```

### DynamicFormModel — 接管外部 reactive 数据

```ts
const externalData = reactive({ keyword: '', category: '' })
const model = new DynamicFormModel({
  keyword: formField({ value: '', required: true }),
  category: formField({ value: '' })
})
model.data = externalData  // 之后修改 externalData 同步反映到表单
```
