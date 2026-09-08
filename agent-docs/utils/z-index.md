---
title: 'zIndex - 弹窗浮层层级动态自增管理'
description: '弹层层级管理工具函数，从初始值 1000 起每次调用返回自增的 z-index 数值，确保模态弹窗、Drawer 抽屉、Message 消息提示与 Popover 浮层按打开顺序正确堆叠覆盖，避免层级冲突遮挡'
keywords: ['zIndex', '@veltra/utils', 'z-index', '弹窗浮层层级动态自增管理']
aliases: ['z-index', 'zIndex', '弹窗浮层层级动态自增管理']
---

## 快速上手

`zIndex` 是 `() => number`。首次调用返回 `1000`，之后每次加一，保证新打开的弹层叠在更上层。模块级单例，全应用共享同一计数。

```ts
import { setStyles, zIndex } from '@veltra/utils'

setStyles(overlay, { position: 'fixed', zIndex: zIndex() })
```
