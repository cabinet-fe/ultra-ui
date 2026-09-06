---
title: "bem - 预置 u- 前缀的 BEM 类名生成工厂与状态类辅助器"
description: "CSS 类名生成工具函数，预置 u- 前缀的标准 BEM（Block-Element-Modifier）类名构造器，包含 bem.is 辅助生成 is-active、is-disabled 等状态类名，规范组件样式层级"
keywords:
  - bem
  - @veltra/utils
  - 预置
  - 前缀的
  - 类名生成工厂与状态类辅助器
aliases: ["bem"]
---
`bem` 是 `@veltra/utils` 用 `CLS_PREFIX`（`'u-'`）预置的 BEM 工厂。传入块名得到实例；`bem.is` 生成 `is-*` 辅助类。自定义前缀用 `makeBEM`。

相关类型：`BEM<N, P, B>`（实例）、`BEMFactory<Prefix>`（工厂，含 `is`）。

## 方法与事件

| 成员 | 含义 | 示例（`bem('button')`） |
| --- | --- | --- |
| `b` | 块 | `'u-button'` |
| `e(name)` | 元素 | `e('icon')` → `'u-button__icon'` |
| `m(name)` | 修饰符 | `m('large')` → `'u-button--large'` |
| `em(e, m)` | 元素修饰符 | `em('icon', 'left')` → `'u-button__icon--left'` |
| `create(block)` | 子块工厂 | `create('panel')` 的 `b` 为 `'u-button-panel'` |

`bem.is(name)` 返回 `'is-${name}'`。`bem.is(name, condition)` 仅在 `condition === true` 时返回该类，否则返回 `''`。

```ts
import { bem } from '@veltra/utils'

const cls = bem('button')
const disabled = false

const classList = [
  cls.b,
  cls.m('large'),
  cls.e('icon'),
  bem.is('disabled', disabled),
  bem.is('loading')
]
```
