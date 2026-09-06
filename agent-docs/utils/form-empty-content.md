---
title: FORM_EMPTY_CONTENT
description: 表单只读态无值时的占位字符串，值为连字符
---

`FORM_EMPTY_CONTENT` 是 `@veltra/utils` 导出的表单空内容占位，值为 `'-'`。桌面端输入类组件在 `readonly` 且无值时用它渲染，避免空白。

```ts
import { FORM_EMPTY_CONTENT } from '@veltra/utils'

const display = model || FORM_EMPTY_CONTENT
```
