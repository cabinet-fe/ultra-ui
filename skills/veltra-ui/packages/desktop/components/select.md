# USelect — 单选选择器

> `import type { SelectProps, SelectEmits, SelectExposed } from '@veltra/desktop'`

基于下拉框的单选选择器，支持搜索过滤、远程异步加载、创建新选项、网格布局和虚拟滚动。

## Import

```ts
// USelect 由 Vite 自动导入，无需手动 import
```

## Props

| prop           | type                                                                                                                                                                   | default    | 说明                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `modelValue`   | `any`                                                                                                                                                                  | —          | 绑定值                                                                     |
| `text`         | `string`                                                                                                                                                               | —          | 文本内容（`v-model:text`）                                                 |
| `options`      | `Record<string, any>[] \| ((qs: string) => Promise<Record<string, any>[]> \| Record<string, any>[])`                                                                   | —          | 列表选项。如果传入一个函数，那么 filterable 会被强制启用                   |
| `valueKey`     | `string`                                                                                                                                                               | `'value'`  | 值字段                                                                     |
| `labelKey`     | `string`                                                                                                                                                               | `'label'`  | 标签字段                                                                   |
| `clearable`    | `boolean`                                                                                                                                                              | `true`     | 是否可清除                                                                 |
| `placeholder`  | `string`                                                                                                                                                               | `'请选择'` | 占位符                                                                     |
| `filterable`   | `boolean`                                                                                                                                                              | —          | 是否启用搜索功能                                                           |
| `contentStyle` | `CSSProperties \| string`                                                                                                                                              | —          | 内容容器样式                                                               |
| `contentClass` | `unknown`                                                                                                                                                              | —          | 内容容器类名                                                               |
| `minWidth`     | `string`                                                                                                                                                               | —          | 弹框最小宽度                                                               |
| `width`        | `string`                                                                                                                                                               | —          | 弹框宽度，默认跟随触发元素的宽度                                           |
| `creatable`    | `boolean`                                                                                                                                                              | —          | 是否允许创建新的选项                                                       |
| `grid`         | `{ cols: number; gap?: number }`                                                                                                                                       | —          | 配置网格布局。开启网格布局将会导致虚拟滚动失效，因此网格布局不适合大量数据 |
| `size`         | `ComponentSize`                                                                                                                                                        | —          | 组件尺寸                                                                   |
| `tips`         | `string`                                                                                                                                                               | —          | 在表单控件内时的提示                                                       |
| `span`         | `number \| 'full' \| { default: number \| 'full'; xs?: number \| 'full'; sm?: number \| 'full'; md?: number \| 'full'; lg?: number \| 'full'; xl?: number \| 'full' }` | —          | 所占列的大小                                                               |
| `label`        | `string`                                                                                                                                                               | —          | 表单标签文字                                                               |
| `field`        | `string`                                                                                                                                                               | —          | 表单项字段                                                                 |
| `disabled`     | `boolean`                                                                                                                                                              | —          | 是否禁用                                                                   |
| `readonly`     | `boolean`                                                                                                                                                              | —          | 是否只读                                                                   |

> `size`、`disabled`、`readonly` 在表单上下文（`UForm`）中会自动继承，运行时 fallback 分别为 `'default'`、`false`、`false`。

## Emits

| event               | 参数                             | 说明                |
| ------------------- | -------------------------------- | ------------------- |
| `update:label`      | `(label?: string)`               | 触发更新 label 事件 |
| `update:modelValue` | `(modelValue?: any)`             | 选中值变化          |
| `change`            | `(option?: Record<string, any>)` | 选中项变化          |

## Slots

| slot      | 作用域                                           | 说明                             |
| --------- | ------------------------------------------------ | -------------------------------- |
| `default` | `{ option: Record<string, any>; index: number }` | 自定义选项渲染，每个选项渲染一次 |
| `prefix`  | —                                                | 触发框前缀内容                   |

## Exposed

```ts
interface SelectExposed {
  /** 信息文本 */
  infoText: string | number
}
```

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const city = shallowRef('')

const cities = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' }
]
</script>

<template>
  <u-select v-model="city" :options="cities" placeholder="请选择城市" />
</template>
```

### 可搜索 + 可创建 + 自定义字段

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const selected = shallowRef()

const users = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]
</script>

<template>
  <u-select
    v-model="selected"
    :options="users"
    value-key="id"
    label-key="name"
    filterable
    creatable
    placeholder="选择或输入创建"
  />
</template>
```

### 异步远程搜索

`options` 传入异步函数时，`filterable` 自动启用，输入的搜索词作为参数 `qs` 传入。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const product = shallowRef()

async function searchProducts(qs: string) {
  if (!qs) return []
  const res = await fetch(`/api/products?q=${qs}`)
  return res.json()
}
</script>

<template>
  <u-select
    v-model="product"
    value-key="id"
    label-key="name"
    :options="searchProducts"
    placeholder="搜索产品..."
  />
</template>
```

### 网格布局 + 自定义渲染

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const color = shallowRef()

const colorOptions = [
  { label: '红色', value: 'red' },
  { label: '蓝色', value: 'blue' },
  { label: '绿色', value: 'green' },
  { label: '黄色', value: 'yellow' },
  { label: '紫色', value: 'purple' },
  { label: '橙色', value: 'orange' }
]
</script>

<template>
  <u-select v-model="color" :options="colorOptions" :grid="{ cols: 3, gap: 8 }">
    <template #default="{ option }">
      <div style="text-align: center">
        <div
          :style="{ width: '24px', height: '24px', background: option?.value, margin: '0 auto' }"
        />
        <div>{{ option?.label }}</div>
      </div>
    </template>
  </u-select>
</template>
```

### 在 UForm 中使用

> 参考 [form.md](form.md) 了解 FormModel 的完整用法。表单内不需要手写 `u-form-item` 和 `v-model`。

```vue
<script setup lang="ts">
import { FormModel, formField } from '@veltra/desktop'

const model = new FormModel({ grade: formField({ value: '' }) })

const gradeList = [
  { label: '一年级', value: 1 },
  { label: '二年级', value: 2 },
  { label: '三年级', value: 3 }
]
</script>

<template>
  <u-form :model="model">
    <u-select label="年级" field="grade" :options="gradeList" />
  </u-form>
</template>
```
