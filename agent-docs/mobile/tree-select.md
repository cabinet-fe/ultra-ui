---
title: UTreeSelect 树选择器（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端单选树选择器：点击触发器弹出底部面板，树形行内展开/收起逐级下钻，单选一个节点落值并收起；data 支持静态树或远程搜索函数（强制开启搜索、200ms 防抖、竞态守卫），支持节点禁用判定、展开策略与 text 兜底回显。'
aliases: [TreeSelect, tree-select, 树选择, 树形下拉, 移动端树选择, el-tree-select]
keywords:
  [
    UTreeSelect,
    TreeSelectProps,
    TreeSelectEmits,
    modelValue,
    data,
    disabledNode,
    expandAll,
    valueKey,
    labelKey,
    childrenKey,
    update:text,
    filterable,
    clearable,
    树选择,
    层级选择,
    远程搜索,
    节点禁用,
    底部面板,
    兜底文案,
    单选树
  ]
---

# UTreeSelect 树选择器（@veltra/mobile 移动端）

`@veltra/mobile` 导出移动端单选树选择器 `UTreeSelect`（`TreeSelectProps` / `TreeSelectEmits` 类型同包导出）。点击触发器弹出**底部面板**，面板内按树形行渲染：父行前有展开/收起箭头按钮，点击行选中该节点并收起面板（禁用节点除外）；仅单选，`v-model` 绑定选中节点 `valueKey` 字段的值。`data` 接收静态树数组或远程搜索函数（传函数时 `filterable` 被强制启用）。分工规则：在树形数据里跨层级直接挑单个节点用 `UTreeSelect`；数据按层级逐级分类、值要表达完整路径时用 `UCascade`。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UTreeSelect } from '@veltra/mobile'

// v-model 绑定选中节点 valueKey 字段的值
const orgId = ref<string | number>()

const orgTree = [
  {
    value: 'hq',
    label: '总部',
    children: [
      { value: 'rd', label: '研发部' },
      { value: 'fin', label: '财务部' }
    ]
  },
  { value: 'sh-branch', label: '上海分部' }
]
</script>

<template>
  <UTreeSelect v-model="orgId" :data="orgTree" placeholder="选择部门" />
  <!-- 点击触发器弹面板，展开总部后点研发部：orgId => 'rd'，触发器展示「研发部」 -->
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件按需样式引入路径为 `@veltra/mobile/components/tree-select/style`。

## API 签名

```ts
// 以下类型从 '@veltra/mobile' 导出；FormComponentProps 来自 @veltra/utils（未再导出，此处展开）
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

export interface ValidateRule {
  /** 是否必填。`true` 或校验失败提示文本 */
  required?: boolean | string
  /** 长度 */
  length?: number | [number, string]
  /** 最小值 */
  min?: number | [number, string]
  /** 最大值 */
  max?: number | [number, string]
  /** 最小长度 */
  minLen?: number | [number, string]
  /** 最大长度 */
  maxLen?: number | [number, string]
  /** 匹配 */
  match?: RegExp | [RegExp, string] | string
  /** 预设规则 */
  preset?: PresetRule
  /** 自定义校验：返回错误文本表示失败 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 树形选择器属性（TreeSelectProps 继承的 FormComponentProps 已展开） */
export interface TreeSelectProps {
  /** 绑定值：选中节点 valueKey 字段的值；清除后为 undefined */
  modelValue?: string | number
  /**
   * 树数据
   * 数组为静态树，按 childrenKey 字段构成层级；
   * 传函数时 filterable 被强制启用：初始以空串 '' 调用一次（加载默认树），输入变化按查询词返回匹配的树
   */
  data?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  /** 值字段名。默认 'value' */
  valueKey?: string
  /** 展示字段名。默认 'label' */
  labelKey?: string
  /** 子级字段名。默认 'children' */
  childrenKey?: string
  /**
   * 节点禁用判定
   * 传字段名时按节点数据该字段真值禁用（如 'lockFlag' 非 0 时禁用）；
   * 传函数时由调用方自定义：返回真值禁用该节点。禁用节点不可选中，仍可展开查看子级
   */
  disabledNode?: string | ((data: Record<string, any>) => boolean)
  /** 兜底展示文案：modelValue 未命中树节点时展示（如回显数据已不在选项中），命中时展示节点 label */
  text?: string
  /** 占位文案；同时作为面板标题。默认 '请选择' */
  placeholder?: string
  /** 是否可清除。默认 true */
  clearable?: boolean
  /** 是否启用搜索。默认 false；data 为函数时强制启用 */
  filterable?: boolean
  /** 面板展开时默认展开全部节点；false 时仅展开选中节点的祖先链。默认 false */
  expandAll?: boolean
  /** 底部面板内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 底部面板内容容器类名 */
  contentClass?: unknown
  /** 组件尺寸。默认 'default' */
  size?: ComponentSize
  /** UForm 内的提示文字；移动端 UForm 不渲染该提示 */
  tips?: string
  /** 所占列数；移动端 UForm 单列呈现，该属性不生效 */
  span?:
    | number
    | 'full'
    | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字，仅 UForm 内生效 */
  label?: string
  /** UForm 内绑定的 model 字段。设置后禁止再写 v-model */
  field?: string
  /** 是否禁用。默认 false */
  disabled?: boolean
  /** 是否只读（渲染为纯文本，不渲染触发器与面板）。默认 false */
  readonly?: boolean
  /** 校验规则，仅 UForm 内生效 */
  rules?: ValidateRule
}

export interface TreeSelectEmits {
  (e: 'update:modelValue', value?: string | number): void
  /**
   * 选中项文案变化（用于同步父级冗余字段）
   * 命中节点时发出 label，清空时发出 undefined；未命中节点时，
   * 传了 text 兜底则不发出（父级文案已是事实来源），未传 text 时发出 undefined；readonly 下不发出
   */
  (e: 'update:text', text?: string): void
  (e: 'change', node?: Record<string, any>): void
  (e: 'clear'): void
}
```

