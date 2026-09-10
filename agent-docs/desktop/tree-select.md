---
title: UTreeSelect 树选择器
description: "从 @veltra/desktop 导入的树形单选下拉选择器：下拉面板内嵌 UTree，绑定所选节点的值，支持关键字过滤、禁用节点、清空与 UForm 内 field 绑定校验。"
aliases: [TreeSelect, tree-select, 树形选择器, 树形下拉]
keywords: [modelValue, update:text, filterable, clearable, disabledNode, labelKey, valueKey, childrenKey, expandAll, field, 关键字过滤, 树形数据, 下拉树, 禁用节点, 冗余文案同步, 表单绑定]
---

# UTreeSelect 树选择器

`@veltra/desktop` 导出的 `UTreeSelect` 是树形单选下拉选择器：`modelValue` 为所选节点 `valueKey` 字段的值，展示文案由 `data` 推导；支持关键字过滤、禁用节点、清空，以及在 `UForm` 内由 `field` 接管绑定与校验。分工规则：从树形数据里单选一个节点值用 `UTreeSelect`；一次勾选多个节点用 `UMultiTreeSelect`；数据按层级逐级下钻且值要保留完整路径时用 `UCascade`。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UTreeSelect } from '@veltra/desktop'

// 值是所选节点的 valueKey 字段值，不是节点对象
const region = shallowRef<string | number>()

const data = [
  {
    label: '浙江',
    value: 'zj',
    children: [
      { label: '杭州', value: 'hz' },
      { label: '宁波', value: 'nb' }
    ]
  },
  { label: '上海', value: 'sh', children: [{ label: '浦东', value: 'pudong' }] }
]
</script>

<template>
  <!-- 点选「杭州」后 region 为 'hz'，输入框显示「杭州」 -->
  <UTreeSelect v-model="region" :data="data" placeholder="请选择地区" />
</template>
```

独立使用（不在 `<u-form>` 内）走 `v-model`；放进 `<u-form>` 必须改用 `field` 绑定，写 `field` 后禁止再写 `v-model`。

## API 签名

```ts
// 树节点类型从本包导入：import type { TreeNode } from '@veltra/desktop'
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

export interface ValidateRule {
  required?: boolean | string
  length?: number | [number, string]
  min?: number | [number, string]
  max?: number | [number, string]
  minLen?: number | [number, string]
  maxLen?: number | [number, string]
  match?: RegExp | [RegExp, string] | string
  preset?: PresetRule
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 表单控件公共属性（继承自 @veltra/utils 的 FormComponentProps） */
export interface FormComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?:
    | number
    | 'full'
    | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** 表单项字段：UForm 内用它绑定 model 字段 */
  field?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 校验规则 */
  rules?: ValidateRule
}

/** 树形选择器属性；TreeProps 中仅 selected / checked / selectable / checkable 被移除（内部固定单选） */
export interface TreeSelectProps extends FormComponentProps {
  /** 选中节点的值（valueKey 字段值），单选 */
  modelValue?: string | number
  /** 数据源，树形数组 */
  data?: Record<string, any>[]
  /** 标签字段名，默认 'label' */
  labelKey?: string
  /** 值字段名，默认 'value' */
  valueKey?: string
  /** 子级字段名，默认 'children' */
  childrenKey?: string
  /** 是否展开全部节点，默认 false */
  expandAll?: boolean
  /** 点击节点时是否展开/收缩，默认 false */
  expandOnClickNode?: boolean
  /** 返回 true 的节点不可选中；node 为构建后的树节点，可访问 node.children / node.isLeaf */
  disabledNode?: (item: Record<string, any>, node: TreeNode) => boolean
  /** 占位文字，默认 '请选择' */
  placeholder?: string
  /** 是否可清空，默认 true */
  clearable?: boolean
  /** 是否可搜索，默认 false */
  filterable?: boolean
  /** 面板最小宽度，默认 '280px' */
  minWidth?: string
  /** 面板宽度，默认跟随触发元素宽度 */
  width?: string
  /** 面板容器样式 */
  contentStyle?: CSSProperties | string
  /** 面板容器类名 */
  contentClass?: unknown
}

