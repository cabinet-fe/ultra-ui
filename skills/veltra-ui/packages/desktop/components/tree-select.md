# UTreeSelect — 树形选择器

> `import type { TreeSelectProps, TreeSelectEmits, TreeSelectExposed } from '@veltra/desktop'`

基于 `UDropdown` + `UTree` 的树形单选选择器，支持搜索过滤、自定义节点渲染、表单上下文继承。多选用 `UMultiTreeSelect`。

## Import

```ts
// UTreeSelect 由 Vite 自动导入，无需手动 import
```

## Props

继承 `FormComponentProps`（`size` / `disabled` / `readonly` / `label` / `field` / `tips` / `span`，详见 `patterns.md`），追加：

| prop                | type                                                       | default      | 说明                                              |
| ------------------- | ---------------------------------------------------------- | ------------ | ------------------------------------------------- |
| `modelValue`        | `string \| number`                                         | —            | 选中值                                            |
| `text`              | `string`                                                   | —            | 显示文本（`v-model:text`）                        |
| `data`              | `Record<string, any>[]`                                    | —            | 树形数据                                          |
| `labelKey`          | `string`                                                   | `'label'`    | 标签字段名                                        |
| `valueKey`          | `string`                                                   | `'value'`    | 值字段名                                          |
| `childrenKey`       | `string`                                                   | `'children'` | 子级字段名                                        |
| `expandAll`         | `boolean`                                                  | `false`      | 展开所有节点                                      |
| `expandOnClickNode` | `boolean`                                                  | —            | 点击节点切换展开/收缩                             |
| `placeholder`       | `string`                                                   | `'请选择'`   | 占位                                              |
| `clearable`         | `boolean`                                                  | `true`       | 可清空                                            |
| `filterable`        | `boolean`                                                  | `false`      | 可搜索过滤                                        |
| `width` / `minWidth`| `string`                                                   | `—` / `'280px'` | 弹框宽度（默认跟随触发元素）                  |
| `checkStrictly`     | `boolean`                                                  | `false`      | 严格选择，父子不联动                              |
| `disabledNode`      | `(item: Record<string, any>, node: TreeNode) => boolean`   | —            | 禁用节点判定                                      |
| `scrollToView`      | `boolean`                                                  | —            | 选中项滚动到视图内                                |
| `slots`             | `Record<string, any>`                                      | —            | 透传插槽给 UTree                                  |
| `contentStyle` / `contentClass` | `CSSProperties \| string` / `unknown`         | —            | 下拉容器样式/类名                                 |

## Emits

| event               | 参数                                                             | 说明                            |
| ------------------- | ---------------------------------------------------------------- | ------------------------------- |
| `update:modelValue` | `(value?: string \| number)`                                     | v-model 变更                    |
| `update:text`       | `(text?: string)`                                                | 显示文本变更                    |
| `change`            | `(value?: string \| number, selectedData?: Record<string, any>)` | 选中变化（同时返回原始数据）    |
| `clear`             | `()`                                                             | 清空选中                        |

## Slots

| slot      | 作用域                                          | 说明                            |
| --------- | ----------------------------------------------- | ------------------------------- |
| `default` | `{ node: TreeNode; data: Record<string, any> }` | 自定义树节点渲染（透传 UTree）  |
| `prefix`  | —                                               | 输入框前缀                      |

## Examples

### 基础

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const selected = shallowRef<string>()
const treeData = [
  {
    label: '北京', value: 'beijing',
    children: [
      { label: '朝阳区', value: 'chaoyang' },
      { label: '海淀区', value: 'haidian' }
    ]
  },
  {
    label: '上海', value: 'shanghai',
    children: [{ label: '浦东新区', value: 'pudong' }]
  }
]
</script>

<template>
  <u-tree-select v-model="selected" :data="treeData" placeholder="请选择地区" />
</template>
```

### 可搜索 + 自定义字段名 + 禁用节点

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const deptId = shallowRef<number>()
const departments = [
  {
    name: '技术部', id: 1,
    subs: [
      { name: '前端组', id: 11 },
      { name: '后端组', id: 12, disabled: true }
    ]
  }
]
</script>

<template>
  <u-tree-select
    v-model="deptId"
    :data="departments"
    label-key="name" value-key="id" children-key="subs"
    filterable
    :disabled-node="item => item.disabled === true"
    placeholder="搜索部门"
  />
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { FormModel, formField } from '@veltra/desktop'

const model = new FormModel({ region: formField({ value: '' }) })
const regionData = [
  { label: '华东', value: 'east', children: [{ label: '上海', value: 'sh' }] },
  { label: '华南', value: 'south', children: [{ label: '广州', value: 'gz' }] }
]
</script>

<template>
  <u-form :model="model">
    <u-tree-select label="地区" field="region" :data="regionData" />
  </u-form>
</template>
```
