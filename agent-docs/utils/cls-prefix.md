---
title: CLS_PREFIX
description: Ultra UI CSS 类前缀常量，值为 u-
---

`CLS_PREFIX` 是 `@veltra/utils` 导出的 CSS 类前缀，值为 `'u-'`（由 `NAME_SPACE` 转小写后加连字符）。预置的 `bem()` 使用该前缀，块名形如 `u-button`。

```ts
import { CLS_PREFIX } from '@veltra/utils'

CLS_PREFIX // 'u-'
```
