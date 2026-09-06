---
title: "removeClass - 从 DOM 元素批量移除指定 CSS 类名"
description: "DOM 操作工具函数，从指定 HTMLElement 元素上移除一个或多个指定的 CSS class 类名，自动重整 class 属性并保持其它样式类不受影响"
keywords:
  - removeClass
  - @veltra/utils
  - remove-class
  - 元素批量移除指定
  - 类名
aliases: ["remove-class", "removeClass"]
---
## 快速上手

`removeClass(el, className)` 调用 `el.classList.remove`。`className` 可以是字符串或字符串数组。

```ts
import { removeClass } from '@veltra/utils'

removeClass(el, 'is-focus')
removeClass(el, ['is-active', 'is-disabled'])
```

