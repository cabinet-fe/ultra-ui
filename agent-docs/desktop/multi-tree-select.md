---
title: UMultiTreeSelect 多选树选择器
description: "从 @veltra/desktop 导入的树形多选下拉选择器：面板内嵌勾选树，绑定勾选节点值数组，支持父子级联勾选或严格独立勾选、面板内全选、标签数量上限与关键字过滤。"
aliases: [MultiTreeSelect, multi-tree-select, 多选树形选择器, 树形多选]
keywords: [modelValue, checkStrictly, checkOnClickNode, visibilityLimit, disabledNode, filterable, clearable, expandAll, childrenKey, field, 全选, 级联勾选, 严格勾选, 标签折叠, 树形数据, 多选树]
---

# UMultiTreeSelect 多选树选择器

`@veltra/desktop` 导出的 `UMultiTreeSelect` 是树形多选下拉选择器：`modelValue` 为勾选节点的 `valueKey` 字段值数组，面板内提供全选与展开/收起全部按钮，已选项以可关闭标签回显。分工规则：从树形数据里一次勾选多个节点（值只是节点值集合、无路径概念）用 `UMultiTreeSelect`；单选一个节点用 `UTreeSelect`；要沿层级路径逐级选择且值保留路径时用 `UCascade`。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UMultiTreeSelect } from '@veltra/desktop'

// 勾选节点的 valueKey 字段值数组；默认勾选「中国」「英国」
const selected = ref<(string | number)[]>(['cn', 'uk'])

