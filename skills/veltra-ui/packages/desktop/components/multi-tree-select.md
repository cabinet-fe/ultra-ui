# UMultiTreeSelect — 多选树形选择器

> `import type { MultiTreeSelectProps, MultiTreeSelectEmits, MultiTreeSelectExposed } from '@veltra/desktop'`

## Import

```ts
import { UMultiTreeSelect } from '@veltra/desktop'
```

## Props

### 组件专属属性

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `(string \| number)[]` | `[]` | 选中值（`v-model`） |
| `placeholder` | `string` | `'请选择'` | 占位文字 |
| `clearable` | `boolean` | `true` | 是否可清空 |
| `filterable` | `boolean` | `false` | 是否显示搜索过滤输入框 |
| `visibilityLimit` | `number` | `3` | 触发器中可见标签数量上限，超出显示 `+N` |
| `minWidth` | `string` | `'280px'` | 下拉面板最小宽度 |
| `width` | `string` | — | 下拉面板宽度（默认跟随触发器宽度） |
| `contentStyle` | `CSSProperties \| string` | — | 下拉内容容器样式 |
| `contentClass` | `unknown` | — | 下拉内容容器类名 |

### 树数据相关属性（继承自 `TreeProps`，含默认值）

| prop | type | default | 说明 |
|------|------|---------|------|
| `data` | `Record<string, any>[]` | — | 树形数据源，每项须包含 `children` 子节点数组 |
| `labelKey` | `string` | `'label'` | 节点文本字段名 |
| `valueKey` | `string` | `'value'` | 节点值字段名 |
| `childrenKey` | `string` | `'children'` | 子节点字段名 |
| `expandAll` | `boolean` | `false` | 是否默认展开所有节点 |
| `expandOnClickNode` | `boolean` | — | 点击节点时是否展开/折叠 |
| `checkStrictly` | `boolean` | `false` | 严格选择：父子节点选中状态互不关联 |
| `disabledNode` | `(item: Record<string, any>, node: TreeNode) => boolean` | — | 控制节点是否禁止勾选 |
| `slots` | `Record<string, any>` | — | 树节点渲染插槽穿透（自定义节点内容） |
| `scrollToView` | `boolean` | — | 选中项是否自动滚动到可视区域 |

### 表单通用属性（继承自 `FormComponentProps`）

| prop | type | default | 说明 |
|------|------|---------|------|
| `size` | `'small' \| 'default' \| 'large'` | — | 组件尺寸 |
| `disabled` | `boolean` | — | 是否禁用（禁止交互） |
| `readonly` | `boolean` | — | 是否只读（仅展示已选标签，不可操作） |
| `label` | `string` | — | 表单标签文字 |
| `field` | `string` | — | 表单项字段标识 |
| `tips` | `string` | — | 表单提示信息 |
| `span` | `number \| 'full' \| { ... }` | — | 表单栅格占比 |

## Emits

| 事件 | 签名 | 说明 |
|------|------|------|
| `update:modelValue` | `(value: (string \| number)[]) => void` | `v-model` 更新，选中值变化时触发 |
| `change` | `(checked: Record<string, any>[]) => void` | 选中的节点数据数组变化时触发 |
| `clear` | `() => void` | 点击清空按钮时触发 |

## Slots

```ts
defineSlots<{
  default?: (props: {
    /** 树节点实例 */
    node: TreeNode
    /** 节点原始数据 */
    data: Record<string, any>
  }) => any
}>()
```

> 树节点内容自定义推荐使用 Props 中的 `slots` 属性传入渲染配置，而非默认插槽。

## Exposed

组件当前未暴露任何公开方法与属性。

```ts
type MultiTreeSelectExposed = {}
```

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UMultiTreeSelect } from '@veltra/desktop'

const selected = ref<(string | number)[]>([])

const treeData = [
  {
    label: '亚洲',
    value: 'asia',
    children: [
      { label: '中国', value: 'cn' },
      { label: '日本', value: 'jp' },
      { label: '韩国', value: 'kr' }
    ]
  },
  {
    label: '欧洲',
    value: 'europe',
    children: [
      { label: '英国', value: 'uk' },
      { label: '法国', value: 'fr' }
    ]
  }
]
</script>

<template>
  <u-multi-tree-select v-model="selected" :data="treeData" />
</template>
```

### 带搜索与清空

```vue
<template>
  <u-multi-tree-select
    v-model="selected"
    :data="treeData"
    filterable
    clearable
    placeholder="搜索并选择地区"
    @change="(checked) => console.log('已选:', checked)"
    @clear="() => console.log('已清空')"
  />
</template>
```

### 严格选择模式

选中父节点不会自动选中子节点，子节点与父节点选中状态互不影响。

```vue
<template>
  <u-multi-tree-select
    v-model="selected"
    :data="treeData"
    check-strictly
    :expand-all="true"
    :visibility-limit="5"
  />
</template>
```

### 禁用与只读

```vue
<template>
  <!-- 禁用：不可交互，不可删除标签 -->
  <u-multi-tree-select v-model="selected" :data="treeData" disabled />

  <!-- 只读：仅展示已选标签列表，无下拉交互 -->
  <u-multi-tree-select v-model="selected" :data="treeData" readonly />
</template>
```
