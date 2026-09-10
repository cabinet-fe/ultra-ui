---
title: "UCollapse / UCollapseItem 折叠面板"
description: "@veltra/desktop 导出的折叠面板组件。UCollapse 用 v-model 管理展开项（数组多开、accordion 手风琴单开），UCollapseItem 支持禁用、自定义头部插槽、自定义展开图标与折叠后卸载内容，支持嵌套与独立使用。"
aliases: [UCollapse, UCollapseItem, Collapse, CollapseItem, 折叠面板, 手风琴, Accordion]
keywords: [CollapseProps, CollapseItemProps, CollapseModelValue, CollapseValue, accordion, defaultCollapseAll, expandIcon, destroyOnCollapse, title, disabled, "#header", 手风琴, 互斥展开, 自定义头部, 展开图标, 嵌套, 禁用, 展开动画, 默认折叠, 独立使用]
---

# UCollapse / UCollapseItem 折叠面板

`@veltra/desktop` 导出折叠面板 `UCollapse` 与面板项 `UCollapseItem`。`UCollapse` 用 `v-model` 管理展开项，普通模式传数组可同时展开多项，`accordion` 手风琴模式传单值互斥展开；`UCollapseItem` 支持禁用、`#header` 自定义标题区、`expandIcon` 自定义展开图标、`destroyOnCollapse` 折叠后卸载内容，支持嵌套与脱离容器独立使用。

## 快速上手

```vue
<script setup lang="ts">
import { UCollapse, UCollapseItem } from '@veltra/desktop'
import { ref } from 'vue'
import type { CollapseModelValue } from '@veltra/desktop'

const active = ref<CollapseModelValue>(['basic'])
</script>

<template>
  <u-collapse v-model="active">
    <u-collapse-item value="basic" title="基础信息">姓名、邮箱与部门。</u-collapse-item>
    <u-collapse-item value="secure" title="安全设置">密码与二次验证。</u-collapse-item>
  </u-collapse>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、面板无颜色。

## API 签名

```ts
import type { Component } from 'vue'

/** Collapse 项的唯一标识 */
export type CollapseValue = string | number

/** Collapse modelValue：手风琴模式为单值，普通模式为数组（也兼容传入单值） */
export type CollapseModelValue = CollapseValue | CollapseValue[]

/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'

export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

/** Collapse 组件属性 */
export interface CollapseProps extends ComponentProps {
  /** 当前展开项的 value（单个或多个） */
  modelValue?: CollapseModelValue
  /** 是否手风琴模式（一次只能展开一项）。默认 false */
  accordion?: boolean
  /**
   * 是否默认折叠全部项。设为 false 时默认全部展开。
   * 默认 false
   */
  defaultCollapseAll?: boolean
  /** 自定义展开图标组件，活动态自动旋转 180°；接受任意 Vue 组件 */
  expandIcon?: Component
}

export interface CollapseEmits {
  (e: 'update:modelValue', value: CollapseModelValue): void
  /** 当前展开项变更时触发 */
  (e: 'change', value: CollapseModelValue): void
}

/** CollapseItem 组件属性 */
export interface CollapseItemProps {
  /** 唯一标识；在 UCollapse 内使用时必填，独立使用时可选 */
  value?: CollapseValue
  /**
   * 独立使用时的展开状态（v-model）。在 UCollapse 内由父组件 modelValue 管理，此属性无效。
   * 默认 false
   */
  modelValue?: boolean
  /** 标题文本；也可通过 #header 插槽自定义标题区，展开图标始终由组件渲染 */
  title?: string
  /** 是否禁用。默认 false */
  disabled?: boolean
  /** 独立使用时的自定义展开图标；在 UCollapse 内由父组件 expandIcon 统一管理 */
  expandIcon?: Component
  /**
   * 折叠动画结束后卸载内容 DOM（展开时重新挂载），减少长内容的渲染成本。
   * 卸载会丢失内容区的本地组件状态。默认 false
   */
  destroyOnCollapse?: boolean
}

export interface CollapseItemEmits {
  (e: 'update:modelValue', value: boolean): void
  /** 展开状态变更时触发（仅独立使用） */
  (e: 'change', value: boolean): void
}
```

## 参数说明

### UCollapse

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `CollapseValue \| CollapseValue[]` | — | 否 | 手风琴模式传单值，普通模式传数组；普通模式传单值也兼容。未传或为 `undefined`/`null`/`[]` 时按 `defaultCollapseAll` 决定初始展开 |
| `accordion` | `boolean` | `false` | 否 | 手风琴：点击新项展开并收起旧项；点击已展开项收起（modelValue 变 `[]`） |
| `defaultCollapseAll` | `boolean` | `false` | 否 | `false` 且无有效初始 `modelValue` 时，子项注册后自动全部展开（手风琴只展开第一个注册项）；`true` 时初始全部折叠 |
| `expandIcon` | `Component` | `ArrowDown` | 否 | 展开图标组件，活动态自动旋转 180°；统管所有子项 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 控制标题字号与间距 |

### UCollapseItem

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `value` | `string \| number` | — | UCollapse 内必填 | 在 UCollapse 内 `value` 为 `undefined` 时点击无效；同容器内禁止重复 |
| `modelValue` | `boolean` | `false` | 否 | 仅独立使用时生效 |
| `title` | `string` | — | 否 | 标题文本；提供 `#header` 插槽时被覆盖 |
| `disabled` | `boolean` | `false` | 否 | 禁用后点击与 Enter/Space 均不切换 |
| `expandIcon` | `Component` | `ArrowDown` | 否 | 仅独立使用时生效 |
| `destroyOnCollapse` | `boolean` | `false` | 否 | 折叠动画结束后卸载内容 DOM；重新展开会丢失内容区本地状态 |

