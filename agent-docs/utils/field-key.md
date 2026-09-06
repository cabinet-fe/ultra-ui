---
title: fieldKey
description: 空串、null、undefined 时回退到默认字段名
---

`fieldKey(key, fallback)`：`key` 为真值时返回 `key`，否则返回 `fallback`。空字符串会回退（按真值判断，不是只判断 `null` / `undefined`）。

```ts
import { fieldKey } from '@veltra/utils'

fieldKey(props.valueKey, 'value')
fieldKey(props.labelKey, 'label')
fieldKey('', 'id') // 'id'
```
