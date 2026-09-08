---
title: 'NAME - _SPACE 组件命名空间前缀常量'
description: '组件库全局常量，值为 U，表示 Ultra UI 组件统一命名空间前缀（如 UButton、UInput），用于组件名格式化、解析匹配与全局注册'
keywords: ['NAME', '@veltra/utils', 'name-space', '组件命名空间前缀常量']
aliases: ['name-space', 'NAME']
---

## 快速上手

`NAME_SPACE` 是 `@veltra/utils` 导出的组件命名前缀，值为 `'U'`。组件公开名按此前缀拼出，如 `UButton`、`USelect`。类名前缀见 `CLS_PREFIX`（`'u-'`）。

```ts
import { NAME_SPACE } from '@veltra/utils'

NAME_SPACE // 'U'
```
