---
title: UCascade 级联选择器（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端级联选择器：点击触发器弹出底部面板，面包屑 Tab 逐级下钻层级数据，单选提交从根到叶的路径值（可切为仅叶子值），多选经面板内勾选暂存、确定后落值数组；支持面板内搜索、多选标签触发器（超出折叠 +N）与 text 兜底回显。'
aliases: [Cascade, cascade, 级联选择, 移动端级联, Cascader, el-cascader]
keywords:
  [
    UCascade,
    CascadeProps,
    CascadeEmits,
    CascadeNode,
    modelValue,
    showFullPath,
    separator,
    multiple,
    strict,
    filterable,
    visibilityLimit,
    labelKey,
    valueKey,
    childrenKey,
    update:label,
    级联选择,
    逐级选择,
    路径值,
    多选级联,
    省市区选择
  ]
---

# UCascade 级联选择器（@veltra/mobile 移动端）

`@veltra/mobile` 导出移动端级联选择器 `UCascade`（`CascadeProps` / `CascadeEmits` / `CascadeNode` 类型同包导出）。点击触发器弹出**底部面板**，面板顶部是面包屑 Tab（首枚 Tab 文案为 `placeholder`，其余为已选路径各级 label），逐级点击下钻；数据按 `childrenKey` 字段构成层级，`labelKey` / `valueKey` 指定展示与绑定字段。单选选中即落值收起面板；多选在面板内勾选暂存，点「确定」落值。属性与 `@veltra/desktop` 的 `UCascade` 同名同默认值，移动端另多出 `contentStyle` / `contentClass` 两个面板容器属性（桌面端 `CascadeProps` 没有这两个）；差异在交互形态：移动端弹底部面板、面包屑导航替代多列联动面板。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UCascade } from '@veltra/mobile'

// 单选 + showFullPath 默认 true：值为从根到叶 value 用 separator 拼接的路径串
const region = ref<string>()