插槽：`UCollapseItem` 有默认插槽（面板内容）与 `#header` 插槽（作用域 `{ isActive: boolean }`，只替换标题区，展开图标仍由组件渲染）。

## 方法与事件

| 事件 | 归属 | payload | 触发时机 |
| --- | --- | --- | --- |
| `update:modelValue` | UCollapse | `CollapseModelValue` | 展开项变化；手风琴为单值或 `[]`，普通模式为数组 |
| `change` | UCollapse | `CollapseModelValue` | 每次 `update:modelValue` 后同步发出 |
| `update:modelValue` | UCollapseItem | `boolean` | 仅独立使用时，点击头部切换 |
| `change` | UCollapseItem | `boolean` | 仅独立使用时 |

无暴露方法。展开动画为高度过渡 `height 0.24s cubic-bezier(0.4, 0, 0.2, 1)`；头部具备无障碍属性：`role="button"`、`aria-expanded`、`aria-disabled`，支持 Enter / Space 键切换。

## 典型示例

### 手风琴模式与默认折叠

```vue
<script setup lang="ts">
import { UCollapse, UCollapseItem } from '@veltra/desktop'
import { ref } from 'vue'
import type { CollapseModelValue } from '@veltra/desktop'

// accordion 模式绑定单值
const active = ref<CollapseModelValue>('a')
const collapsed = ref<CollapseModelValue>()
</script>

<template>
  <!-- 点击已展开项可重新关闭；disabled 项不可展开 -->
  <u-collapse v-model="active" accordion>
    <u-collapse-item value="a" title="什么是手风琴模式？">内容互斥地展开。</u-collapse-item>
    <u-collapse-item value="b" title="何时使用？">FAQ、设置面板等线性阅读场景。</u-collapse-item>
    <u-collapse-item value="c" title="无障碍支持" disabled>该项被禁用。</u-collapse-item>
  </u-collapse>

  <!-- default-collapse-all：无初始值时初始全部折叠，点击才展开 -->
  <u-collapse v-model="collapsed" default-collapse-all>
    <u-collapse-item value="y1" title="模块 A">初始为折叠状态。</u-collapse-item>
    <u-collapse-item value="y2" title="模块 B">手动点击头部才会展开。</u-collapse-item>
  </u-collapse>
</template>
```

### 自定义头部与展开图标

```vue
<script setup lang="ts">
import { UCollapse, UCollapseItem } from '@veltra/desktop'
import { Plus } from '@veltra/icons/normal'
import { ref } from 'vue'
import type { CollapseModelValue } from '@veltra/desktop'

const active = ref<CollapseModelValue>(['account'])
</script>

<template>
  <!-- expand-icon 换成 Plus：激活旋转 180° 后呈"×"视觉 -->
  <u-collapse v-model="active" :expand-icon="Plus">
    <u-collapse-item value="account">
      <!-- #header 只替换标题区，作用域 isActive 指示展开状态 -->
      <template #header="{ isActive }">
        <span>{{ isActive ? '• ' : '' }}账户信息</span>
      </template>
      <p>头像、昵称、绑定手机等基础资料。</p>
    </u-collapse-item>
    <u-collapse-item value="notify" title="通知偏好">
      <p>邮件、站内信与推送渠道的开关。</p>
    </u-collapse-item>
  </u-collapse>
</template>
```

### 嵌套内容与折叠后卸载

```vue
<script setup lang="ts">
import { UCollapse, UCollapseItem } from '@veltra/desktop'
import { ref } from 'vue'
import type { CollapseModelValue } from '@veltra/desktop'

const outer = ref<CollapseModelValue>(['pkg'])
const inner = ref<CollapseModelValue>(['pkg-components'])
</script>

<template>
  <!-- 内层 UCollapse 是独立实例，value 命名空间互不影响 -->
  <u-collapse v-model="outer">
    <u-collapse-item value="pkg" title="@veltra/desktop">
      <u-collapse v-model="inner">
        <u-collapse-item value="pkg-components" title="组件目录" destroy-on-collapse>
          <p>长内容折叠后卸载 DOM，重新展开时重新挂载（本地状态会丢失）。</p>
        </u-collapse-item>
        <u-collapse-item value="pkg-types" title="类型目录">
          <p>类型集中在 src/types/&lt;name&gt;.ts。</p>
        </u-collapse-item>
      </u-collapse>
    </u-collapse-item>
    <u-collapse-item value="styles" title="@veltra/styles">
      <p>颜色、间距、圆角统一通过 CSS 变量提供。</p>
    </u-collapse-item>
  </u-collapse>
</template>
```

## 注意事项

> [!WARNING]
> - 默认行为是**初始全部展开**（`defaultCollapseAll` 默认 `false` 且无初始值时）；要初始全收起必须显式写 `default-collapse-all`。
> - 包在 `UCollapse` 内时，`UCollapseItem` 的 `value` 必填，且禁止再给它写 `v-model`——展开状态完全由父级 `modelValue` 管理，子项上的 `modelValue` / `expandIcon` 属性此时无效。
> - 手风琴模式 `v-model` 绑定单值（`string | number`），普通模式绑定数组；两种模式都兼容传入单值。
> - `#header` 只替换标题区；展开图标始终由组件渲染，不要在 `#header` 里自己再放一个箭头。
> - 本库手风琴开关是 `accordion`，不是 Element Plus 折叠面板的手风琴数组写法；点击已展开的手风琴项会收起（modelValue 变 `[]`）。
> - `destroyOnCollapse` 会卸载内容 DOM：内容区里的表单输入值、组件内部状态在下次展开时全部重置。