export interface TreeSelectEmits {
  (e: 'clear'): void
  (e: 'update:modelValue', value?: string | number): void
  /** 选中节点的完整数据对象；清空时为 undefined */
  (e: 'change', selectedData?: Record<string, any>): void
  /** 选中项文案变化（单向通知，用于同步父级冗余字段） */
  (e: 'update:text', text?: string): void
}

/** ref 上无暴露成员（DeconstructValue 解包后的形态） */
export type TreeSelectExposed = {}
```

插槽：`default`（作用域 `{ node: TreeNode; data: Record<string, any> }`，自定义节点内容）、`prefix`（输入框前缀）。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `v-model` | `string \| number` | — | 否 | 必须等于 `data` 中某节点的 `valueKey` 字段值；清空后写入 `''` |
| `data` | `Record<string, any>[]` | `[]` | 否 | 树形数组；无懒加载，必须一次性传入全部层级 |
| `labelKey` | `string` | `'label'` | 否 | 回显文案读取该字段 |
| `valueKey` | `string` | `'value'` | 否 | 值比对与提交读取该字段 |
| `childrenKey` | `string` | `'children'` | 否 | 子级数组字段名 |
| `expandAll` | `boolean` | `false` | 否 | 初始展开全部节点 |
| `expandOnClickNode` | `boolean` | `false` | 否 | 点击节点文本是否展开/收缩 |
| `disabledNode` | `(item, node) => boolean` | — | 否 | 返回 `true` 的节点置灰且不可选中 |
| `placeholder` | `string` | `'请选择'` | 否 | 无选中值时的占位文字 |
| `clearable` | `boolean` | `true` | 否 | 悬停且已有选中值时显示清除按钮 |
| `filterable` | `boolean` | `false` | 否 | 开启后可输入关键字，按节点 `label` 做子串匹配（区分大小写），命中节点的祖先自动展开 |
| `minWidth` | `string` | `'280px'` | 否 | 面板最小宽度 |
| `width` | `string` | 跟随触发元素宽度 | 否 | 面板宽度 |
| `contentStyle` | `CSSProperties \| string` | — | 否 | 面板容器内联样式 |
| `contentClass` | `unknown` | — | 否 | 面板容器类名 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 组件未设置时继承 `UForm` 的 `size` |
| `label` | `string` | — | 否 | 标签文字，仅 `UForm` / `UFormItem` 内生效 |
| `field` | `string` | — | 否 | `UForm` 内必须用它绑定字段；写了 `field` 禁止再写 `v-model` |
| `rules` | `ValidateRule` | — | 否 | 校验规则，仅 `UForm` 内生效 |
| `tips` | `string` | — | 否 | 表单内提示文字，仅 `UForm` 内生效 |
| `span` | `number \| 'full' \| 响应式对象` | — | 否 | 所占列宽，仅 `UForm` 内生效 |
| `disabled` | `boolean` | `false` | 否 | 未设置时继承 `UForm` 的 `disabled` |
| `readonly` | `boolean` | `false` | 否 | 未设置时继承 `UForm` 的 `readonly`；只读时渲染为纯文本 |

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value?: string \| number` | 点选节点或清空；清空时为 `''` |
| `change` | `selectedData?: Record<string, any>` | 点选节点（payload 为节点完整数据对象）或清空（payload 为 `undefined`） |
| `update:text` | `text?: string` | 选中项文案变化，值为节点 `labelKey` 字段值；清空时为 `undefined` |
| `clear` | — | 点击清除按钮 |

组件 ref 上没有可调用的暴露方法。

## 典型示例

