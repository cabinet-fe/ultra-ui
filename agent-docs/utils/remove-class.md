---
title: removeClass
description: 从 HTMLElement 移除一个或多个 class
---

`removeClass(el, className)` 调用 `el.classList.remove`。`className` 可以是字符串或字符串数组。

```ts
import { removeClass } from '@veltra/utils'

removeClass(el, 'is-focus')
removeClass(el, ['is-active', 'is-disabled'])
```
