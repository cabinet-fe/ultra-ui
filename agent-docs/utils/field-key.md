---
title: "fieldKey - 表单控件字段 key 解析与默认回退"
description: "表单工具函数，处理字段标识符，在传入空字符串、null 或 undefined 时安全回退到默认字段名，避免对象路径索引报错"
keywords:
  - fieldKey
  - @veltra/utils
  - field-key
  - 表单控件字段
  - 解析与默认回退
aliases: ["field-key", "fieldKey"]
---

## 快速上手

`fieldKey(key, fallback)`：`key` 为真值时返回 `key`，否则返回 `fallback`。空字符串会回退（按真值判断，不是只判断 `null` / `undefined`）。

```ts
import { fieldKey } from '@veltra/utils'

fieldKey(props.valueKey, 'value')
fieldKey(props.labelKey, 'label')
fieldKey('', 'id') // 'id'
```