组件 ref 上没有可调用的暴露方法；唯一插槽是 `prefix`（触发器前缀内容）。

## 参数说明

| 参数           | 类型                                                                                                  | 默认        | 必填 | 约束                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------- | ----------- | :--: | ------------------------------------------------------------------------------------------------------------------- |
| `modelValue`   | `string \| number`                                                                                    | —           |  否  | 选中节点 `valueKey` 字段的值；回显按字符串化对比，`'1'` 能命中 `1`；选中落值时写入节点原值类型                     |
| `data`         | `Record<string, any>[] \| ((qs: string) => Promise<Record<string, any>[]> \| Record<string, any>[])`  | `[]`        |  否  | 数组为静态树；传函数强制开启搜索、初始以空串调用一次、输入 200ms 防抖调用，函数必须能处理空串                      |
| `valueKey`     | `string`                                                                                              | `'value'`   |  否  | 绑定值字段名，支持 `a.b` 链式取值                                                                                   |
| `labelKey`     | `string`                                                                                              | `'label'`   |  否  | 展示字段名；搜索仅按该字段 `includes` 匹配                                                                          |
| `childrenKey`  | `string`                                                                                              | `'children'`|  否  | 子级字段名                                                                                                          |
| `disabledNode` | `string \| ((data: Record<string, any>) => boolean)`                                                  | —           |  否  | 字段名按节点数据真值禁用，函数返回真值禁用；禁用节点不可选中、仍可展开                                              |
| `text`         | `string`                                                                                              | —           |  否  | `modelValue` 未命中树节点时的兜底文案（如回显数据对应节点已删除）；命中时展示节点 label                             |
| `placeholder`  | `string`                                                                                              | `'请选择'`  |  否  | 触发器占位文案；同时作为面板标题                                                                                    |
| `clearable`    | `boolean`                                                                                             | `true`      |  否  | 有展示文案且非禁用时触发器常显清除按钮（替代箭头）                                                                  |
| `filterable`   | `boolean`                                                                                             | `false`     |  否  | 面板顶部搜索框，展开时自动聚焦；静态树为本地过滤，函数为远程搜索（200ms 防抖 + 过期响应丢弃）                       |
| `expandAll`    | `boolean`                                                                                             | `false`     |  否  | `true` 面板展开时展开全部含子级节点；`false` 仅展开选中节点的祖先链（含选中节点自身）                               |
| `contentStyle` | `CSSProperties \| string`                                                                             | —           |  否  | 底部面板内容容器样式                                                                                                |
| `contentClass` | `unknown`                                                                                             | —           |  否  | 底部面板内容容器类名                                                                                                |
| `size`         | `ComponentSize`                                                                                       | `'default'` |  否  | `'small' \| 'default' \| 'large'`；UForm 上设置的值兜底，组件 prop 优先                                             |
| `tips`         | `string`                                                                                              | —           |  否  | 仅 UForm（或 UFormItem）内生效；移动端不渲染悬浮提示                                                                |
| `span`         | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }`                                            | —           |  否  | 仅 UForm 内生效；移动端单列呈现，不生效                                                                             |
| `label`        | `string`                                                                                              | —           |  否  | 仅 UForm 内生效，生成 UFormItem 标签                                                                                |
| `field`        | `string`                                                                                              | —           |  否  | UForm 按该路径读写 `model`；设置后禁止再写 `v-model`                                                                |
| `disabled`     | `boolean`                                                                                             | `false`     |  否  | 禁用交互（不弹面板、不可清除）                                                                                      |
| `readonly`     | `boolean`                                                                                             | `false`     |  否  | 渲染为纯文本，不渲染触发器与面板；无值显示 `-`                                                                      |
| `rules`        | `ValidateRule`                                                                                        | —           |  否  | 仅 UForm 内生效；枚举见 API 签名                                                                                    |

## 方法与事件

- `update:modelValue` — payload 为选中节点 `valueKey` 字段的原值（`string | number`）；清除时为 `undefined`。`v-model` 即绑定此事件。
- `change` — payload `(node?: Record<string, any>)`：用户选择时为**整个节点原始数据对象**，清除时为 `undefined`。仅用户操作触发；在 `UFormItem` 内会冒泡为 Item 的 `change`。
- `update:text` — payload `(text?: string)`：选中项展示文案，可直接 `v-model:text` 绑定冗余字段。触发时机与取值：用户选择、`modelValue` 回显命中、远程搜索树到达后完成回显时发出节点 label；清空时发出 `undefined`；未命中节点时传了 `text` 兜底则**不发出**（父级文案即事实来源），未传 `text` 时发出 `undefined`；`readonly` 下一律不发出。
- `clear` — 点击清除按钮。
- 面板交互：点击触发器弹出底部面板；每次展开重新初始化展开状态；点击行选中并收起面板（禁用节点忽略），点击行首箭头只展开/收起该节点；点击遮罩直接收起面板（不改动已选值）。
- 远程搜索：请求期间面板显示「加载中...」；组件内置序号守卫，慢的旧响应不覆盖新查询结果。
- ref：无暴露成员。

## 典型示例

### 远程搜索树

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UTreeSelect } from '@veltra/mobile'

const deviceId = ref<string | number>()

// data 传函数即远程搜索：filterable 自动开启，200ms 防抖，初始以空串调用一次
async function searchDevices(qs: string) {
  const res = await fetch(`/api/devices/tree?q=${encodeURIComponent(qs)}`)
  return (await res.json()) as { value: number; label: string; children: { value: number; label: string }[] }[]
}
</script>

<template>
  <UTreeSelect v-model="deviceId" :data="searchDevices" value-key="value" label-key="label" placeholder="搜索设备" />
</template>
```

