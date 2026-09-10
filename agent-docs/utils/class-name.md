---
title: DOM 类名与 BEM 工具
description: 操作 HTMLElement 类名与生成 BEM 类名的工具集：addClass / removeClass 批量增删 class，bem / makeBEM 生成 block__element--modifier 与 is-* 状态类，NAME_SPACE / CLS_PREFIX 提供全局命名前缀。
aliases: [addClass, removeClass, bem, makeBEM, BEM, CLS_PREFIX, NAME_SPACE, BEMFactory]
keywords: [addClass, removeClass, bem, makeBEM, NAME_SPACE, CLS_PREFIX, BEMFactory, classList, is-active, is-disabled, 状态类, 修饰符, 命名空间, 样式隔离, 前缀, 动态class]
---

# DOM 类名与 BEM 工具

`@veltra/utils` 导出 DOM 类名操作函数 `addClass` / `removeClass`、BEM 类名工厂 `bem`（预置前缀）与 `makeBEM`（自定义前缀）、全局常量 `NAME_SPACE`（`'U'`）与 `CLS_PREFIX`（`'u-'`）。组件根类名、元素类名、修饰符与 `is-*` 状态类全部通过这套工具生成，保证与组件库样式选择器一致。

## 快速上手

用预置工厂 `bem` 生成组件的全部类名，状态类用 `bem.is(name, condition)` 按条件拼接：

```ts
import { bem } from '@veltra/utils'

const disabled = true
const loading = false

const cls = bem('button')

const classList = [
  cls.b, // => 'u-button'
  cls.m('large'), // => 'u-button--large'
  cls.e('icon'), // => 'u-button__icon'
  bem.is('disabled', disabled), // => 'is-disabled'
  bem.is('loading', loading) // => ''
].filter(Boolean)
```

## API 签名

### addClass / removeClass

```ts
/** 向元素添加一个或多个 class，内部调用 el.classList.add */
export function addClass(el: HTMLElement, className: string | string[]): void

/** 从元素移除一个或多个 class，内部调用 el.classList.remove */
export function removeClass(el: HTMLElement, className: string | string[]): void
```

### bem / makeBEM

```ts
/** 全局组件命名前缀，值为 'U'。组件公开名由它拼出，如 UButton */
export const NAME_SPACE: 'U'

/** CSS 类前缀，值为 'u-'（NAME_SPACE 转小写后加连字符） */
export const CLS_PREFIX: 'u-'

/** 预置 CLS_PREFIX 前缀的 BEM 工厂，等价于 makeBEM('u-') */
export const bem: BEMFactory<'u-'>

/**
 * 创建自定义前缀的 BEM 工厂
 * @param prefix 前缀，必须是 '' 或以 '-' 结尾的字符串（如 'app-'），否则类型错误
 */
export function makeBEM<Prefix extends '' | `${string}-`>(prefix: Prefix): BEMFactory<Prefix>

/** BEM 实例。B = `${P}${N}`（前缀 + 块名） */
export type BEM<N extends string, P extends string = 'u-', B extends string = `${P}${N}`> = {
  /** BEM 中的块，如 'u-button' */
  b: B
  /** BEM 中的元素（E），返回 `${B}__${name}` */
  e<const E extends string>(name: E): `${B}__${E}`
  /** 基于当前块创建子块工厂，子块名为 `${N}-${block}` */
  create<const Block extends string>(block: Block): BEM<`${N}-${Block}`, P>
  /** BEM 中的修饰符（M），返回 `${B}--${m}` */
  m<const M extends string>(m: M): `${B}--${M}`
  /** 元素 + 修饰符，返回 `${B}__${e}--${m}` */
  em<const E extends string, const M extends string>(e: E, m: M): `${B}__${E}--${M}`
}

/** BEM 工厂（makeBEM 的返回值） */
export interface BEMFactory<Prefix extends string> {
  /** 传入块名得到 BEM 实例 */
  <N extends string>(name: N): BEM<N, Prefix>
  /** 无条件生成 is-${name} */
  is<const N extends string>(name: N): `is-${N}`
  /** condition === true 时返回 is-${name}，否则返回 '' */
  is<const N extends string, C extends boolean | undefined>(
    name: N,
    condition: C
  ): C extends true ? `is-${N}` : ''
}
```

