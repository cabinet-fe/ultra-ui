# UCollapse — 折叠面板

基于 CSS Grid `0fr → 1fr` 行高度过渡实现高度动画，零 JS 测量。

> [!IMPORTANT]
> **版本更新提醒**：从 `1.1.6` 开始，折叠面板采用全新的**独立胶囊卡片**视觉和交互设计。
>
> 1. 废弃并移除了外层边框与细线分割模式（即 `:bordered` 属性已失效，请勿使用）。
> 2. 移除了暴露给外部 `ref` 调用的程序化控制方法（`CollapseExposed` 实例方法，如 `toggle`, `expand`, `collapse` 等均已被移除）。
> 3. 新增了 `default-collapse-all` 属性以控制未绑定值时的默认折叠/展开行为。

## Import

```ts
// UCollapse、UCollapseItem 由 Vite 自动导入，无需手动 import
import type {
  CollapseProps,
  CollapseItemProps,
  CollapseEmits,
  CollapseValue,
  CollapseModelValue,
  CollapseIconPosition
} from '@veltra/desktop'
```

## 类型

```ts
type CollapseValue = string | number
type CollapseModelValue = CollapseValue | CollapseValue[]
type CollapseIconPosition = 'left' | 'right'
```

`accordion=true` 时 `modelValue` 应为单值，关闭时回写空数组 `[]`；`accordion=false` 时为数组（也兼容传入单值，组件内部自动包装为数组）。

## UCollapse Props

| prop                 | type                   | default     | 说明                                                                                                      |
| -------------------- | ---------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| `size`               | `ComponentSize`        | `'default'` | 组件尺寸，通过 `useFormFallbackProps` 回退到全局配置                                                      |
| `modelValue`         | `CollapseModelValue`   | —           | 当前展开项（v-model）                                                                                     |
| `accordion`          | `boolean`              | `false`     | 是否手风琴模式（一次只能展开一项）                                                                        |
| `defaultCollapseAll` | `boolean`              | `false`     | 是否默认折叠全部项。设为 `true` 时初始化默认全部折叠；为 `false` 时（默认）在外部未传绑定值时默认全部展开 |
| `iconPosition`       | `CollapseIconPosition` | `'right'`   | 展开/收起图标位置                                                                                         |
| `expandIcon`         | `Component`            | —           | 自定义展开图标组件，活动态会自动旋转 90°                                                                  |

## UCollapse Emits

| event               | 参数                          | 说明                                                    |
| ------------------- | ----------------------------- | ------------------------------------------------------- |
| `update:modelValue` | `(value: CollapseModelValue)` | v-model 更新                                            |
| `change`            | `(value: CollapseModelValue)` | 展开项变更时触发（在 `update:modelValue` 之后同步触发） |

## UCollapse Slots

| slot    | 参数 | 说明                            |
| ------- | ---- | ------------------------------- |
| default | —    | 放置 `UCollapseItem` 的默认插槽 |

组件当前仅用于声明式状态展示与绑定，未向外部暴露程序化控制的实例方法与属性。

---

## UCollapseItem Props

| prop       | type            | default | 说明                             |
| ---------- | --------------- | ------- | -------------------------------- |
| `value`    | `CollapseValue` | —       | **必填**，唯一标识               |
| `title`    | `string`        | —       | 标题文本，可被 `#title` 插槽替代 |
| `disabled` | `boolean`       | `false` | 是否禁用                         |
| `hideIcon` | `boolean`       | `false` | 是否隐藏展开图标                 |

## UCollapseItem Slots

| slot    | 参数                    | 说明                                     |
| ------- | ----------------------- | ---------------------------------------- |
| default | —                       | 折叠的内容                               |
| `title` | —                       | 自定义标题区域                           |
| `icon`  | `{ isActive: boolean }` | 自定义图标，可按 `isActive` 渲染不同图形 |

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { CollapseModelValue } from '@veltra/desktop'

const active = ref<CollapseModelValue>(['1'])
</script>

<template>
  <u-collapse v-model="active">
    <u-collapse-item value="1" title="标题 1">内容 1</u-collapse-item>
    <u-collapse-item value="2" title="标题 2">内容 2</u-collapse-item>
    <u-collapse-item value="3" title="标题 3">内容 3</u-collapse-item>
  </u-collapse>
</template>
```

### 手风琴模式

```vue
<template>
  <!-- accordion 模式下 modelValue 为单值。每个折叠项表现为独立的精致胶囊卡片 -->
  <u-collapse v-model="active" accordion>
    <u-collapse-item value="a" title="常规设置">…</u-collapse-item>
    <u-collapse-item value="b" title="高级配置">…</u-collapse-item>
    <u-collapse-item value="c" title="关于" disabled>…</u-collapse-item>
  </u-collapse>
</template>
```

### 自定义图标与标题

```vue
<script setup lang="ts">
import { Star, ArrowDown } from '@veltra/icons/normal'
</script>

<template>
  <u-collapse v-model="active" icon-position="left" :expand-icon="ArrowDown">
    <u-collapse-item value="1">
      <template #title>
        <span style="display:inline-flex;align-items:center;gap:6px">
          <u-icon><Star /></u-icon>
          收藏夹
        </span>
      </template>
      收藏内容
    </u-collapse-item>

    <u-collapse-item value="2" title="动态图标">
      <template #icon="{ isActive }">
        <u-icon :style="{ color: isActive ? 'var(--u-color-primary)' : '' }">
          <ArrowDown />
        </u-icon>
      </template>
      根据展开状态切换图标样式
    </u-collapse-item>
  </u-collapse>
</template>
```

### 默认展开与全部折叠（default-collapse-all）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { CollapseModelValue } from '@veltra/desktop'

const activeExpand = ref<CollapseModelValue>()
const activeCollapse = ref<CollapseModelValue>()
</script>

<template>
  <!-- default-collapse-all 默认为 false，未传递绑定初始值时默认展开全部折叠项 -->
  <u-collapse v-model="activeExpand">
    <u-collapse-item value="x1" title="模块 A">默认全部展开</u-collapse-item>
    <u-collapse-item value="x2" title="模块 B">默认全部展开</u-collapse-item>
  </u-collapse>

  <!-- 显式配置 default-collapse-all 后，即使没有初始绑定值，组件也会默认折叠收起所有项 -->
  <u-collapse v-model="activeCollapse" default-collapse-all>
    <u-collapse-item value="y1" title="模块 A">初始化默认为折叠收起状态</u-collapse-item>
    <u-collapse-item value="y2" title="模块 B">只有手动点击头部才会展开</u-collapse-item>
  </u-collapse>
</template>
```
