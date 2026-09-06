---
title: removeStyles
description: 从 HTMLElement 移除指定 inline 样式属性
---

`removeStyles(el, props)` 按 `props` 中的 CSS 属性名清掉 inline 样式。支持 `attributeStyleMap` 时会把键转成 kebab-case 再 `delete`；否则走 `el.style.removeProperty`。传入 kebab-case 名称即可（如 `'padding-top'`、`'height'`）。

```ts
import { removeStyles } from '@veltra/utils'

removeStyles(dialogEl, ['height'])
removeStyles(el, ['box-sizing', 'overflow', 'transition', 'will-change'])
```
