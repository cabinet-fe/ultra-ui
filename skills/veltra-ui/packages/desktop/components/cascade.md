# UCascade — 级联选择器

> `import type { CascadeProps, CascadeEmits, CascadeExposed } from '@veltra/desktop'`

级联选择器组件，支持单选/多选、搜索过滤、严格模式、只读/禁用等。

## Import

```ts
// UCascade 由 Vite 自动导入，无需手动 import
```

## Props

| prop              | 类型                                                     | 默认值       | 说明                                |
| ----------------- | -------------------------------------------------------- | ------------ | ----------------------------------- |
| `modelValue`      | `string[] \| string`                                     | —            | 双向绑定的值                        |
| `data`            | `Record<string, any>[]`                                  | `[]`         | 级联数据                            |
| `labelKey`        | `string`                                                 | `'label'`    | 数据项中标签字段名                  |
| `valueKey`        | `string`                                                 | `'value'`    | 数据项中值字段名                    |
| `childrenKey`     | `string`                                                 | `'children'` | 数据项中子级字段名                  |
| `separator`       | `string`                                                 | `'/'`        | 单选展示时的路径分隔符              |
| `placeholder`     | `string`                                                 | `'请选择'`   | 占位文本                            |
| `clearable`       | `boolean`                                                | `true`       | 是否可清除                          |
| `strict`          | `boolean`                                                | —            | 严格模式，仅叶子节点可选中          |
| `multiple`        | `boolean`                                                | —            | 是否多选                            |
| `filterable`      | `boolean`                                                | `false`      | 是否可搜索过滤                      |
| `visibilityLimit` | `number`                                                 | `3`          | 多选标签最多可见数量，超出显示 `+N` |
| `disabledNode`    | `(item: Record<string, any>) => boolean`                 | —            | 禁用节点判定函数                    |
| `size`            | `'small' \| 'default' \| 'large'`                        | `'default'`  | 组件尺寸                            |
| `disabled`        | `boolean`                                                | `false`      | 是否禁用                            |
| `readonly`        | `boolean`                                                | `false`      | 是否只读                            |
| `tips`            | `string`                                                 | —            | 表单控件内的提示文字                |
| `label`           | `string`                                                 | —            | 表单标签文字                        |
| `field`           | `string`                                                 | —            | 表单项字段名                        |
| `span`            | `number \| 'full' \| { [breakpoint]: number \| 'full' }` | —            | 所占列的大小                        |

## Emits

| event               | 参数                                                              | 说明             |
| ------------------- | ----------------------------------------------------------------- | ---------------- |
| `update:modelValue` | `(value?: string \| string[])`                                    | `v-model` 值变更 |
| `change`            | `(value: string[], label: string[], data: Record<string, any>[])` | 多选时选中值变更 |
| `change`            | `(value?: string, label?: string, item?: Record<string, any>)`    | 单选时选中值变更 |
| `clear`             | `()`                                                              | 清除选中         |

## Slots

无暴露 slots。

## Exposed

```ts
interface CascadeExposed {}
```

无暴露属性或方法。

## Examples

### 基础单选

```vue
<script setup lang="ts">
import { ref } from 'vue'

const value = ref<string>()
const options = [
  {
    value: '1',
    label: '北京',
    children: [
      { value: '11', label: '朝阳区' },
      { value: '12', label: '海淀区' }
    ]
  },
  {
    value: '2',
    label: '上海',
    children: [
      { value: '21', label: '浦东新区' },
      { value: '22', label: '徐汇区' }
    ]
  }
]
</script>

<template>
  <u-cascade v-model="value" :data="options" />
</template>
```

### 多选模式

```vue
<script setup lang="ts">
import { ref } from 'vue'

const value = ref<string[]>([])

const options = [
  {
    value: '1',
    label: '技术部',
    children: [
      { value: '11', label: '前端组' },
      { value: '12', label: '后端组' }
    ]
  },
  {
    value: '2',
    label: '产品部',
    children: [
      { value: '21', label: '移动端' },
      { value: '22', label: 'PC 端' }
    ]
  }
]
</script>

<template>
  <u-cascade v-model="value" :data="options" multiple />
</template>
```

### 搜索过滤

```vue
<template>
  <u-cascade v-model="value" :data="options" filterable placeholder="搜索地区" />
</template>
```

### 严格模式 + 自定义字段

```vue
<template>
  <u-cascade
    v-model="value"
    :data="data"
    strict
    label-key="name"
    value-key="id"
    children-key="subs"
  />
</template>
```
