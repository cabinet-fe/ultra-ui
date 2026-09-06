---
title: setStyles
description: 按 Vue CSSProperties 给 HTMLElement 写入 inline 样式
---

`setStyles(el, styles)` 把 `styles`（Vue `CSSProperties`）的每个键赋到 `el.style`。键用 camelCase（如 `zIndex`、`paddingTop`）。

```ts
import { setStyles, zIndex } from '@veltra/utils'

setStyles(container, {
  position: 'fixed',
  zIndex: zIndex(),
  top: '20px',
  right: '20px'
})
```
