---
title: UCascade 级联选择器
description: "从 @veltra/desktop 导入的级联选择器：逐级下钻选择层级数据，单选提交从根到叶的路径值（可切换为仅叶子值），支持多选勾选、面板内关键字过滤与自定义字段。"
aliases: [Cascade, cascade, 级联选择, Cascader, 级联面板]
keywords: [modelValue, showFullPath, separator, multiple, strict, filterable, visibilityLimit, labelKey, valueKey, childrenKey, update:label, 级联选择, 逐级选择, 路径值, 多选级联, 层级数据, 省市区选择]
---

# UCascade 级联选择器

`@veltra/desktop` 导出的 `UCascade` 是级联选择器：数据按 `childrenKey` 字段构成层级，点击逐级展开面板选择，单选值默认是从根到叶的路径字符串。分工规则：数据按层级逐级分类（省市区、类目层级）、值要表达完整路径时用 `UCascade`；在树形数据里跨层级直接挑单个节点用 `UTreeSelect`，勾选多个节点用 `UMultiTreeSelect`。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UCascade } from '@veltra/desktop'

// 单选 + showFullPath 默认 true：值为路径字符串
const region = ref<string>()

const data = [
  {
    value: 'east',
    label: '华东',
    children: [
      { value: 'sh', label: '上海' },
      { value: 'hz', label: '杭州' }
    ]
  },
  {
    value: 'south',
    label: '华南',
    children: [
      { value: 'gz', label: '广州' },
      { value: 'sz', label: '深圳' }
    ]
  }
]
</script>

<template>
  <!-- 选「华东 / 杭州」后 region 为 'east/hz'，输入框显示「华东/杭州」 -->
  <UCascade v-model="region" :data="data" placeholder="请选择地区" />
</template>
```

独立使用（不在 `<u-form>` 内）走 `v-model`；放进 `<u-form>` 必须改用 `field` 绑定，写 `field` 后禁止再写 `v-model`。

## API 签名

```ts
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

/** 级联节点（组件内部由 data 构建，此处列常用字段） */
export interface CascadeNode {
  visible: boolean
  /** valueKey 字段值 */
  value: string
  /** labelKey 字段值 */
  label: string
  children?: CascadeNode[]
  parent?: CascadeNode
  data: Record<string, any>
}

/** 面板列（内部构建）：一列即一个层级 */
export interface PanelItem {
  key: number
  nodes: CascadeNode[]
}

export interface CascadeProps extends FormComponentProps {
  /** 单选选中值：showFullPath 时为路径字符串，多选时为节点值数组 */
  modelValue?: string[] | string
  /** 数据项，树形数组 */
  data?: Record<string, any>[]
  /** 标签字段名，默认 'label' */
  labelKey?: string
  /** 值字段名，默认 'value' */
  valueKey?: string
  /** 子级字段名，默认 'children' */
  childrenKey?: string
  /** 路径分隔符（提交与回显共用），默认 '/' */
  separator?: string
  /** 占位符，默认 '请选择' */
  placeholder?: string
  /** 是否可清除，默认 true */
  clearable?: boolean
  /** 严格模式：仅叶子节点可提交（有子级的节点点击只展开）。仅单选生效，默认 false */
  strict?: boolean
  /**
   * 是否展示/提交完整路径，默认 true。
   * false 时显示、modelValue、update:label 均只体现选中叶子节点（仅单选）
   */
  showFullPath?: boolean
  /** 多选，默认 false */
  multiple?: boolean
  /** 面板内搜索，默认 false */
  filterable?: boolean
  /** 多选标签数量上限，默认 3 */
  visibilityLimit?: number
}

export interface CascadeEmits {
  (e: 'update:label', label?: string | string[]): void
  (e: 'update:modelValue', value?: string | string[]): void
  /** 多选：items 为勾选节点完整数据数组（元素含 fullLabel），fullLabels 为 label 数组 */
  (
    e: 'change',
    items: (Record<string, any> & { fullLabel?: string })[],
    fullLabels?: string[]
  ): void
  /** 单选：item 为选中节点完整数据（含 fullLabel），fullLabel 为路径或叶子 label */
  (
    e: 'change',
    item: (Record<string, any> & { fullLabel?: string }) | undefined,
    fullLabel?: string
  ): void
  (e: 'clear'): void
}