### 节点禁用（字段名与函数两种判定）

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UTreeSelect } from '@veltra/mobile'

const regionId = ref<string | number>()

const regions = [
  {
    value: 'east',
    label: '华东',
    lockFlag: 0,
    children: [
      { value: 'sh', label: '上海', lockFlag: 0 },
      { value: 'hz', label: '杭州', lockFlag: 1 } // lockFlag 非 0：该行禁用
    ]
  }
]

// 函数判定：返回真值禁用（与字段名二选一）
function disableRoot(data: Record<string, any>) {
  return data.value === 'east'
}
</script>

<template>
  <!-- 字段名判定：lockFlag 真值禁用；禁用行置灰不可选中，展开按钮仍可用 -->
  <UTreeSelect v-model="regionId" :data="regions" disabled-node="lockFlag" />
  <!-- 函数判定写法：:disabled-node="disableRoot" -->
</template>
```

### 展开策略与冗余文案同步

```vue
<script setup lang="ts">
import { reactive } from 'vue'

import { UTreeSelect } from '@veltra/mobile'

// 编辑回显：后端存 id 与冗余名称；id 不在树中时展示 text 兜底
const form = reactive({ deptId: 'd-legacy' as string | number, deptName: '原事业部（已撤销）' })

const deptTree = [
  {
    value: 'd-1',
    label: '研发中心',
    children: [
      { value: 'd-11', label: '前端组' },
      { value: 'd-12', label: '后端组' }
    ]
  }
]
</script>

