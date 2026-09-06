---
title: withUnit CSS 尺寸数值单位自动规范与补充工具
description: 样式格式化工具函数，输入纯数字或纯数字字符串时自动追加 px 单位，已有单位（如 %、em、rem、vh 等）原样返回，用于组件 width、height 等尺寸属性兼容解析
---

`withUnit(value, unit)`：`value` 为 `undefined` 时返回 `undefined`；数字或能被 `Number` 解析的字符串会拼上 `unit`；其它字符串原样返回（视为已带单位）。

```ts
import { withUnit } from '@veltra/utils'

withUnit(16, 'px') // '16px'
withUnit('24', 'px') // '24px'
withUnit('100%', 'px') // '100%'
withUnit(undefined, 'px') // undefined
```
