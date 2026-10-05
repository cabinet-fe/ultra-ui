---
title: UButton 按钮（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端按钮组件，API 与桌面端 UButton 对齐：五种语义色、三档尺寸、plain/text/circle 形态、loading 与 disabled 状态、图标按钮；任何尺寸的可点击热区不小于 44×44，按压反馈走 :active。'
aliases: [UButton, Button, 按钮, 移动端按钮, MobileButton]
keywords:
  [
    UButton,
    ButtonProps,
    ButtonType,
    ButtonExposed,
    propagate,
    iconPosition,
    loadingIcon,
    circle,
    plain,
    44px 热区,
    触控热区,
    按压态,
    点击事件,
    阻止冒泡,
    图标按钮,
    加载状态,
    禁用按钮,
    语义色按钮,
    移动端按钮
  ]
---

# UButton 按钮（@veltra/mobile 移动端）

`@veltra/mobile` 导出按钮组件 `UButton`（`packages/mobile/src/index.ts` 具名导出）。渲染原生 `<button type="button">`，`type` 指定五种语义色，`size` 指定三档尺寸，`plain` / `text` / `circle` 切换形态，`loading` / `disabled` 控制状态，`icon` 传图标组件。与桌面端的差异：移动端任何尺寸的可点击热区不小于 44×44，按压反馈用 `:active` 而非 `:hover`，且不导出 `UButtonGroup`。

## 快速上手

```vue
<script setup lang="ts">
import { UButton } from '@veltra/mobile'
import '@veltra/mobile/components/button/style'

function onSave() {
  console.log('saved') // => 点击按钮时输出 'saved'
}
</script>

<template>
  <u-button type="primary" @click="onSave">保存</u-button>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、按钮无颜色。组件样式按需引入 `@veltra/mobile/components/button/style`，仅导入组件不带入样式。

## API 签名

```ts
import type { Component } from 'vue'

/** 五种语义色 */
export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** 按钮类型 = 语义色 */
export type ButtonType = ColorType

/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'

/** 按钮属性类型（size 继承自 ComponentProps） */
export interface ButtonProps extends ComponentProps {
  /** 组件尺寸，默认 'default' */
  size?: ComponentSize
  /** 按钮语义色，不传时为无语义的默认灰样式 */
  type?: ButtonType
  /** 是否以文本形式展示（无边框底色） */
  text?: boolean
  /** 朴素模式（类型色文字 + 浅底 + 透明描边） */
  plain?: boolean
  /** 加载中，为 true 时不触发 click */
  loading?: boolean
  /** 加载图标，默认 Loading（@veltra/icons） */
  loadingIcon?: Component
  /** 圆形，宽度不小于高度；只放图标时使用 */
  circle?: boolean
  /** 禁用，默认 false；为 true 时不触发 click */
  disabled?: boolean
  /** 图标组件，传 @veltra/icons/normal 中的图标 */
  icon?: Component
  /** 图标大小，单位 px */
  iconSize?: number
  /** 图标位置，默认 'left' */
  iconPosition?: 'left' | 'right'
  /** 点击事件是否向父元素冒泡，默认 true */
  propagate?: boolean
}

export interface ButtonEmits {
  /** 点击事件 */
  (name: 'click', e: MouseEvent): void
}

/** 按钮暴露的属性和方法（原 _ButtonExposed 经 DeconstructValue 解包后的形态：模板 ref 上直接读 el，不需要 .value） */
export interface ButtonExposed {
  el: HTMLButtonElement | undefined
}
```

`DeconstructValue` 已在类型入口展开：模板 ref 上 `instance.el` 直接是 `HTMLButtonElement | undefined`。

## 参数说明

| 参数           | 类型                                                        | 默认        | 必填 | 约束                                                         |
| -------------- | ----------------------------------------------------------- | ----------- | :--: | ------------------------------------------------------------ |
| `type`         | `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'` | —           |  否  | 枚举仅这五个值；不传时渲染无语义色的默认灰底按钮             |
| `size`         | `'small' \| 'default' \| 'large'`                           | `'default'` |  否  | 控制字号（small 14px、其余 16px，走 `--um-*` 密度 token）、圆角与档位高度；可点击热区始终不小于 44×44（见注意事项） |
| `text`         | `boolean`                                                   | `false`     |  否  | 文本按钮：无底色、无边框、无阴影                             |
| `plain`        | `boolean`                                                   | `false`     |  否  | 朴素模式：类型色文字 + 类型色 `light-9` 浅底 + 透明描边      |
| `circle`       | `boolean`                                                   | `false`     |  否  | 圆形；无内边距，热区不小于 44×44，只放图标时使用             |
| `loading`      | `boolean`                                                   | `false`     |  否  | 显示加载图标（替换左侧图标）并屏蔽 click                     |
| `loadingIcon`  | `Component`                                                 | `Loading`   |  否  | 加载图标组件，从 `@veltra/icons` 导入                        |
| `disabled`     | `boolean`                                                   | `false`     |  否  | 禁用；屏蔽 click、去阴影、字色变次要色                       |
| `icon`         | `Component`                                                 | —           |  否  | 图标组件；`loading` 为 true 时左侧图标被加载图标替换         |
| `iconSize`     | `number`                                                    | —           |  否  | 图标边长，单位 px；写入图标容器 `font-size`                  |
| `iconPosition` | `'left' \| 'right'`                                         | `'left'`    |  否  | `right` 时图标在文字之后                                     |
| `propagate`    | `boolean`                                                   | `true`      |  否  | `false` 时点击调用 `stopPropagation()`，事件不再冒泡到父元素 |

