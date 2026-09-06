---
title: setStyles 为 DOM 元素批量设置内联 CSS 样式
description: DOM 操作工具函数，支持以 Vue CSSProperties 驼峰格式或 CSS 属性名批量写入 inline style，纯数字值自动补充 px 单位，用于命令式动态样式计算与动画驱动
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
