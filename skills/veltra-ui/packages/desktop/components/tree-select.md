# UTreeSelect — 树形选择器

> `import type { TreeSelectProps, TreeSelectEmits, TreeSelectExposed } from '@veltra/desktop'`

基于 UDropdown 与 UTree 的树形单选选择器，支持搜索过滤、自定义节点渲染、表单上下文集成。

## Import

```ts
import { UTreeSelect } from '@veltra/desktop'
```

## Props

| prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string \| number` | — | 双向绑定的选中值 |
| `text` | `string` | — | 显示文本（`v-model:text`） |
| `data` | `Record<string, any>[]` | — | 树形数据 |
| `labelKey` | `string` | `'label'` | 数据项中标签字段名 |
| `valueKey` | `string` | `'value'` | 数据项中值字段名 |
| `childrenKey` | `string` | `'children'` | 数据项中子级字段名 |
| `expandAll` | `boolean` | `false` | 是否展开所有节点 |
| `expandOnClickNode` | `boolean` | — | 是否在点击节点时展开/收缩节点 |
| `placeholder` | `string` | `'请选择'` | 占位文本 |
| `clearable` | `boolean` | `true` | 是否可清空 |
| `filterable` | `boolean` | `false` | 是否可搜索过滤 |
| `minWidth` | `string` | `'280px'` | 弹框最小宽度 |
| `width` | `string` | — | 弹框宽度，默认跟随触发元素宽度 |
| `checkStrictly` | `boolean` | `false` | 严格选择，选择的内容和父级不会产生关联 |
| `disabledNode` | `(item: Record<string, any>, node: TreeNode) => boolean` | — | 禁用节点判定函数 |
| `scrollToView` | `boolean` | — | 使选中项出现在滚动视图内 |
| `slots` | `Record<string, any>` | — | 向 UTree 穿透插槽 |
| `contentStyle` | `CSSProperties \| string` | — | 下拉内容容器样式 |
| `contentClass` | `unknown` | — | 下拉内容容器类名 |
| `size` | `'small' \| 'default' \| 'large'` | — | 组件尺寸 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `readonly` | `boolean` | `false` | 是否只读 |
| `tips` | `string` | — | 在表单控件内时的提示文字 |
| `label` | `string` | — | 表单标签文字 |
| `field` | `string` | — | 表单项字段名 |
| `span` | `number \| 'full' \| { default: number \| 'full'; xs?: number \| 'full'; sm?: number \| 'full'; md?: number \| 'full'; lg?: number \| 'full'; xl?: number \| 'full' }` | — | 所占列的大小 |

> `size`、`disabled`、`readonly` 在表单上下文（`UForm`）中会自动继承，运行时 fallback 分别为 `'default'`、`false`、`false`。

## Emits

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `(value?: string \| number)` | `v-model` 值变更 |
| `update:text` | `(text?: string)` | 显示文本变更 |
| `change` | `(value?: string \| number, selectedData?: Record<string, any>)` | 选中值变化，同时返回选中节点原始数据 |
| `clear` | `()` | 清空选中 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ node: TreeNode; data: Record<string, any> }` | 自定义树节点渲染，向 UTree 穿透 |
| `prefix` | — | 输入框前缀内容 |

## Exposed

```ts
interface TreeSelectExposed {}
```

无暴露属性或方法。

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UTreeSelect } from '@veltra/desktop'

const selected = shallowRef<string>()

const treeData = [
  {
    label: '北京',
    value: 'beijing',
    children: [
      { label: '朝阳区', value: 'chaoyang' },
      { label: '海淀区', value: 'haidian' }
    ]
  },
  {
    label: '上海',
    value: 'shanghai',
    children: [
      { label: '浦东新区', value: 'pudong' },
      { label: '徐汇区', value: 'xuhui' }
    ]
  }
]
</script>

<template>
  <u-tree-select v-model="selected" :data="treeData" placeholder="请选择地区" />
</template>
```

### 可搜索 + 自定义字段

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const deptId = shallowRef<number>()

const departments = [
  {
    name: '技术部',
    id: 1,
    subs: [
      { name: '前端组', id: 11 },
      { name: '后端组', id: 12 }
    ]
  },
  {
    name: '产品部',
    id: 2,
    subs: [
      { name: '移动端', id: 21 },
      { name: 'PC 端', id: 22 }
    ]
  }
]
</script>

<template>
  <u-tree-select
    v-model="deptId"
    :data="departments"
    label-key="name"
    value-key="id"
    children-key="subs"
    filterable
    placeholder="搜索部门"
  />
</template>
```

### 禁用节点 + 展开控制

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const category = shallowRef<string>()

const categories = [
  {
    label: '电子产品',
    value: 'electronics',
    children: [
      { label: '手机', value: 'phone' },
      { label: '电脑', value: 'pc', disabled: true }
    ]
  },
  {
    label: '服装',
    value: 'clothing',
    children: [
      { label: '男装', value: 'mens' },
      { label: '女装', value: 'womens' }
    ]
  }
]

function isDisabledNode(item: Record<string, any>) {
  return item.disabled === true
}
</script>

<template>
  <u-tree-select
    v-model="category"
    :data="categories"
    :disabled-node="isDisabledNode"
    :expand-all="false"
    expand-on-click-node
    placeholder="选择分类"
  />
</template>
```

### 在 UForm 中使用

> 参考 [form.md](form.md) 了解 FormModel 的完整用法。表单内不需要手写 `u-form-item` 和 `v-model`。

```vue
<script setup lang="ts">
import { UForm, UTreeSelect, FormModel, formField } from '@veltra/desktop'

const model = new FormModel({
  region: formField({ value: '' })
})

const regionData = [
  {
    label: '华东',
    value: 'east',
    children: [
      { label: '上海', value: 'sh' },
      { label: '杭州', value: 'hz' }
    ]
  },
  {
    label: '华南',
    value: 'south',
    children: [
      { label: '广州', value: 'gz' },
      { label: '深圳', value: 'sz' }
    ]
  }
]
</script>

<template>
  <u-form :model="model">
    <u-tree-select
      label="地区"
      field="region"
      :data="regionData"
      placeholder="请选择地区"
    />
  </u-form>
</template>
```
