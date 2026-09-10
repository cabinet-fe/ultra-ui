---
title: 内联样式与层叠工具
description: 命令式操作元素内联样式的工具集：setStyles / removeStyles 批量写入与清除 inline style，withUnit 给数值拼接 CSS 单位，zIndex 弹层层级自增单例（从 1000 起每次调用加一）。
aliases: [setStyles, removeStyles, withUnit, zIndex, z-index, 内联样式, style]
keywords: [setStyles, removeStyles, withUnit, zIndex, CSSProperties, attributeStyleMap, removeProperty, style, 弹层层级, 单位拼接, 批量设置样式, 移除样式, 弹窗置顶, camelCase, kebab-case]
---

# 内联样式与层叠工具

`@veltra/utils` 导出内联样式工具 `setStyles` / `removeStyles`（批量写入、清除 `el.style`）、单位拼接函数 `withUnit` 与弹层层级单例 `zIndex`。浮层定位、动画驱动、弹窗置顶等命令式样式场景全部使用这一组工具。

## 快速上手

浮层元素用 `setStyles` 定位、`zIndex()` 置顶，是组件库内部弹层组件的标准写法：

```ts
import { setStyles, zIndex } from '@veltra/utils'

const overlay = document.querySelector<HTMLElement>('.overlay')!

setStyles(overlay, { position: 'fixed', zIndex: zIndex(), top: '20px', right: '20px' })
// overlay.style.zIndex 被设为本次调用返回的数值（首次为 '1000'）
```

## API 签名

```ts
import type { CSSProperties } from 'vue'

/**
 * 批量设置元素内联样式
 * @param el 目标元素
 * @param styles 样式表，键为 camelCase（如 zIndex、paddingTop）
 */
export function setStyles(el: HTMLElement, styles: CSSProperties): void

/**
 * 批量移除元素内联样式
 * @param el 目标元素
 * @param props 要移除的 CSS 属性名，必须为 kebab-case（如 'padding-top'）
 */
export function removeStyles(el: HTMLElement, props: string[]): void

/**
 * 给数值拼接单位
 * @param value 数值、数值字符串或 undefined
 * @param unit 单位（如 'px'、'%'）
 * @returns 可拼接时返回 `${value}${unit}`；value 为 undefined 时返回 undefined；
 *          value 是非数值字符串时原样返回
 */
export function withUnit(value: number | string | undefined, unit: string): string | undefined

/**
 * 弹层层级：createIncrease(1000) 生成的模块级单例自增函数。
 * 首次调用返回 1000，之后每次调用加一，保证后打开的弹层叠在上层
 */
export const zIndex: () => number
```

## 参数说明

### setStyles

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `el` | `HTMLElement` | — | 是 | 目标元素 |
| `styles` | `CSSProperties`（Vue 类型） | — | 是 | 键必须为 camelCase（`zIndex`、`paddingTop`）；值为字符串或数字，逐键赋给 `el.style[key]` |

副作用：直接修改 `el` 的 inline style；键顺序为 `Object.keys` 顺序，逐键同步写入。

### removeStyles

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `el` | `HTMLElement` | — | 是 | 目标元素 |
| `props` | `string[]` | — | 是 | 必须为 kebab-case（`'padding-top'`、`'height'`）；支持 CSS Typed OM 的环境经 `attributeStyleMap.delete`（键自动转 kebab-case），否则走 `el.style.removeProperty`（该分支要求 kebab-case） |

副作用：清除匹配的 inline style；camelCase 键在无 `attributeStyleMap` 的环境不生效。

### withUnit

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `value` | `number \| string \| undefined` | — | 是 | `number` 或能被 `Number()` 解析的字符串拼接 `unit`；其余字符串视为已带单位原样返回；`undefined` 返回 `undefined` |
| `unit` | `string` | — | 是 | 任意 CSS 单位字符串（`'px'`、`'%'`、`'em'`）；原样拼接，不做合法性校验 |

### zIndex

无参数。返回 `number`。副作用与边界：

- 模块级单例，整个应用共享同一计数，调用顺序决定层级大小
- 首次调用返回 `1000`，第 n 次调用返回 `1000 + n - 1`
- 每次调用都会自增；渲染函数中重复调用会持续消耗数值，调用方自行保存结果

## 典型示例

### 弹窗打开时置顶并定位

```ts
import { setStyles, zIndex } from '@veltra/utils'

const dialog = document.querySelector<HTMLElement>('.dialog')!

// 每开一个弹窗调用一次 zIndex()，后开者层级必大于先开者
setStyles(dialog, {
  position: 'fixed',
  zIndex: zIndex(),
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)'
})
```

### 尺寸 prop 兼容数字与带单位字符串

```ts
import { withUnit } from '@veltra/utils'
import type { CSSProperties } from 'vue'

function cardStyle(width: number | string | undefined): CSSProperties {
  return { width: withUnit(width, 'px') }
}

cardStyle(200) // => { width: '200px' }
cardStyle('50%') // => { width: '50%' }
cardStyle(undefined) // => { width: undefined }
```

### 动画结束后清理临时样式

```ts
import { removeStyles, setStyles } from '@veltra/utils'

const panel = document.querySelector<HTMLElement>('.panel')!

setStyles(panel, { overflow: 'hidden', transition: 'height 0.25s ease' })

// 中间是动画播放时间；结束后清除临时 inline 样式，键用 kebab-case
removeStyles(panel, ['overflow', 'transition', 'will-change'])
```

## 注意事项

> [!WARNING]
> - `setStyles` 的键必须 camelCase，`removeStyles` 的键必须 kebab-case，两者方向相反；混用会导致样式不生效。
> - `withUnit` 是按传入 `unit` 拼接，不是只补 `px`；`withUnit('100%', 'px')` 返回 `'100%'` 原样。
> - `withUnit('', 'px')` 返回 `'px'`（空串被 `Number()` 解析为 0）；空串需调用方先行过滤。
> - `setStyles` 不清除未列出的属性；要恢复原状必须显式 `removeStyles`。
> - `zIndex` 是模块级单例而非每次调用独立的生成器；需要独立计数时用 `createIncrease(1000)`（见 `agent-docs/utils/animation.md`）。
> - 弹层层级基准从 1000 起；业务 CSS 中禁止给弹层写死 `z-index: 1000` 以下竞争值，统一走 `zIndex()`。
