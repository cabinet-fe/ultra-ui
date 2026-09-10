---
title: UTip 文字提示
description: "@veltra/desktop 导出的气泡文字提示组件。默认插槽元素为触发器，悬停或点击后在其上方/下方/左右弹出只读提示，支持 12 种 placement（direction + alignment）、受控显隐、弹出延时、自定义内容标签，用于字段说明、图标释义等轻量提示。"
aliases: [UTip, Tip, Tooltip, tooltip 提示, 气泡提示, 文字提示]
keywords: [UTip, TipProps, TipDirection, TipAlign, content, trigger, triggerDom, direction, alignment, showDelay, hideArrow, contentTag, visible, update:visible, hover 触发, 点击触发, 受控显隐, 气泡定位, 提示气泡]
---

# UTip 文字提示

`@veltra/desktop` 导出组件 `UTip`。默认插槽的第一个元素是触发器，`trigger` 为 `'hover'`（默认）或 `'click'`；提示内容用 `content` 或 `#content` 插槽，弹出层通过 floating-ui 定位到 `direction` + `alignment` 组合的方向上，Teleport 到 `body` 下的 `#pop-container` 容器。UTip 只承载只读信息；需要用户「确认 / 取消」操作的用 `UPopConfirm`。

## 快速上手

```vue
<script setup lang="ts">
import { UButton, UTip } from '@veltra/desktop'
</script>

<template>
  <u-tip content="保存后不可撤销">
    <u-button>悬停查看</u-button>
  </u-tip>
</template>
```

视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、气泡无颜色。

## API 签名

```ts
import type { CSSProperties } from 'vue'

/** 弹出方向 */
export type TipDirection = 'top' | 'bottom' | 'left' | 'right'

/** 方向上的对齐 */
export type TipAlign = 'center' | 'start' | 'end'

/** tip 提示组件属性 */
export interface TipProps {
  /** 受控显隐；传值即进入受控模式，显隐变化时 emit update:visible；不传则组件内部维护 */
  visible?: boolean
  /** 提示内容，#content 插槽存在时被插槽覆盖，默认 '' */
  content?: string
  /** 触发方式，默认 'hover' */
  trigger?: 'hover' | 'click'
  /** 方向，默认 'top'（withDefaults 实际值；类型 JSDoc 里的 'auto' 不是运行时默认） */
  direction?: TipDirection
  /** 对齐方式，默认 'center' */
  alignment?: TipAlign
  /** 自定义定位基准元素；不传时用默认插槽渲染出的触发元素 */
  triggerDom?: HTMLElement
  /** 隐藏箭头，默认 false */
  hideArrow?: boolean
  /** 提示内容的标签名，默认 'div' */
  contentTag?: string
  /** 禁用提示，默认 false；为 true 时不绑定任何触发事件 */
  disabled?: boolean
  /** 弹出延时毫秒，默认 0；仅 trigger="hover" 时生效 */
  showDelay?: number
  /** 自定义气泡样式，作用于弹出层 */
  style?: CSSProperties | string
  /** 自定义气泡 class，作用于弹出层 */
  class?: string | string[] | Record<string, boolean>
}

/** tip 提示组件事件 */
export interface TipEmits {
  (e: 'update:visible', value: boolean): void
}

/** 暴露的属性和方法：TipExposed 为空接口，模板 ref 上取不到任何方法或属性 */
export type TipExposed = {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `visible` | `boolean` | — | 否 | 传任意布尔值（含 `false`）即受控：显隐只由该值驱动，交互时 emit `update:visible`；不传为非受控 |
| `content` | `string` | `''` | 否 | 纯文本内容；复杂内容用 `#content` 插槽 |
| `trigger` | `'hover' \| 'click'` | `'hover'` | 否 | hover 绑定 mouseenter/mouseleave；click 绑定 click + 点击外部关闭 |
| `direction` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | 否 | 四个主方向；空间不足时自动 flip 翻转 |
| `alignment` | `'center' \| 'start' \| 'end'` | `'center'` | 否 | 与 `direction` 组合成 placement；`'center'` 时不拼接后缀 |
| `triggerDom` | `HTMLElement` | — | 否 | 更换定位与关闭判定的基准 DOM |
| `hideArrow` | `boolean` | `false` | 否 | `true` 时不渲染箭头元素 |
| `contentTag` | `string` | `'div'` | 否 | 弹出层根标签名，任意合法 HTML 标签字符串 |
| `disabled` | `boolean` | `false` | 否 | `true` 时 hover/click 事件全部不绑定 |
| `showDelay` | `number` | `0` | 否 | 毫秒；仅 `trigger="hover"` 生效，click 触发无延时 |
| `style` | `CSSProperties \| string` | — | 否 | 落在弹出层上，不影响触发器 |
| `class` | `string \| string[] \| Record<string, boolean>` | — | 否 | 落在弹出层上（class 是本组件声明 prop，不做 attr 透传） |

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:visible` | `value: boolean` | 仅受控模式（传了 `visible`）下，hover 进入/离开或 click 切换时 emit；非受控模式不 emit |

行为细节（源码事实）：

- hover 触发：`mouseenter` 打开，`mouseleave` 延迟 250ms 关闭（给鼠标移入气泡留时间）；`showDelay > 0` 时打开再延迟对应毫秒。
- click 触发：点击触发器打开；点击触发器以外任意位置关闭（点击触发器本身不关闭）。
- 触发元素随页面滚动（祖先滚动容器 scroll）或窗口 resize 改变位置时，气泡直接关闭，不跟随重定位。
- 弹出层 `z-index` 由库内 `zIndex()` 递增分配；进入过渡 0.25s ease、离开 0.15s ease-out（透明度 + scale 0.9）。

## 典型示例

### hover 提示与方向对齐

```vue
<script setup lang="ts">
import { UButton, UTip } from '@veltra/desktop'
</script>

