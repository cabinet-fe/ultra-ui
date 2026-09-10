---
title: 文本高亮、溢出导航与通用类型工具
description: 文本匹配高亮、水平溢出导航状态与表单字段回退工具：getHighlightChunks 按关键字切分高亮片段，computeOverflowNavState 推导翻页箭头可用状态，fieldKey 字段名回退，FORM_EMPTY_CONTENT 空值占位，另含库通用类型导出。
aliases: [getHighlightChunks, computeOverflowNavState, fieldKey, FORM_EMPTY_CONTENT, 高亮, DeconstructValue]
keywords: [getHighlightChunks, computeOverflowNavState, fieldKey, FORM_EMPTY_CONTENT, OverflowNavState, OverflowNavViewport, scrollLeft, scrollWidth, clientWidth, canPrev, canNext, overflowing, 关键字高亮, 搜索高亮, 溢出导航, 翻页箭头, 字段回退, 空值占位, labelKey, valueKey]
---

# 文本高亮、溢出导航与通用类型工具

`@veltra/utils` 导出文本与状态推导工具：`getHighlightChunks` 把字符串按关键字切成高亮片段，`computeOverflowNavState` 依据视口几何推导水平溢出导航的箭头可用状态，`fieldKey` 做字段名回退，`FORM_EMPTY_CONTENT` 是表单空值占位常量。本篇同时收录库的通用类型导出。

## 快速上手

搜索框输入关键字后，把候选文本切成普通与高亮片段渲染：

```ts
import { getHighlightChunks } from '@veltra/utils'
import { createTextVNode, h } from 'vue'

const chunks = getHighlightChunks('Hello Vue', ['vue'])
// => [{ text: 'Hello ', highlight: false }, { text: 'Vue', highlight: true }]

const nodes = chunks.map((chunk) =>
  chunk.highlight ? h('mark', chunk.text) : createTextVNode(chunk.text)
)
```

## API 签名

### getHighlightChunks

```ts
interface HighlightChunk {
  text: string
  highlight: boolean
} // 库内类型，未单独导出

/**
 * 按关键字切分文本为高亮片段
 * @param str 原始文本
 * @param substrings 关键字列表；每项 trim 后转义正则特殊字符，空项丢弃
 * @returns 片段数组，顺序与原文一致，拼接后等于原文
 */
export function getHighlightChunks(str: string, substrings: string[]): HighlightChunk[]
```

匹配为大小写不敏感（正则 `gi` 标志）。`HighlightChunk` 未导出，调用方按结构 `[{ text: string; highlight: boolean }]` 标注。

### computeOverflowNavState

```ts
/** 视口滚动几何（scrollTo 兼容 HTMLElement 与 vue 模板 ref） */
export interface OverflowNavViewport {
  scrollLeft: number
  scrollWidth: number
  clientWidth: number
}

/** 导航按钮状态 */
export interface OverflowNavState {
  /** 内容是否溢出视口（scrollWidth - clientWidth > 1 视为溢出） */
  overflowing: boolean
  /** 可向前（左）滚动：溢出且 scrollLeft > 0 */
  canPrev: boolean
  /** 可向后（右）滚动：溢出且右侧仍有未露出内容（余量 > 1px） */
  canNext: boolean
}

/** 依据视口与内容尺寸推导滚动按钮可用状态 */
export function computeOverflowNavState(vp: OverflowNavViewport): OverflowNavState
```

### fieldKey

```ts
/** 字段名回退：key 为真值时返回 key，否则返回 fallback */
export function fieldKey(key: string | null | undefined, fallback: string): string
```

### FORM_EMPTY_CONTENT

```ts
/** 表单空内容占位符，值为 '-'。控件 readonly 且无值时用它渲染，避免空白 */
export const FORM_EMPTY_CONTENT: '-'
```

### 通用类型导出

```ts
/** 可为 null 的 T */
export type Null<T> = null | T
/** 可为 undefined 的 T */
export type Undef<T> = undefined | T
/** 自定义事件，target 收窄为 T */
export interface DefineEvent<T = HTMLElement> extends Omit<Event, 'target'> {
  target: T
}
/** 解构 Vue expose 对象中被 ref 包裹的成员，得到 ref 上直接可访问的形态 */
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}
/** 索引类型：Keys 中每个键可选，值统一为 Val */
export type Index<Keys extends string, Val> = { [key in Keys]?: Val }
/** 渲染函数返回内容 */
export type RenderReturn =
  | (undefined | VNode | string | null | number)[]
  | undefined
  | VNode
  | string
  | null
  | number

/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'
/** 语义色 */
export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'
/** 断点名称 */
export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
/** 组件通用属性：{ size?: ComponentSize } */
export interface ComponentProps {
  size?: ComponentSize
}
/** 预设校验规则名 */
export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'
/** 字段校验规则（见参数说明表） */
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
/** 表单控件通用属性（仅在 UForm 内或包 UFormItem 时生效） */
export interface FormComponentProps extends ComponentProps {
  tips?: string
  span?: number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  label?: string
  field?: string
  disabled?: boolean
  readonly?: boolean
  rules?: ValidateRule
}
/** 带服务端查询的组件属性 */
export interface PropsWithServerQuery {
  api?: string
  query?: Record<string, any>
}
```