插槽：默认插槽放按钮文字内容。

## 方法与事件

| 事件 / 暴露     | 签名                             | 说明                                                                                                                |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `click`         | `(e: MouseEvent) => void`        | 同步触发；`disabled` 或 `loading` 为 true 时不 emit 且阻止冒泡；`propagate: false` 时先 `stopPropagation()` 再 emit |
| `el`（exposed） | `HTMLButtonElement \| undefined` | 经模板 ref 访问，如 `btnRef.value?.el`；组件挂载前为 `undefined`                                                    |

## 典型示例

### 语义色与形态组合

```vue
<script setup lang="ts">
import { UButton } from '@veltra/mobile'
import '@veltra/mobile/components/button/style'
</script>

<template>
  <u-button>默认</u-button>
  <u-button type="primary">主要</u-button>
  <u-button type="success">成功</u-button>
  <u-button type="warning">警告</u-button>
  <u-button type="danger">危险</u-button>
  <u-button type="info">信息</u-button>

  <u-button type="primary" size="small">小</u-button>
  <u-button type="primary" size="large">大</u-button>

  <u-button type="primary" plain>朴素</u-button>
  <u-button type="danger" text>文本按钮</u-button>
  <u-button type="primary" disabled>禁用</u-button>
</template>
```

### 图标按钮与加载状态

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton } from '@veltra/mobile'
import { Edit, Refresh, Search } from '@veltra/icons/normal'
import '@veltra/mobile/components/button/style'

const saving = ref(false)

function onSave() {
  saving.value = true
  setTimeout(() => {
    saving.value = false // 模拟请求结束后关闭加载态
  }, 1000)
}
</script>

<template>
  <u-button type="primary" :icon="Search">搜索</u-button>
  <u-button type="primary" :icon="Search" icon-position="right" :icon-size="16">搜索</u-button>
  <u-button type="primary" circle :icon="Edit" aria-label="编辑" />
  <u-button type="primary" :loading="saving" @click="onSave">保存</u-button>
  <u-button type="primary" loading :loading-icon="Refresh">自定义加载图标</u-button>
</template>
```

### 列表行内按钮阻止冒泡

移动端列表整行可点时，行内按钮必须关掉冒泡，否则点击按钮会同时触发行点击：

```vue
<script setup lang="ts">
import { UButton } from '@veltra/mobile'
import '@veltra/mobile/components/button/style'

function onRowClick() {
  console.log('row') // => 点击按钮（propagate=false）时不会输出
}

function onAction() {
  console.log('action') // => 'action'
}
</script>

<template>
  <div @click="onRowClick">
    <span>列表行</span>
    <u-button size="small" type="primary" text :propagate="false" @click="onAction">详情</u-button>
  </div>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端任何尺寸的可点击热区不小于 44×44：样式计算 `min-height: max(--um-control-height-<size>, --um-touch-target)`（档位高度 32/40/48，热区下限 44），`circle` 同时保证 `min-width` 不小于 44px；桌面端高度直接跟随档位 token（light 预设 24/32/40px），没有 44px 下限。
> - 移动端按压反馈是 `:active`（背景色加深一档），没有 `:hover` 悬停态；桌面端主反馈是 `:hover` 变深、`:active` 去阴影。移动端同时用 `-webkit-tap-highlight-color: transparent` 关掉了系统点按高亮。
> - 移动端包不导出 `UButtonGroup`（桌面端导出）；按钮组场景直接用 `USpace` 排列，或循环渲染 `UButton`。
> - 本库原生按钮的 `type` 固定为 `"button"`，没有 `native-type` 属性；需要表单提交时自行监听 click 调用提交逻辑。
> - 组件不注入默认 `aria-label`：可访问名来自默认插槽文本或你传入的 `aria-label`（透传到根元素）。只有图标的按钮（`circle` + `icon`、无文字）必须自行传 `aria-label`。
> - 本库图标是 prop（`icon` 传组件），不是 `<template #icon>` 插槽；默认插槽只承载文字内容。
> - `type` 的五个枚举值是语义色，没有 `'default'`、`'text'` 取值；无色按钮是「不传 `type`」，文本按钮是「传 `text`」。
> - `disabled` / `loading` 时组件不 emit `click`，父级 `@click` 也不会收到，且点击被 `stopPropagation()` 拦截。
> - 键盘焦点环走 `:focus-visible`（禁用与加载态除外）；移动端触控不触发，外接键盘时可见。
> - 暴露的 `el` 是解包后的形态，直接读 `btnRef.value?.el`，禁止再写 `.el.value`。

## 常见问题

### 点击按钮没有任何反应

按顺序排查：`disabled` 或 `loading` 是否为 true（此时组件直接吞掉点击）；事件是否绑在 `@click` 上（本库事件名是 `click`）：

```vue
<script setup lang="ts">
import { UButton } from '@veltra/mobile'
import '@veltra/mobile/components/button/style'

function onClick() {
  console.log('clicked') // => 'clicked'
}
</script>

<template>
  <u-button type="primary" @click="onClick">可点击</u-button>
</template>
```

### 点击按钮时外层容器的 click 也被触发了

原因：`propagate` 默认 `true`。修复：给按钮设 `:propagate="false"`，或在外层用 `@click.stop` 自行拦截。

### 小尺寸按钮在手机上不好点

原因：视觉上 `size="small"` 的字号与圆角变小，但热区被强制抬到 44px（`min-height: max(--um-control-height-small, --um-touch-target)`）。修复：不要通过缩小按钮换密度，改用 `text` 形态或减少页面按钮数量；热区下限无法通过 `size` 关闭。