<template>
  <u-tip content="提示内容" direction="bottom" alignment="start">
    <u-button>底部左对齐</u-button>
  </u-tip>
  <u-tip content="悬停 500ms 后才弹出" :show-delay="500">
    <u-button>延迟弹出</u-button>
  </u-tip>
  <u-tip content="这段提示不会显示" disabled>
    <u-button>禁用提示</u-button>
  </u-tip>
</template>
```

### click 触发 + 受控显隐 + 自定义内容

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UTip } from '@veltra/desktop'

const visible = ref(false)
</script>

<template>
  <u-tip trigger="click" v-model:visible="visible">
    <u-button>点击打开</u-button>
    <template #content>
      <p>支持任意结构的自定义内容</p>
    </template>
  </u-tip>
  <p>当前状态：{{ visible ? '打开' : '关闭' }}</p>
</template>
```

### 更换定位基准元素与隐藏箭头

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { UTip } from '@veltra/desktop'

// 定位基准是下面的 div，而不是默认插槽里的 span
const customEl = useTemplateRef<HTMLElement>('customEl')
</script>

<template>
  <u-tip content="提示锚定在另一元素上" :trigger-dom="customEl" :hide-arrow="true">
    <span>这段文本不作为定位基准</span>
  </u-tip>
  <div ref="customEl">实际定位基准元素</div>
</template>
```

## 注意事项

> [!WARNING]
> - 本库弹出方向参数是 `direction`（`'top' | 'bottom' | 'left' | 'right'`），不是 Element Plus 的 12 个 placement 字符串（如 `'top-start'`）；对齐用 `alignment` 单独传。
> - 默认插槽只取第一个元素节点作为触发器；放多个兄弟节点时只有第一个生效，触发器必须单根。
> - 触发器不是 DOM 包裹：UTip 通过 `UNodeRender` 直接给插槽元素绑事件，不给触发器加额外 wrapper。
> - 气泡没有主题色变体（无 `type` / `effect` 属性）：统一浅色卡片（`--u-bg-color-top` 底、`--u-shadow-lg` 阴影、圆角），要改外观用 `style` / `class` prop 作用到弹出层。
> - `UTip` 只展示信息；需要用户点击「确认 / 取消」的二次确认场景用 `UPopConfirm`，不是 UTip。
> - `showDelay` 只对 hover 生效；click 触发传它无效果。
> - 类型文件中 `direction` 的 JSDoc 写 `@default 'auto'`，运行时默认值是 `'top'`（`withDefaults`），以 `'top'` 为准。
> - 气泡 Teleport 到 `body > #pop-container`；禁止给祖先设 `transform` 相关裁剪来控制气泡位置，定位由 floating-ui 计算。

## 常见问题

### 悬停后气泡不出现

按顺序排查：`disabled` 是否为 true；默认插槽里是否有元素（空插槽没有触发器）；气泡是否渲染在了视口外（用 `direction` + `alignment` 调整，空间不足时组件会自动 flip）。修复示例：

```vue
<script setup lang="ts">
import { UButton, UTip } from '@veltra/desktop'
</script>

<template>
  <u-tip content="提示文本">
    <u-button>触发器必须是单根元素</u-button>
  </u-tip>
</template>
```

### 受控模式下点击没有反应

原因：传了 `visible` 即为受控模式，组件自身不再改内部状态，必须监听 `update:visible` 回写。修复：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTip } from '@veltra/desktop'

const visible = ref(false)
</script>

<template>
  <u-tip content="受控提示" :visible="visible" @update:visible="visible = $event">
    <button type="button">受控触发器</button>
  </u-tip>
</template>
```
