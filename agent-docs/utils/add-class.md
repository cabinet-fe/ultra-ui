---
title: "addClass - 向 DOM 元素添加 CSS 类名"
description: "DOM 操作工具函数，向指定 HTMLElement 批量或单个添加 CSS class 类名，内部自动去重并保持现有样式类完整，适用于动态状态类追加与交互高亮"
keywords:
  - addClass
  - @veltra/utils
  - add-class
  - 元素添加
  - 类名
aliases: ["add-class", "addClass"]
---
## 快速上手

`addClass(el, className)` 调用 `el.classList.add`。`className` 可以是字符串或字符串数组。

```ts
import { addClass } from '@veltra/utils'

addClass(el, 'u-button')
addClass(el, ['is-active', 'is-focus'])
```

