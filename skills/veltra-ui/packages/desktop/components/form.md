# UForm — 表单容器

> `import type { FormProps, FormExposed } from '@veltra/desktop'`
> `import type { FormModelItem, ModelData, IFormModel } from '@veltra/desktop'`

配合 `FormModel` / `DynamicFormModel` 实现表单数据绑定、校验、尺寸/禁用/只读继承。Form 自动检测 slot 中的子组件，若子组件有 `field` 属性则自动用 `<u-form-item>` 包裹并绑定 `model.data[field]`，**无需手写 FormItem 和 v-model**。

## Import

```ts
import { UForm, FormModel, DynamicFormModel, formField } from '@veltra/desktop'
```

## 核心机制：自动 FormItem 包裹与数据绑定

### 不需要手动写 FormItem 与 v-model

在 `<u-form>` 内使用的表单输入组件，只要设置了 `field` 属性，Form 会：

1. 自动用 `<u-form-item>` 包裹该组件
2. 自动将 `model.data[field]` 作为 `model-value` 传入
3. 自动监听 `update:model-value` 事件写回 model

```vue
<!-- ✅ Veltra UI — 不需要 FormItem，不需要 v-model -->
<u-form :model="model">
  <u-input label="用户名" field="username" />
  <u-select label="角色" field="role" :options="roles" />
</u-form>

<!-- ⚠️ 独立使用（不在 Form 内）时才需要 v-model -->
<u-input v-model="keyword" placeholder="搜索" />
```

### 什么时候需要手动使用 FormItem

只有在一个表单项内需要**多个组件组合**时才需要手动 `<u-form-item>`：

```vue
<u-form :model="model">
  <u-input field="name" label="姓名" />

  <!-- 一个表单项内有两个输入组件 -->
  <u-form-item label="价格区间">
    <u-number-input v-model="model.data.minPrice" placeholder="最低价" />
    <span> — </span>
    <u-number-input v-model="model.data.maxPrice" placeholder="最高价" />
  </u-form-item>
</u-form>
```

### 内部实现

Form 遍历 slot 子节点，通过 VNode 拦截机制：检测每个组件的 `field` prop，若存在且不是 `FormItem`，则自动包裹 `<u-form-item>` 并绑定数据。

## Props

`FormProps` extends `ComponentProps`（包含 `size?: ComponentSize`）：

| prop | type | default | 说明 |
| --- | --- | --- | --- |
| `model` | `FormModel \| DynamicFormModel` | **必填** | 表单数据模型 |
| `cols` | `number` | — | 列数，不传则根据断点自动排列（xs:1, md:2, lg:3, xl:4） |
| `showInitialData` | `boolean` | — | 值变更后显示初始数据对比（需要 model 设置了 initialData） |
| `labelWidth` | `string \| number` | — | 表单项 label 统一宽度 |
| `noTips` | `boolean` | — | 隐藏错误提示与 tips |
| `readonly` | `boolean` | — | 全局只读，子组件通过 provide/inject 继承 |
| `disabled` | `boolean` | — | 全局禁用，子组件通过 provide/inject 继承 |
| `size` | `'small' \| 'default' \| 'large'` | — | 表单内组件尺寸，子组件通过 provide/inject 继承 |

## Slots

| slot | 作用域 | 说明 |
| --- | --- | --- |
| `default` | `{ data: Model['data']; model: Model }` | 表单内容，`data` 为当前表单数据，`model` 为表单模型实例 |

```vue
<u-form :model="model">
  <template #default="{ data }">
    <u-input label="类型" field="type" />
    <u-input v-if="data.type === 'custom'" label="自定义值" field="customValue" />
  </template>
</u-form>
```

## Exposed

```ts
interface FormExposed {
  /** 根元素（UGrid 的 el） */
  el: ShallowRef<HTMLElement | null | undefined>
}
```

## FormModel vs DynamicFormModel

| 特性 | FormModel | DynamicFormModel |
| --- | --- | --- |
| 字段定义时机 | 构造时静态定义，不可增删 | 运行时可 `add()` / `delete()` 动态增删 |
| 类型安全 | 泛型推导，`model.data.xxx` 有完整类型提示 | `Record<string, any>`，无字段级类型推导 |
| 数据源 | 内部创建 `reactive` data，不可替换 | 可通过 `model.data = externalReactive` 替换为外部 reactive 对象 |
| `validate()` 失败 | `Promise.reject(false)` | `Promise.resolve(false)` |
| `setData()` | 返回 `this`，支持链式调用 | 无返回值 |
| `setInitialData()` | ✅ 有 | ❌ 无（直接操作 `model.initialData`） |
| `allKeys` | `readonly` 属性 | `get` 访问器 |

**选择依据**：
- 字段在编码时已知且固定 → `FormModel`（推荐，类型安全）
- 字段需运行时增删（点击「添加条件」、字段配置来自后端接口） → `DynamicFormModel`

---

## FormModel API

```ts
class FormModel<Fields extends Record<string, FormModelItem>>
```

### 构造

```ts
const model = new FormModel({
  username: formField({ value: '', required: true }),
  email: formField({ value: '', preset: 'email' }),
  age: formField({ value: 18, min: 0, max: 150 })
})
```

