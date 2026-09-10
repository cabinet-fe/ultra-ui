---
title: UText 文本
description: "@veltra/desktop 导出的文本排版组件。渲染 <p> 元素，提供五档文字预设（main-title/title/sub-title/content/additional）、自定义字号、粗体、斜体、删除线、下划线与关键词高亮（命中片段包 <mark>），用于页面标题层级与正文中关键词强调。"
aliases: [UText, Text, 文本, 文字, 排版文本, Typography]
keywords: [UText, TextProps, as, fontSize, highlight, deleted, underline, bold, italic, 文本预设, 标题层级, 关键词高亮, 高亮词, 删除线, 下划线, 粗体, 斜体]
---

# UText 文本

`@veltra/desktop` 导出组件 `UText`，渲染 `<p class="u-text">`。用 `as` 选五档预设字号 / 字重 / 颜色，`fontSize` 覆盖预设字号，`bold` / `italic` / `deleted` / `underline` 切换字形，`highlight` 把命中的关键词片段包进 `<mark>`。只渲染默认插槽中的文本节点，元素子节点会被丢弃。

## 快速上手

```vue
<script setup lang="ts">
import { UText } from '@veltra/desktop'
</script>

<template>
  <u-text as="title">页面标题</u-text>
  <u-text>正文段落，as 默认即 content</u-text>
</template>
```

视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-text-color-*` token 为空、文字无颜色。

## API 签名

```ts
/** 文本组件属性 */
export interface TextProps {
  /** 预设文本类型，默认 'content' */
  as?: 'main-title' | 'title' | 'sub-title' | 'content' | 'additional'
  /** 文本大小；数字自动补 px，字符串原样使用；与 as 同时指定时覆盖 as 的字号 */
  fontSize?: string | number
  /** 是否删除线 */
  deleted?: boolean
  /** 是否下划线；与 deleted 同时为 true 时下划线生效（后写覆盖） */
  underline?: boolean
  /** 是否粗体；为 true 时覆盖 as 预设的字重 */
  bold?: boolean
  /** 是否斜体 */
  italic?: boolean
  /** 高亮关键词；命中片段渲染为 <mark>，传字符串或字符串数组 */
  highlight?: string | string[]
}

/** 文本组件定义的事件（仅类型声明，当前版本源码不会触发） */
export interface TextEmits {
  (e: 'update:modelValue', value: string): void
}

/** 文本组件暴露的属性和方法（当前版本为空） */
export interface TextExposed {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `as` | `'main-title' \| 'title' \| 'sub-title' \| 'content' \| 'additional'` | `'content'` | 否 | 枚举仅这五档，对应样式见下表 |
| `fontSize` | `string \| number` | — | 否 | 数字按 px 处理（`24` → `24px`）；含单位的字符串原样生效（`'1.2em'`）；优先于 `as` 的字号 |
| `deleted` | `boolean` | `false` | 否 | `text-decoration: line-through`；与 `underline` 同设时被下划线覆盖 |
| `underline` | `boolean` | `false` | 否 | `text-decoration: underline`；与 `deleted` 同设时覆盖删除线 |
| `bold` | `boolean` | `false` | 否 | 覆盖 `as` 预设字重为 `bold` |
| `italic` | `boolean` | `false` | 否 | `font-style: italic` |
| `highlight` | `string \| string[]` | — | 否 | 不区分大小写、全局匹配；关键词先去首尾空格，空字符串被过滤；正则元字符自动转义，按原文写即可 |

`as` 五档预设（源码 `style.scss` 固定值）：

| 预设 | 字号 | 字重 | 颜色 token |
| --- | --- | --- | --- |
| `main-title` | 18px | 600 | `--u-text-color-title` |
| `title` | 16px | 600 | `--u-text-color-main` |
| `sub-title` | 16px | 500 | `--u-text-color-placeholder` |
| `content` | 14px | 300 | `--u-text-color-second` |
| `additional` | 12px | 300 | `--u-text-color-assist` |

## 方法与事件

无暴露方法（`TextExposed` 为空接口）。`update:modelValue` 只存在于类型声明 `TextEmits`，当前版本源码没有任何 emit 调用，监听它不会收到回调。

## 典型示例

### 标题层级与字形修饰

```vue
<script setup lang="ts">
import { UText } from '@veltra/desktop'
</script>

<template>
  <u-text as="main-title">这是主标题</u-text>
  <u-text as="title">这是标题</u-text>
  <u-text as="sub-title">这是副标题</u-text>
  <u-text>这是正文内容</u-text>
  <u-text as="additional">这是附加说明文字</u-text>

  <u-text :font-size="24" bold>24px 粗体，覆盖预设字号与字重</u-text>
  <u-text deleted>已删除文本</u-text>
  <u-text underline>带下划线的文本</u-text>
  <u-text italic>斜体文本</u-text>
</template>
```

### 关键词高亮

```vue
<script setup lang="ts">
import { UText } from '@veltra/desktop'

const keywords = ['Vue', 'TypeScript']
</script>

<template>
  <u-text highlight="Vue">这是一段关于 Vue 框架的介绍文字</u-text>
  <u-text :highlight="keywords">Vue 3 配合 TypeScript 开发体验极佳</u-text>
  <!-- 命中片段渲染为 <mark>：Vue 与 TypeScript 底色高亮 -->
</template>
```

### 搜索结果列表（高亮 + 层级组合）

```vue
<script setup lang="ts">
import { UText } from '@veltra/desktop'

const query = '发布'
const results = [
  { title: 'v2.6 发布公告', digest: '新版本发布，包含 12 项改进' },
  { title: '发布流程说明', digest: '介绍从分支到发布的完整流程' }
]
</script>

<template>
  <div v-for="item in results" :key="item.title">
    <u-text as="title" :highlight="query">{{ item.title }}</u-text>
    <u-text as="content" :highlight="query">{{ item.digest }}</u-text>
  </div>
</template>
```

## 注意事项

> [!WARNING]
> - 默认插槽只渲染文本节点：插进去的 `<span>`、`<a>` 等元素会被过滤掉；需要富文本排版时不要用 UText 包元素。
> - 本库文本元素固定是 `<p>`（块级），不是 `<span>`；行内文本直接写原生 span，或给 `<u-text>` 设 `display: inline`。
> - 高亮匹配不区分大小写且会转义正则元字符：`highlight="C++"` 按字面匹配 `C++`，不是正则。
> - 关键词命中片段是 `<mark>` 元素（库内无额外样式，即浏览器默认黄色底），禁止用 `highlight` 做交互（如点击跳转），它只是视觉标记。
> - `deleted` 与 `underline` 同时为 true 时只有下划线生效（`text-decoration` 单属性覆盖），不是两者叠加。
> - `update:modelValue` 事件当前版本不会触发，禁止监听它。

## 常见问题

### 高亮没有生效

原因：高亮只作用于默认插槽的文本节点，且插槽内容先经过文本过滤。确认内容是纯文本、关键词非空字符串：

```vue
<script setup lang="ts">
import { UText } from '@veltra/desktop'

const word = '重要'
</script>

<template>
  <!-- 生效：纯文本节点 -->
  <u-text :highlight="word">这一段有重要内容</u-text>
  <!-- 不生效：内容被元素包裹，元素节点被过滤 -->
</template>
```

### `as` 与 `fontSize` 同时设置后字号不对

原因：`fontSize` 优先于 `as` 的预设字号，这是约定行为。要恢复预设字号就移除 `fontSize`；要微调预设就在 `fontSize` 上写目标值（如 `:font-size="20"`）。