/** ref 上无暴露成员（DeconstructValue 解包后的形态） */
export type CascadeExposed = {}
```

`UCascade` 不提供插槽。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `v-model` | `string \| string[]` | — | 否 | 单选见「方法与事件」的取值模式；多选时为节点值数组 |
| `data` | `Record<string, any>[]` | `[]` | 否 | 树形数组；无 `childrenKey` 字段的节点即叶子；无懒加载，必须一次性传入全部层级 |
| `labelKey` | `string` | `'label'` | 否 | 展示文案读取该字段 |
| `valueKey` | `string` | `'value'` | 否 | 路径拼接与回显映射读取该字段；取值必须为字符串且全树唯一，数值或重复值会导致回显映射失败 |
| `childrenKey` | `string` | `'children'` | 否 | 子级数组字段名 |
| `separator` | `string` | `'/'` | 否 | 路径分隔符，既是提交值分隔符也是回显拆分符 |
| `placeholder` | `string` | `'请选择'` | 否 | 无选中值时的占位文字 |
| `clearable` | `boolean` | `true` | 否 | 悬停且已有选中值时显示清除按钮 |
| `strict` | `boolean` | `false` | 否 | 仅单选：`true` 时仅叶子节点提交，非叶子点击只展开下级 |
| `showFullPath` | `boolean` | `true` | 否 | 仅单选：`false` 时显示、`modelValue`、`update:label` 均只体现叶子 |
| `multiple` | `boolean` | `false` | 否 | 多选时触发框渲染可关闭标签 |
| `filterable` | `boolean` | `false` | 否 | 面板顶部出现过滤输入框，按节点 `label` 子串匹配（忽略大小写），命中节点与其祖先保留 |
| `visibilityLimit` | `number` | `3` | 否 | 多选可见标签上限，超出折叠为 `N+`；负数按 `0` |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 组件未设置时继承 `UForm` 的 `size` |
| `label` | `string` | — | 否 | 标签文字，仅 `UForm` / `UFormItem` 内生效 |
| `field` | `string` | — | 否 | `UForm` 内必须用它绑定字段；写了 `field` 禁止再写 `v-model` |
| `rules` | `ValidateRule` | — | 否 | 校验规则，仅 `UForm` 内生效 |
| `tips` | `string` | — | 否 | 表单内提示文字，仅 `UForm` 内生效 |
| `span` | `number \| 'full' \| 响应式对象` | — | 否 | 所占列宽，仅 `UForm` 内生效 |
| `disabled` | `boolean` | `false` | 否 | 未设置时继承 `UForm` 的 `disabled` |
| `readonly` | `boolean` | `false` | 否 | 未设置时继承 `UForm`；只读时渲染为纯文本或标签列表 |

## 方法与事件

`modelValue` 的取值模式（按源码写死）：

- 单选 + `showFullPath: true`（默认）：`modelValue` 为从根到叶各节点 `valueKey` 值用 `separator` 拼接的字符串，如 `'east/hz'`；回显文案为对应 `labelKey` 值拼接。
- 单选 + `showFullPath: false`：`modelValue` 仅叶子节点的 `valueKey` 值，如 `'hz'`；回显仅显示叶子 label。
- `multiple: true`：`modelValue` 为字符串数组，每个元素是勾选节点自身的 `valueKey` 值（不含路径，与 `showFullPath` 无关）。

选择行为：点击节点展开下一级面板；单选非 `strict` 时点击任意层级节点即提交当前路径（叶子节点提交后关闭面板）；`strict` 时仅叶子节点提交。多选通过节点前 checkbox 勾选，勾选任意节点会连带勾选其全部子孙（父子始终联动，无独立开关）。

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value?: string \| string[]` | 逐级点选、勾选、删除标签、清空；单选清空为 `undefined`，多选清空为 `[]` |
| `update:label` | `label?: string \| string[]` | 选中项 label（单选按 `showFullPath` 为路径串或叶子 label；多选为 label 数组） |
| `change` | 单选 `(item?, fullLabel?)`；多选 `(items[], fullLabels?)` | 选中变化；`item` 为节点原始数据附加 `fullLabel` 字段（单选为路径 label 串，多选为该节点 label） |
| `clear` | — | 点击清除按钮 |