## 参数说明

### addClass / removeClass

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `el` | `HTMLElement` | — | 是 | 目标元素 |
| `className` | `string \| string[]` | — | 是 | 单个类名或类名数组；数组时逐项调用 `classList.add` / `classList.remove` |

无返回值（`void`），同步执行；对不存在的类调用 `remove` 不报错（`classList` 语义）。

### makeBEM

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `prefix` | `'' \| \`${string}-\`` | — | 是 | 必须为空串或以 `-` 结尾（如 `'u-'`、`'app-'`）；不以 `-` 结尾时 TypeScript 编译报错 |

### bem 实例成员

| 成员 | 返回 | 示例（`bem('button')`） |
| --- | --- | --- |
| `b` | 块 | `'u-button'` |
| `e(name)` | `${b}__${name}` | `e('icon')` → `'u-button__icon'` |
| `m(name)` | `${b}--${name}` | `m('large')` → `'u-button--large'` |
| `em(e, m)` | `${b}__${e}--${m}` | `em('icon', 'left')` → `'u-button__icon--left'` |
| `create(block)` | 块名为 `${name}-${block}` 的子 BEM 实例 | `create('panel')` 的 `b` 为 `'u-button-panel'` |
| `bem.is(name)` | 恒返回 `'is-${name}'` | `bem.is('active')` → `'is-active'` |
| `bem.is(name, cond)` | `cond === true` 返回 `'is-${name}'`，否则 `''` | `bem.is('disabled', false)` → `''` |

`makeBEM(prefix)` 返回的工厂成员与上表一致，前缀换成 `prefix`。

## 典型示例

### 组件模板中拼接根类名与状态类

```vue
<script setup lang="ts">
import { bem } from '@veltra/utils'
import { computed, ref } from 'vue'

const disabled = ref(false)

const classList = computed(() => [
  bem('switch').b,
  bem.is('checked', true),
  bem.is('disabled', disabled.value)
])
// disabled 为 false 时 => ['u-switch', 'is-checked']
// disabled 为 true 时  => ['u-switch', 'is-checked', 'is-disabled']
</script>

<template>
  <div :class="classList">开关</div>
</template>
```

### 自定义前缀做样式隔离

微前端或独立包内用 `makeBEM` 生成自己的前缀，避免与 `u-` 冲突：

```ts
import { makeBEM } from '@veltra/utils'

const bem = makeBEM('app-')
const cls = bem('toolbar')

cls.b // => 'app-toolbar'
cls.e('item') // => 'app-toolbar__item'
cls.em('item', 'active') // => 'app-toolbar__item--active'

// create 生成子块实例，b 为 'app-toolbar-panel'
const sub = cls.create('panel')
sub.b // => 'app-toolbar-panel'
sub.m('open') // => 'app-toolbar-panel--open'
```

### 命令式增删 class

```ts
import { addClass, removeClass } from '@veltra/utils'

const el = document.querySelector<HTMLElement>('.target')!

addClass(el, 'is-active')
addClass(el, ['is-focus', 'is-dragging'])

removeClass(el, 'is-focus')
removeClass(el, ['is-active', 'is-dragging'])
```

## 注意事项

> [!WARNING]
> - 本库类名前缀是 `u-`（如 `u-button`），不是 Element 的 `el-`、Ant Design 的 `ant-`；覆盖样式时选择器写 `.u-button`。
> - 本库状态类是 `is-*`（如 `is-active`、`is-disabled`），不是 `--active` 后缀式修饰符；`bem.m()` 才生成 `--` 修饰符。
> - `bem.is(name)` 不传第二参时恒返回 `'is-${name}'`；要按条件拼接必须传第二参 `bem.is(name, condition)`。
> - `makeBEM` 的前缀必须以 `-` 结尾或为空串；传 `'u'` 会得到类型错误 `'"u"' does not satisfy the constraint '"" | \`${string}-\`'`。
> - `NAME_SPACE`（`'U'`）用于组件名（`UButton`），`CLS_PREFIX`（`'u-'`）用于 CSS 类名；大小写不同，禁止混用。
> - `addClass` / `removeClass` 不做去重与存在性检查，重复添加同一类由 `classList` 去重语义兜底。
