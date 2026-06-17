# @veltra/utils

底层工具与共享类型，被所有 Veltra 组件库包复用。

## 导入

```ts
import {
  bem,
  makeBEM,
  withUnit,
  ExpandTransition,
  Tween,
  extractNormalVNodes,
  getZIndex
} from '@veltra/utils'
import { NAME_SPACE, CLS_PREFIX, FORM_EMPTY_CONTENT } from '@veltra/utils/shared'
import type {
  ComponentProps,
  ComponentSize,
  ColorType,
  BreakpointName,
  FormComponentProps,
  DeconstructValue
} from '@veltra/utils'
```

## 共享类型

| 类型                  | 含义                                                                        |
| --------------------- | --------------------------------------------------------------------------- |
| `ComponentSize`       | `'small' \| 'default' \| 'large'`                                           |
| `ColorType`           | `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'`                 |
| `BreakpointName`      | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`                                      |
| `ComponentProps`      | `{ size?: ComponentSize }`                                                  |
| `FormComponentProps`  | 继承 `ComponentProps`，增加 `label/field/tips/disabled/readonly/span`       |
| `FormContextProps`    | UForm 通过 provide 下发的上下文形状（`model`、`labelWidth`、`readonly` 等） |
| `FormFieldItem`       | 字段注册项：`validate()`、`clearValidate?()`                                |
| `DeconstructValue<E>` | 把 `_XxxExposed`（含 ShallowRef）解为 `XxxExposed`（值类型）                |
| `RenderReturn`        | 渲染函数允许的返回类型联合（VNode / string / null / 数组）                  |

详细字段见 `node_modules/@veltra/utils/dist/index.d.ts`。

### 命名约定

```ts
export interface ButtonProps extends ComponentProps { ... }
export interface ButtonEmits { (e: 'click', ev: MouseEvent): void }
export interface _ButtonExposed { el: ShallowRef<HTMLButtonElement | undefined> }
export type ButtonExposed = DeconstructValue<_ButtonExposed>  // { el: HTMLButtonElement | undefined }
```

## 共享常量

```ts
import { NAME_SPACE, CLS_PREFIX, FORM_EMPTY_CONTENT } from '@veltra/utils/shared'

NAME_SPACE // 'U'   — 组件名前缀
CLS_PREFIX // 'u-'  — CSS 类名前缀
FORM_EMPTY_CONTENT // '-'   — 表单空值占位符
```

## BEM 类名工厂

`bem(name)` = 默认前缀 `'u-'` 的工厂；`makeBEM(prefix)` 自定义前缀。

```ts
import { bem } from '@veltra/utils'
const cls = bem('button')

cls.b // 'u-button'
cls.e('icon') // 'u-button__icon'
cls.m('primary') // 'u-button--primary'
cls.em('icon', 'left') // 'u-button__icon--left'
bem.is('disabled', true) // 'is-disabled'（false 返回 ''）
cls.create('custom') // 'u-button-custom'
```

模板里：

```vue
<template>
  <button :class="[cls.b, cls.m(size), bem.is('disabled', disabled)]">
    <span :class="cls.e('icon')"><u-icon /></span>
    <span :class="cls.e('text')"><slot /></span>
  </button>
</template>
```

## DOM / Vue 工具

低频 API，签名详见类型定义。

```ts
withUnit(10) // '10px'
withUnit(10, 'rem') // '10rem'
withUnit('50%') // '50%' — 已是字符串原样返回

getZIndex() // 自增 z-index，浮层组件用

extractNormalVNodes(slots.default?.()) // 过滤注释/文本，返回真实组件 VNode

new ExpandTransition({ transition: 'height 0.25s ease', opacity: true })
// .enter / .leave / .setExpanded(el, expanded) — Collapse、Menu 复用的高度展开动画

new Tween({ from, to, duration, easing, onUpdate }) // 简易补间
```

## 相关

- `styles/index.md` — SCSS BEM mixins（与 `bem()` 对应的 SCSS 端实现）、主题运行时
- `compositions.md` — 基于这些类型的组合式函数（含 `useConfig`）