组件 ref 上没有可调用的暴露方法。

## 典型示例

### 省市区单选（完整路径值）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UCascade } from '@veltra/desktop'

const region = ref<string>()

const data = [
  {
    value: 'zj',
    label: '浙江',
    children: [
      { value: 'hz', label: '杭州' },
      { value: 'nb', label: '宁波' }
    ]
  },
  {
    value: 'gd',
    label: '广东',
    children: [
      { value: 'gz', label: '广州' },
      { value: 'sz', label: '深圳' }
    ]
  }
]

function handleChange(item: Record<string, any> | undefined, fullLabel?: string) {
  console.log(item, fullLabel) // => 选「杭州」时 { value: 'hz', label: '杭州', fullLabel: '浙江/杭州' } '浙江/杭州'
}
</script>

<template>
  <!-- 自定义分隔符：提交值形如 'zj > hz' -->
  <UCascade v-model="region" :data="data" separator=" > " @change="handleChange" />
</template>
```

### 仅提交叶子值 + 严格模式

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UCascade } from '@veltra/desktop'

// showFullPath=false：modelValue 只有叶子 value，如 'hz'
const leaf = ref<string>()

const data = [
  {
    value: 'zj',
    label: '浙江',
    children: [
      { value: 'hz', label: '杭州' },
      { value: 'nb', label: '宁波' }
    ]
  }
]
</script>

<template>
  <!-- strict 下点击「浙江」只展开不提交，必须选到叶子 -->
  <UCascade v-model="leaf" :data="data" :show-full-path="false" strict />
</template>
```

### UForm 内多选 + 过滤 + 必填校验

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UCascade, UForm } from '@veltra/desktop'

// 多选值为节点值数组，如 ['hz', 'gz']
const form = reactive({ cities: [] as string[] })

const data = [
  {
    value: 'zj',
    label: '浙江',
    children: [
      { value: 'hz', label: '杭州' },
      { value: 'nb', label: '宁波' }
    ]
  },
  {
    value: 'gd',
    label: '广东',
    children: [
      { value: 'gz', label: '广州' },
      { value: 'sz', label: '深圳' }
    ]
  }
]
</script>

<template>
  <!-- 表单内用 field 接管绑定与校验，禁止再写 v-model -->
  <UForm :model="form">
    <UCascade
      label="意向城市"
      field="cities"
      :data="data"
      multiple
      filterable
      :rules="{ required: '请选择至少一个城市' }"
    />
  </UForm>
</template>
```

## 注意事项

> [!WARNING]
> - 在 `<u-form>` 内必须用 `field` 绑定字段，禁止再写 `v-model`。
> - 单选 `modelValue` 默认是路径字符串 `'east/hz'`，不是叶子值，也不是 Ant Design Cascader 的 `['east', 'hz']` 数组；要叶子值设 `:show-full-path="false"`。
> - 多选 `modelValue` 是节点值数组，每个元素不含路径；父子勾选始终联动（勾选父级必带全部子孙），没有独立勾选开关。
> - `strict` 仅单选生效；`showFullPath` 仅单选生效。
> - `valueKey` 字段值必须为字符串且全树唯一：回显靠「值 → 节点」映射，数值类型或重复值会映射失败。
> - 没有懒加载：`data` 必须一次性传入全部层级，本库不存在 `load` / `lazy` 属性。
> - `UCascade` 不提供插槽；选中项文案由 `data` 推导，需要同步到父级时监听 `update:label`（`CascadeProps` 上没有 `label` 属性）。

## 常见问题

### 设置了 `modelValue` 但输入框显示原始值或空白

原因：路径拆分后与 `data` 中 `valueKey` 字段值对不上——常见于 `separator` 与提交时不一致，或值不是字符串。修复：保证回显值的分隔符与 `separator` 一致、每段等于节点 `value` 字段值。

```ts
// separator 默认 '/'，回显值也必须用 '/' 拼接
const region = ref<string>('zj/hz') // 'zj｜hz'、'zj-hz' 都无法回显
```
