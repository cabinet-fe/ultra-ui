---
title: "removeStyles - 从 DOM 元素批量移除内联 style 样式属性"
description: "DOM 操作工具函数，从指定 HTMLElement 元素上批量移除指定的 inline style 行内样式属性（如 transform、height 等），重置内联样式"
keywords:
  - removeStyles
  - @veltra/utils
  - remove-styles
  - 元素批量移除内联
  - 样式属性
aliases: ["remove-styles", "removeStyles"]
---
## 快速上手

`removeStyles(el, props)` 按 `props` 中的 CSS 属性名清掉 inline 样式。支持 `attributeStyleMap` 时会把键转成 kebab-case 再 `delete`；否则走 `el.style.removeProperty`。传入 kebab-case 名称即可（如 `'padding-top'`、`'height'`）。

```ts
import { removeStyles } from '@veltra/utils'

removeStyles(dialogEl, ['height'])
removeStyles(el, ['box-sizing', 'overflow', 'transition', 'will-change'])
```