### 属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `data` | `ModelData<Fields>` | 当前表单数据（响应式），字段类型由泛型推导 |
| `fields` | `Fields` | 字段校验规则（构造时定义，不可更改） |
| `allKeys` | `string[]` | 所有字段键 |
| `errors` | `Map<keyof Fields, string[] \| undefined>` | 校验错误集合（shallowReactive） |
| `initialData` | `ModelData<Fields>` | 初始数据（用于 resetData 和 showInitialData 对比） |
| `formKeys` | `Map<number, (keyof Fields)[]>` | 由 Form 组件内部维护，记录当前渲染的表单需要校验的字段 |

### 方法

| 方法 | 返回值 | 说明 |
| --- | --- | --- |
| `validate(fields?)` | `Promise<boolean>` | 校验。成功返回 `true`；失败 `reject(false)`，且全量校验时会自动滚动到第一个错误项 |
| `resetData(fields?)` | `void` | 重置指定字段到 `initialData`，不传则重置全部。重置时内部会抑制字段变更自动校验 |
| `setData(data, config?)` | `this` | 设置表单数据。`config.validate`（默认 `true`）控制是否触发校验。返回 `this` 支持链式调用 |
| `setInitialData(data)` | `this` | 设置初始值（用于重置和变更对比）。返回 `this` 支持链式调用 |
| `clearValidate()` | `void` | 清除所有校验错误状态 |
| `onChange(cb)` | `void` | 监听任意字段值变更，`cb: (field, value) => void` |
| `offChange(cb)` | `void` | 取消监听值变更 |
| `setProxyData(proxyData)` | `void` | 替换内部 data 为新的 reactive 对象（内部方法，一般不需要手动调用） |

---

## DynamicFormModel API

```ts
class DynamicFormModel
```

### 构造

```ts
// 可选传入初始字段
const model = new DynamicFormModel({
  name: formField({ value: '', required: true })
})

// 也可空构造，后续 add
const model = new DynamicFormModel()
```

### 属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `data` | `Record<string, any>` | 当前表单数据（响应式）。**支持 setter**：可替换为外部 `reactive` 对象 |
| `fields` | `Record<string, FormModelItem>` | 字段校验规则（shallowReactive，可动态增删） |
| `allKeys` | `string[]` | 所有字段键（get 访问器，实时反映 `fields` 的键） |
| `errors` | `Map<string, string[] \| undefined>` | 校验错误集合（shallowReactive） |
| `initialData` | `Record<string, any>` | 初始数据（readonly） |
| `formKeys` | `Map<number, string[]>` | 由 Form 组件内部维护，记录当前渲染的表单需要校验的字段 |

### 方法

| 方法 | 返回值 | 说明 |
| --- | --- | --- |
| `add(field, item)` | `void` | 运行时添加字段及其校验规则 |
| `delete(field)` | `void` | 运行时移除字段（从 `fields` 中删除，`data` 与该字段的数据保留） |
| `append(fields)` | `void` | 批量添加多个字段（内部遍历调用 `add`） |
| `validate(fields?)` | `Promise<boolean>` | 校验。成功返回 `true`，失败返回 `false`（**不 reject**，与 FormModel 不同） |
| `resetData(fields?)` | `void` | 重置指定字段到 `initialData` |
| `setData(data, config?)` | `void` | 设置表单数据。`config.validate`（默认 `true`）控制是否触发校验 |
| `clearValidate()` | `void` | 清除所有校验错误状态 |
| `onChange(cb)` | `void` | 监听任意字段值变更，`cb: (field, value) => void` |
| `offChange(cb)` | `void` | 取消监听值变更 |

---

## formField

`formField` 是一个纯类型辅助函数，用于定义 `FormModelItem`：

```ts
function formField<Val = unknown>(item?: FormModelItem<Val>): FormModelItem<Val>
```

`FormModelItem` extends `ValidateRule`：

```ts
interface FormModelItem<Val = any> extends ValidateRule {
  /** 模型值（初始值） */
  value?: Val
}
```

### 校验规则（ValidateRule）

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `value` | `any` | 初始值（来自 `FormModelItem`，非 `ValidateRule`） |
| `required` | `boolean \| string` | 必填。`string` 时为自定义错误提示 |
| `min` | `number \| [number, string]` | 最小值。元组时第二项为自定义错误提示 |
| `max` | `number \| [number, string]` | 最大值。元组时第二项为自定义错误提示 |
| `minLen` | `number \| [number, string]` | 最小长度。元组时第二项为自定义错误提示 |
| `maxLen` | `number \| [number, string]` | 最大长度。元组时第二项为自定义错误提示 |
| `length` | `number \| [number, string]` | 精确长度。元组时第二项为自定义错误提示 |
| `match` | `RegExp \| [RegExp, string] \| string` | 正则匹配。元组时第二项为自定义错误提示 |
| `preset` | `'email' \| 'phone' \| 'num' \| 'url' \| 'idCard'` | 预设校验规则 |
| `validator` | `(value: any, data: Data) => Promise<string> \| string` | 自定义异步/同步校验。返回 `string` 表示错误信息，空字符串或 `undefined` 表示通过 |

