---
title: withUnit
description: 给数字或纯数字字符串补上 CSS 单位，已有单位则原样返回
---

`withUnit(value, unit)`：`value` 为 `undefined` 时返回 `undefined`；数字或能被 `Number` 解析的字符串会拼上 `unit`；其它字符串原样返回（视为已带单位）。

```ts
import { withUnit } from '@veltra/utils'

withUnit(16, 'px') // '16px'
withUnit('24', 'px') // '24px'
withUnit('100%', 'px') // '100%'
withUnit(undefined, 'px') // undefined
```
