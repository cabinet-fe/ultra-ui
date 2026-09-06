---
title: addClass
description: 向 HTMLElement 添加一个或多个 class
---

`addClass(el, className)` 调用 `el.classList.add`。`className` 可以是字符串或字符串数组。

```ts
import { addClass } from '@veltra/utils'

addClass(el, 'u-button')
addClass(el, ['is-active', 'is-focus'])
```