<template>
  <!-- expandAll：面板展开即全展开，省去逐级点开；选中/回显命中后 update:text 同步冗余字段 -->
  <UTreeSelect
    v-model="form.deptId"
    v-model:text="form.deptName"
    :data="deptTree"
    expand-all
    placeholder="选择部门"
  />
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是点击触发器弹出**底部面板 + 树形行展开**；桌面端是下拉树面板，两者属性同名同默认值，例外：桌面端 `disabledNode` 只支持函数 `(item, node) => boolean`（第二参数是树节点对象），移动端还支持字段名字符串（按节点数据该字段真值判定）；桌面端另有 `minWidth`（默认 `'280px'`）/ `width` 弹层宽度属性，移动端底部面板为全宽面板，无这两个属性。
> - 移动端清除按钮在有展示文案且 `clearable` 时**常显**（无 hover 概念）；展开/收起必须点行首箭头按钮，点行是选中。
> - 仅单选：没有 `multiple` 属性；需要多选树时本组件不提供。
> - `data` 传函数时 `filterable` 被强制开启，初始以空串 `''` 调用一次，函数必须能处理空串（返回默认树或空数组）。
> - 回显按字符串化对比：`modelValue` 为 `'1'` 能命中 value 为数字 `1` 的节点；但 `update:modelValue` 落值是节点原值类型，`v-model` 初值类型必须与 `valueKey` 字段一致。
> - `modelValue` 未命中树节点时展示 `text` 兜底文案；同步冗余文案用 `v-model:text`（或 `@update:text`）。未命中且传了 `text` 时组件不发送该事件，未传 `text` 时发出 `undefined`；`readonly` 下一律不发送。
> - 面板每次展开重新初始化展开状态：`expandAll: false`（默认）只展开选中节点的祖先链，收起再开不会保留手动展开的节点。
> - `disabledNode` 禁用的节点不可选中但可展开查看子级；`disabled` 与 `readonly` 是组件级状态，与节点禁用互不影响。
> - 本地搜索只匹配 `labelKey` 字段的 `includes`，不匹配 `valueKey` 与其他字段；搜索结果行主标题为 label、副标题为祖先路径（固定 `/` 连接，不受 `separator` 影响，本组件无 `separator` 属性）。
> - 在 UForm 中必须用 `field` 绑定，禁止再写 `v-model`；`label` / `rules` / `span` / `tips` 仅在 UForm（或 UFormItem）内生效，且移动端 `span` 与 `tips` 不产生布局与提示效果。
> - 触发器密度走 `--um-*` 移动端 token：触发器高度按 `--um-control-height-*` 且整行热区以 `--um-touch-target`（44px）保底；面板内搜索输入框字号为 `--um-font-size-main`（16px），iOS Safari 聚焦不触发页面缩放。
> - 底部面板展开期间锁定页面滚动，关闭后恢复原滚动位置；空数据面板内显示「暂无数据」。

## 常见问题

### 回显显示原始值而不是节点 label

两种原因：

1. 树数据尚未到达（`data` 为函数时首屏未返回），`modelValue` 无节点可命中。修复：数据到达后组件自动回显，或传 `text` 兜底。
2. 回显数据对应节点已删除（如数据权限收窄后回显旧单据）。修复：传 `text` 兜底文案。

```vue
<script setup lang="ts">
import { reactive } from 'vue'

import { UTreeSelect } from '@veltra/mobile'

// 节点已不在树中：传冗余文案兜底（模板上 :text="form.deptName"）
const form = reactive({ deptId: 'd-legacy', deptName: '原事业部（已撤销）' })
const deptTree = [{ value: 'd-1', label: '研发中心', children: [] }]
</script>

<template>
  <UTreeSelect v-model="form.deptId" v-model:text="form.deptName" :data="deptTree" />
</template>
```

### 传了 `data` 函数后面板里多出搜索框

`data` 为函数时 `filterable` 被强制启用，属预期行为：搜索词经 200ms 防抖传给函数，组件不提供关闭手段。

### 在 UForm 中同时写了 `field` 和 `v-model`

状态由 `field` 接管后 `v-model` 是重复绑定，两者会竞争写入。修复：删除 `v-model`，只保留 `field`。
