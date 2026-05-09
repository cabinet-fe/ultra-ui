# @veltra/utils

底层工具函数与共享类型。所有 Veltra 组件库包的基石。

## 子路径

| 子路径 | 内容 |
|--------|------|
| `@veltra/utils` | 全部导出（工具 + 类型 + 常量） |
| `@veltra/utils/shared` | 仅共享常量 |

## 导入示例

```ts
import { bem, makeBEM, CLS_PREFIX, NAME_SPACE } from '@veltra/utils'
import type { ComponentProps, ComponentSize, ColorType } from '@veltra/utils'
```

---

## 共享常量

```ts
import { NAME_SPACE, CLS_PREFIX, FORM_EMPTY_CONTENT } from '@veltra/utils/shared'

NAME_SPACE          // 'U'          — 组件名前缀
CLS_PREFIX          // 'u-'         — CSS 类名前缀
FORM_EMPTY_CONTENT  // '-'          — 表单空值占位符
```

---

## BEM 类名工具

### `bem(name)` — 快捷工厂

默认前缀 `'u-'`，适用于所有 Veltra 组件。

```ts
import { bem } from '@veltra/utils'

const cls = bem('button')

// Block
cls.b                           // 'u-button'

// Element
cls.e('icon')                   // 'u-button__icon'
cls.e('text')                   // 'u-button__text'

// Modifier
cls.m('primary')                // 'u-button--primary'
cls.m('size-small')             // 'u-button--size-small'

// Element + Modifier
cls.em('icon', 'left')          // 'u-button__icon--left'

// State（is-xxx 形式）
cls.is('disabled', true)        // 'u-button.is-disabled'
cls.is('disabled', false)       // ''（空字符串）

// 自定义后缀
cls.create('custom')            // 'u-button-custom'
```

**典型组件用法：**

```vue
<script setup lang="ts">
import { bem } from '@veltra/utils'

const props = defineProps<{ disabled?: boolean; size?: string }>()
const cls = bem('button')

const classList = computed(() => [
  cls.b,
  cls.m(size),
  cls.is('disabled', props.disabled),
  cls.is('loading', loading.value)
])
</script>

<template>
  <button :class="classList">
    <span :class="cls.e('icon')"><u-icon /></span>
    <span :class="cls.e('text')"><slot /></span>
  </button>
</template>
```

### `makeBEM(prefix)` — 自定义前缀

```ts
import { makeBEM } from '@veltra/utils'

const cls = makeBEM('my-')

cls.b                           // 'my-'（需配合 name 调用）
// 实际用法：不直接调 b，作为工厂创建：
const btnCls = cls('btn')       // 返回同上结构的 BEM 对象
btnCls.b                        // 'my-btn'
btnCls.e('icon')                // 'my-btn__icon'
```

---

## 共享类型

### `ComponentSize`

```ts
type ComponentSize = 'small' | 'default' | 'large'
```

### `ColorType`

```ts
type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'
```

### `BreakpointName`

```ts
type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
```

### `ComponentProps`

所有组件的基础 Props 接口：

```ts
interface ComponentProps {
  size?: ComponentSize
}
```

### `FormComponentProps`

表单组件专用 Props（继承 `ComponentProps`）：

```ts
interface FormComponentProps extends ComponentProps {
  tips?: string          // 提示文字
  span?: number | 'full' | ({ [key in BreakpointName]?: number | 'full' } & { default: number | 'full' }) // 栅格跨度
  label?: string         // 标签文字
  field?: string         // 表单字段名
  disabled?: boolean     // 禁用
  readonly?: boolean     // 只读
}
```

### `PropsWithServerQuery`

```ts
interface PropsWithServerQuery {
  api?: string
  query?: Record<string, any>
}
```

### `DeconstructValue` / `RenderReturn`

```ts
// 将 ShallowRef 解构为其值类型（用于 Exposed）
type DeconstructValue<E>

// 渲染函数返回类型联合
type RenderReturn
```

### 组件类型命名约定

```ts
// Props 类型：<组件名>Props
export interface ButtonProps extends ComponentProps { ... }
export interface InputProps extends FormComponentProps { ... }

// Emits 类型：<组件名>Emits
export interface ButtonEmits {
  (e: 'click', value: MouseEvent): void
}

// Exposed 类型（内部定义用下划线前缀）
export interface _ButtonExposed {
  el: ShallowRef<HTMLButtonElement | undefined>
}

// Exposed 类型（导出，解构 ref）
export type ButtonExposed = DeconstructValue<_ButtonExposed>
```

---

## DOM 工具

```ts
import {
  withUnit,
  ExpandTransition,
  getZIndex,
  // ... 更多 DOM 工具
} from '@veltra/utils'
```

### `withUnit(value, unit?)`

给数值加单位：

```ts
withUnit(10)        // '10px'
withUnit(10, 'rem') // '10rem'
withUnit('50%')     // '50%'（已是字符串则原样返回）
```

### `ExpandTransition`

可复用的高度展开/收起动画工具，当前由 `UCollapse`、`UMenu` 复用。支持两种调用方式：

```ts
import { ExpandTransition } from '@veltra/utils'

const expandTransition = new ExpandTransition({
  transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: true
})

// Vue <transition> hooks
expandTransition.enter(el)
expandTransition.afterEnter(el)
expandTransition.beforeLeave(el)
expandTransition.leave(el)
expandTransition.afterLeave(el)

// 命令式展开/收起
expandTransition.setExpanded(el, expanded)
expandTransition.expand(el)
expandTransition.collapse(el)
expandTransition.cancel(el)
```

`enterTransition` / `leaveTransition` 可分别覆盖进场和离场 transition；命令式 `expand()` 完成后会把高度恢复为 `auto`，`collapse()` 完成后保持 `0px`。

---

## Vue 工具

```ts
import { extractNormalVNodes } from '@veltra/utils'

// 从 VNode 数组中提取普通 VNode（排除注释、文本等）
extractNormalVNodes(slots.default?.())
```

---

## Tween 工具

```ts
import { Tween } from '@veltra/utils'

const tween = new Tween({
  from: { x: 0, y: 0 },
  to: { x: 100, y: 200 },
  duration: 300,
  easing: 'ease-out',
  onUpdate: (values) => {
    element.style.transform = `translate(${values.x}px, ${values.y}px)`
  }
})

tween.start()
```

---

## 相关文档

- styles.md — SCSS BEM mixins（对应的 SCSS 端实现）
- compositions.md — 基于这些类型构建的组合式函数