## 参数说明

### getHighlightChunks

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `str` | `string` | — | 是 | 原始文本，原样切分不修改 |
| `substrings` | `string[]` | — | 是 | 关键字列表；`trim` 后参与匹配，假值项丢弃；正则特殊字符（`| \ { } ( ) [ ] ^ $ + * ? . -`）自动转义 |

同步返回 `HighlightChunk[]`，无副作用。匹配忽略大小写且保留原文大小写。

### computeOverflowNavState

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `vp` | `OverflowNavViewport` | — | 是 | 只需 `scrollLeft` / `scrollWidth` / `clientWidth` 三个数值字段，HTMLElement 与模板 ref 均满足 |

返回 `OverflowNavState`，阈值：内容宽超出视口超过 `1px` 判为溢出；`canNext` 要求右侧余量大于 `1px`。纯计算函数，无副作用。

### fieldKey

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `key` | `string \| null \| undefined` | — | 是 | 按真值判断，空字符串 `''` 同样回退 |
| `fallback` | `string` | — | 是 | `key` 非真值时的返回值 |

### ValidateRule 字段

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `required` | `boolean \| string` | `true` 必填；传 `string` 时该文案作为报错提示 |
| `length` | `number \| [number, string]` | 精确长度；元组第二位为报错文案 |
| `min` / `max` | `number \| [number, string]` | 数值最小 / 最大值 |
| `minLen` / `maxLen` | `number \| [number, string]` | 最小 / 最大长度 |
| `match` | `RegExp \| [RegExp, string] \| string` | 正则或字符串匹配 |
| `preset` | `'email' \| 'phone' \| 'num' \| 'url' \| 'idCard'` | 预设规则，五选一 |
| `validator` | `(value, data) => Promise<string> \| string` | 返回报错文案表示失败，返回空串或 resolve 表示通过 |

## 典型示例

### 下拉选项关键字高亮

```ts
import { fieldKey, getHighlightChunks } from '@veltra/utils'
import { createTextVNode, h } from 'vue'

interface Option {
  name: string
}

const options: Option[] = [{ name: '张三' }, { name: '李四' }]
const keyword = '张'
const labelKey = fieldKey(undefined, 'name') // => 'name'

options
  .map((option) => option[labelKey])
  .filter((label) => label.includes(keyword))
  .map((label) =>
    getHighlightChunks(label, [keyword]).map((chunk) =>
      chunk.highlight ? h('mark', chunk.text) : createTextVNode(chunk.text)
    )
  )
```

### 标签栏翻页箭头的显隐与禁用

```ts
import { computeOverflowNavState } from '@veltra/utils'

const viewport = document.querySelector<HTMLElement>('.tabs-viewport')!

function updateArrows() {
  const { overflowing, canPrev, canNext } = computeOverflowNavState(viewport)
  // overflowing 为 false 时隐藏整组箭头
  // canPrev / canNext 控制左右箭头禁用态
  const prev = document.querySelector<HTMLElement>('.arrow-prev')!
  const next = document.querySelector<HTMLElement>('.arrow-next')!
  prev.toggleAttribute('disabled', !canPrev)
  next.toggleAttribute('disabled', !canNext)
}

updateArrows()
viewport.addEventListener('scroll', updateArrows, { passive: true })
```

### 只读控件空值占位与字段回退

```ts
import { fieldKey, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { computed, ref } from 'vue'

const model = ref<{ name?: string }>({})
const valueKey = fieldKey('name', 'id') // => 'name'

// 只读态无值时渲染 '-'，与组件库行为一致
const display = computed(() => model.value[valueKey] || FORM_EMPTY_CONTENT)
```

## 注意事项

> [!WARNING]
> - `getHighlightChunks` 的 `highlight` 判定依赖正则 `g` 标志的 `lastIndex`：相邻关键字（中间无任何间隔文本，如 `'vuevue'`）时，第二个匹配片段会被误判为 `highlight: false`。需要严格结果时自行对 `chunk.text` 做二次匹配校验。
> - `computeOverflowNavState` 的溢出阈值是 `1px`：内容恰好超出 1px 以内不算溢出，与 `scrollWidth > clientWidth` 的朴素判断不同。
> - `scrollViewportByStep` / `scrollElementIntoView` / `applyWheelHorizontalScroll`（配套的滚动执行函数）在 `agent-docs/utils/scroll.md`。
> - `HighlightChunk` 类型未从包内导出；类型标注直接写 `ReturnType<typeof getHighlightChunks>` 或结构 `{ text: string; highlight: boolean }[]`。
> - `fieldKey` 按真值回退：空字符串 `''` 也会取 `fallback`，与只判 `null` / `undefined` 的 `??` 写法不同。
> - `FormComponentProps` 的 `label` / `rules` / `span` / `tips` 仅在 `UForm` 内（或包 `UFormItem`）生效；有 `field` 绑定就禁止再写 `v-model`。
> - `DeconstructValue` 解包后的形态可直接从组件 ref 上访问：`ref.value.method()`，无需再 `.value.xxx`。
