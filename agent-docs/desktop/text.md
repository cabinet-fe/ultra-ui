---
title: "UText - 文本"
description: "用 UText 按标题层级展示文本，并支持高亮、删除线与强调"
keywords:
  - UText
  - @veltra/desktop
  - text
  - Text
  - 文本
aliases: ["text", "UText", "Text", "文本"]
---

## 快速上手

```ts
import { UText } from '@veltra/desktop'
```

## 典型示例

`UText` 只渲染默认插槽里的文本节点。`as` 默认 `content`，还可为 `main-title` / `title` / `sub-title` / `additional`。`font-size` 与 `bold` 会覆盖 `as` 对应样式。`highlight` 可以是字符串或字符串数组，命中部分包在 `mark` 里。

```vue
<template>
  <u-text as="title">页面标题</u-text>
  <u-text>正文段落</u-text>
  <u-text highlight="截止日期">请在截止日期前完成提交。</u-text>
  <u-text deleted>已撤销的说明</u-text>
  <u-text underline bold>强调内容</u-text>
</template>
```

## API 签名 / 类型定义

```ts
/** 文本组件属性 */
export interface TextProps {
  /** 使用预设文本类型, 默认content正文 */
  as?: 'main-title' | 'title' | 'sub-title' | 'content' | 'additional'
  /** 文本大小, 与as同时指定时会覆盖as */
  fontSize?: string | number
  /** 是否删除 */
  deleted?: boolean
  /** 下划线 */
  underline?: boolean
  /** 粗体, 与as同时指定时会覆盖as中的字体粗细 */
  bold?: boolean
  /** 斜体 */
  italic?: boolean
  /** 高亮 */
  highlight?: string | string[]
}

/** 文本组件定义的事件 */
export interface TextEmits {
  (e: 'update:modelValue', value: string): void
}

/** 文本组件暴露的属性和方法(组件内部使用) */
export interface _TextExposed {}

/** 文本组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface TextExposed {}
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