---

## 类型导出

```ts
// 从 @veltra/desktop 可直接导入的类型
import type {
  FormProps,           // 表单组件属性
  FormExposed,         // 表单暴露的方法/属性
  FormModelItem,       // 表单模型字段项
  ModelData,           // 从 Fields 推导出的 data 类型
  ModelRules,          // 从 Fields 推导出的 rules 类型（不含 value）
  IFormModel,          // 表单模型接口
  DataSettingConfig    // setData config 类型
} from '@veltra/desktop'
```

`FormProps` 还接受泛型：
```ts
FormProps<MyModel>  // MyModel extends IFormModel
```

---

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

### 自定义校验

```vue
<script setup lang="ts">
import { UForm, UInput, UButton, FormModel, formField } from '@veltra/desktop'

const model = new FormModel({
  username: formField({
    value: '',
    required: '用户名不能为空',
    minLen: [2, '至少 2 个字符'],
    maxLen: [20, '最多 20 个字符']
  }),
  code: formField({
    value: '',
    match: [/^[A-Z]{3}-\d{4}$/, '格式：XXX-0000']
  }),
  customField: formField({
    value: '',
    validator: async (val) => {
      // 返回非空字符串表示错误，返回 undefined 表示通过
      if (val === 'admin') return '该值已被占用'
    }
  })
})
</script>

<template>
  <u-form :model="model" :cols="1">
    <u-input label="用户名" field="username" />
    <u-input label="编号" field="code" />
    <u-input label="自定义" field="customField" />
  </u-form>
</template>
```

### 设置数据 + 初始值对比

```vue
<script setup lang="ts">
import { UForm, UInput, FormModel, formField } from '@veltra/desktop'

const model = new FormModel({ name: formField({ value: '张三' }) })

// 设置初始值（用于重置和变更对比）
model.setInitialData({ name: '张三' })

// 模拟异步加载数据，不触发校验
setTimeout(() => model.setData({ name: '李四' }, { validate: false }), 1000)
</script>

<template>
  <!-- showInitialData 使变更字段显示「变更前」对比 -->
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
  model.add(field, { value: '', required: true })
}

function removeField(field: string) {
  extraFields.value = extraFields.value.filter((f) => f !== field)
  model.delete(field)
}
</script>

<template>
  <u-form :model="model" label-width="100px" :cols="1">
    <u-input label="名称" field="name" />

    <u-form-item v-for="field in extraFields" :key="field" :label="`扩展字段 ${field}`" :field="field">
      <u-input v-model="model.data[field]" />
      <u-button size="small" @click="removeField(field)">删除</u-button>
    </u-form-item>
  </u-form>
  <u-button @click="addField">添加字段</u-button>
</template>
```

### DynamicFormModel — 使用外部 reactive 数据源

```vue
<script setup lang="ts">
import { UForm, UInput, DynamicFormModel, formField } from '@veltra/desktop'
import { reactive } from 'vue'

const externalData = reactive({ keyword: '', category: '' })

const model = new DynamicFormModel({
  keyword: formField({ value: '', required: true }),
  category: formField({ value: '' })
})

// 替换内部数据源为外部 reactive 对象
model.data = externalData
// 外部修改 externalData.keyword 会同步反映到表单
</script>

<template>
  <u-form :model="model" label-width="100px" :cols="1">
    <u-input label="关键字" field="keyword" />
    <u-input label="分类" field="category" />
  </u-form>
</template>
```

### 复杂场景：手动 FormItem 组合多个组件

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
    <u-input label="商品名" field="name" />

    <u-form-item label="价格区间">
      <u-number-input v-model="model.data.minPrice" placeholder="最低" />
      <span style="margin: 0 8px">—</span>
      <u-number-input v-model="model.data.maxPrice" placeholder="最高" />
    </u-form-item>
  </u-form>
</template>
```

### 监听字段变更

```ts
model.onChange((field, val) => {
  console.log(`字段 ${String(field)} 变为`, val)
})

// 组件卸载时记得取消
model.offChange(cb)
```

### 全局禁用/只读 + 尺寸继承

```vue
<u-form :model="model" disabled size="small">
  <!-- 所有子组件自动继承 disabled 和 size="small" -->
  <u-input field="name" label="姓名" />
  <u-select field="role" label="角色" />
</u-form>
```

## 使用决策速查

| 场景 | 写法 |
| --- | --- |
| 表单内普通输入 | `<u-input field="xxx" label="标签" />` — 不需要 FormItem、不需要 v-model |
| 表单内一个项多个组件 | `<u-form-item label="标签"><组件 v-model="model.data.xxx" />...</u-form-item>` |
| 独立使用输入组件（不在 Form 内） | `<u-input v-model="value" />` |
| 属性继承（size/disabled/readonly） | 设在 `u-form` 上，所有子组件自动通过 provide/inject 继承 |
| 固定字段表单 | `new FormModel({...})` |
| 动态增减字段 | `new DynamicFormModel({...})` + `add()` / `delete()` |
