# UCollapse — 折叠面板

> `import type { CollapseProps, CollapseEmits, CollapseExposed, CollapseItemProps } from '@veltra/desktop'`

基于 CSS Grid `0fr → 1fr` 行高度过渡实现高度动画，零 JS 测量。

## Import

```ts
// UCollapse、UCollapseItem 由 Vite 自动导入，无需手动 import
import type {
  CollapseProps,
  CollapseItemProps,
  CollapseEmits,
  CollapseValue,
  CollapseModelValue,
  CollapseIconPosition,
  CollapseExposed
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

| prop           | type                   | default     | 说明                                                       |
| -------------- | ---------------------- | ----------- | ---------------------------------------------------------- |
| `size`         | `ComponentSize`        | `'default'` | 组件尺寸，通过 `useFormFallbackProps` 回退到全局配置       |
| `modelValue`   | `CollapseModelValue`   | —           | 当前展开项（v-model）                                      |
| `accordion`    | `boolean`              | `false`     | 是否手风琴模式（一次只能展开一项）                         |
| `bordered`     | `boolean`              | `true`      | 是否显示外层与项之间的分隔线；设为 `false` 时为 ghost 风格 |
| `iconPosition` | `CollapseIconPosition` | `'right'`   | 展开/收起图标位置                                          |
| `expandIcon`   | `Component`            | —           | 自定义展开图标组件，活动态会自动旋转 90°                   |

## UCollapse Emits

| event               | 参数                          | 说明                                                    |
| ------------------- | ----------------------------- | ------------------------------------------------------- |
| `update:modelValue` | `(value: CollapseModelValue)` | v-model 更新                                            |
| `change`            | `(value: CollapseModelValue)` | 展开项变更时触发（在 `update:modelValue` 之后同步触发） |

## UCollapse Slots

| slot    | 参数 | 说明                            |
| ------- | ---- | ------------------------------- |
| default | —    | 放置 `UCollapseItem` 的默认插槽 |

## UCollapse Exposed

```ts
interface CollapseExposed {
  /** 切换某项的展开状态 */
  toggle: (value: CollapseValue) => void
  /** 展开某项 */
  expand: (value: CollapseValue) => void
  /** 收起某项 */
  collapse: (value: CollapseValue) => void
  /** 展开全部（accordion 模式下只展开第一个传入的 value） */
  expandAll: (values: CollapseValue[]) => void
  /** 全部收起 */
  collapseAll: () => void
}
```

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

### 手风琴 + 无边框

```vue
<template>
  <!-- accordion 模式下 modelValue 为单值 -->
  <u-collapse v-model="active" accordion :bordered="false">
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

### 程序化控制

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { CollapseExposed, CollapseModelValue } from '@veltra/desktop'

const collapseRef = ref<CollapseExposed>()
const active = ref<CollapseModelValue>([])
</script>

<template>
  <u-button @click="collapseRef?.expand('a')">展开 A</u-button>
  <u-button @click="collapseRef?.collapseAll()">全部收起</u-button>
  <u-button @click="collapseRef?.expandAll(['a', 'b', 'c'])">展开全部</u-button>

  <u-collapse ref="collapseRef" v-model="active">
    <u-collapse-item value="a" title="项目 A">A 的内容</u-collapse-item>
    <u-collapse-item value="b" title="项目 B">B 的内容</u-collapse-item>
    <u-collapse-item value="c" title="项目 C">C 的内容</u-collapse-item>
  </u-collapse>
</template>
```