### 自定义字段名 + 过滤 + 禁用节点

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UTreeSelect } from '@veltra/desktop'

const deptId = shallowRef<number>()

const departments = [
  {
    name: '技术部',
    id: 1,
    subs: [
      { name: '前端组', id: 11 },
      { name: '后端组', id: 12, disabled: true }
    ]
  }
]

// 返回 true 的节点不可选中
function disabledNode(item: Record<string, any>) {
  return item.disabled === true
}
</script>

<template>
  <UTreeSelect
    v-model="deptId"
    :data="departments"
    label-key="name"
    value-key="id"
    children-key="subs"
    :disabled-node="disabledNode"
    filterable
    expand-all
  >
    <!-- 默认插槽自定义节点渲染，data 为原始数据项 -->
    <template #default="{ data }">{{ data.name }}（{{ data.id }}）</template>
  </UTreeSelect>
</template>
```

### UForm 内 field 绑定与必填校验

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, UTreeSelect } from '@veltra/desktop'

const form = reactive({ region: '' })

const data = [
  { label: '华东', value: 'east', children: [{ label: '上海', value: 'sh' }] },
  { label: '华南', value: 'south', children: [{ label: '广州', value: 'gz' }] }
]
</script>

<template>
  <!-- 表单内用 field 接管绑定与校验，禁止再写 v-model -->
  <UForm :model="form">
    <UTreeSelect label="地区" field="region" :data="data" :rules="{ required: '请选择地区' }" />
  </UForm>
</template>
```

### 同步冗余文案（@update:text）

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UTreeSelect } from '@veltra/desktop'

// text 是冗余文案：展示始终由 data 推导，父级只经事件存储，不回写
const form = reactive({ code: 'chaoyang', text: '' })

const data = [
  {
    label: '北京',
    value: 'beijing',
    children: [
      { label: '朝阳区', value: 'chaoyang' },
      { label: '海淀区', value: 'haidian' }
    ]
  }
]
</script>

<template>
  <UTreeSelect
    v-model="form.code"
    :data="data"
    expand-all
    clearable
    @update:text="form.text = $event ?? ''"
  />
  <p>值：{{ form.code || '—' }}；文案：{{ form.text || '—' }}</p>
</template>
```

## 注意事项

> [!WARNING]
> - 在 `<u-form>` 内必须用 `field` 绑定字段，禁止再写 `v-model`。
> - `v-model` 的值是节点 `valueKey` 字段值（`string | number`），不是节点对象，也不是路径字符串。
> - `update:text` 是单向通知事件，本库没有 `v-model:text`；展示文案始终由 `data` 反查推导，禁止手工写文案回显。
> - 没有懒加载：`data` 必须一次性传入全部层级，本库不存在 `load` / `lazy` 属性（不要套用 Element `el-tree-select` 的懒加载写法）。
> - 内部固定单选（`selectable`）；继承自 `TreeProps` 的 `checkStrictly` / `checkOnClickNode` 在本组件不生效，勾选行为属于 `UMultiTreeSelect`。
> - `clearable` 默认 `true`，清空后 `modelValue` 为 `''`，不是 `undefined`。
> - 字段名用顶层 `labelKey` / `valueKey` / `childrenKey` 属性配置，不是 Ant Design 的 `fieldNames` 对象，也不是 `el-tree` 的 `props="{ label, children }"` 对象。
> - `filterable` 是对已传入 `data` 的本地过滤（`label` 子串匹配、区分大小写），没有 `remote-method` 远程搜索。

## 常见问题

### 设置了 `modelValue` 但输入框不回显

原因：值与 `data` 中节点的 `valueKey` 字段值不相等（类型不一致或拼写错误），回显文案靠按值反查 `data` 得到。修复：保证值类型与字段值完全一致。

```ts
// data 中 valueKey 为数字时，绑定值也必须是数字
const selected = shallowRef<number>(2) // 传 '2' 字符串不会回显
```
