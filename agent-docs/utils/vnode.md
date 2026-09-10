---
title: VNode 判断与提取工具
description: Vue 虚拟节点判断与插槽拍平工具集：isTextNode / isFragment / isComment / isTemplate 四个类型守卫，extractNormalVNodes 递归展开 Fragment 与 template 包装、把字符串数字转文本节点，提取扁平 VNode 数组。
aliases: [isTextNode, isFragment, isComment, isTemplate, extractNormalVNodes, 类型守卫]
keywords: [isTextNode, isFragment, isComment, isTemplate, extractNormalVNodes, VNode, VNodeArrayChildren, slots.default, Fragment, Comment, Text, 插槽拍平, 插槽遍历, 文本节点, 注释节点, 默认插槽, 类型守卫, 节点提取]
---

# VNode 判断与提取工具

`@veltra/utils` 导出 Vue VNode 类型守卫 `isTextNode` / `isFragment` / `isComment` / `isTemplate` 与插槽拍平函数 `extractNormalVNodes`。组件在渲染函数中分析默认插槽、过滤包装节点、提取真实子节点时使用这一组工具，全部从 `@veltra/utils` 导入。

## 快速上手

提取默认插槽的真实节点列表，`Fragment` 与 `template` 包装被递归展开、字符串数字转文本节点：

```ts
import { extractNormalVNodes } from '@veltra/utils'
import { Fragment, h } from 'vue'

const nodes = extractNormalVNodes([
  h(Fragment, [h('span', 'a'), h('template', [h('span', 'b')])]),
  'plain',
  1
])
// => [span'a' 的 VNode, span'b' 的 VNode, 'plain' 的文本 VNode, '1' 的文本 VNode]
```

## API 签名

```ts
import type { VNode, VNodeArrayChildren } from 'vue'

/** 是否为文本节点（node.type === Text）；类型收窄后 children 为 string */
export function isTextNode(node: VNode): node is TextVNode

/** 是否为 Fragment 片段（node 存在且 node.type === Fragment）；入参接受任意值 */
export function isFragment(node: any): node is VNode

/** 是否为注释节点（node.type === Comment）；类型收窄后 children 为 string */
export function isComment(node: VNode): node is CommentVNode

/** 是否为 template 包装节点（isVNode(node) && node.type === 'template'）；入参接受任意值 */
export function isTemplate(node: unknown): node is VNode

/**
 * 提取常规虚拟节点：递归展开 type 为 Fragment / template 且 children 为数组的节点，
 * 字符串与数字转文本 VNode，非 VNode 的其它项忽略
 * @param nodes 插槽 children 数组
 * @param results 累加目标数组，默认新建空数组
 * @returns 收集结果（传入 results 时即该数组）
 */
export function extractNormalVNodes(
  nodes: VNodeArrayChildren,
  results: VNode[] = []
): VNode[]
```

`TextVNode` / `CommentVNode` 是库内类型（`VNode` 加 `children: string` 收窄），未单独导出；守卫为真后可直接访问 `node.children` 作为字符串。

## 参数说明

### isTextNode / isFragment / isComment / isTemplate

| 函数 | 入参类型 | 判定条件 | 收窄结果 |
| --- | --- | --- | --- |
| `isTextNode` | `VNode` | `node.type === Text` | `children` 收窄为 `string` |
| `isFragment` | `any` | `node` 真值且 `node.type === Fragment` | 收窄为 `VNode`；传 `undefined` / `null` 返回 `false` 不报错 |
| `isComment` | `VNode` | `node.type === Comment` | `children` 收窄为 `string` |
| `isTemplate` | `unknown` | `isVNode(node) && node.type === 'template'` | 收窄为 `VNode`；`type` 是字符串 `'template'`，不是 Vue 导出的 Symbol |

四个函数同步返回 `boolean`，无副作用。

### extractNormalVNodes

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `nodes` | `VNodeArrayChildren` | — | 是 | 插槽 children 数组；混有 VNode、字符串、数字 |
| `results` | `VNode[]` | `[]` | 否 | 传入时结果累加进该数组并返回同一引用 |

遍历规则（对每个子项）：

- 非 VNode 的字符串或数字 → `createTextVNode(String(node))` 后收集
- 非 VNode 的其它项（如 `null`、布尔值）→ 忽略
- `Fragment` 或 `template` 节点且 `children` 为数组 → 递归展开其 children
- 其余 VNode（含注释节点、文本节点、普通元素与组件节点）→ 原样收集，注释节点不过滤

## 典型示例

### 提取默认插槽的第一个真实节点

弹层类组件常把插槽第一项作为触发器渲染：

```ts
import { extractNormalVNodes } from '@veltra/utils'
import { Fragment, h, type Slot } from 'vue'

function firstSlotNode(slots: Record<string, Slot | undefined>): ReturnType<Slot> {
  const nodes = slots.default?.() ?? []
  const flat = extractNormalVNodes(nodes)
  return flat.slice(0, 1)
}

const trigger = firstSlotNode({ default: () => [h(Fragment, [h('button', 'ok'), h('span', 'x')])] })
// => [button'ok' 的 VNode]，Fragment 包装被展开
```

### 过滤出纯文本节点

```ts
import { isTextNode } from '@veltra/utils'
import { h, type Slot } from 'vue'

function slotTexts(slots: Record<string, Slot | undefined>): string[] {
  return (slots.default?.() ?? [])
    .filter((node) => isTextNode(node))
    .map((node) => node.children)
}

slotTexts({ default: () => [h('i', 'x'), 'hello'] }) // => ['hello']
```

### 区分 Fragment 与 template

```ts
import { isFragment, isTemplate } from '@veltra/utils'
import { Fragment, h } from 'vue'

const frag = h(Fragment, [h('span', 'a')])
const tpl = h('template', [h('span', 'b')])

isFragment(frag) // => true
isTemplate(frag) // => false
isTemplate(tpl) // => true
isFragment(undefined) // => false，入参为 any，不抛错
```

## 注意事项

> [!WARNING]
> - `isTemplate` 匹配的 `type` 是字符串 `'template'`，不是 Vue 导出的 `Template` Symbol（Vue 不导出该内置类型）。
> - `isFragment` 入参是 `any`，传 `undefined` / `null` 返回 `false`；其余三个守卫要求传入 VNode，传非 VNode 前先自行确认。
> - `extractNormalVNodes` 不过滤注释节点，注释 VNode 会出现在结果中；要过滤需自行叠加 `isComment`。
> - `extractNormalVNodes` 展开的仅是 `children` 为数组的 `Fragment` / `template`；`children` 为字符串的节点按普通 VNode 原样收集。
> - 多次调用要复用结果数组时才传第二参 `results`；默认每次新建数组，不污染外部。
