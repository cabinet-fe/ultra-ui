---
title: "makeBEM - 自定义命名空间前缀的 BEM 类名工厂创建函数"
description: "CSS 类名构造工具函数，根据自定义命名空间前缀（如 my-）创建独立的 BEM 类名生成器工厂，支持 block、element、modifier 及 is 状态类生成，用于第三方包或微前端样式隔离"
keywords:
  - makeBEM
  - @veltra/utils
  - make-bem
  - 自定义命名空间前缀的
  - 类名工厂创建函数
aliases: ["make-bem", "makeBEM"]
---

## 快速上手

`makeBEM(prefix)` 返回 BEM 工厂。`prefix` 须为 `''` 或以 `-` 结尾的字符串（如 `'u-'`）。组件库预置实例是 `bem`（前缀 `CLS_PREFIX`）。

相关类型：`BEMFactory<Prefix>`（工厂，含 `is`）、`BEM<N, P, B>`（实例）。

工厂调用 `factory(block)` 得到实例：

| 成员            | 含义       | 示例（`makeBEM('x-')('btn')`）               |
| --------------- | ---------- | -------------------------------------------- |
| `b`             | 块         | `'x-btn'`                                    |
| `e(name)`       | 元素       | `e('icon')` → `'x-btn__icon'`                |
| `m(name)`       | 修饰符     | `m('lg')` → `'x-btn--lg'`                    |
| `em(e, m)`      | 元素修饰符 | `em('icon', 'left')` → `'x-btn__icon--left'` |
| `create(block)` | 子块       | `create('panel')` 的 `b` 为 `'x-btn-panel'`  |

`factory.is(name)` 返回 `'is-${name}'`。`factory.is(name, condition)` 仅在 `condition === true` 时返回该类，否则 `''`。

```ts
import { makeBEM } from '@veltra/utils'

const bem = makeBEM('app-')
const cls = bem('toolbar')

cls.b // 'app-toolbar'
cls.e('item') // 'app-toolbar__item'
bem.is('active', true) // 'is-active'
```
