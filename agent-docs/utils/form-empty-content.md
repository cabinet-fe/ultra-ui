---
title: "FORM - _EMPTY_CONTENT 表单只读与无值占位符常量"
description: "表单常量定义，默认值为连字符 -，用于表单控件在只读模式（readonly）或值为空时的统一兜底文本占位展示"
keywords: ["FORM", "@veltra/utils", "form-empty-content", "表单只读与无值占位符常量"]
aliases: ["form-empty-content", "FORM"]
---
## 快速上手

`FORM_EMPTY_CONTENT` 是 `@veltra/utils` 导出的表单空内容占位，值为 `'-'`。桌面端输入类组件在 `readonly` 且无值时用它渲染，避免空白。

```ts
import { FORM_EMPTY_CONTENT } from '@veltra/utils'

const display = model || FORM_EMPTY_CONTENT
```