const regions = [
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
  <UCascade v-model="region" :data="regions" placeholder="选择地区" />
  <!-- 逐级点 华东 → 杭州 后收起面板：region => 'east/hz'，触发器展示「华东/杭州」 -->
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件按需样式引入路径为 `@veltra/mobile/components/cascade/style`。

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

/** 级联数据节点的类型描述（组件内部自建节点树，外部仅用于给数据标注类型） */
export interface CascadeNode<Data extends Record<string, any> = Record<string, any>> {
  visible: boolean
  value: string
  label: string
  /* 继承 TreeNode：children 为子节点数组，此处省略泛型链 */
}

/** 级联选择器属性（CascadeProps 继承的 FormComponentProps 已展开） */
export interface CascadeProps {
  /** 绑定值：单选为 string（路径串或叶子 value），多选为 string[]；清除后单选 undefined、多选 [] */
  modelValue?: string[] | string
  /** 树数据，按 childrenKey 字段构成层级。默认 [] */
  data?: Record<string, any>[]
  /** 路径分隔符，用于 modelValue 路径串与回显文案。默认 '/' */
  separator?: string
  /** 数据展示字段名。默认 'label' */
  labelKey?: string
  /** 数据绑定值字段名。默认 'value' */
  valueKey?: string
  /** 子级字段名。默认 'children' */
  childrenKey?: string
  /** 兜底展示文案：单选回显未命中数据时展示（如路径已不在选项中），命中时展示 label 路径 */
  text?: string
  /** 占位文案；同时作为面板标题与面包屑首枚 Tab 文案。默认 '请选择' */
  placeholder?: string
  /** 是否可清除。默认 true */
  clearable?: boolean
  /** 严格模式：仅叶子节点提交，非叶子点击只展开下级。默认 false */
  strict?: boolean
  /**
   * 是否展示/提交完整路径。默认 true
   * false 时单选的展示文案、modelValue、update:label 均只体现选中叶子节点；对多选无效
   */
  showFullPath?: boolean
  /** 多选。默认 false */
  multiple?: boolean
  /** 面板内搜索。默认 false */
  filterable?: boolean
  /** 触发器上最多展示的标签数，超出折叠为 +N。默认 3 */
  visibilityLimit?: number
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

export interface CascadeEmits {
  (e: 'update:label', label?: string | string[]): void
  (e: 'update:modelValue', value?: string | string[]): void
  (e: 'change', items: (Record<string, any> & { fullLabel?: string })[], fullLabels?: string[]): void
  (e: 'change', item: (Record<string, any> & { fullLabel?: string }) | undefined, fullLabel?: string): void
  (e: 'clear'): void
}
```

组件 ref 上没有可调用的暴露方法；无插槽。

## 参数说明

| 参数               | 类型                                  | 默认        | 必填 | 约束                                                                                                                     |
| ------------------ | ------------------------------------- | ----------- | :--: | ------------------------------------------------------------------------------------------------------------------------ |
| `modelValue`       | `string[] \| string`                  | —           |  否  | 单选：`showFullPath` 时为 `separator` 拼接的路径串（如 `'east/hz'`），否则为叶子 value；多选：勾选节点 value 的数组，无路径拼接 |
| `data`             | `Record<string, any>[]`               | `[]`        |  否  | 按 `childrenKey` 构成层级；value 字段值必须非空且唯一，回显与提交都按 value 匹配                                          |
| `separator`        | `string`                              | `'/'`       |  否  | 仅单选路径模式生效：拆分回显路径、拼接提交值与展示文案                                                                   |
| `labelKey`         | `string`                              | `'label'`   |  否  | 展示字段名                                                                                                               |
| `valueKey`         | `string`                              | `'value'`   |  否  | 绑定值字段名                                                                                                             |
| `childrenKey`      | `string`                              | `'children'`|  否  | 子级字段名                                                                                                               |
| `text`             | `string`                              | —           |  否  | 单选回显未命中（路径末级 value 不在数据中）时的兜底文案；未传时展示原始 `modelValue`                                     |
| `placeholder`      | `string`                              | `'请选择'`  |  否  | 触发器占位文案；同时作为面板标题与面包屑首枚 Tab 文案                                                                    |
| `clearable`        | `boolean`                             | `true`      |  否  | 有值且非禁用时触发器常显清除按钮（替代箭头）                                                                             |
| `strict`           | `boolean`                             | `false`     |  否  | `true` 时点击非叶子只展开不提交；`false` 时点击非叶子立即提交当前路径并继续展开                                          |
| `showFullPath`     | `boolean`                             | `true`      |  否  | 仅单选生效；`false` 时展示、`modelValue`、`update:label` 均只含选中叶子                                                  |
| `multiple`         | `boolean`                             | `false`     |  否  | 多选：面板头部出现取消/确定，勾选暂存、确定落值                                                                          |
| `filterable`       | `boolean`                             | `false`     |  否  | 面板顶部出现搜索框，展开时自动聚焦，按 `labelKey` 字段 `includes` 忽略大小写过滤                                         |
| `visibilityLimit`  | `number`                              | `3`         |  否  | 多选触发器标签上限；禁用/只读时展示全部；宽度不足时自动收缩到标签完整可读（最少 1 个），其余计入 +N                      |
| `contentStyle`     | `CSSProperties \| string`             | —           |  否  | 底部面板内容容器样式                                                                                                     |
| `contentClass`     | `unknown`                             | —           |  否  | 底部面板内容容器类名                                                                                                     |
| `size`             | `ComponentSize`                       | `'default'` |  否  | `'small' \| 'default' \| 'large'`；UForm 上设置的值兜底，组件 prop 优先                                                  |
| `tips`             | `string`                              | —           |  否  | 仅 UForm（或 UFormItem）内生效；移动端不渲染悬浮提示                                                                     |
| `span`             | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | — | 否 | 仅 UForm 内生效；移动端单列呈现，不生效                                                                                  |
| `label`            | `string`                              | —           |  否  | 仅 UForm 内生效，生成 UFormItem 标签                                                                                     |
| `field`            | `string`                              | —           |  否  | UForm 按该路径读写 `model`；设置后禁止再写 `v-model`                                                                     |
| `disabled`         | `boolean`                             | `false`     |  否  | 禁用交互：不弹面板、不可清除、多选标签不显示移除按钮                                                                     |
| `readonly`         | `boolean`                             | `false`     |  否  | 渲染为纯文本：单选展示回显文案、多选展示全部标签；无值显示 `-`                                                          |
| `rules`            | `ValidateRule`                        | —           |  否  | 仅 UForm 内生效；枚举见 API 签名                                                                                         |

## 方法与事件

`modelValue` 取值模式（单选/多选行为不同）：

- 单选 + `showFullPath: true`（默认）：`modelValue` 为从根到叶各节点 `valueKey` 值用 `separator` 拼接的字符串（如 `'east/hz'`）；回显拆路径逐级查 label，末级未命中视为整条路径无效，展示 `text` 兜底。
- 单选 + `showFullPath: false`：`modelValue` 仅叶子节点 value（如 `'hz'`）；回显只显示叶子 label。
- `multiple: true`：`modelValue` 为 string[]，每个元素是勾选节点自身的 value（不含路径，与 `showFullPath` 无关）。

| 事件                | payload                                                   | 触发时机                                                                                        |
| ------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `update:modelValue` | `value?: string \| string[]`                              | 逐级点选、多选确定、删标签、清空；单选清空为 `undefined`，多选清空为 `[]`                       |
| `update:label`      | `label?: string \| string[]`                              | 选中项文案：单选为路径 label 串（`showFullPath: false` 时仅叶子 label），多选为 label 数组；清空为 `undefined` |
| `change`            | 单选 `(item?, fullLabel?)`；多选 `(items[], fullLabels?)` | 选中变化；`item` 为节点原始数据附加 `fullLabel` 字段（单选为路径文案，多选为该节点 label）。仅用户操作触发，程序改 `v-model` 不触发 |
| `clear`             | —                                                         | 点击清除按钮                                                                                    |

面板交互：点击触发器弹底部面板；单选点击叶子提交并收起，点击非叶子按 `strict` 决定是否同时提交；点面包屑 Tab 回退到对应层级。多选面板头部为「取消 / 标题 / 确定」：点行进级（有子级）或勾选（叶子），点 checkbox 勾选或取消该节点及其全部后代，确定才落值，取消直接收起不落值。搜索结果行主标题为 label、副标题为祖先路径（`separator` 连接）；单选点叶子结果直接提交收起，点非叶子结果跳转到该层级并清空搜索词。点击遮罩直接收起面板（单选不改动已选值，多选丢弃暂存勾选）。

## 典型示例

### 多选 + 标签触发器

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UCascade } from '@veltra/mobile'

// 多选值为叶子 value 数组，无路径拼接
const picked = ref<string[]>([])

const menu = [
  {
    value: 'coffee',
    label: '咖啡',
    children: [
      { value: 'latte', label: '拿铁' },
      { value: 'mocha', label: '摩卡' }
    ]
  },
  {
    value: 'tea',
    label: '茶',
    children: [
      { value: 'puer', label: '普洱' },
      { value: 'longjing', label: '龙井' }
    ]
  }
]

function onChange(items: (Record<string, any> & { fullLabel?: string })[]) {
  console.log(items.map((item) => item.fullLabel)) // => ['拿铁', '龙井'] 这类叶子 label
}
</script>

<template>
  <!-- 面板内勾选暂存，点确定落值；触发器最多展示 2 个标签，超出折叠为 +N -->
  <UCascade v-model="picked" :data="menu" multiple :visibility-limit="2" @change="onChange" />
</template>
```

### 仅提交叶子值（showFullPath: false）

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UCascade } from '@veltra/mobile'

// 后端只存末级编码时关闭完整路径
const categoryId = ref<string>()

const categories = [
  {
    value: 'digital',
    label: '数码',
    children: [
      { value: 'phone', label: '手机' },
      { value: 'laptop', label: '笔记本' }
    ]
  }
]
</script>

<template>
  <!-- 逐级点 数码 → 手机：categoryId => 'phone'，触发器只展示「手机」 -->
  <UCascade v-model="categoryId" :data="categories" :show-full-path="false" />
</template>
```

### 面板内搜索 + strict 只能选叶子

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UCascade } from '@veltra/mobile'

const city = ref<string>()

const tree = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hz', label: '杭州' },
      { value: 'nb', label: '宁波' }
    ]
  }
]
</script>

<template>
  <!-- strict：点「浙江」只展开不提交，只有叶子可落值；filterable 面板顶部出现搜索框 -->
  <UCascade v-model="city" :data="tree" strict filterable placeholder="选择城市" />
</template>
```

### 回显数据已不在选项中（text 兜底）

```vue
<script setup lang="ts">
import { reactive } from 'vue'

import { UCascade } from '@veltra/mobile'

// 编辑回显：后端存了路径与冗余文案；当前数据已不含 hz（如地区缩编）
const form = reactive({ region: 'east/hz', regionText: '华东/杭州（已撤销）' })

const regions = [
  {
    value: 'south',
    label: '华南',
    children: [{ value: 'gz', label: '广州' }]
  }
]
</script>

<template>
  <!-- 路径末级 'hz' 未命中：展示 text 而非原始路径串；重新选择后 update:label 同步新路径文案 -->
  <UCascade v-model="form.region" :data="regions" :text="form.regionText" @update:label="form.regionText = $event ?? ''" />
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是点击触发器弹出**底部面板 + 面包屑 Tab** 逐级下钻；桌面端是多列联动面板，两者属性同名同默认值，例外：移动端 `CascadeProps` 另有 `contentStyle` / `contentClass` 两个底部面板容器属性，桌面端没有。
> - 移动端清除按钮在有值且 `clearable` 时**常显**（无 hover 概念），桌面端悬停触发器时才显示。
> - 多选的 `modelValue` 是勾选节点 value 的**数组，无路径拼接**；`showFullPath` 与 `separator` 对多选无效。
> - 默认（`strict: false`）点击非叶子节点会**立即提交到该节点的路径**并继续展开；要求只能选叶子时必须传 `strict`。
> - 多选勾选任意节点会连带勾选其全部后代（点 checkbox 才会作用于非叶子，点行只进级或勾选叶子）；取消同理，父子始终联动，无独立开关。
> - 多选是暂存模式：面板内勾选不落值，点「确定」才触发 `update:modelValue` / `change`；点「取消」或遮罩丢弃暂存。
> - 单选回显按路径末级 value 判定命中：数据异步加载完成前或数据已删除时展示 `text`（未传则展示原始路径串）；`change` 只由用户操作触发，程序改 `v-model` 不触发。
> - `data` 的 value 字段值必须非空且唯一；空串、null 值节点不进入匹配表，无法被回显或提交。
> - 在 UForm 中必须用 `field` 绑定，禁止再写 `v-model`；`label` / `rules` / `span` / `tips` 仅在 UForm（或 UFormItem）内生效，且移动端 `span` 与 `tips` 不产生布局与提示效果。
> - 触发器密度走 `--um-*` 移动端 token：触发器高度按 `--um-control-height-*` 且整行热区以 `--um-touch-target`（44px）保底；面板内搜索输入框字号为 `--um-font-size-main`（16px），iOS Safari 聚焦不触发页面缩放。
> - 底部面板展开期间锁定页面滚动，关闭后恢复原滚动位置；空数据面板内显示「暂无数据」。

## 常见问题

### 单选回显显示原始路径串而不是 label

原因：路径末级 value 在 `data` 中不存在（数据未加载完成、回显数据对应的选项已删除、value 值为空串）。组件把整条路径视为无效，展示 `text` 兜底文案；未传 `text` 时展示原始 `modelValue`。修复：等 `data` 就绪后再渲染组件，或传入 `text`。

```vue
<script setup lang="ts">
import { reactive } from 'vue'

import { UCascade } from '@veltra/mobile'

// 后端存的 'east/hz' 在当前 options 中已不存在，传冗余文案兜底
const form = reactive({ region: 'east/hz', regionText: '华东/杭州（已撤销）' })
const regions = [{ value: 'south', label: '华南', children: [{ value: 'gz', label: '广州' }] }]
</script>

<template>
  <UCascade v-model="form.region" :data="regions" :text="form.regionText" />
</template>
```

### 多选把路径串写进了 v-model

多选值是勾选节点 value 的数组（如 `['latte', 'puer']`），不是 `'咖啡/拿铁'` 这类路径串；路径串数组会导致回显全部未命中、触发器无标签。修复：`v-model` 绑定 string 数组，每项为叶子（或勾选节点）的 value 原值。

### 在 UForm 中同时写了 `field` 和 `v-model`

状态由 `field` 接管后 `v-model` 是重复绑定，两者会竞争写入。修复：删除 `v-model`，只保留 `field`。
