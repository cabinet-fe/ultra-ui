---
title: "CLS - _PREFIX 组件库统一 CSS 类名前缀常量"
description: "样式常量定义，值为 u-，代表 Ultra UI 组件库统一 CSS 类名前缀，用于自定义样式拓展、BEM 类名拼装与选择器匹配"
keywords:
  - CLS
  - @veltra/utils
  - cls-prefix
  - 组件库统一
  - 类名前缀常量
aliases: ["cls-prefix", "CLS"]
---

## 快速上手

`CLS_PREFIX` 是 `@veltra/utils` 导出的 CSS 类前缀，值为 `'u-'`（由 `NAME_SPACE` 转小写后加连字符）。预置的 `bem()` 使用该前缀，块名形如 `u-button`。

```ts
import { CLS_PREFIX } from '@veltra/utils'

CLS_PREFIX // 'u-'
```