const data = [
  {
    label: '亚洲',
    value: 'asia',
    children: [
      { label: '中国', value: 'cn' },
      { label: '日本', value: 'jp' }
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
  <UMultiTreeSelect v-model="selected" :data="data" />
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

/** 树形多选属性；TreeProps 中仅 selected / checked / selectable / checkable 被移除（组件本身即勾选多选） */
export interface MultiTreeSelectProps extends FormComponentProps {
  /** 勾选节点的值数组 */
  modelValue?: (string | number)[]
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
  /** 返回 true 的节点不可勾选；node 为构建后的树节点，可访问 node.children / node.isLeaf */
  disabledNode?: (item: Record<string, any>, node: TreeNode) => boolean
  /**
   * 严格勾选：true 时父子勾选互不关联。
   * 默认 false：勾选父级级联勾选全部未禁用子孙，子级全选时父级自动勾选
   */
  checkStrictly?: boolean
  /** 点击节点文本是否触发勾选；false 时仅点击 checkbox 勾选。默认 true */
  checkOnClickNode?: boolean
  /** 占位文字，默认 '请选择' */
  placeholder?: string
  /** 是否可清空，默认 true */
  clearable?: boolean
  /** 是否可搜索，默认 false */
  filterable?: boolean
  /** 触发框内可见标签数量上限，默认 3 */
  visibilityLimit?: number
  /** 面板最小宽度，默认 '280px' */
  minWidth?: string
  /** 面板宽度，默认跟随触发元素宽度 */
  width?: string
  /** 面板容器样式 */
  contentStyle?: CSSProperties | string
  /** 面板容器类名 */
  contentClass?: unknown
}

export interface MultiTreeSelectEmits {
  (e: 'clear'): void
  (e: 'update:modelValue', value: any[]): void
  /** 勾选节点完整数据对象数组 */
  (e: 'change', checked: Record<string, any>[]): void
}

/** ref 上无暴露成员（DeconstructValue 解包后的形态） */
export type MultiTreeSelectExposed = {}
```

插槽：`default`（作用域 `{ node: TreeNode; data: Record<string, any> }`，自定义树节点内容）。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `v-model` | `(string \| number)[]` | `[]` | 否 | 每个元素必须等于 `data` 中某节点的 `valueKey` 字段值；匹配不到的值在回显时被忽略 |
| `data` | `Record<string, any>[]` | `[]` | 否 | 树形数组；无懒加载，必须一次性传入全部层级 |
| `labelKey` | `string` | `'label'` | 否 | 标签文案读取该字段 |
| `valueKey` | `string` | `'value'` | 否 | 值比对与提交读取该字段 |
| `childrenKey` | `string` | `'children'` | 否 | 子级数组字段名 |
| `expandAll` | `boolean` | `false` | 否 | 初始展开全部节点；面板内有「展开全部 / 收起全部」按钮 |
| `expandOnClickNode` | `boolean` | `false` | 否 | 点击节点文本是否展开/收缩 |
| `disabledNode` | `(item, node) => boolean` | — | 否 | 返回 `true` 的节点不可勾选 |
| `checkStrictly` | `boolean` | `false` | 否 | 父子勾选策略，见「方法与事件」 |
| `checkOnClickNode` | `boolean` | `true` | 否 | 点击节点文本即切换勾选；`false` 时仅点击 checkbox |
| `placeholder` | `string` | `'请选择'` | 否 | 无选中值时的占位文字 |
| `clearable` | `boolean` | `true` | 否 | 悬停且已有勾选时显示清除按钮；清空后值为 `[]` |
| `filterable` | `boolean` | `false` | 否 | 开启后标签区出现输入框，按节点 `label` 做子串匹配（区分大小写），命中节点的祖先自动展开 |
| `visibilityLimit` | `number` | `3` | 否 | 可见标签上限，超出折叠为 `+N`；负数按 `0`；禁用/只读时显示全部 |
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
| `disabled` | `boolean` | `false` | 否 | 未设置时继承 `UForm`；禁用时标签不可关闭 |
| `readonly` | `boolean` | `false` | 否 | 未设置时继承 `UForm`；只读时仅展示已选标签，无下拉 |

## 方法与事件

父子联动（勾选策略）由 `checkStrictly` 控制：

- `checkStrictly: false`（默认）：勾选父级会把其全部未禁用子孙一并写入 `modelValue`；某父级的子级全部勾选时该父级自动勾选；取消勾选级联取消子孙，并取消父级勾选。
- `checkStrictly: true`：每个节点独立勾选，勾选父级不会带出子孙的值。

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value: any[]` | 勾选、取消勾选、删除标签、清空 |
| `change` | `checked: Record<string, any>[]` | 勾选、取消勾选、删除标签；payload 为勾选节点的完整数据对象数组 |
| `clear` | — | 点击清除按钮；清空只触发 `clear`，不触发 `change` |

组件 ref 上没有可调用的暴露方法。

## 典型示例

### 级联勾选 + 过滤 + 禁用节点

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UMultiTreeSelect } from '@veltra/desktop'

// 勾选「亚洲」后 selected 为 ['asia', 'cn', 'jp']（含全部子孙）
const selected = ref<(string | number)[]>([])

const data = [
  {
    label: '亚洲',
    value: 'asia',
    children: [
      { label: '中国', value: 'cn' },
      { label: '日本', value: 'jp' }
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

function disabledNode(item: Record<string, any>) {
  return item.value === 'jp'
}

function handleChange(checked: Record<string, any>[]) {
  console.log(checked.map((item) => item.label)) // => 已勾选节点的 label 数组
}
</script>

<template>
  <UMultiTreeSelect
    v-model="selected"
    :data="data"
    :disabled-node="disabledNode"
    filterable
    clearable
    @change="handleChange"
  />
</template>
```

### 严格独立勾选 + 标签上限

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UMultiTreeSelect } from '@veltra/desktop'

// check-strictly 下勾选「亚洲」只写入 ['asia']，不包含子孙
const selected = ref<(string | number)[]>([])

const data = [
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
  <!-- 最多显示 5 个标签，超出折叠为 +N -->
  <UMultiTreeSelect
    v-model="selected"
    :data="data"
    check-strictly
    :visibility-limit="5"
    expand-all
  />
</template>
```

### UForm 内 field 绑定与必填校验

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, UMultiTreeSelect } from '@veltra/desktop'

const form = reactive({ depts: [] as (string | number)[] })

const data = [
  {
    name: '研发中心',
    id: 'rd',
    children: [
      { name: '前端组', id: 'fe' },
      { name: '后端组', id: 'be' }
    ]
  }
]
</script>

<template>
  <!-- 表单内用 field 接管绑定与校验，禁止再写 v-model -->
  <UForm :model="form">
    <UMultiTreeSelect
      label="负责部门"
      field="depts"
      :data="data"
      label-key="name"
      value-key="id"
      :rules="{ required: '请选择至少一个部门' }"
    />
  </UForm>
</template>
```

## 注意事项

> [!WARNING]
> - 在 `<u-form>` 内必须用 `field` 绑定字段，禁止再写 `v-model`。
> - `v-model` 的值是节点 `valueKey` 字段值数组，不是节点对象数组；要拿完整对象监听 `change`。
> - 默认父子联动：勾选父级会把全部子孙值一并写入 `modelValue`；只要父级本身、不要子孙时必须设 `check-strictly` 并自行处理提交值。
> - 公开类型不含 `checkable` / `selectable`（已从继承中移除）：本组件本身即勾选多选，传这两个属性无效。
> - 清空按钮只触发 `clear`，不触发 `change`；清空后 `modelValue` 为 `[]`。
> - 没有懒加载：`data` 必须一次性传入全部层级，本库不存在 `load` / `lazy` 属性。
> - 标签折叠是本组件内置的 `+N`（由 `visibilityLimit` 控制），不是其他组件库的 `collapse-tags` 属性。

## 常见问题

### 回显时部分值不显示标签

原因：`modelValue` 里存在 `data` 中匹配不到的值（`valueKey` 字段值对不上），回显时这类值被直接忽略。修复：保证数组每个元素与 `data` 中对应字段值完全相等。

```ts
// data 的 valueKey 为字符串 'cn' 时，绑定 ['CN'] 或 [1] 都不会回显
const selected = ref<(string | number)[]>(['cn'])
```
